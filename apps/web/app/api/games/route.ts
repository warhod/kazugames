import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { scrapeGame, scrapeSearch, normalizeDekuUrl } from 'deku-scraper';

const STALE_MS = 24 * 60 * 60 * 1000;

const SCRAPE_INCOMPLETE_MESSAGE =
  'Could not read game details from DekuDeals (missing title). The page may have changed or content may not be available in the fetched HTML.';

function isCompleteScrapedGame(data: { title: unknown }): boolean {
  return typeof data.title === 'string' && data.title.trim().length > 0;
}

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
  const { data: cached } = await supabase
    .from('games')
    .select('*')
    .eq('deku_url', url)
    .single();

  if (cached) {
    const age = Date.now() - new Date(cached.updated_at).getTime();
    if (age < STALE_MS) {
      return NextResponse.json(cached);
    }
  }

  const scraped = await scrapeGame(url);
  if (!scraped) {
    if (cached) return NextResponse.json(cached);
    return NextResponse.json({ error: 'Failed to scrape game' }, { status: 502 });
  }

  if (!isCompleteScrapedGame(scraped)) {
    if (cached) return NextResponse.json(cached);
    return NextResponse.json({ error: SCRAPE_INCOMPLETE_MESSAGE }, { status: 502 });
  }

  const { data: game, error } = await supabase
    .from('games')
    .upsert(
      { ...scraped, updated_at: new Date().toISOString() },
      { onConflict: 'deku_url' },
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
