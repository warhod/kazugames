import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const PROFILE_SELECT = 'user_id, display_name, friend_code, nintendo_profile_url, account_hint' as const;

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: row, error } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('user_id', user.id)
    .single();

  if (error || !row) {
    return NextResponse.json({ error: error?.message ?? 'Profile not found' }, { status: 500 });
  }

  return NextResponse.json(row);
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const display_name = typeof b.display_name === 'string' ? b.display_name.trim() : undefined;
  const friend_code = typeof b.friend_code === 'string' ? b.friend_code.trim() : undefined;
  const nintendo_profile_url =
    typeof b.nintendo_profile_url === 'string' ? b.nintendo_profile_url.trim() : undefined;

  const updates: Record<string, string | null> = {};

  if (display_name !== undefined) {
    if (display_name.length > 50) {
      return NextResponse.json({ error: 'display_name is too long' }, { status: 400 });
    }
    updates.display_name = display_name.length > 0 ? display_name : null;
  }

  if (friend_code !== undefined) {
    if (friend_code.length > 64) {
      return NextResponse.json({ error: 'friend_code is too long' }, { status: 400 });
    }
    updates.friend_code = friend_code.length > 0 ? friend_code : null;
  }

  if (nintendo_profile_url !== undefined) {
    if (nintendo_profile_url.length === 0) {
      updates.nintendo_profile_url = null;
    } else {
      try {
        const u = new URL(nintendo_profile_url);
        if (u.protocol !== 'https:') {
          return NextResponse.json({ error: 'Nintendo profile URL must be https' }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: 'Invalid Nintendo profile URL' }, { status: 400 });
      }
      if (nintendo_profile_url.length > 500) {
        return NextResponse.json({ error: 'nintendo_profile_url is too long' }, { status: 400 });
      }
      updates.nintendo_profile_url = nintendo_profile_url;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data: row, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', user.id)
    .select(PROFILE_SELECT)
    .single();

  if (error || !row) {
    return NextResponse.json({ error: error?.message ?? 'Update failed' }, { status: 500 });
  }

  return NextResponse.json(row);
}
