import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { GameStatus } from "@/lib/database.types";
import { lendableForStatus } from "@/lib/collection-lending";

const GAME_STATUSES: GameStatus[] = [
  "owned",
  "playing",
  "completed",
  "abandoned",
];

const ALLOWED_PER_PAGE = new Set([10, 20, 50, 100]);

type CollectionFilter = "all" | GameStatus | "lendable";

function parsePerPage(raw: string | null): number {
  const n = raw ? Number.parseInt(raw, 10) : 20;
  if (!Number.isFinite(n) || !ALLOWED_PER_PAGE.has(n)) return 20;
  return n;
}

function parsePage(raw: string | null): number {
  const n = raw ? Number.parseInt(raw, 10) : 1;
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

function parseFilter(raw: string | null): CollectionFilter {
  if (!raw || raw === "all") return "all";
  if (raw === "lendable") return "lendable";
  if (GAME_STATUSES.includes(raw as GameStatus)) return raw as GameStatus;
  return "all";
}

function applyListFilter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- same builder generic issue as countUserGames
  q: any,
  filter: CollectionFilter,
) {
  if (filter === "all") return q;
  if (filter === "lendable") return q.eq("lendable", true);
  return q.eq("status", filter);
}

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parsePage(searchParams.get("page"));
  const perPage = parsePerPage(searchParams.get("per_page"));
  const filter = parseFilter(searchParams.get("filter"));

  try {
    // ⚡ Bolt Optimization: Replace 6 parallel count queries with a single query
    // to fetch just the necessary columns, and calculate counts in-memory.
    // This reduces network requests to Supabase from 7 to 2 per API call.
    // Using a high limit to ensure we fetch all rows for users with large collections,
    // avoiding issues with default pagination limits (e.g. 1000).
    const { data: userGames, error: countError } = await supabase
      .from("user_games")
      .select("status, lendable")
      .eq("user_id", user.id)
      .limit(100000);

    if (countError) throw new Error(countError.message);

    const status_counts: Record<GameStatus, number> = {
      owned: 0,
      playing: 0,
      completed: 0,
      abandoned: 0,
    };

    let lendable_count = 0;
    const total = userGames.length;

    for (const game of userGames) {
      if (game.status && game.status in status_counts) {
        status_counts[game.status as GameStatus]++;
      }
      if (game.lendable) {
        lendable_count++;
      }
    }

    let filtered_total = total;
    if (filter === "lendable") filtered_total = lendable_count;
    else if (filter !== "all") filtered_total = status_counts[filter];

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let listQuery = supabase
      .from("user_games")
      .select("*, game:games(*)")
      .eq("user_id", user.id);
    listQuery = applyListFilter(listQuery, filter);

    const { data, error } = await listQuery
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      items: data ?? [],
      page,
      per_page: perPage,
      total,
      filtered_total,
      status_counts,
      lendable_count,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
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

  const body = await request.json();
  const { game_id, status } = body as { game_id?: string; status?: GameStatus };

  if (!game_id || !status) {
    return NextResponse.json(
      { error: "game_id and status are required" },
      { status: 400 },
    );
  }

  const validStatuses: GameStatus[] = [
    "owned",
    "playing",
    "completed",
    "abandoned",
  ];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${validStatuses.join(", ")}` },
      { status: 400 },
    );
  }

  const { data: existing } = await supabase
    .from("user_games")
    .select("id")
    .eq("user_id", user.id)
    .eq("game_id", game_id)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "Game already in collection" },
      { status: 409 },
    );
  }

  const { data, error } = await supabase
    .from("user_games")
    .insert({
      user_id: user.id,
      game_id,
      status,
      lendable: lendableForStatus(status),
    })
    .select("*, game:games(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
