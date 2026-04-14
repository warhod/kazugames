"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { href: "/", label: "Discover" },
  { href: "/collection", label: "My Collections" },
  { href: "/groups", label: "My Groups" },
];

const glassBarStyle = {
  background: "var(--glass-bg)",
  backdropFilter: "blur(16px)",
  borderColor: "var(--border-subtle)",
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
  layout: "desktop" | "mobile";
}) {
  const isActive = pathname === href;
  const color = isActive ? "var(--accent)" : "var(--text-muted)";
  const textShadow = isActive ? "0 0 8px var(--accent)" : "none";

  if (layout === "desktop") {
    return (
      <Link
        href={href}
        className="px-4 py-2 rounded-md transition-all duration-200 font-display text-[0.72rem] tracking-widest"
        style={{
          color,
          textShadow,
          borderBottom: isActive
            ? "2px solid var(--accent)"
            : "2px solid transparent",
        }}
        aria-current={isActive ? "page" : undefined}
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
        borderColor: "var(--border-subtle)",
        background: isActive
          ? "color-mix(in srgb, var(--accent) 12%, transparent)"
          : undefined,
        boxShadow: isActive ? "inset 0 -2px 0 var(--accent)" : undefined,
      }}
      aria-current={isActive ? "page" : undefined}
    >
      {label}
    </Link>
  );
}

const ACCOUNT_MENU_ID = "navbar-account-menu";

/** Fixed row height so header, Edit Profile, and Log out align. */
const ACCOUNT_MENU_ROW_H = "h-12";

const accountMenuHeaderClass = `${ACCOUNT_MENU_ROW_H} flex w-full shrink-0 flex-col justify-center gap-0.5 overflow-hidden rounded-md border px-3 font-display text-xs font-semibold uppercase tracking-wide`;

const accountMenuActionClass = `${ACCOUNT_MENU_ROW_H} w-full !items-center !justify-center !px-3 !py-0 !text-xs`;

function UserAccountMenu({
  user,
  navDisplayName,
  pathname,
  onSignOut,
}: {
  user: User;
  navDisplayName: string | null;
  pathname: string;
  onSignOut: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDocPointerDown = (e: PointerEvent) => {
      const el = wrapRef.current;
      if (el && !el.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDocPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onDocPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const triggerLabel = navDisplayName ?? user.email ?? "Profile";
  const headerPrimary = navDisplayName?.trim() || user.email || "Profile";
  const title =
    navDisplayName && user.email
      ? `${navDisplayName} — ${user.email} (account menu)`
      : user.email
        ? `${user.email} (account menu)`
        : "Account menu";

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        id="navbar-account-trigger"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={ACCOUNT_MENU_ID}
        onClick={() => setOpen((v) => !v)}
        className="max-w-[7rem] sm:max-w-[12.5rem] truncate text-[10px] font-display tracking-wide sm:tracking-widest uppercase shrink rounded-full border px-3 py-1.5 text-center transition hover:opacity-90"
        style={{
          color: "var(--accent)",
          borderColor: "var(--border-subtle)",
          background: "var(--bg-elevated)",
          boxShadow: "0 0 0 1px color-mix(in srgb, var(--accent) 15%, transparent)",
        }}
        title={title}
        aria-label={`Account menu for ${triggerLabel}`}
      >
        {triggerLabel}
      </button>
      {open ? (
        <div
          id={ACCOUNT_MENU_ID}
          role="region"
          aria-label="Account"
          className="absolute right-0 top-[calc(100%+0.35rem)] z-[60] flex min-w-[11.5rem] flex-col gap-2 overflow-hidden rounded-lg border p-2 shadow-lg"
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--bg-elevated)",
            boxShadow:
              "0 10px 28px color-mix(in srgb, var(--bg) 55%, transparent), 0 0 0 1px color-mix(in srgb, var(--accent) 14%, transparent)",
          }}
        >
          <div
            className={accountMenuHeaderClass}
            style={{
              borderColor: "var(--border-subtle)",
              background: "color-mix(in srgb, var(--bg-elevated) 100%, transparent)",
              boxShadow: "0 0 0 1px color-mix(in srgb, var(--accent) 15%, transparent)",
            }}
          >
            <p className="truncate leading-tight" style={{ color: "var(--accent)" }}>
              {headerPrimary}
            </p>
            {navDisplayName?.trim() && user.email ? (
              <p
                className="truncate font-display text-[10px] font-semibold normal-case leading-tight tracking-normal"
                style={{ color: "var(--text-muted)" }}
              >
                {user.email}
              </p>
            ) : null}
          </div>
          <Link
            href="/profile"
            className={`btn-neon btn-neon-cyan ${accountMenuActionClass}`}
            onClick={() => setOpen(false)}
          >
            Edit Profile
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void onSignOut();
            }}
            className={`btn-neon btn-neon-pink ${accountMenuActionClass}`}
          >
            LOG OUT
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [navDisplayName, setNavDisplayName] = useState<string | null>(null);

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

  useEffect(() => {
    if (!user) {
      setNavDisplayName(null);
      return;
    }
    let cancelled = false;
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((row: { display_name?: string | null } | null) => {
        if (cancelled || !row) return;
        const n = typeof row.display_name === "string" ? row.display_name.trim() : "";
        setNavDisplayName(n.length > 0 ? n : null);
      })
      .catch(() => {
        if (!cancelled) setNavDisplayName(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    const onProfileUpdated = (ev: Event) => {
      const d = (ev as CustomEvent<{ display_name?: string | null }>).detail;
      const n = typeof d?.display_name === "string" ? d.display_name.trim() : "";
      setNavDisplayName(n.length > 0 ? n : null);
    };
    window.addEventListener("kazu:profile-updated", onProfileUpdated);
    return () => window.removeEventListener("kazu:profile-updated", onProfileUpdated);
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex flex-col">
      {/* Top row: logo, desktop nav, actions */}
      <div
        className="h-16 shrink-0 px-4 sm:px-6 flex items-center justify-between border-b"
        style={glassBarStyle}
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-0 shrink-0 whitespace-nowrap tracking-tight"
          aria-label="Kazu Games home"
        >
          <span
            className="text-lg neon-text-cyan glitch-hover font-display"
            data-text="KAZU"
          >
            KAZU
          </span>
          <span
            className="text-lg font-black font-display"
            style={{
              color: "var(--accent-secondary)",
              textShadow: "0 0 8px var(--accent-secondary)",
            }}
          >
            GAMES
          </span>
        </Link>

        {/* Nav links — wide screens only (narrow: secondary row below) */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main">
          {navLinks.map(({ href, label }) => (
            <MainNavLink
              key={href}
              href={href}
              label={label}
              pathname={pathname}
              layout="desktop"
            />
          ))}
        </nav>

        {/* Action buttons */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <ThemeToggle />
          {user ? (
            <UserAccountMenu
              user={user}
              navDisplayName={navDisplayName}
              pathname={pathname}
              onSignOut={signOut}
            />
          ) : (
            <Link
              href="/login"
              className="btn-neon btn-neon-cyan text-xs inline-flex min-w-[5.75rem] items-center justify-center text-center"
            >
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
          <MainNavLink
            key={href}
            href={href}
            label={label}
            pathname={pathname}
            layout="mobile"
          />
        ))}
      </nav>

      {/* Theme-aware bottom accent line */}
      <div
        className="h-px w-full shrink-0"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--accent), transparent)",
          opacity: 0.4,
        }}
      />
    </header>
  );
}
