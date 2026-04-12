import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ensureGameByDekuUrl, STALE_MS } from '@/lib/ensure-game-from-deku-url';
import { scrapeSearch, normalizeDekuUrl } from 'deku-scraper';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const url = searchParams.get('url');
  const query = searchParams.get('q');

  if (!url && !query) {
    return NextResponse.json(
      { error: 'Provide either ?q=<search> or ?url=<dekudeals_url>' },
      { status: 400 },
    );
  }

  const supabase = createClient();

  if (url) {
    return handleUrlLookup(supabase, normalizeDekuUrl(url));
  }

  return handleSearch(supabase, query!);
}

async function handleUrlLookup(supabase: ReturnType<typeof createClient>, url: string) {
  const result = await ensureGameByDekuUrl(supabase, url);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  const { data: game, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', result.id)
    .single();

  if (error || !game) {
    return NextResponse.json({ error: error?.message ?? 'Game not found' }, { status: 500 });
  }

  return NextResponse.json(game);
}

async function handleSearch(supabase: ReturnType<typeof createClient>, query: string) {
  const { data: dbResults } = await supabase
    .from('games')
    .select('*')
    .ilike('title', `%${query}%`)
    .order('updated_at', { ascending: false })
    .limit(20);

  const hasRecentResults =
    dbResults &&
    dbResults.length > 0 &&
    dbResults.every(
      (g) => Date.now() - new Date(g.updated_at).getTime() < STALE_MS,
    );

  if (hasRecentResults) {
    return NextResponse.json(dbResults);
  }

  const searchResults = await scrapeSearch(query);
  if (searchResults.length === 0 && dbResults && dbResults.length > 0) {
    return NextResponse.json(dbResults);
  }

  return NextResponse.json(searchResults);
}
