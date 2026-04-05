import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { GameStatus } from '@/lib/database.types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.status !== undefined) {
    const validStatuses: GameStatus[] = ['owned', 'wishlist', 'playing', 'completed', 'abandoned'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 },
      );
    }
    updates.status = body.status;
  }

  if (body.loanable !== undefined) {
    updates.loanable = Boolean(body.loanable);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: 'Provide at least one field to update (status, loanable)' },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from('user_games')
    .update(updates)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select('*, game:games(*)')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Collection entry not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('user_games')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
