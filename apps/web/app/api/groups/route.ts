import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  for (let i = 0; i < bytes.length; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: memberships, error: memErr } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id);

  if (memErr) {
    return NextResponse.json({ error: memErr.message }, { status: 500 });
  }

  const groupIds = (memberships ?? []).map((m) => m.group_id);
  if (groupIds.length === 0) {
    return NextResponse.json([]);
  }

  const { data: groups, error } = await supabase
    .from('groups')
    .select('*')
    .in('id', groupIds)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(groups);
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name } = body as { name?: string };

  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const invite_code = generateInviteCode();

  const { data: group, error: groupErr } = await supabase
    .from('groups')
    .insert({ name: name.trim(), invite_code, owner_id: user.id })
    .select()
    .single();

  if (groupErr) {
    return NextResponse.json({ error: groupErr.message }, { status: 500 });
  }

  const { error: memberErr } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id });

  if (memberErr) {
    await supabase.from('groups').delete().eq('id', group.id);
    return NextResponse.json({ error: memberErr.message }, { status: 500 });
  }

  return NextResponse.json(group, { status: 201 });
}
