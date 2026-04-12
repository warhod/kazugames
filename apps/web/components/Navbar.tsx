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

const glassBarStyle = {
  background: 'var(--glass-bg)',
  backdropFilter: 'blur(16px)',
  borderColor: 'var(--border-subtle)',
} as const;

function MainNavLink({
  href,
  label,
  pathname,
  layout,
}: {
  href: string;
  label: string;
  pathname: string;
  layout: 'desktop' | 'mobile';
}) {
  const isActive = pathname === href;
  const color = isActive ? 'var(--accent)' : 'var(--text-muted)';
  const textShadow = isActive ? '0 0 8px var(--accent)' : 'none';

  if (layout === 'desktop') {
    return (
      <Link
        href={href}
        className="px-4 py-2 rounded-md transition-all duration-200 font-display text-[0.72rem] tracking-widest"
        style={{
          color,
          textShadow,
          borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
        }}
        aria-current={isActive ? 'page' : undefined}
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="flex min-h-[48px] items-center justify-center border-r font-display text-[0.7rem] tracking-widest transition-all duration-200 last:border-r-0"
      style={{
        color,
        textShadow,
        borderColor: 'var(--border-subtle)',
        background: isActive ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : undefined,
        boxShadow: isActive ? 'inset 0 -2px 0 var(--accent)' : undefined,
      }}
      aria-current={isActive ? 'page' : undefined}
    >
      {label}
    </Link>
  );
}

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
    <header className="fixed top-0 left-0 right-0 z-50 flex flex-col">
      {/* Top row: logo, desktop nav, actions */}
      <div
        className="h-16 shrink-0 px-4 sm:px-6 flex items-center justify-between border-b"
        style={glassBarStyle}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
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

        {/* Nav links — wide screens only (narrow: secondary row below) */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main">
          {navLinks.map(({ href, label }) => (
            <MainNavLink key={href} href={href} label={label} pathname={pathname} layout="desktop" />
          ))}
        </nav>

        {/* Action buttons */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
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

      {/* Mobile / tablet portrait: essential routes always visible */}
      <nav
        className="grid h-12 grid-cols-3 border-b md:hidden"
        style={glassBarStyle}
        aria-label="Main"
      >
        {navLinks.map(({ href, label }) => (
          <MainNavLink key={href} href={href} label={label} pathname={pathname} layout="mobile" />
        ))}
      </nav>

      {/* Theme-aware bottom accent line */}
      <div
        className="h-px w-full shrink-0"
        style={{
          background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
          opacity: 0.4,
        }}
      />
    </header>
  );
}
