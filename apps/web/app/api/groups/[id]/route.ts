import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', params.id)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });
  }

  const { data: group, error: groupErr } = await supabase
    .from('groups')
    .select('*')
    .eq('id', params.id)
    .single();

  if (groupErr || !group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  const { data: members } = await supabase
    .from('group_members')
    .select('user_id, joined_at')
    .eq('group_id', params.id);

  const memberIds = (members ?? []).map((m) => m.user_id);

  const { data: loanableGames } = await supabase
    .from('user_games')
    .select('*, game:games(*)')
    .in('user_id', memberIds.length > 0 ? memberIds : ['__none__'])
    .eq('loanable', true);

  return NextResponse.json({
    ...group,
    members: members ?? [],
    loanable_games: loanableGames ?? [],
  });
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

  const { data: group } = await supabase
    .from('groups')
    .select('owner_id')
    .eq('id', params.id)
    .single();

  if (!group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  if (group.owner_id !== user.id) {
    return NextResponse.json({ error: 'Only the group owner can delete' }, { status: 403 });
  }

  await supabase.from('group_members').delete().eq('group_id', params.id);

  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
