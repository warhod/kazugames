import { describe, expect, mock, test } from 'bun:test';
import { NextRequest } from 'next/server';
import { createQueuedSupabaseMock } from '../../test/supabase-mock';

let currentMock: ReturnType<typeof createQueuedSupabaseMock>;

mock.module('@/lib/supabase/server', () => ({
  createClient: () => currentMock,
}));

describe('GET /api/profile', () => {
  test('401 when not signed in', async () => {
    currentMock = createQueuedSupabaseMock(null, []);
    const { GET } = await import('@/app/api/profile/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  test('200 returns profile row', async () => {
    const row = {
      user_id: 'u1',
      display_name: 'Alex',
      friend_code: null,
      nintendo_profile_url: null,
      account_hint: 'alex',
    };
    currentMock = createQueuedSupabaseMock({ id: 'u1' }, [{ data: row, error: null }]);
    const { GET } = await import('@/app/api/profile/route');
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(row);
  });
});

describe('PATCH /api/profile', () => {
  test('400 on invalid Nintendo URL', async () => {
    currentMock = createQueuedSupabaseMock({ id: 'u1' }, []);
    const { PATCH } = await import('@/app/api/profile/route');
    const res = await PATCH(
      new NextRequest('http://localhost/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ nintendo_profile_url: 'http://insecure.example' }),
      }),
    );
    expect(res.status).toBe(400);
  });

  test('200 updates allowed fields', async () => {
    const updated = {
      user_id: 'u1',
      display_name: 'Sam',
      friend_code: 'SW-1',
      nintendo_profile_url: 'https://accounts.nintendo.com/foo',
      account_hint: 'legacy',
    };
    currentMock = createQueuedSupabaseMock({ id: 'u1' }, [{ data: updated, error: null }]);
    const { PATCH } = await import('@/app/api/profile/route');
    const res = await PATCH(
      new NextRequest('http://localhost/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          display_name: 'Sam',
          friend_code: 'SW-1',
          nintendo_profile_url: 'https://accounts.nintendo.com/foo',
        }),
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(updated);
  });
});
