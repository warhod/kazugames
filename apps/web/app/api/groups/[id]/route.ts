import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { DbPublicProfile } from '@/lib/database.types';

const PROFILE_FIELDS =
  'user_id, display_name, account_hint, friend_code, nintendo_profile_url' as const;

type ProfileRow = {
  user_id: string;
  display_name: string | null;
  account_hint: string | null;
  friend_code: string | null;
  nintendo_profile_url: string | null;
};

function toPublicProfile(row: ProfileRow | undefined): DbPublicProfile {
  if (!row) {
    return {
      display_name: null,
      account_hint: null,
      friend_code: null,
      nintendo_profile_url: null,
    };
  }
  return {
    display_name: row.display_name,
    account_hint: row.account_hint,
    friend_code: row.friend_code,
    nintendo_profile_url: row.nintendo_profile_url,
  };
}

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

  // ⚡ Bolt Optimization: Parallelize independent sequential queries
  // Fetch group details and members concurrently to reduce database round-trips.
  const [
    { data: group, error: groupErr },
    { data: members }
  ] = await Promise.all([
    supabase.from('groups').select('*').eq('id', params.id).single(),
    supabase.from('group_members').select('user_id, joined_at').eq('group_id', params.id)
  ]);

  if (groupErr || !group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  const memberIds = (members ?? []).map((m) => m.user_id);

  let lendableGames: any[] = [];
  let profileRows: ProfileRow[] = [];

  if (memberIds.length > 0) {
    // ⚡ Bolt Optimization: Parallelize independent queries based on memberIds
    // Fetch user_games and profiles concurrently.
    const [
      { data: gamesData },
      { data: profilesData }
    ] = await Promise.all([
      supabase.from('user_games').select('*, game:games(*)').in('user_id', memberIds).eq('lendable', true),
      supabase.from('profiles').select(PROFILE_FIELDS).in('user_id', memberIds)
    ]);
    lendableGames = gamesData ?? [];
    profileRows = (profilesData ?? []) as ProfileRow[];
  }

  const profileByUserId = new Map(profileRows.map((p) => [p.user_id, p]));

  const membersWithProfiles = (members ?? []).map((m) => ({
    user_id: m.user_id,
    joined_at: m.joined_at,
    profile: toPublicProfile(profileByUserId.get(m.user_id)),
  }));

  const lendableWithOwners = (lendableGames ?? []).map((ug: { user_id: string }) => ({
    ...ug,
    owner_profile: toPublicProfile(profileByUserId.get(ug.user_id)),
  }));

  return NextResponse.json({
    ...group,
    members: membersWithProfiles,
    lendable_games: lendableWithOwners,
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
