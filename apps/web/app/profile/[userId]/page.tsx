'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type PublicProfile = {
  user_id: string;
  display_name: string | null;
  account_hint: string | null;
  friend_code: string | null;
  nintendo_profile_url: string | null;
};

function shortUserId(userId: string) {
  return userId.slice(0, 8).toUpperCase();
}

function headline(row: PublicProfile) {
  const name = row.display_name?.trim();
  if (name) return name;
  const hint = row.account_hint?.trim();
  if (hint) return hint;
  return shortUserId(row.user_id);
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

export default function MemberProfilePage() {
  const params = useParams();
  const userId = typeof params.userId === 'string' ? params.userId : '';

  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [row, setRow] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setError('Invalid profile link.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);

      if (!user) {
        setError('Sign in to view this profile.');
        setRow(null);
        return;
      }

      const res = await fetch(`/api/profile/${encodeURIComponent(userId)}`);
      if (res.status === 404) {
        setError(
          'Profile not found, or you do not share a group with this person.',
        );
        setRow(null);
        return;
      }
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || 'Failed to load profile');
      }
      const data: PublicProfile = await res.json();
      setRow(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setRow(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const isSelf = currentUserId === userId;
  const nintendoUrl = row ? safeHttpsUrl(row.nintendo_profile_url) : null;

  return (
    <div className="relative z-10 px-6 py-8">
      <div className="max-w-lg mx-auto">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1
              className="text-3xl md:text-4xl font-black font-display uppercase tracking-tighter mb-2"
              style={{ color: 'var(--accent)' }}
            >
              MEMBER
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Details they share with groupmates for lending and friend codes.
            </p>
          </div>
          <Link
            href="/groups"
            className="text-[10px] font-display tracking-widest uppercase"
            style={{ color: 'var(--accent-secondary)' }}
          >
            ← Groups
          </Link>
        </div>

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

        {loading ? (
          <div className="glass-card p-6 space-y-4">
            <div className="skeleton h-8 w-48 rounded-lg" />
            <div className="skeleton h-4 w-full rounded-lg" />
            <div className="skeleton h-4 w-3/4 rounded-lg" />
          </div>
        ) : row ? (
          <div className="glass-card p-6 space-y-5">
            {isSelf && (
              <p className="text-xs rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                This is you.{' '}
                <Link href="/profile" className="font-display uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                  Edit your profile
                </Link>
              </p>
            )}

            <div>
              <p
                className="text-[10px] font-display tracking-widest uppercase mb-1"
                style={{ color: 'var(--text-muted)' }}
              >
                Name
              </p>
              <p className="font-display text-xl tracking-wide" style={{ color: 'var(--accent)' }}>
                {headline(row)}
              </p>
            </div>

            {row.friend_code?.trim() && (
              <div>
                <p
                  className="text-[10px] font-display tracking-widest uppercase mb-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Switch friend code
                </p>
                <p className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
                  {row.friend_code.trim()}
                </p>
              </div>
            )}

            {nintendoUrl && (
              <div>
                <p
                  className="text-[10px] font-display tracking-widest uppercase mb-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Nintendo profile
                </p>
                <a
                  href={nintendoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm break-all underline-offset-2 hover:underline"
                  style={{ color: 'var(--accent-secondary)' }}
                >
                  {nintendoUrl}
                </a>
              </div>
            )}

            {!row.friend_code?.trim() && !nintendoUrl && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                No friend code or Nintendo link on file yet.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
