import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { GameStatus } from '@/lib/database.types';
import { loanableForStatus } from '@/lib/collection-lending';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('user_games')
    .select('*, game:games(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { game_id, status } = body as { game_id?: string; status?: GameStatus };

  if (!game_id || !status) {
    return NextResponse.json(
      { error: 'game_id and status are required' },
      { status: 400 },
    );
  }

  const validStatuses: GameStatus[] = ['owned', 'wishlist', 'playing', 'completed', 'abandoned'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${validStatuses.join(', ')}` },
      { status: 400 },
    );
  }

  const { data: existing } = await supabase
    .from('user_games')
    .select('id')
    .eq('user_id', user.id)
    .eq('game_id', game_id)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: 'Game already in collection' },
      { status: 409 },
    );
  }

  const { data, error } = await supabase
    .from('user_games')
    .insert({ user_id: user.id, game_id, status, loanable: loanableForStatus(status) })
    .select('*, game:games(*)')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
