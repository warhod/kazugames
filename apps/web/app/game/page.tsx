'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { DbGame, DbUserGame, GameStatus } from '@/lib/database.types';

type CollectionEntry = Pick<DbUserGame, 'id' | 'status' | 'lendable'>;

const STATUSES: { value: GameStatus; label: string; icon: string }[] = [
  { value: 'owned',     label: 'Owned',     icon: '✓' },
  { value: 'playing',   label: 'Playing',   icon: '▶' },
  { value: 'completed', label: 'Completed', icon: '★' },
  { value: 'abandoned', label: 'Dropped',   icon: '⌛' },
];

function PriceBadge({ current, msrp }: { current: number | null; msrp: number | null }) {
  if (current === null) {
    return (
      <span className="text-sm font-display" style={{ color: 'var(--text-muted)' }}>
        AVAILABILITY UNKNOWN
      </span>
    );
  }
  const pct = msrp && msrp > current ? Math.round(((msrp - current) / msrp) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className={`price-badge ${msrp && current < msrp ? 'price-badge-sale' : ''}`}>
        ${current.toFixed(2)}
      </span>
      {msrp && current < msrp && (
        <span className="price-msrp-strike">${msrp.toFixed(2)}</span>
      )}
      {pct > 0 && (
        <span
          className="px-2 py-0.5 rounded text-[10px] font-bold font-display"
          style={{
            background: 'var(--neon-green)',
            color: '#000',
            boxShadow: '0 0 12px rgba(57,255,20,0.4)',
          }}
        >
          -{pct}%
        </span>
      )}
    </div>
  );
}

function GameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const url = searchParams.get('url') ?? '';

  const [game, setGame] = useState<DbGame | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState<GameStatus | ''>('');
  const [collectionEntry, setCollectionEntry] = useState<CollectionEntry | null>(null);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [collectionBusy, setCollectionBusy] = useState(false);
  const [collectionErr, setCollectionErr] = useState<string | null>(null);

  useEffect(() => {
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setCollectionEntry(null);
    setCollectionErr(null);

    fetch(`/api/games?url=${encodeURIComponent(url)}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<DbGame>;
      })
      .then((data) => setGame(data))
      .catch((e) => setError(e.message ?? 'Failed to load game'))
      .finally(() => setLoading(false));
  }, [url]);

  useEffect(() => {
    if (!game?.id) return;

    let cancelled = false;
    setMembershipLoading(true);
    setCollectionErr(null);

    fetch(`/api/collection/lookup?game_id=${encodeURIComponent(game.id)}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401) {
          setCollectionEntry(null);
          return;
        }
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }
        const data: { entry: CollectionEntry | null } = await res.json();
        if (!cancelled) {
          setCollectionEntry(data.entry);
          if (data.entry) setSelectedStatus(data.entry.status);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setCollectionErr(e instanceof Error ? e.message : 'Could not load collection status');
        }
      })
      .finally(() => {
        if (!cancelled) setMembershipLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [game?.id]);

  const refreshCollectionEntry = async (gameId: string) => {
    const res = await fetch(`/api/collection/lookup?game_id=${encodeURIComponent(gameId)}`);
    if (res.status === 401) {
      setCollectionEntry(null);
      return;
    }
    if (!res.ok) return;
    const data: { entry: CollectionEntry | null } = await res.json();
    setCollectionEntry(data.entry);
    if (data.entry) setSelectedStatus(data.entry.status);
  };

  const handleAddToCollection = async () => {
    if (!game || adding || !selectedStatus) return;
    setAdding(true);
    setCollectionErr(null);

    try {
      const res = await fetch('/api/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: game.id, status: selectedStatus }),
      });

      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/game?url=${encodeURIComponent(url)}`)}`);
        return;
      }

      if (res.status === 409) {
        await refreshCollectionEntry(game.id);
        setCollectionErr('This title is already in your collection.');
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to add to collection');
      }

      const row: DbUserGame = await res.json();
      setCollectionEntry({
        id: row.id,
        status: row.status,
        lendable: row.lendable,
      });
      setSelectedStatus(row.status);
    } catch (e) {
      setCollectionErr(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setAdding(false);
    }
  };

  const handleStatusChange = async (next: GameStatus) => {
    if (!collectionEntry || collectionBusy) return;
    setSelectedStatus(next);
    setCollectionBusy(true);
    setCollectionErr(null);
    try {
      const res = await fetch(`/api/collection/${collectionEntry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });

      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/game?url=${encodeURIComponent(url)}`)}`);
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to update status');
      }

      const updated: DbUserGame = await res.json();
      setCollectionEntry({
        id: updated.id,
        status: updated.status,
        lendable: updated.lendable,
      });
    } catch (e) {
      setSelectedStatus(collectionEntry.status);
      setCollectionErr(e instanceof Error ? e.message : 'Failed to update status');
    } finally {
      setCollectionBusy(false);
    }
  };

  const handleRemoveFromCollection = async () => {
    if (!collectionEntry || collectionBusy) return;
    if (!confirm('Remove this game from your collection?')) return;

    setCollectionBusy(true);
    setCollectionErr(null);
    try {
      const res = await fetch(`/api/collection/${collectionEntry.id}`, {
        method: 'DELETE',
      });

      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/game?url=${encodeURIComponent(url)}`)}`);
        return;
      }

      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to remove');
      }

      setCollectionEntry(null);
      setSelectedStatus('');
    } catch (e) {
      setCollectionErr(e instanceof Error ? e.message : 'Failed to remove');
    } finally {
      setCollectionBusy(false);
    }
  };

  if (!url.trim()) {
    return (
      <div className="relative z-10 px-6 py-16 flex flex-col items-center text-center">
        <p className="font-display text-xl mb-4" style={{ color: 'var(--accent)' }}>
          NO URL PROVIDED
        </p>
        <Link href="/" className="btn-neon btn-neon-cyan text-xs">
          BACK TO HOME
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="relative z-10 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="skeleton h-6 w-32 mb-8" />
          <div className="glass-card overflow-hidden">
            <div className="md:flex">
              <div className="skeleton md:w-80 h-64 md:h-auto" />
              <div className="p-8 flex-1 space-y-4">
                <div className="skeleton h-8 w-3/4" />
                <div className="skeleton h-4 w-1/3" />
                <div className="skeleton h-6 w-1/4" />
                <div className="skeleton h-20 w-full" />
                <div className="skeleton h-10 w-40" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="relative z-10 px-6 py-16 flex flex-col items-center text-center">
        <p className="font-display text-xl mb-2" style={{ color: 'var(--accent-secondary)' }}>
          FAILED TO LOAD GAME
        </p>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          {error ?? 'Game not found.'}
        </p>
        <div className="flex gap-3">
          <Link href="/" className="btn-neon btn-neon-cyan text-xs">HOME</Link>
          <a href={url} target="_blank" rel="noopener noreferrer" className="btn-neon text-xs">
            OPEN ON DEKUDEALS ↗
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 px-6 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-6 text-[11px] font-display tracking-wider" style={{ color: 'var(--text-muted)' }}>
          <Link href="/" className="hover:underline" style={{ color: 'var(--accent)' }}>HOME</Link>
          <span className="mx-2">›</span>
          <Link href="/search" className="hover:underline" style={{ color: 'var(--text-muted)' }}>SEARCH</Link>
          <span className="mx-2">›</span>
          <span className="truncate">{game.title}</span>
        </nav>

        <div className="glass-card overflow-hidden">
          <div className="md:flex">
            {/* Cover */}
            <div
              className="relative md:w-72 flex-shrink-0"
              style={{ minHeight: '260px', background: 'var(--bg-elevated)' }}
            >
              {game.image_url && !imgError ? (
                <Image
                  src={game.image_url}
                  alt={game.title}
                  fill
                  className="object-cover"
                  onError={() => setImgError(true)}
                  sizes="(max-width: 768px) 100vw, 288px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl opacity-20">🎮</span>
                </div>
              )}
              {/* Platform badge */}
              <span
                className="absolute top-3 left-3 px-2 py-0.5 rounded text-[9px] font-display tracking-widest"
                style={{
                  background: 'var(--bg-void)',
                  color: 'var(--accent)',
                  border: '1px solid var(--border-subtle)',
                  opacity: 0.9,
                }}
              >
                {game.platform}
              </span>
            </div>

            {/* Details */}
            <div className="flex-1 p-6 md:p-8 flex flex-col gap-5">
              <div>
                <h1
                  className="text-2xl md:text-3xl font-black font-display leading-tight mb-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {game.title}
                </h1>
                <a
                  href={game.deku_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-display hover:underline"
                  style={{ color: 'var(--text-muted)' }}
                >
                  VIEW ON DEKUDEALS ↗
                </a>
              </div>

              {/* Price */}
              <PriceBadge current={game.current_price} msrp={game.msrp} />

              {/* Description */}
              {game.description && (
                <p className="text-sm leading-relaxed line-clamp-4" style={{ color: 'var(--text-muted)' }}>
                  {game.description}
                </p>
              )}

              {/* Collection: status + add / remove on this screen */}
              <div
                className="mt-auto pt-4 border-t"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <p
                  className="text-[10px] font-display tracking-[0.15em] uppercase mb-3"
                  style={{ color: 'var(--text-muted)' }}
                >
                  YOUR COLLECTION STATUS
                </p>

                {membershipLoading ? (
                  <div className="skeleton h-10 w-full max-w-xs rounded-md" />
                ) : (
                  <div className="flex flex-col gap-3">
                    {!collectionEntry && (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Choose a status, then add this game to your collection.
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                      <select
                        value={selectedStatus}
                        onChange={(e) => {
                          const v = e.target.value as GameStatus;
                          if (collectionEntry) void handleStatusChange(v);
                          else setSelectedStatus(v);
                        }}
                        disabled={
                          membershipLoading ||
                          (collectionEntry ? collectionBusy : adding)
                        }
                        className="input-neon text-xs py-2 px-3"
                        style={{ background: 'var(--bg-elevated)', width: 'auto' }}
                      >
                        {!collectionEntry && (
                          <option value="" disabled>
                            Select status
                          </option>
                        )}
                        {STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.icon} {s.label}
                          </option>
                        ))}
                      </select>

                      {!collectionEntry && (
                        <button
                          type="button"
                          onClick={() => void handleAddToCollection()}
                          disabled={adding || !selectedStatus}
                          className="btn-neon btn-neon-solid text-xs px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {adding ? (
                            <span className="inline-flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full border-2 border-void border-t-transparent animate-spin" />
                              ADDING…
                            </span>
                          ) : !selectedStatus ? (
                            'SELECT STATUS TO ADD'
                          ) : (
                            '+ ADD TO COLLECTION'
                          )}
                        </button>
                      )}
                    </div>

                    {collectionEntry && (
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                        <p
                          className="text-sm font-display w-full sm:w-auto sm:mr-2"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Already in your collection.
                        </p>
                        <button
                          type="button"
                          onClick={handleRemoveFromCollection}
                          disabled={collectionBusy}
                          className="btn-neon btn-neon-pink text-xs px-4 py-2 w-fit disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          REMOVE FROM COLLECTION
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {collectionErr && (
                  <p className="mt-2 text-xs" style={{ color: 'var(--accent-secondary)' }}>
                    {collectionErr}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <div className="relative z-10 px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="glass-card overflow-hidden">
              <div className="md:flex">
                <div className="skeleton md:w-72 h-64" />
                <div className="p-8 flex-1 space-y-4">
                  <div className="skeleton h-8 w-3/4" />
                  <div className="skeleton h-4 w-1/3" />
                  <div className="skeleton h-6 w-1/4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <GameContent />
    </Suspense>
  );
}
