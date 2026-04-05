import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { invite_code } = body as { invite_code?: string };

  if (!invite_code) {
    return NextResponse.json({ error: 'invite_code is required' }, { status: 400 });
  }

  const { data: group } = await supabase
    .from('groups')
    .select('id, invite_code')
    .eq('id', params.id)
    .single();

  if (!group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  if (group.invite_code !== invite_code) {
    return NextResponse.json({ error: 'Invalid invite code' }, { status: 403 });
  }

  const { data: existing } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', params.id)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Already a member' }, { status: 409 });
  }

  const { error } = await supabase
    .from('group_members')
    .insert({ group_id: params.id, user_id: user.id });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ joined: true }, { status: 201 });
}
