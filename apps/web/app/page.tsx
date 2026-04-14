import type { Metadata } from "next";
import { Suspense } from "react";
import SearchBar from "@/components/SearchBar";
import CollectionGrid from "@/components/CollectionGrid";
import { getFeaturedHottestGames } from "@/lib/featured-hottest-deals";

export const metadata: Metadata = {
  title: "KazuGames — Switch collections & friend lending",
  description:
    "Discover Nintendo Switch games, track your collection, and lend titles inside your friend group.",
};

export default async function HomePage() {
  const featuredGames = await getFeaturedHottestGames();
  return (
    <div className="relative z-10">
      {/* ── HERO ─────────────────────────────────── */}
      <section className="relative px-6 py-16 text-center overflow-hidden">
        {/* Ambient glow blobs */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px] pointer-events-none opacity-20 transition-colors duration-1000"
          style={{
            background:
              "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-0 left-1/4 w-[400px] h-[200px] rounded-full blur-[100px] pointer-events-none opacity-10 transition-colors duration-1000"
          style={{
            background:
              "radial-gradient(circle, var(--accent-secondary) 0%, transparent 70%)",
          }}
        />

        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-7">
          {/* Main headline */}
          <h1 className="text-5xl leading-none font-display font-black uppercase tracking-tighter md:text-7xl">
            <span style={{ color: "var(--accent)" }}>DISCOVER.</span>{" "}
            <span style={{ color: "var(--accent-secondary)" }}>COLLECT.</span>{" "}
            <span style={{ color: "var(--text-primary)" }}>SHARE.</span>
          </h1>

          {/* Search */}
          <div className="w-full max-w-2xl">
            <Suspense
              fallback={<div className="skeleton h-[50px] w-full rounded-md" />}
            >
              <SearchBar />
            </Suspense>
          </div>

          {/* Supporting "how it works" strip */}
          <div
            className="w-full max-w-xl rounded-lg border px-3 py-2.5 sm:px-4"
            style={{
              borderColor:
                "color-mix(in srgb, var(--border-subtle) 82%, transparent)",
              background:
                "color-mix(in srgb, var(--bg-elevated) 78%, transparent)",
              boxShadow:
                "0 1px 12px color-mix(in srgb, var(--bg) 25%, transparent), inset 0 0 0 1px color-mix(in srgb, var(--text-muted) 10%, transparent)",
            }}
          >
            <p
              className="mb-2 text-[18px] font-display font-semibold uppercase tracking-[0.2em]"
              style={{ color: "var(--text-muted)" }}
            >
              <span
                className="inline-block"
                style={{
                  color:
                    "color-mix(in srgb, var(--accent) 72%, var(--text-muted))",
                  textShadow:
                    "0 0 4px color-mix(in srgb, var(--accent) 35%, transparent)",
                }}
              >
                ⬡
              </span>{" "}
              How It Works
            </p>
            <div className="flex flex-col items-center gap-1.5 text-center md:flex-row md:justify-center md:gap-2">
              {[
                "01 Search for a Nintendo Switch game",
                "02 Add games to your collection",
                "03 Lend games to your friends",
              ].map((item, idx) => (
                <div key={item} className="inline-flex items-center gap-2">
                  <span
                    className="inline-flex items-center rounded-full border px-2 py-1 text-[12px] font-display uppercase tracking-[0.13em]"
                    style={{
                      color:
                        "color-mix(in srgb, var(--text-primary) 86%, var(--text-muted))",
                      borderColor:
                        "color-mix(in srgb, var(--border-subtle) 70%, transparent)",
                      background:
                        "color-mix(in srgb, var(--bg-elevated) 72%, transparent)",
                    }}
                  >
                    {item}
                  </span>
                  {idx < 2 ? (
                    <span
                      aria-hidden
                      className="hidden h-px w-4 rounded-full md:inline-block"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent, color-mix(in srgb, var(--text-muted) 65%, transparent), transparent)",
                      }}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* ── FEATURED GAMES ───────────────────────── */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <div
            className="flex items-center justify-between mb-8 border-b pb-4"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <h2 className="text-xl font-bold font-display text-text-primary tracking-widest uppercase">
              <span style={{ color: "var(--accent)" }}>★</span> FEATURED GAMES
            </h2>
          </div>
          <CollectionGrid games={featuredGames} />
        </div>
      </section>
    </div>
  );
}
