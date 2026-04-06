'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DbGroup, DbGameLoan } from '@/lib/database.types';
import { createClient } from '@/lib/supabase/client';
import GroupPanel from '@/components/GroupPanel';

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

type Tab = 'my-groups' | 'join';

export default function GroupsPage() {
  const [tab, setTab] = useState<Tab>('my-groups');
  const [groups, setGroups] = useState<DbGroup[]>([]);
  const [groupDetails, setGroupDetails] = useState<Record<string, GroupDetail>>({});
  const [loans, setLoans] = useState<DbGameLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

  // Create group state
  const [newGroupName, setNewGroupName] = useState('');
  const [creating, setCreating] = useState(false);

  // Join group state
  const [joinGroupId, setJoinGroupId] = useState('');
  const [joinInviteCode, setJoinInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);

      const [groupsRes, loansRes] = await Promise.all([
        fetch('/api/groups'),
        fetch('/api/loans'),
      ]);

      if (groupsRes.status === 401) {
        setError('Sign in to manage your groups.');
        setLoading(false);
        return;
      }

      if (!groupsRes.ok) {
        const err = await groupsRes.json();
        throw new Error(err.error || 'Failed to load groups');
      }

      const groupsData: DbGroup[] = await groupsRes.json();
      setGroups(groupsData);

      if (loansRes.ok) {
        const loansData: DbGameLoan[] = await loansRes.json();
        setLoans(loansData);
      }

      const details: Record<string, GroupDetail> = {};
      await Promise.all(
        groupsData.map(async (g) => {
          const res = await fetch(`/api/groups/${g.id}`);
          if (res.ok) {
            details[g.id] = await res.json();
          }
        }),
      );
      setGroupDetails(details);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || creating) return;

    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create group');
      }

      setNewGroupName('');
      await fetchGroups();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinGroupId.trim() || !joinInviteCode.trim() || joining) return;

    setJoining(true);
    setError(null);
    try {
      const res = await fetch(`/api/groups/${joinGroupId.trim()}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_code: joinInviteCode.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to join group');
      }

      setJoinGroupId('');
      setJoinInviteCode('');
      setTab('my-groups');
      await fetchGroups();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join group');
    } finally {
      setJoining(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Delete this group? All members will be removed.')) return;

    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete group');
      }
      await fetchGroups();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete group');
    }
  };

  const handleRemoveMember = async (groupId: string, userId: string) => {
    if (!confirm('Remove this member from the group?')) return;

    try {
      const res = await fetch(
        `/api/groups/${groupId}/members?user_id=${userId}`,
        { method: 'DELETE' },
      );
      if (!res.ok && res.status !== 204) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to remove member');
      }
      await fetchGroups();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove member');
    }
  };

  const handleRequestLoan = async (gameId: string, ownerId: string, groupId: string) => {
    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: gameId,
          owner_id: ownerId,
          group_id: groupId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to request loan');
      }

      await fetchGroups();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to request loan');
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'my-groups', label: 'MY GROUPS' },
    { key: 'join', label: 'JOIN / CREATE' },
  ];

  return (
    <div className="relative z-10 px-6 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-3xl md:text-4xl font-black font-display uppercase tracking-tighter mb-2"
            style={{ color: 'var(--accent)' }}
          >
            GROUPS
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Create squads, share collections, and borrow games from friends.
          </p>
        </div>

        {/* Tab bar */}
        <div
          className="flex gap-1 mb-8 p-1 rounded-lg w-fit"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="px-5 py-2 rounded-md font-display text-[10px] tracking-[0.15em] transition-all duration-200"
              style={{
                background: tab === key ? 'var(--bg-elevated)' : 'transparent',
                color: tab === key ? 'var(--accent)' : 'var(--text-muted)',
                boxShadow:
                  tab === key
                    ? '0 0 8px color-mix(in srgb, var(--accent) 20%, transparent)'
                    : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div
            className="mb-6 px-4 py-3 rounded-lg border text-sm font-display"
            style={{
              background: 'color-mix(in srgb, var(--accent-secondary) 8%, transparent)',
              borderColor: 'color-mix(in srgb, var(--accent-secondary) 30%, transparent)',
              color: 'var(--accent-secondary)',
            }}
          >
            {error}
          </div>
        )}

        {/* My Groups tab */}
        {tab === 'my-groups' && (
          <>
            {loading ? (
              <div className="space-y-6">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="glass-card p-6">
                    <div className="skeleton h-6 w-48 mb-4" />
                    <div className="skeleton h-4 w-32 mb-6" />
                    <div className="flex gap-2 mb-6">
                      {Array.from({ length: 3 }).map((_, j) => (
                        <div key={j} className="skeleton h-8 w-24 rounded-full" />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="skeleton h-48 rounded-xl" />
                      <div className="skeleton h-48 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div
                  className="text-6xl mb-6 opacity-20"
                  style={{ color: 'var(--accent)' }}
                >
                  <span className="font-display">⬡</span>
                </div>
                <h3
                  className="font-display text-xl mb-2 tracking-widest"
                  style={{ color: 'var(--accent)' }}
                >
                  NO SQUADS YET
                </h3>
                <p
                  className="text-sm max-w-xs mx-auto mb-6"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Create a group or join an existing one to start sharing games with your crew.
                </p>
                <button
                  onClick={() => setTab('join')}
                  className="btn-neon btn-neon-solid text-xs"
                >
                  CREATE OR JOIN
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {groups.map((group) => {
                  const detail = groupDetails[group.id];
                  if (!detail) {
                    return (
                      <div key={group.id} className="glass-card p-6">
                        <div className="skeleton h-6 w-48 mb-2" />
                        <div className="skeleton h-4 w-32" />
                      </div>
                    );
                  }
                  return (
                    <GroupPanel
                      key={group.id}
                      group={detail}
                      currentUserId={currentUserId}
                      loans={loans}
                      onRequestLoan={handleRequestLoan}
                      onDeleteGroup={handleDeleteGroup}
                      onRemoveMember={handleRemoveMember}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Join / Create tab */}
        {tab === 'join' && (
          <div className="grid gap-8 md:grid-cols-2">
            {/* Create Group */}
            <div className="glass-card p-6">
              <h3
                className="font-display text-sm tracking-[0.15em] uppercase mb-1"
                style={{ color: 'var(--accent)' }}
              >
                CREATE GROUP
              </h3>
              <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
                Start a new squad. You&apos;ll get an invite code to share.
              </p>

              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label
                    htmlFor="group-name"
                    className="block text-[10px] font-display tracking-wider mb-1.5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    GROUP NAME
                  </label>
                  <input
                    id="group-name"
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g. Nintendo Crew"
                    className="input-neon"
                    maxLength={50}
                  />
                </div>
                <button
                  type="submit"
                  disabled={creating || !newGroupName.trim()}
                  className="btn-neon btn-neon-solid w-full text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full border-2 border-void border-t-transparent animate-spin" />
                      CREATING...
                    </span>
                  ) : (
                    'CREATE GROUP'
                  )}
                </button>
              </form>
            </div>

            {/* Join Group */}
            <div className="glass-card p-6">
              <h3
                className="font-display text-sm tracking-[0.15em] uppercase mb-1"
                style={{ color: 'var(--accent)' }}
              >
                JOIN GROUP
              </h3>
              <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
                Got an invite? Enter the group ID and code to join.
              </p>

              <form onSubmit={handleJoinGroup} className="space-y-4">
                <div>
                  <label
                    htmlFor="join-group-id"
                    className="block text-[10px] font-display tracking-wider mb-1.5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    GROUP ID
                  </label>
                  <input
                    id="join-group-id"
                    type="text"
                    value={joinGroupId}
                    onChange={(e) => setJoinGroupId(e.target.value)}
                    placeholder="Paste group ID"
                    className="input-neon"
                  />
                </div>
                <div>
                  <label
                    htmlFor="join-invite-code"
                    className="block text-[10px] font-display tracking-wider mb-1.5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    INVITE CODE
                  </label>
                  <input
                    id="join-invite-code"
                    type="text"
                    value={joinInviteCode}
                    onChange={(e) => setJoinInviteCode(e.target.value)}
                    placeholder="Enter invite code"
                    className="input-neon"
                  />
                </div>
                <button
                  type="submit"
                  disabled={joining || !joinGroupId.trim() || !joinInviteCode.trim()}
                  className="btn-neon btn-neon-cyan w-full text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {joining ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full border-2 border-void border-t-transparent animate-spin" />
                      JOINING...
                    </span>
                  ) : (
                    'JOIN GROUP'
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
