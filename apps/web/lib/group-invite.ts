/**
 * Parse group invite deep-link from a URL or Location (join + invite in query and/or legacy hash).
 */
export function parseGroupInviteFromLocation(loc: Pick<Location, 'search' | 'hash'>): {
  join: string;
  invite: string;
  hasInviteDeepLink: boolean;
} {
  const params = new URLSearchParams(loc.search);
  const join = params.get('join')?.trim() ?? '';
  let invite = params.get('invite')?.trim() ?? '';

  if (!invite && loc.hash) {
    const rawHash = loc.hash.replace(/^#/, '');
    const inviteMatch = rawHash.match(/^invite=(.*)$/);
    const inviteEncoded = inviteMatch?.[1];
    if (inviteEncoded) {
      try {
        invite = decodeURIComponent(inviteEncoded);
      } catch {
        invite = inviteEncoded;
      }
    }
  }

  const hasInviteDeepLink = join.length > 0;
  return { join, invite, hasInviteDeepLink };
}

export function buildGroupInviteShareUrl(origin: string, groupId: string, inviteCode: string): string {
  const u = new URL(`${origin.replace(/\/$/, '')}/groups`);
  u.searchParams.set('join', groupId);
  u.searchParams.set('invite', inviteCode);
  return u.href;
}
