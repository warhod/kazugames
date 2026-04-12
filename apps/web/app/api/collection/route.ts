import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { GameStatus } from "@/lib/database.types";
import { loanableForStatus } from "@/lib/collection-lending";

const GAME_STATUSES: GameStatus[] = [
  "owned",
  "wishlist",
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

async function countUserGames(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  filter: (q: ReturnType<ReturnType<typeof createClient>["from"]>) => unknown,
): Promise<number> {
  let q = supabase
    .from("user_games")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  q = filter(q) as typeof q;
  const { count, error } = await q;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

function applyListFilter<
  Q extends ReturnType<ReturnType<typeof createClient>["from"]>,
>(q: Q, filter: CollectionFilter): Q {
  if (filter === "all") return q;
  if (filter === "lendable") return q.eq("loanable", true) as Q;
  return q.eq("status", filter) as Q;
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
    const [
      total,
      owned,
      wishlist,
      playing,
      completed,
      abandoned,
      lendable_count,
    ] = await Promise.all([
      countUserGames(supabase, user.id, (q) => q),
      countUserGames(supabase, user.id, (q) => q.eq("status", "owned")),
      countUserGames(supabase, user.id, (q) => q.eq("status", "wishlist")),
      countUserGames(supabase, user.id, (q) => q.eq("status", "playing")),
      countUserGames(supabase, user.id, (q) => q.eq("status", "completed")),
      countUserGames(supabase, user.id, (q) => q.eq("status", "abandoned")),
      countUserGames(supabase, user.id, (q) => q.eq("loanable", true)),
    ]);

    const status_counts: Record<GameStatus, number> = {
      owned,
      wishlist,
      playing,
      completed,
      abandoned,
    };

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
    "wishlist",
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
      loanable: loanableForStatus(status),
    })
    .select("*, game:games(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
