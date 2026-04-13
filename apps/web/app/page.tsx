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
      <section className="relative px-6 pt-16 pb-20 text-center overflow-hidden">
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

        {/* Eyebrow */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 border text-[10px] font-display tracking-[0.2em]"
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--bg-elevated)",
            color: "var(--accent)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "var(--accent)" }}
          />
          SWITCH GAME CATALOG
        </div>

        {/* Main headline */}
        <h1 className="text-5xl md:text-7xl font-black mb-4 leading-none font-display uppercase tracking-tighter">
          <span style={{ color: "var(--accent)" }}>DISCOVER.</span>{" "}
          <span style={{ color: "var(--accent-secondary)" }}>COLLECT.</span>{" "}
          <span style={{ color: "var(--text-primary)" }}>SHARE.</span>
        </h1>

        <p className="text-lg md:text-xl mb-10 max-w-xl mx-auto text-text-muted">
          Discover Nintendo Switch games, save them to your collection, and
          share them with your friends
        </p>

        {/* Search */}
        <div className="max-w-2xl mx-auto">
          <SearchBar />
        </div>

        {/* CTA badges */}
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          {[
            "Friend Groups",
            "Game Lending",
            "Lookup & add games",
            "Wishlist & loans",
          ].map((feat) => (
            <span
              key={feat}
              className="px-3 py-1 rounded-full text-[10px] border font-display tracking-wider"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--bg-elevated)",
                color: "var(--text-muted)",
              }}
            >
              {feat}
            </span>
          ))}
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
            <span className="text-[10px] font-display text-text-muted tracking-[0.3em] uppercase">
              FEATURED TITLES
            </span>
          </div>
          <CollectionGrid games={featuredGames} />
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-xl font-bold font-display tracking-widest uppercase text-center mb-12"
            style={{ color: "var(--text-primary)" }}
          >
            <span style={{ color: "var(--accent)" }}>⬡</span> HOW IT WORKS
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "SEARCH & TRACK",
                desc: "Look up Switch games and add titles to your collection in one click.",
              },
              {
                step: "02",
                title: "BUILD GROUPS",
                desc: "Create a squad, invite your friends, and see everyone's libraries in one place.",
              },
              {
                step: "03",
                title: "LEND & BORROW",
                desc: "Mark games as lendable. Friends can request to borrow — you approve or decline.",
              },
            ].map((item) => (
              <div key={item.step} className="glass-card p-6 text-center">
                <div
                  className="text-3xl font-black font-display mb-3"
                  style={{
                    color: "var(--accent)",
                    textShadow:
                      "0 0 12px color-mix(in srgb, var(--accent) 40%, transparent)",
                  }}
                >
                  {item.step}
                </div>
                <h3
                  className="font-display text-sm tracking-[0.15em] mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "var(--text-muted)" }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
