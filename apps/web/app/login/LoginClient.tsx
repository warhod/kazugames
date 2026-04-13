"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatAuthError, isAuthEnvConfigured } from "@/lib/auth-errors";

/** Only allow same-origin relative redirects after sign-in. */
function sanitizeNextPath(raw: string): string {
  const next = (raw || "/collection").trim();
  if (!next.startsWith("/") || next.startsWith("//")) return "/collection";
  if (next.includes("\0")) return "/collection";
  if (next.length > 2048) return "/collection";
  return next;
}

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = sanitizeNextPath(searchParams.get("next") ?? "/collection");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">(() =>
    searchParams.get("mode") === "signup" ? "signup" : "signin",
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const envOk = isAuthEnvConfigured();
  let supabaseHost = "";
  try {
    const u = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (u) supabaseHost = new URL(u).host;
  } catch {
    supabaseHost = "(invalid URL)";
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (!envOk) {
      setError(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in apps/web/.env.local. Add them and restart `just dev`.",
      );
      setLoading(false);
      return;
    }

    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signUpError) {
          if (process.env.NODE_ENV === "development") {
            console.error("[auth signUp]", signUpError);
          }
          setError(formatAuthError(signUpError));
          return;
        }
        if (signUpData.session) {
          router.refresh();
          router.push(next);
          return;
        }
        setMessage(
          "Check your email to confirm your account (if confirmations are enabled), then sign in.",
        );
        setMode("signin");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        if (process.env.NODE_ENV === "development") {
          console.error("[auth signIn]", signInError);
        }
        setError(formatAuthError(signInError));
        return;
      }

      router.refresh();
      router.push(next);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("[auth]", err);
      }
      setError(
        formatAuthError(err instanceof Error ? err : new Error(String(err))),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 px-6 py-16 flex flex-col items-center min-h-[calc(100vh-7rem)] md:min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-md glass-card p-8">
        <h1
          className="text-2xl font-black font-display uppercase tracking-widest mb-2 text-center"
          style={{ color: "var(--accent)" }}
        >
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>

        {mode === "signup" &&
          next.includes("/groups") &&
          next.includes("join=") && (
            <p
              className="mb-4 text-center text-[11px] font-display tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              You&apos;re joining a friend&apos;s group. Create an account or sign in, then
              you&apos;ll return to finish joining.
            </p>
          )}

        {process.env.NODE_ENV === "development" && envOk && (
          <p
            className="text-[10px] mb-4 text-center break-all"
            style={{ color: "var(--text-muted)" }}
          >
            Dev: auth requests go to{" "}
            <span style={{ color: "var(--accent)" }}>{supabaseHost}</span>{" "}
            (browser → Supabase; not logged in the Next.js terminal).
          </p>
        )}

        {!envOk && (
          <div
            className="mb-4 px-3 py-2 rounded-md text-[11px] border"
            style={{
              borderColor:
                "color-mix(in srgb, var(--accent-secondary) 40%, transparent)",
              color: "var(--accent-secondary)",
              background:
                "color-mix(in srgb, var(--accent-secondary) 8%, transparent)",
            }}
          >
            Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in{" "}
            <code className="font-mono">apps/web/.env.local</code>, then restart
            the dev server.
          </div>
        )}

        {error && (
          <div
            className="mb-4 px-3 py-2 rounded-md text-[11px] font-display border whitespace-pre-wrap break-words"
            style={{
              borderColor:
                "color-mix(in srgb, var(--accent-secondary) 40%, transparent)",
              color: "var(--accent-secondary)",
              background:
                "color-mix(in srgb, var(--accent-secondary) 8%, transparent)",
            }}
          >
            {error}
          </div>
        )}
        {message && (
          <div
            className="mb-4 px-3 py-2 rounded-md text-xs border"
            style={{
              borderColor: "var(--border-subtle)",
              color: "var(--text-muted)",
              background: "var(--bg-elevated)",
            }}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-[12px] font-display tracking-wider mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              EMAIL
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-neon"
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-[12px] font-display tracking-wider mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              PASSWORD
            </label>
            <input
              id="password"
              type="password"
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-neon"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-neon btn-neon-solid w-full text-xs disabled:opacity-50"
          >
            {loading ? "…" : mode === "signin" ? "SIGN IN" : "SIGN UP"}
          </button>
        </form>

        <div className="mt-6 flex justify-between text-[12px] font-display tracking-wider">
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setMessage(null);
            }}
            className="underline-offset-2 hover:underline"
            style={{ color: "var(--accent)" }}
          >
            {mode === "signin"
              ? "Need an account? Sign up"
              : "Have an account? Sign in"}
          </button>
          <Link href="/" style={{ color: "var(--text-muted)" }}>
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
