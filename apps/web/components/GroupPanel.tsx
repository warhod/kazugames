'use client';

import { useState } from 'react';
import type { DbGroup, DbGameLoan } from '@/lib/database.types';
import GameCard from './GameCard';

interface GroupMember {
  user_id: string;
  joined_at: string;
}

interface LoanableGame {
  id: string;
  user_id: string;
  game_id: string;
  status: string;
  loanable: boolean;
  game: {
    id: string;
    title: string;
    deku_url: string;
    image_url: string | null;
    current_price: number | null;
    msrp: number | null;
    platform: string;
  };
}

interface GroupDetail extends DbGroup {
  members: GroupMember[];
  loanable_games: LoanableGame[];
}

interface GroupPanelProps {
  group: GroupDetail;
  currentUserId?: string;
  loans?: DbGameLoan[];
  onRequestLoan?: (gameId: string, ownerId: string, groupId: string) => void;
  onDeleteGroup?: (groupId: string) => void;
  onRemoveMember?: (groupId: string, userId: string) => void;
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
        <div className="flex flex-wrap gap-2">
          {group.members.map((member) => {
            const isSelf = member.user_id === currentUserId;
            const isMemberOwner = member.user_id === group.owner_id;
            return (
              <div
                key={member.user_id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border"
                style={{
                  borderColor: isMemberOwner
                    ? 'var(--accent)'
                    : 'var(--border-subtle)',
                  background: 'var(--bg-elevated)',
                  color: isMemberOwner ? 'var(--accent)' : 'var(--text-primary)',
                }}
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{
                    background: isMemberOwner
                      ? 'color-mix(in srgb, var(--accent) 20%, transparent)'
                      : 'var(--bg-surface)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {isMemberOwner ? '★' : '●'}
                </span>
                <span className="font-display text-[10px] tracking-wider">
                  {isSelf ? 'YOU' : member.user_id.slice(0, 8).toUpperCase()}
                </span>
                {isOwner && !isSelf && onRemoveMember && (
                  <button
                    onClick={() => onRemoveMember(group.id, member.user_id)}
                    className="ml-1 w-4 h-4 flex items-center justify-center rounded-full text-[8px] hover:opacity-100 opacity-50 transition-opacity"
                    style={{ color: 'var(--accent-secondary)' }}
                    title="Remove member"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
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
            No games marked as loanable yet. Members can toggle lending in their collection.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {group.loanable_games.map((ug) => {
              const alreadyLoaned = hasActiveLoan(ug.game_id, ug.user_id);
              const isSelf = ug.user_id === currentUserId;
              return (
                <div key={ug.id} className="relative">
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
                        onClick={() => onRequestLoan(ug.game_id, ug.user_id, group.id)}
                        disabled={alreadyLoaned}
                        className="btn-neon btn-neon-solid w-full text-[10px] py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {alreadyLoaned ? 'LOAN PENDING' : 'REQUEST BORROW'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
