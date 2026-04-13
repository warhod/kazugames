import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import type { GameCardProps } from "@/components/GameCard";
import { scrapeCollection } from "@/lib/deku-scraper";
import {
  ensureGameByDekuUrl,
  type SupabaseServer,
} from "@/lib/ensure-game-from-deku-url";

export const DEKU_HOTTEST_URL = "https://www.dekudeals.com/hottest";

/** Used when env, network, or scrape fails (e.g. CI build without network). */
const FALLBACK_FEATURED_GAMES: GameCardProps[] = [
  {
    id: "1",
    title: "The Legend of Zelda: Tears of the Kingdom",
    deku_url:
      "https://www.dekudeals.com/items/the-legend-of-zelda-tears-of-the-kingdom",
    image_url: null,
    current_price: 51.99,
    msrp: 69.99,
    platform: "Switch",
  },
  {
    id: "2",
    title: "Super Mario Odyssey",
    deku_url: "https://www.dekudeals.com/items/super-mario-odyssey",
    image_url: null,
    current_price: 39.99,
    msrp: 59.99,
    platform: "Switch",
  },
  {
    id: "3",
    title: "Mario Kart 8 Deluxe",
    deku_url: "https://www.dekudeals.com/items/mario-kart-8-deluxe",
    image_url: null,
    current_price: 49.99,
    msrp: 59.99,
    platform: "Switch",
  },
  {
    id: "4",
    title: "Metroid Prime Remastered",
    deku_url: "https://www.dekudeals.com/items/metroid-prime-remastered",
    image_url: null,
    current_price: 29.99,
    msrp: 39.99,
    platform: "Switch",
  },
  {
    id: "5",
    title: "Fire Emblem Engage",
    deku_url: "https://www.dekudeals.com/items/fire-emblem-engage",
    image_url: null,
    current_price: 35.99,
    msrp: 59.99,
    platform: "Switch",
  },
  {
    id: "6",
    title: "Pikmin 4",
    deku_url: "https://www.dekudeals.com/items/pikmin-4",
    image_url: null,
    current_price: 44.99,
    msrp: 59.99,
    platform: "Switch",
  },
];

function toNum(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function rowToGameCard(row: Record<string, unknown>): GameCardProps {
  return {
    id: String(row.id),
    title: String(row.title),
    deku_url: String(row.deku_url),
    image_url: row.image_url == null ? null : String(row.image_url),
    current_price: toNum(row.current_price),
    msrp: toNum(row.msrp),
    platform: row.platform == null ? "" : String(row.platform),
  };
}

async function fetchFeaturedHottestGames(): Promise<GameCardProps[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return FALLBACK_FEATURED_GAMES;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey) as unknown as SupabaseServer;

  let items;
  try {
    items = await scrapeCollection(DEKU_HOTTEST_URL, { maxPages: 1 });
  } catch {
    return FALLBACK_FEATURED_GAMES;
  }

  const seen = new Set<string>();
  const orderedUrls: string[] = [];
  for (const it of items) {
    if (seen.has(it.deku_url)) continue;
    seen.add(it.deku_url);
    orderedUrls.push(it.deku_url);
    if (orderedUrls.length >= 8) break;
  }

  if (orderedUrls.length === 0) {
    return FALLBACK_FEATURED_GAMES;
  }

  const games: GameCardProps[] = [];
  for (const dekuUrl of orderedUrls) {
    const res = await ensureGameByDekuUrl(supabase, dekuUrl);
    if ("error" in res) continue;

    const { data: row, error } = await supabase
      .from("games")
      .select("id, title, deku_url, image_url, current_price, msrp, platform")
      .eq("id", res.id)
      .single();

    if (error || !row) continue;
    games.push(rowToGameCard(row as Record<string, unknown>));
  }

  return games.length > 0 ? games : FALLBACK_FEATURED_GAMES;
}

/**
 * First page of Deku “Hottest Deals”, top 8 unique titles, upserted into `games`.
 * Cached 24h per data cache key (see Next.js `unstable_cache`).
 */
export const getFeaturedHottestGames = unstable_cache(
  fetchFeaturedHottestGames,
  ["homepage-featured-hottest-v1"],
  { revalidate: 86400, tags: ["featured-hottest"] },
);
