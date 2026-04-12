import { createClient } from '@/lib/supabase/server';
import { scrapeGame, normalizeDekuUrl } from '@/lib/deku-scraper';

/** Max age before search DB hits are treated as stale (matches scrape freshness). */
export const STALE_MS = 24 * 60 * 60 * 1000;

/** Same copy as legacy GET /api/games?url= responses for incomplete scrapes. */
export const SCRAPE_INCOMPLETE_MESSAGE =
  'Could not read game details from DekuDeals (missing title). The page may have changed or content may not be available in the fetched HTML.';

function isCompleteScrapedGame(data: { title: unknown }): boolean {
  return typeof data.title === 'string' && data.title.trim().length > 0;
}

export type SupabaseServer = ReturnType<typeof createClient>;

/**
 * Resolves a DekuDeals item URL to a `games.id`, using cache when fresh and scrape+upsert otherwise.
 * Mirrors {@link apps/web/app/api/games/route.ts} URL lookup behavior.
 */
export async function ensureGameByDekuUrl(
  supabase: SupabaseServer,
  url: string,
): Promise<{ id: string } | { error: string; httpStatus: number }> {
  const normalized = normalizeDekuUrl(url);

  const { data: cached } = await supabase
    .from('games')
    .select('id, updated_at')
    .eq('deku_url', normalized)
    .maybeSingle();

  if (cached) {
    const age = Date.now() - new Date(cached.updated_at).getTime();
    if (age < STALE_MS) {
      return { id: cached.id };
    }
  }

  const scraped = await scrapeGame(normalized);
  if (!scraped) {
    if (cached) return { id: cached.id };
    return { error: 'Failed to scrape game', httpStatus: 502 };
  }

  if (!isCompleteScrapedGame(scraped)) {
    if (cached) return { id: cached.id };
    return { error: SCRAPE_INCOMPLETE_MESSAGE, httpStatus: 502 };
  }

  const { data: game, error } = await supabase
    .from('games')
    .upsert(
      { ...scraped, updated_at: new Date().toISOString() },
      { onConflict: 'deku_url' },
    )
    .select('id')
    .single();

  if (error || !game) {
    return {
      error: error?.message ?? 'Failed to save game',
      httpStatus: 500,
    };
  }

  return { id: game.id };
}
