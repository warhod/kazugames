'use client';

import { useState } from 'react';
import type {
  DbGroup,
  DbGameLoan,
  DbGroupMemberView,
  DbLoanableGameRow,
  DbPublicProfile,
} from '@/lib/database.types';
import GameCard from './GameCard';

interface GroupDetail extends DbGroup {
  members: DbGroupMemberView[];
  loanable_games: DbLoanableGameRow[];
}

interface GroupPanelProps {
  group: GroupDetail;
  currentUserId?: string;
  loans?: DbGameLoan[];
  onRequestLoan?: (gameId: string, ownerId: string, groupId: string) => void;
  onDeleteGroup?: (groupId: string) => void;
  onRemoveMember?: (groupId: string, userId: string) => void;
}

function shortUserId(userId: string) {
  return userId.slice(0, 8).toUpperCase();
}

function displayNameForMember(
  profile: DbPublicProfile,
  userId: string,
  currentUserId: string | undefined,
  isGroupOwner: boolean,
) {
  const name = profile.display_name?.trim();
  if (name) return name;
  if (userId === currentUserId) return 'YOU';
  if (isGroupOwner) return 'OWNER';
  return shortUserId(userId);
}

function ownerLabel(profile: DbPublicProfile, ownerUserId: string) {
  const name = profile.display_name?.trim();
  if (name) return name;
  return shortUserId(ownerUserId);
}

function safeHttpsUrl(url: string | null): string | null {
  const u = url?.trim();
  if (!u) return null;
  try {
    const parsed = new URL(u);
    return parsed.protocol === 'https:' ? parsed.href : null;
  } catch {
    return null;
  }
}

export default function GroupPanel({
  group,
  currentUserId,
  loans = [],
  onRequestLoan,
  onDeleteGroup,
  onRemoveMember,
}: GroupPanelProps) {
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedFriendFor, setCopiedFriendFor] = useState<string | null>(null);
  const isOwner = currentUserId === group.owner_id;

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(group.invite_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      setShowInviteCode(true);
    }
  };

  const copyFriendCode = async (userId: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedFriendFor(userId);
      setTimeout(() => setCopiedFriendFor(null), 2000);
    } catch {
      // ignore
    }
  };

  const hasActiveLoan = (gameId: string, ownerId: string) => {
    return loans.some(
      (l) =>
        l.game_id === gameId &&
        l.owner_id === ownerId &&
        (l.status === 'requested' || l.status === 'approved'),
    );
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div
        className="p-5 border-b flex items-start justify-between gap-4"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="min-w-0">
          <h3
            className="font-display text-lg tracking-widest uppercase truncate"
            style={{ color: 'var(--accent)' }}
          >
            {group.name}
          </h3>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {group.members.length} member{group.members.length !== 1 ? 's' : ''} &middot;
            Created {new Date(group.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={copyInviteCode}
            className="btn-neon btn-neon-cyan text-[10px] px-3 py-1.5"
            title="Copy invite code"
          >
            {copiedCode ? 'COPIED!' : 'INVITE'}
          </button>
          {isOwner && onDeleteGroup && (
            <button
              onClick={() => onDeleteGroup(group.id)}
              className="btn-neon btn-neon-pink text-[10px] px-3 py-1.5"
              title="Delete group"
            >
              DELETE
            </button>
          )}
        </div>
      </div>

      {/* Invite code reveal */}
      {showInviteCode && (
        <div
          className="px-5 py-3 text-xs font-mono flex items-center gap-2 border-b"
          style={{
            background: 'var(--bg-elevated)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--accent)',
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>Code:</span>
          <code className="font-bold tracking-wider">{group.invite_code}</code>
          <button
            onClick={() => setShowInviteCode(false)}
            className="ml-auto text-[10px]"
            style={{ color: 'var(--text-muted)' }}
          >
            HIDE
          </button>
        </div>
      )}

      {/* Members */}
      <div
        className="px-5 py-4 border-b"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <h4
          className="text-[10px] font-display tracking-[0.2em] uppercase mb-3"
          style={{ color: 'var(--text-muted)' }}
        >
          MEMBERS
        </h4>
        <ul className="space-y-2">
          {group.members.map((member) => {
            const isSelf = member.user_id === currentUserId;
            const isMemberOwner = member.user_id === group.owner_id;
            const primary = displayNameForMember(
              member.profile,
              member.user_id,
              currentUserId,
              isMemberOwner,
            );
            const friend = member.profile.friend_code?.trim() || null;
            const nintendoUrl = safeHttpsUrl(member.profile.nintendo_profile_url);

            return (
              <li
                key={member.user_id}
                className="flex items-start gap-3 rounded-lg border px-3 py-2.5"
                style={{
                  borderColor: isMemberOwner
                    ? 'var(--accent)'
                    : 'var(--border-subtle)',
                  background: 'var(--bg-elevated)',
                }}
              >
                <span
                  className="mt-0.5 w-7 h-7 rounded-full flex shrink-0 items-center justify-center text-xs font-bold"
                  style={{
                    background: isMemberOwner
                      ? 'color-mix(in srgb, var(--accent) 22%, transparent)'
                      : 'var(--bg-surface)',
                    color: isMemberOwner ? 'var(--accent)' : 'var(--text-muted)',
                  }}
                  aria-hidden
                >
                  {isMemberOwner ? '★' : '●'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex flex-wrap items-center gap-2">
                      <span
                        className="font-display text-xs tracking-wide"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {primary}
                      </span>
                      {isSelf && member.profile.display_name?.trim() && (
                        <span
                          className="text-[10px] uppercase tracking-wider"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          (you)
                        </span>
                      )}
                    </div>
                    {isOwner && !isSelf && onRemoveMember && (
                      <button
                        onClick={() => onRemoveMember(group.id, member.user_id)}
                        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-[10px] hover:opacity-100 opacity-60 transition-opacity"
                        style={{ color: 'var(--accent-secondary)' }}
                        title="Remove member"
                        type="button"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div
                    className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {friend && (
                      <span className="inline-flex items-center gap-1.5 font-mono">
                        {friend}
                        <button
                          type="button"
                          onClick={() => copyFriendCode(member.user_id, friend)}
                          className="uppercase tracking-wider underline-offset-2 hover:underline"
                          style={{ color: 'var(--accent)' }}
                        >
                          {copiedFriendFor === member.user_id ? 'Copied' : 'Copy'}
                        </button>
                      </span>
                    )}
                    {nintendoUrl && (
                      <a
                        href={nintendoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 uppercase tracking-wider"
                        style={{ color: 'var(--accent-secondary)' }}
                      >
                        <span aria-hidden>↗</span> Nintendo
                      </a>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Loanable Games */}
      <div className="px-5 py-4">
        <h4
          className="text-[10px] font-display tracking-[0.2em] uppercase mb-3"
          style={{ color: 'var(--text-muted)' }}
        >
          AVAILABLE TO BORROW ({group.loanable_games.length})
        </h4>

        {group.loanable_games.length === 0 ? (
          <p className="text-xs py-6 text-center" style={{ color: 'var(--text-muted)' }}>
            {`No games available to borrow yet. Owned, completed, or dropped titles in a member's collection appear here for the group.`}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {group.loanable_games.map((ug) => {
              const alreadyLoaned = hasActiveLoan(ug.game_id, ug.user_id);
              const isSelf = ug.user_id === currentUserId;
              return (
                <div key={ug.id} className="flex flex-col gap-2 min-w-0">
                  <div
                    className="inline-flex items-center gap-1.5 self-start rounded-full border px-2.5 py-1 text-[10px] font-display tracking-wider uppercase"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>Owner</span>
                    <span className="font-semibold" style={{ color: 'var(--accent)' }}>
                      {ownerLabel(ug.owner_profile, ug.user_id)}
                    </span>
                  </div>
                  <div className="relative min-w-0">
                    <GameCard
                      id={ug.game.id}
                      title={ug.game.title}
                      deku_url={ug.game.deku_url}
                      image_url={ug.game.image_url}
                      current_price={ug.game.current_price}
                      msrp={ug.game.msrp}
                      platform={ug.game.platform}
                    />
                    {!isSelf && onRequestLoan && (
                      <div className="absolute bottom-3 left-3 right-3">
                        <button
                          type="button"
                          onClick={() => onRequestLoan(ug.game_id, ug.user_id, group.id)}
                          disabled={alreadyLoaned}
                          className="btn-neon btn-neon-solid w-full text-[10px] py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {alreadyLoaned ? 'LOAN PENDING' : 'REQUEST BORROW'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
