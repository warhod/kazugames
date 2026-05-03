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

  // ⚡ Bolt Optimization: Parallel query resolution
  // Fetch group details and member list simultaneously instead of sequentially.
  const [groupResponse, membersResponse] = await Promise.all([
    supabase
      .from('groups')
      .select('*')
      .eq('id', params.id)
      .single(),
    supabase
      .from('group_members')
      .select('user_id, joined_at')
      .eq('group_id', params.id)
  ]);

  const { data: group, error: groupErr } = groupResponse;
  const { data: members } = membersResponse;

  if (groupErr || !group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  const memberIds = (members ?? []).map((m) => m.user_id);

  // ⚡ Bolt Optimization: Parallel query resolution
  // Fetch lendable games and profiles simultaneously instead of sequentially.
  // This reduces the total sequential query steps in this endpoint from 5 down to 3.
  const [lendableGamesResponse, profilesResponse] = await Promise.all([
    supabase
      .from('user_games')
      .select('*, game:games(*)')
      .in('user_id', memberIds.length > 0 ? memberIds : ['__none__'])
      .eq('lendable', true),
    memberIds.length > 0
      ? supabase
          .from('profiles')
          .select(PROFILE_FIELDS)
          .in('user_id', memberIds)
      : Promise.resolve({ data: [] })
  ]);

  const { data: lendableGames } = lendableGamesResponse;
  const profileRows = (profilesResponse.data ?? []) as ProfileRow[];

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
