import type { Metadata } from "next";
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
          {/* Eyebrow */}
          <div
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-display tracking-[0.2em]"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--bg-elevated)",
              color: "var(--accent)",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full animate-pulse"
              style={{ background: "var(--accent)" }}
            />
            YOUR SWITCH LIBRARY
          </div>

          {/* Main headline */}
          <h1 className="text-5xl leading-none font-display font-black uppercase tracking-tighter md:text-7xl">
            <span style={{ color: "var(--accent)" }}>DISCOVER.</span>{" "}
            <span style={{ color: "var(--accent-secondary)" }}>COLLECT.</span>{" "}
            <span style={{ color: "var(--text-primary)" }}>SHARE.</span>
          </h1>

          {/* "How it works" between title and search */}
          <div
            className="w-full rounded-lg border px-4 py-4"
            style={{
              borderColor: "var(--border-subtle)",
              background: "color-mix(in srgb, var(--bg-elevated) 90%, transparent)",
            }}
          >
            <h2
              className="mb-3 text-lg font-display font-bold uppercase tracking-[0.18em] sm:text-xl"
              style={{ color: "var(--text-primary)" }}
            >
              <span style={{ color: "var(--accent)" }}>⬡</span> HOW IT WORKS
            </h2>
            <div
              className="grid grid-cols-1 gap-3 text-center sm:grid-cols-3"
              style={{ color: "var(--text-primary)" }}
            >
              {[
                "Search for a Nintendo Switch game",
                "Add it to your collection",
                "Share it with your group",
              ].map((step, idx) => (
                <div key={step} className="flex flex-col items-center gap-1">
                  <span
                    className="font-display text-sm font-semibold uppercase tracking-[0.18em]"
                    style={{ color: "var(--accent)" }}
                  >
                    {`0${idx + 1}`}
                  </span>
                  <span className="font-display text-xs uppercase tracking-[0.11em] sm:text-[13px]">
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="w-full max-w-2xl">
            <SearchBar />
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
