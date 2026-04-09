import { describe, expect, mock, test } from 'bun:test';
import { NextRequest } from 'next/server';
import { createQueuedSupabaseMock } from '../../test/supabase-mock';

let currentMock: ReturnType<typeof createQueuedSupabaseMock>;

mock.module('@/lib/supabase/server', () => ({
  createClient: () => currentMock,
}));

describe('GET /api/groups', () => {
  test('401 when anonymous', async () => {
    currentMock = createQueuedSupabaseMock(null, []);
    const { GET } = await import('@/app/api/groups/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  test('returns empty array when user has no memberships', async () => {
    currentMock = createQueuedSupabaseMock({ id: 'u1' }, [{ data: [], error: null }]);
    const { GET } = await import('@/app/api/groups/route');
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  test('returns groups when member', async () => {
    const groups = [{ id: 'g1', name: 'Squad', invite_code: 'abc', owner_id: 'u1' }];
    currentMock = createQueuedSupabaseMock(
      { id: 'u1' },
      [
        { data: [{ group_id: 'g1' }], error: null },
        { data: groups, error: null },
      ],
    );
    const { GET } = await import('@/app/api/groups/route');
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(groups);
  });
});

describe('POST /api/groups', () => {
  test('400 when name missing', async () => {
    currentMock = createQueuedSupabaseMock({ id: 'u1' }, []);
    const { POST } = await import('@/app/api/groups/route');
    const req = new NextRequest('http://localhost/api/groups', {
      method: 'POST',
      body: JSON.stringify({ name: '   ' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  test('201 creates group and membership', async () => {
    const group = { id: 'g-new', name: 'Crew', invite_code: 'xyz', owner_id: 'u1' };
    currentMock = createQueuedSupabaseMock(
      { id: 'u1' },
      [
        { data: group, error: null },
        { data: {}, error: null },
      ],
    );
    const { POST } = await import('@/app/api/groups/route');
    const req = new NextRequest('http://localhost/api/groups', {
      method: 'POST',
      body: JSON.stringify({ name: 'Crew' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual(group);
  });
});
