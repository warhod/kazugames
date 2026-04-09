import { describe, expect, mock, test } from 'bun:test';
import { NextRequest } from 'next/server';
import { createQueuedSupabaseMock } from '../../test/supabase-mock';

let currentMock: ReturnType<typeof createQueuedSupabaseMock>;

mock.module('@/lib/supabase/server', () => ({
  createClient: () => currentMock,
}));

const params = { id: 'grp-1' };

describe('POST /api/groups/[id]/join', () => {
  test('400 without invite_code', async () => {
    currentMock = createQueuedSupabaseMock({ id: 'u1' }, []);
    const { POST } = await import('@/app/api/groups/[id]/join/route');
    const req = new NextRequest('http://localhost/api/groups/grp-1/join', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req, { params });
    expect(res.status).toBe(400);
  });

  test('403 when code wrong', async () => {
    currentMock = createQueuedSupabaseMock(
      { id: 'u1' },
      [{ data: { id: 'grp-1', invite_code: 'good' }, error: null }],
    );
    const { POST } = await import('@/app/api/groups/[id]/join/route');
    const req = new NextRequest('http://localhost/api/groups/grp-1/join', {
      method: 'POST',
      body: JSON.stringify({ invite_code: 'bad' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req, { params });
    expect(res.status).toBe(403);
  });

  test('201 joins group', async () => {
    currentMock = createQueuedSupabaseMock(
      { id: 'u1' },
      [
        { data: { id: 'grp-1', invite_code: 'secret' }, error: null },
        { data: null, error: null },
        { data: {}, error: null },
      ],
    );
    const { POST } = await import('@/app/api/groups/[id]/join/route');
    const req = new NextRequest('http://localhost/api/groups/grp-1/join', {
      method: 'POST',
      body: JSON.stringify({ invite_code: 'secret' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req, { params });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ joined: true });
  });
});
