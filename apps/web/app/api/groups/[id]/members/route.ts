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

  const { data: members, error } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', params.id)
    .order('joined_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(members);
}

export async function DELETE(
  request: NextRequest,
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
    return NextResponse.json({ error: 'Only the group owner can remove members' }, { status: 403 });
  }

  const targetUserId = request.nextUrl.searchParams.get('user_id');
  if (!targetUserId) {
    return NextResponse.json({ error: 'user_id query param is required' }, { status: 400 });
  }

  if (targetUserId === user.id) {
    return NextResponse.json({ error: 'Owner cannot remove themselves' }, { status: 400 });
  }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', params.id)
    .eq('user_id', targetUserId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
