import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const PUBLIC_SELECT =
  'user_id, display_name, account_hint, friend_code, nintendo_profile_url' as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: { userId: string } },
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: row, error } = await supabase
    .from('profiles')
    .select(PUBLIC_SELECT)
    .eq('user_id', params.userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!row) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json(row);
}
