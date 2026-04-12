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

  test('200 returns group payload with profiles on members and lendable rows', async () => {
    const group = {
      id: 'grp-1',
      name: 'Squad',
      invite_code: 'x',
      owner_id: 'u1',
      created_at: '2024-01-01T00:00:00.000Z',
    };
    const members = [
      { user_id: 'u1', joined_at: '2024-01-01T00:00:00.000Z' },
      { user_id: 'u2', joined_at: '2024-01-02T00:00:00.000Z' },
    ];
    const game = {
      id: 'g1',
      title: 'Test Game',
      deku_url: 'https://www.dekudeals.com/items/a',
      image_url: null,
      current_price: 10,
      msrp: 20,
      description: null,
      platform: 'Switch',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    };
    const lendableGames = [
      {
        id: 'ug1',
        user_id: 'u2',
        game_id: 'g1',
        status: 'owned',
        lendable: true,
        created_at: '2024-01-01T00:00:00.000Z',
        game,
      },
    ];
    const profiles = [
      {
        user_id: 'u1',
        display_name: 'Alex',
        account_hint: null,
        friend_code: 'SW-0000-0000-0001',
        nintendo_profile_url: null,
      },
      {
        user_id: 'u2',
        display_name: 'Sam',
        account_hint: null,
        friend_code: null,
        nintendo_profile_url: 'https://accounts.nintendo.com/',
      },
    ];
    currentMock = createQueuedSupabaseMock(
      { id: 'u1' },
      [
        { data: { id: 'mem' }, error: null },
        { data: group, error: null },
        { data: members, error: null },
        { data: lendableGames, error: null },
        { data: profiles, error: null },
      ],
    );
    const { GET } = await import('@/app/api/groups/[id]/route');
    const res = await GET(new NextRequest('http://localhost/api/groups/grp-1'), { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('Squad');
    expect(body.members).toEqual([
      {
        user_id: 'u1',
        joined_at: '2024-01-01T00:00:00.000Z',
        profile: {
          display_name: 'Alex',
          account_hint: null,
          friend_code: 'SW-0000-0000-0001',
          nintendo_profile_url: null,
        },
      },
      {
        user_id: 'u2',
        joined_at: '2024-01-02T00:00:00.000Z',
        profile: {
          display_name: 'Sam',
          account_hint: null,
          friend_code: null,
          nintendo_profile_url: 'https://accounts.nintendo.com/',
        },
      },
    ]);
    expect(body.lendable_games).toHaveLength(1);
    expect(body.lendable_games[0].owner_profile).toEqual({
      display_name: 'Sam',
      account_hint: null,
      friend_code: null,
      nintendo_profile_url: 'https://accounts.nintendo.com/',
    });
    expect(body.lendable_games[0].game.title).toBe('Test Game');
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
