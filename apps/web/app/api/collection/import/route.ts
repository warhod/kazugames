import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loanableForStatus } from "@/lib/collection-lending";
import { ensureGameByDekuUrl } from "@/lib/ensure-game-from-deku-url";
import { mapDekuImportHintToGameStatus } from "@/lib/collection-import-status";
import {
  scrapeCollection,
  normalizeDekuUrl,
  mapDekuCollectionStatusLabel,
  MAX_COLLECTION_SCRAPE_PAGES,
} from "deku-scraper";

const MAX_IMPORT_ITEMS = 200;
/** Small delay between items to avoid hammering Deku when scraping many games in sequence. */
const PER_ITEM_MS = 100;

function isDekuCollectionUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim());
    const host = u.hostname.toLowerCase();
    if (!host.endsWith("dekudeals.com")) return false;
    return u.pathname.includes("/collection/");
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { collection_url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawUrl =
    typeof body.collection_url === "string" ? body.collection_url.trim() : "";
  if (!rawUrl) {
    return NextResponse.json(
      { error: "collection_url is required" },
      { status: 400 },
    );
  }

  if (!isDekuCollectionUrl(rawUrl)) {
    return NextResponse.json(
      {
        error:
          "URL must be a DekuDeals collection page (https://www.dekudeals.com/collection/…)",
      },
      { status: 400 },
    );
  }

  const collectionUrl = new URL(rawUrl).toString();
  const items = await scrapeCollection(collectionUrl, {
    maxPages: MAX_COLLECTION_SCRAPE_PAGES,
  });

  const slice = items.slice(0, MAX_IMPORT_ITEMS);
  const truncated = items.length > MAX_IMPORT_ITEMS;

  let imported = 0;
  let skipped = 0;
  let failed = 0;
  const errors: { message: string; url?: string }[] = [];

  for (let i = 0; i < slice.length; i++) {
    const item = slice[i]!;
    const itemUrl = normalizeDekuUrl(item.deku_url);
    const hint = mapDekuCollectionStatusLabel(item.deku_status_label);
    const status = mapDekuImportHintToGameStatus(hint);

    const gameResult = await ensureGameByDekuUrl(supabase, itemUrl);
    if ("error" in gameResult) {
      failed += 1;
      if (errors.length < 25) {
        errors.push({ message: gameResult.error, url: itemUrl });
      }
      if (i < slice.length - 1) {
        await new Promise((r) => setTimeout(r, PER_ITEM_MS));
      }
      continue;
    }

    const { error: insertError } = await supabase.from("user_games").insert({
      user_id: user.id,
      game_id: gameResult.id,
      status,
      loanable: loanableForStatus(status),
    });

    if (insertError) {
      if (insertError.code === "23505") {
        skipped += 1;
      } else {
        failed += 1;
        if (errors.length < 25) {
          errors.push({ message: insertError.message, url: itemUrl });
        }
      }
    } else {
      imported += 1;
    }

    if (i < slice.length - 1) {
      await new Promise((r) => setTimeout(r, PER_ITEM_MS));
    }
  }

  return NextResponse.json({
    imported,
    skipped,
    failed,
    errors: errors.length > 0 ? errors : undefined,
    ...(truncated
      ? { truncated: true as const, max_items: MAX_IMPORT_ITEMS }
      : {}),
    ...(slice.length === 0 && items.length === 0
      ? {
          notice:
            "No games found on this collection page. Check that the URL is public and not empty.",
        }
      : {}),
  });
}
