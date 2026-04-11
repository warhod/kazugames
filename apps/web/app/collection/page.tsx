'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GameStatus, DbUserGame } from '@/lib/database.types';
import CollectionGrid from '@/components/CollectionGrid';
import SearchBar from '@/components/SearchBar';

type FilterTab = 'all' | GameStatus;

const FILTER_TABS: { key: FilterTab; label: string; icon: string }[] = [
  { key: 'all',       label: 'ALL',       icon: '◈' },
  { key: 'owned',     label: 'OWNED',     icon: '✓' },
  { key: 'wishlist',  label: 'WISHLIST',  icon: '♥' },
  { key: 'playing',   label: 'PLAYING',   icon: '▶' },
  { key: 'completed', label: 'COMPLETED', icon: '★' },
  { key: 'abandoned', label: 'DROPPED',   icon: '⌛' },
];

export default function CollectionPage() {
  const [userGames, setUserGames] = useState<DbUserGame[]>([]);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchCollection = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/collection');

      if (res.status === 401) {
        setError('Sign in to view your collection.');
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load collection');
      }

      const data: DbUserGame[] = await res.json();
      setUserGames(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollection();
  }, [fetchCollection]);

  const handleStatusChange = async (userGameId: string, newStatus: GameStatus) => {
    setUpdatingId(userGameId);
    try {
      const res = await fetch(`/api/collection/${userGameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update status');
      }

      const updated: DbUserGame = await res.json();
      setUserGames((prev) =>
        prev.map((ug) => (ug.id === updated.id ? updated : ug)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleLoanable = async (userGameId: string, currentLoanable: boolean) => {
    setUpdatingId(userGameId);
    try {
      const res = await fetch(`/api/collection/${userGameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanable: !currentLoanable }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to toggle lending');
      }

      const updated: DbUserGame = await res.json();
      setUserGames((prev) =>
        prev.map((ug) => (ug.id === updated.id ? updated : ug)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveGame = async (userGameId: string) => {
    if (!confirm('Remove this game from your collection?')) return;

    try {
      const res = await fetch(`/api/collection/${userGameId}`, {
        method: 'DELETE',
      });

      if (!res.ok && res.status !== 204) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to remove');
      }

      setUserGames((prev) => prev.filter((ug) => ug.id !== userGameId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove');
    }
  };

  const filtered =
    filter === 'all'
      ? userGames
      : userGames.filter((ug) => ug.status === filter);

  const statusCounts = userGames.reduce(
    (acc, ug) => {
      acc[ug.status] = (acc[ug.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const gamesForGrid = filtered
    .filter((ug) => ug.game)
    .map((ug) => ({
      id: ug.game!.id,
      title: ug.game!.title,
      deku_url: ug.game!.deku_url,
      image_url: ug.game!.image_url,
      current_price: ug.game!.current_price,
      msrp: ug.game!.msrp,
      platform: ug.game!.platform,
      status: ug.status,
    }));

  return (
    <div className="relative z-10 px-6 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1
              className="text-3xl md:text-4xl font-black font-display uppercase tracking-tighter mb-2"
              style={{ color: 'var(--accent)' }}
            >
              COLLECTION
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {userGames.length} title{userGames.length !== 1 ? 's' : ''} in your collection
            </p>
          </div>

          {/* Quick-add search */}
          <div className="w-full md:w-80">
            <SearchBar />
          </div>
        </div>

        {/* Stats ribbon */}
        {!loading && userGames.length > 0 && (
          <div
            className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-8"
          >
            {[
              { label: 'Owned', count: statusCounts['owned'] || 0, color: 'var(--neon-green)' },
              { label: 'Wishlist', count: statusCounts['wishlist'] || 0, color: 'var(--accent)' },
              { label: 'Playing', count: statusCounts['playing'] || 0, color: 'var(--neon-yellow)' },
              { label: 'Completed', count: statusCounts['completed'] || 0, color: 'var(--neon-purple)' },
              { label: 'Dropped', count: statusCounts['abandoned'] || 0, color: 'var(--text-muted)' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="glass-card p-3 text-center"
              >
                <div
                  className="text-2xl font-bold font-display"
                  style={{ color: stat.color }}
                >
                  {stat.count}
                </div>
                <div
                  className="text-[9px] font-display tracking-[0.15em] uppercase mt-0.5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        <div
          className="flex gap-1 mb-8 p-1 rounded-lg overflow-x-auto"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          {FILTER_TABS.map(({ key, label, icon }) => {
            const count = key === 'all' ? userGames.length : (statusCounts[key] || 0);
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md font-display text-[10px] tracking-[0.1em] transition-all duration-200 whitespace-nowrap"
                style={{
                  background: filter === key ? 'var(--bg-elevated)' : 'transparent',
                  color: filter === key ? 'var(--accent)' : 'var(--text-muted)',
                  boxShadow:
                    filter === key
                      ? '0 0 8px color-mix(in srgb, var(--accent) 20%, transparent)'
                      : 'none',
                }}
              >
                <span>{icon}</span>
                {label}
                <span
                  className="ml-1 px-1.5 py-0.5 rounded-full text-[8px]"
                  style={{
                    background: filter === key
                      ? 'color-mix(in srgb, var(--accent) 15%, transparent)'
                      : 'var(--bg-elevated)',
                    color: filter === key ? 'var(--accent)' : 'var(--text-muted)',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
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

        {/* Collection management grid */}
        {loading ? (
          <CollectionGrid games={[]} loading={true} />
        ) : filtered.length === 0 && filter !== 'all' ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <h3
              className="font-display text-lg mb-2 tracking-widest"
              style={{ color: 'var(--accent)' }}
            >
              NO {FILTER_TABS.find((t) => t.key === filter)?.label} TITLES
            </h3>
            <p className="text-sm max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>
              Games with this status will appear here.
            </p>
          </div>
        ) : (
          <>
            <CollectionGrid games={gamesForGrid} showStatus={true} />

            {/* Inline management controls */}
            {filtered.length > 0 && (
              <div className="mt-10">
                <h3
                  className="text-[10px] font-display tracking-[0.2em] uppercase mb-4 border-b pb-3"
                  style={{ color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}
                >
                  MANAGE TITLES
                </h3>
                <div className="space-y-2">
                  {filtered.map((ug) => {
                    if (!ug.game) return null;
                    const isUpdating = updatingId === ug.id;
                    return (
                      <div
                        key={ug.id}
                        className="glass-card flex items-center gap-4 px-4 py-3"
                        style={{ opacity: isUpdating ? 0.6 : 1 }}
                      >
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-sm font-semibold truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {ug.game.title}
                          </p>
                        </div>

                        {/* Status selector */}
                        <select
                          value={ug.status}
                          onChange={(e) =>
                            handleStatusChange(ug.id, e.target.value as GameStatus)
                          }
                          disabled={isUpdating}
                          className="input-neon text-xs py-1.5 px-2 w-auto"
                          style={{ background: 'var(--bg-elevated)' }}
                        >
                          <option value="owned">Owned</option>
                          <option value="wishlist">Wishlist</option>
                          <option value="playing">Playing</option>
                          <option value="completed">Completed</option>
                          <option value="abandoned">Dropped</option>
                        </select>

                        {/* Loanable toggle */}
                        <button
                          onClick={() => handleToggleLoanable(ug.id, ug.loanable)}
                          disabled={isUpdating}
                          className="btn-neon text-[9px] px-3 py-1.5 whitespace-nowrap"
                          style={{
                            borderColor: ug.loanable ? 'var(--neon-green)' : 'var(--border-subtle)',
                            color: ug.loanable ? 'var(--neon-green)' : 'var(--text-muted)',
                            background: ug.loanable
                              ? 'rgba(57, 255, 20, 0.08)'
                              : 'transparent',
                          }}
                        >
                          {ug.loanable ? '✓ LENDABLE' : 'LEND OFF'}
                        </button>

                        {/* Remove */}
                        <button
                          onClick={() => handleRemoveGame(ug.id)}
                          disabled={isUpdating}
                          className="btn-neon btn-neon-pink text-[9px] px-2 py-1.5"
                          title="Remove from collection"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
