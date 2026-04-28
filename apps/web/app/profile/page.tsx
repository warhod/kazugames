'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type ProfileRow = {
  user_id: string;
  display_name: string | null;
  friend_code: string | null;
  nintendo_profile_url: string | null;
  account_hint: string | null;
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [friendCode, setFriendCode] = useState('');
  const [nintendoUrl, setNintendoUrl] = useState('');
  const [accountHint, setAccountHint] = useState<string | null>(null);
  const [showFriendCodeHelp, setShowFriendCodeHelp] = useState(false);
  const [showNintendoHelp, setShowNintendoHelp] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/profile');
      if (res.status === 401) {
        setError('Sign in to edit your profile.');
        return;
      }
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || 'Failed to load profile');
      }
      const row: ProfileRow = await res.json();
      setDisplayName(row.display_name ?? '');
      setFriendCode(row.friend_code ?? '');
      setNintendoUrl(row.nintendo_profile_url ?? '');
      setAccountHint(row.account_hint ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedAt(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName,
          friend_code: friendCode,
          nintendo_profile_url: nintendoUrl,
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || 'Save failed');
      }
      const row: ProfileRow = await res.json();
      setDisplayName(row.display_name ?? '');
      setFriendCode(row.friend_code ?? '');
      setNintendoUrl(row.nintendo_profile_url ?? '');
      setAccountHint(row.account_hint ?? null);
      setSavedAt(Date.now());
      window.dispatchEvent(
        new CustomEvent('kazu:profile-updated', {
          detail: { display_name: row.display_name },
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative z-10 px-6 py-8">
      <div className="max-w-lg mx-auto">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1
              className="text-3xl md:text-4xl font-black font-display uppercase tracking-tighter mb-2"
              style={{ color: 'var(--accent)' }}
            >
              PROFILE
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              How you appear to friends in groups and on loan cards.
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
            <div className="skeleton h-10 w-full rounded-lg" />
            <div className="skeleton h-10 w-full rounded-lg" />
            <div className="skeleton h-10 w-full rounded-lg" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
            {accountHint && !displayName.trim() && (
              <p className="text-xs rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                Until you set a display name, groupmates see{' '}
                <span className="font-mono" style={{ color: 'var(--accent)' }}>{accountHint}</span>{' '}
                (from your account email). Add a name below anytime.
              </p>
            )}

            <div>
              <label
                htmlFor="pf-display-name"
                className="block text-[10px] font-display tracking-wider mb-1.5"
                style={{ color: 'var(--text-muted)' }}
              >
                DISPLAY NAME
              </label>
              <input
                id="pf-display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Kazu"
                className="input-neon"
                maxLength={50}
                autoComplete="nickname"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center gap-3">
                <label
                  htmlFor="pf-friend-code"
                  className="block text-[10px] font-display tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  SWITCH FRIEND CODE
                </label>
                <button
                  type="button"
                  onClick={() => setShowFriendCodeHelp((v) => !v)}
                  className="text-[10px] font-display tracking-wider hover:underline"
                  style={{ color: 'var(--accent)' }}
                  aria-expanded={showFriendCodeHelp}
                  aria-controls="friend-code-help"
                >
                  HELP
                </button>
              </div>
              <input
                id="pf-friend-code"
                type="text"
                value={friendCode}
                onChange={(e) => setFriendCode(e.target.value)}
                placeholder="SW-0000-0000-0000"
                className="input-neon font-mono"
                maxLength={64}
              />
              {showFriendCodeHelp && (
                <p id="friend-code-help" className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  On Nintendo Switch, open HOME Menu, select your user icon, then check your profile to find your
                  friend code in the <span className="font-mono">SW-####-####-####</span> format.
                </p>
              )}
            </div>

            <div>
              <div className="mb-1.5 flex items-center gap-3">
                <label
                  htmlFor="pf-nintendo"
                  className="block text-[10px] font-display tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  NINTENDO PROFILE (HTTPS LINK)
                </label>
                <button
                  type="button"
                  onClick={() => setShowNintendoHelp((v) => !v)}
                  className="text-[10px] font-display tracking-wider hover:underline"
                  style={{ color: 'var(--accent)' }}
                  aria-expanded={showNintendoHelp}
                  aria-controls="nintendo-profile-help"
                >
                  HELP
                </button>
              </div>
              <input
                id="pf-nintendo"
                type="url"
                value={nintendoUrl}
                onChange={(e) => setNintendoUrl(e.target.value)}
                placeholder="https://accounts.nintendo.com/..."
                className="input-neon"
                maxLength={500}
              />
              {showNintendoHelp && (
                <>
                  <p id="nintendo-profile-help" className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    Sign in at Nintendo Account, open your own profile page, and paste that full profile URL.
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px]">
                    <a
                      href="https://accounts.nintendo.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                      style={{ color: 'var(--accent)' }}
                    >
                      Nintendo Account
                    </a>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="btn-neon btn-neon-solid text-xs disabled:opacity-40"
              >
                {saving ? 'Saving…' : 'Save profile'}
              </button>
              {savedAt && (
                <span className="text-xs font-display" style={{ color: 'var(--accent-secondary)' }}>
                  Saved
                </span>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
