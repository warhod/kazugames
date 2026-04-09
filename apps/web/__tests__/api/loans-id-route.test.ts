import { describe, expect, mock, test } from 'bun:test';
import { NextRequest } from 'next/server';
import { createQueuedSupabaseMock } from '../../test/supabase-mock';

let currentMock: ReturnType<typeof createQueuedSupabaseMock>;

mock.module('@/lib/supabase/server', () => ({
  createClient: () => currentMock,
}));

const params = { id: 'loan-1' };

describe('PATCH /api/loans/[id]', () => {
  test('401 when anonymous', async () => {
    currentMock = createQueuedSupabaseMock(null, []);
    const { PATCH } = await import('@/app/api/loans/[id]/route');
    const req = new NextRequest('http://localhost/api/loans/loan-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'approved' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(401);
  });

  test('400 when status omitted', async () => {
    currentMock = createQueuedSupabaseMock({ id: 'u1' }, []);
    const { PATCH } = await import('@/app/api/loans/[id]/route');
    const req = new NextRequest('http://localhost/api/loans/loan-1', {
      method: 'PATCH',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(400);
  });

  test('404 when loan missing', async () => {
    currentMock = createQueuedSupabaseMock(
      { id: 'u1' },
      [{ data: null, error: { message: 'missing' } }],
    );
    const { PATCH } = await import('@/app/api/loans/[id]/route');
    const req = new NextRequest('http://localhost/api/loans/loan-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'approved' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(404);
  });

  test('403 when user not participant', async () => {
    currentMock = createQueuedSupabaseMock(
      { id: 'stranger' },
      [
        {
          data: {
            id: 'loan-1',
            owner_id: 'o',
            borrower_id: 'b',
            status: 'requested',
          },
          error: null,
        },
      ],
    );
    const { PATCH } = await import('@/app/api/loans/[id]/route');
    const req = new NextRequest('http://localhost/api/loans/loan-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'approved' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(403);
  });

  test('403 when borrower tries to approve', async () => {
    currentMock = createQueuedSupabaseMock(
      { id: 'borrower' },
      [
        {
          data: {
            id: 'loan-1',
            owner_id: 'owner',
            borrower_id: 'borrower',
            status: 'requested',
          },
          error: null,
        },
      ],
    );
    const { PATCH } = await import('@/app/api/loans/[id]/route');
    const req = new NextRequest('http://localhost/api/loans/loan-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'approved' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(403);
  });

  test('400 on invalid transition', async () => {
    currentMock = createQueuedSupabaseMock(
      { id: 'owner' },
      [
        {
          data: {
            id: 'loan-1',
            owner_id: 'owner',
            borrower_id: 'borrower',
            status: 'returned',
          },
          error: null,
        },
      ],
    );
    const { PATCH } = await import('@/app/api/loans/[id]/route');
    const req = new NextRequest('http://localhost/api/loans/loan-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'approved' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(400);
  });

  test('200 owner approves', async () => {
    const updated = {
      id: 'loan-1',
      status: 'approved',
      owner_id: 'owner',
      borrower_id: 'borrower',
    };
    currentMock = createQueuedSupabaseMock(
      { id: 'owner' },
      [
        {
          data: {
            id: 'loan-1',
            owner_id: 'owner',
            borrower_id: 'borrower',
            status: 'requested',
          },
          error: null,
        },
        { data: updated, error: null },
      ],
    );
    const { PATCH } = await import('@/app/api/loans/[id]/route');
    const req = new NextRequest('http://localhost/api/loans/loan-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'approved' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(updated);
  });
});
