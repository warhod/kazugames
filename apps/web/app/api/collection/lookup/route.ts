import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** Returns the signed-in user's `user_games` row for a game, or `entry: null`. */
export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const gameId = request.nextUrl.searchParams.get('game_id')?.trim();
  if (!gameId) {
    return NextResponse.json({ error: 'game_id is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('user_games')
    .select('id, status, lendable')
    .eq('user_id', user.id)
    .eq('game_id', gameId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entry: data });
}
