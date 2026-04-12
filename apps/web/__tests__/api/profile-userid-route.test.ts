import { describe, expect, mock, test } from 'bun:test';
import { NextRequest } from 'next/server';
import { createQueuedSupabaseMock } from '../../test/supabase-mock';

let currentMock: ReturnType<typeof createQueuedSupabaseMock>;

mock.module('@/lib/supabase/server', () => ({
  createClient: () => currentMock,
}));

const params = { userId: 'peer-uuid' };

describe('GET /api/profile/[userId]', () => {
  test('401 when anonymous', async () => {
    currentMock = createQueuedSupabaseMock(null, []);
    const { GET } = await import('@/app/api/profile/[userId]/route');
    const res = await GET(new NextRequest('http://localhost/api/profile/peer-uuid'), { params });
    expect(res.status).toBe(401);
  });

  test('404 when profile not visible (e.g. not a groupmate)', async () => {
    currentMock = createQueuedSupabaseMock({ id: 'u1' }, [{ data: null, error: null }]);
    const { GET } = await import('@/app/api/profile/[userId]/route');
    const res = await GET(new NextRequest('http://localhost/api/profile/peer-uuid'), { params });
    expect(res.status).toBe(404);
  });

  test('200 returns public profile fields', async () => {
    const row = {
      user_id: 'peer-uuid',
      display_name: 'Sam',
      account_hint: null,
      friend_code: 'SW-1111-2222-3333',
      nintendo_profile_url: 'https://accounts.nintendo.com/foo',
    };
    currentMock = createQueuedSupabaseMock({ id: 'u1' }, [{ data: row, error: null }]);
    const { GET } = await import('@/app/api/profile/[userId]/route');
    const res = await GET(new NextRequest('http://localhost/api/profile/peer-uuid'), { params });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(row);
  });
});
