import { describe, expect, mock, test } from 'bun:test';
import { NextRequest } from 'next/server';
import { createQueuedSupabaseMock } from '../../test/supabase-mock';

let currentMock: ReturnType<typeof createQueuedSupabaseMock>;

mock.module('@/lib/supabase/server', () => ({
  createClient: () => currentMock,
}));

const params = { id: 'grp-1' };

describe('GET /api/groups/[id]', () => {
  test('403 when not a member', async () => {
    currentMock = createQueuedSupabaseMock(
      { id: 'u1' },
      [{ data: null, error: null }],
    );
    const { GET } = await import('@/app/api/groups/[id]/route');
    const res = await GET(new NextRequest('http://localhost/api/groups/grp-1'), { params });
    expect(res.status).toBe(403);
  });

  test('200 returns group payload', async () => {
    const group = { id: 'grp-1', name: 'Squad', invite_code: 'x', owner_id: 'u1' };
    const members = [{ user_id: 'u1', joined_at: '2024-01-01' }];
    currentMock = createQueuedSupabaseMock(
      { id: 'u1' },
      [
        { data: { id: 'mem' }, error: null },
        { data: group, error: null },
        { data: members, error: null },
        { data: [], error: null },
      ],
    );
    const { GET } = await import('@/app/api/groups/[id]/route');
    const res = await GET(new NextRequest('http://localhost/api/groups/grp-1'), { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('Squad');
    expect(body.members).toEqual(members);
    expect(body.loanable_games).toEqual([]);
  });
});

describe('DELETE /api/groups/[id]', () => {
  test('403 when not owner', async () => {
    currentMock = createQueuedSupabaseMock(
      { id: 'u1' },
      [{ data: { owner_id: 'other' }, error: null }],
    );
    const { DELETE } = await import('@/app/api/groups/[id]/route');
    const res = await DELETE(new NextRequest('http://localhost/api/groups/grp-1'), { params });
    expect(res.status).toBe(403);
  });

  test('204 when owner deletes', async () => {
    currentMock = createQueuedSupabaseMock(
      { id: 'owner' },
      [
        { data: { owner_id: 'owner' }, error: null },
        { data: null, error: null },
        { data: null, error: null },
      ],
    );
    const { DELETE } = await import('@/app/api/groups/[id]/route');
    const res = await DELETE(new NextRequest('http://localhost/api/groups/grp-1'), { params });
    expect(res.status).toBe(204);
  });
});
