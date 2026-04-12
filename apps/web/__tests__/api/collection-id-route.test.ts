import { describe, expect, mock, test } from 'bun:test';
import { NextRequest } from 'next/server';
import { createQueuedSupabaseMock } from '../../test/supabase-mock';

let currentMock: ReturnType<typeof createQueuedSupabaseMock>;

mock.module('@/lib/supabase/server', () => ({
  createClient: () => currentMock,
}));

const params = { id: 'ug-1' };

describe('PATCH /api/collection/[id]', () => {
  test('401 when anonymous', async () => {
    currentMock = createQueuedSupabaseMock(null, []);
    const { PATCH } = await import('@/app/api/collection/[id]/route');
    const req = new NextRequest('http://localhost/api/collection/ug-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'playing' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(401);
  });

  test('400 when no updatable fields', async () => {
    currentMock = createQueuedSupabaseMock({ id: 'u1' }, []);
    const { PATCH } = await import('@/app/api/collection/[id]/route');
    const req = new NextRequest('http://localhost/api/collection/ug-1', {
      method: 'PATCH',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(400);
  });

  test('400 for invalid status', async () => {
    currentMock = createQueuedSupabaseMock({ id: 'u1' }, []);
    const { PATCH } = await import('@/app/api/collection/[id]/route');
    const req = new NextRequest('http://localhost/api/collection/ug-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'nope' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(400);
  });

  test('200 on status update', async () => {
    const updated = { id: 'ug-1', status: 'playing', lendable: false, game: {} };
    currentMock = createQueuedSupabaseMock(
      { id: 'u1' },
      [
        { data: { status: 'owned' }, error: null },
        { data: updated, error: null },
      ],
    );
    const { PATCH } = await import('@/app/api/collection/[id]/route');
    const req = new NextRequest('http://localhost/api/collection/ug-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'playing' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(200);
  });

  test('404 when update fails', async () => {
    currentMock = createQueuedSupabaseMock(
      { id: 'u1' },
      [
        { data: { status: 'owned' }, error: null },
        { data: null, error: { message: 'not found' } },
      ],
    );
    const { PATCH } = await import('@/app/api/collection/[id]/route');
    const req = new NextRequest('http://localhost/api/collection/ug-1', {
      method: 'PATCH',
      body: JSON.stringify({ lendable: true }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(404);
  });

  test('404 when collection row missing', async () => {
    currentMock = createQueuedSupabaseMock(
      { id: 'u1' },
      [{ data: null, error: { message: 'not found' } }],
    );
    const { PATCH } = await import('@/app/api/collection/[id]/route');
    const req = new NextRequest('http://localhost/api/collection/ug-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'owned' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/collection/[id]', () => {
  test('204 on success', async () => {
    currentMock = createQueuedSupabaseMock({ id: 'u1' }, [{ data: null, error: null }]);
    const { DELETE } = await import('@/app/api/collection/[id]/route');
    const req = new NextRequest('http://localhost/api/collection/ug-1', { method: 'DELETE' });
    const res = await DELETE(req, { params });
    expect(res.status).toBe(204);
  });

  test('500 when delete errors', async () => {
    currentMock = createQueuedSupabaseMock(
      { id: 'u1' },
      [{ data: null, error: { message: 'fail' } }],
    );
    const { DELETE } = await import('@/app/api/collection/[id]/route');
    const req = new NextRequest('http://localhost/api/collection/ug-1', { method: 'DELETE' });
    const res = await DELETE(req, { params });
    expect(res.status).toBe(500);
  });
});
