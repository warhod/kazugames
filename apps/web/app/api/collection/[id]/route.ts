import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { GameStatus } from '@/lib/database.types';
import { lendableForStatus } from '@/lib/collection-lending';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json() as { status?: GameStatus; lendable?: boolean };

  const hasStatus = body.status !== undefined;
  const hasLendable = body.lendable !== undefined;
  if (!hasStatus && !hasLendable) {
    return NextResponse.json(
      { error: 'Provide at least one field to update (status, lendable)' },
      { status: 400 },
    );
  }

  if (hasStatus) {
    const validStatuses: GameStatus[] = ['owned', 'wishlist', 'playing', 'completed', 'abandoned'];
    if (!validStatuses.includes(body.status!)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 },
      );
    }
  }

  const { data: existing, error: fetchError } = await supabase
    .from('user_games')
    .select('status')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Collection entry not found' }, { status: 404 });
  }

  const newStatus: GameStatus = hasStatus ? body.status! : existing.status;
  const updates: Record<string, unknown> = {
    lendable: lendableForStatus(newStatus),
  };
  if (hasStatus) {
    updates.status = newStatus;
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
