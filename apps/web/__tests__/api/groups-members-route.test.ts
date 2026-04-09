import { describe, expect, mock, test } from 'bun:test';
import { NextRequest } from 'next/server';
import { createQueuedSupabaseMock } from '../../test/supabase-mock';

let currentMock: ReturnType<typeof createQueuedSupabaseMock>;

mock.module('@/lib/supabase/server', () => ({
  createClient: () => currentMock,
}));

const params = { id: 'grp-1' };

describe('GET /api/groups/[id]/members', () => {
  test('403 when not member', async () => {
    currentMock = createQueuedSupabaseMock(
      { id: 'u1' },
      [{ data: null, error: null }],
    );
    const { GET } = await import('@/app/api/groups/[id]/members/route');
    const res = await GET(new NextRequest('http://localhost/api/groups/grp-1/members'), { params });
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/groups/[id]/members', () => {
  test('400 without user_id query', async () => {
    currentMock = createQueuedSupabaseMock(
      { id: 'owner' },
      [{ data: { owner_id: 'owner' }, error: null }],
    );
    const { DELETE } = await import('@/app/api/groups/[id]/members/route');
    const req = new NextRequest('http://localhost/api/groups/grp-1/members', { method: 'DELETE' });
    const res = await DELETE(req, { params });
    expect(res.status).toBe(400);
  });

  test('400 when owner removes self', async () => {
    currentMock = createQueuedSupabaseMock(
      { id: 'owner' },
      [{ data: { owner_id: 'owner' }, error: null }],
    );
    const { DELETE } = await import('@/app/api/groups/[id]/members/route');
    const req = new NextRequest(
      'http://localhost/api/groups/grp-1/members?user_id=owner',
      { method: 'DELETE' },
    );
    const res = await DELETE(req, { params });
    expect(res.status).toBe(400);
  });
});
