import { describe, expect, mock, test } from 'bun:test';
import { NextRequest } from 'next/server';
import { createQueuedSupabaseMock } from '../../test/supabase-mock';

let currentMock: ReturnType<typeof createQueuedSupabaseMock>;

mock.module('@/lib/supabase/server', () => ({
  createClient: () => currentMock,
}));

const params = { id: 'game-uuid' };

describe('GET /api/games/[id]', () => {
  test('404 when not found', async () => {
    currentMock = createQueuedSupabaseMock(null, [{ data: null, error: { message: 'not found' } }]);
    const { GET } = await import('@/app/api/games/[id]/route');
    const res = await GET(new NextRequest('http://localhost/api/games/game-uuid'), { params });
    expect(res.status).toBe(404);
  });

  test('200 returns game', async () => {
    const game = { id: 'game-uuid', title: 'Zelda', deku_url: 'https://x/z' };
    currentMock = createQueuedSupabaseMock(null, [{ data: game, error: null }]);
    const { GET } = await import('@/app/api/games/[id]/route');
    const res = await GET(new NextRequest('http://localhost/api/games/game-uuid'), { params });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(game);
  });
});
