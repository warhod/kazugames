'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import ThemeToggle from './ThemeToggle';

const navLinks = [
  { href: '/', label: 'Discover' },
  { href: '/collection', label: 'Collection' },
  { href: '/groups', label: 'Groups' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16">
      {/* Glassmorphism bar */}
      <div
        className="h-full px-6 flex items-center justify-between border-b"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(16px)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span
            className="text-lg neon-text-cyan glitch-hover font-display"
            data-text="KAZU"
          >
            KAZU
          </span>
          <span
            className="text-lg font-black font-display"
            style={{
              color: 'var(--accent-secondary)',
              textShadow: '0 0 8px var(--accent-secondary)',
            }}
          >
            DEALS
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="px-4 py-2 rounded-md transition-all duration-200 font-display text-[0.72rem] tracking-widest"
                style={{
                  color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                  textShadow: isActive ? '0 0 8px var(--accent)' : 'none',
                  borderBottom: isActive
                    ? '2px solid var(--accent)'
                    : '2px solid transparent',
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Action buttons */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-3">
              <span
                className="hidden sm:inline max-w-[140px] truncate text-[10px] font-display"
                style={{ color: 'var(--text-muted)' }}
                title={user.email ?? undefined}
              >
                {user.email}
              </span>
              <button type="button" onClick={() => void signOut()} className="btn-neon btn-neon-pink text-xs">
                Sign out
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-neon btn-neon-cyan text-xs">
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Theme-aware bottom border line */}
      <div
        className="h-px w-full"
        style={{
          background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
          opacity: 0.4,
        }}
      />
    </header>
  );
}
