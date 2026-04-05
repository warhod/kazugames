import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('game_loans')
    .select('*, game:games(*)')
    .or(`owner_id.eq.${user.id},borrower_id.eq.${user.id}`)
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
  const { game_id, owner_id, group_id } = body as {
    game_id?: string;
    owner_id?: string;
    group_id?: string;
  };

  if (!game_id || !owner_id || !group_id) {
    return NextResponse.json(
      { error: 'game_id, owner_id, and group_id are required' },
      { status: 400 },
    );
  }

  if (owner_id === user.id) {
    return NextResponse.json(
      { error: 'Cannot request a loan from yourself' },
      { status: 400 },
    );
  }

  const { data: borrowerMembership } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', group_id)
    .eq('user_id', user.id)
    .single();

  if (!borrowerMembership) {
    return NextResponse.json(
      { error: 'You must be a member of the group' },
      { status: 403 },
    );
  }

  const { data: ownerMembership } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', group_id)
    .eq('user_id', owner_id)
    .single();

  if (!ownerMembership) {
    return NextResponse.json(
      { error: 'Game owner is not a member of this group' },
      { status: 400 },
    );
  }

  const { data: userGame } = await supabase
    .from('user_games')
    .select('id, loanable')
    .eq('user_id', owner_id)
    .eq('game_id', game_id)
    .single();

  if (!userGame) {
    return NextResponse.json({ error: 'Owner does not have this game' }, { status: 404 });
  }

  if (!userGame.loanable) {
    return NextResponse.json({ error: 'This game is not marked as loanable' }, { status: 400 });
  }

  const { data: activeLoan } = await supabase
    .from('game_loans')
    .select('id')
    .eq('game_id', game_id)
    .eq('owner_id', owner_id)
    .in('status', ['requested', 'approved'])
    .single();

  if (activeLoan) {
    return NextResponse.json(
      { error: 'An active loan already exists for this game' },
      { status: 409 },
    );
  }

  const { data: loan, error } = await supabase
    .from('game_loans')
    .insert({
      game_id,
      owner_id,
      borrower_id: user.id,
      group_id,
      status: 'requested',
    })
    .select('*, game:games(*)')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(loan, { status: 201 });
}
