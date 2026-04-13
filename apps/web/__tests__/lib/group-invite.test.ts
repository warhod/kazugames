import { describe, expect, test } from 'bun:test';
import { buildGroupInviteShareUrl, parseGroupInviteFromLocation } from '@/lib/group-invite';

describe('parseGroupInviteFromLocation', () => {
  test('parses join and invite from query', () => {
    const r = parseGroupInviteFromLocation({
      search: '?join=abc-uuid&invite=CODE1',
      hash: '',
    });
    expect(r.join).toBe('abc-uuid');
    expect(r.invite).toBe('CODE1');
    expect(r.hasInviteDeepLink).toBe(true);
  });

  test('legacy hash invite when join in query', () => {
    const r = parseGroupInviteFromLocation({
      search: '?join=g1',
      hash: '#invite=hello%20world',
    });
    expect(r.join).toBe('g1');
    expect(r.invite).toBe('hello world');
    expect(r.hasInviteDeepLink).toBe(true);
  });

  test('no deep link without join', () => {
    const r = parseGroupInviteFromLocation({
      search: '',
      hash: '#invite=only',
    });
    expect(r.join).toBe('');
    expect(r.invite).toBe('only');
    expect(r.hasInviteDeepLink).toBe(false);
  });
});

describe('buildGroupInviteShareUrl', () => {
  test('includes join and invite query params', () => {
    const u = buildGroupInviteShareUrl('https://example.com', 'gid', 'xyz');
    expect(u).toBe('https://example.com/groups?join=gid&invite=xyz');
  });
});
