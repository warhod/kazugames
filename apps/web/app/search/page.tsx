"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import CollectionGrid from "@/components/CollectionGrid";
import GameCollectionModal from "@/components/GameCollectionModal";
import SearchBar from "@/components/SearchBar";
import type { GameCardProps } from "@/components/GameCard";
import { isDekuItemUrl } from "@/lib/is-deku-item-url";

interface RawResult {
  id?: string;
  title: string;
  deku_url: string;
  image_url: string | null;
  current_price: number | null;
  msrp?: number | null;
  platform?: string;
}

function toGameCardProps(r: RawResult): GameCardProps {
  return {
    id: r.id ?? r.deku_url,
    title: r.title,
    deku_url: r.deku_url,
    image_url: r.image_url,
    current_price: r.current_price,
    msrp: r.msrp ?? null,
    platform: r.platform ?? "Switch",
  };
}

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";

  const [games, setGames] = useState<GameCardProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeGame, setActiveGame] = useState<GameCardProps | null>(null);

  useEffect(() => {
    if (!q.trim()) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setGames([]);

    fetch(`/api/games?q=${encodeURIComponent(q)}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<RawResult[]>;
      })
      .then((data) => {
        if (!cancelled) setGames(data.map(toGameCardProps));
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? "Search failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [q]);

  return (
    <div className="relative z-10 px-6 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1
              className="text-3xl md:text-4xl font-black font-display uppercase tracking-tighter mb-1"
              style={{ color: "var(--accent)" }}
            >
              FIND GAMES
            </h1>
            <p
              className="text-sm max-w-xl mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Look up games by title or paste a DekuDeals game URL for the best match.
            </p>
            {!loading && q && (
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                <p>
                  {games.length > 0
                    ? `${games.length} result${games.length !== 1 ? "s" : ""} for "${q}"`
                    : `No results for "${q}"`}
                </p>
                {games.length === 0 && !isDekuItemUrl(q) && (
                  <p className="text-xs mt-2 max-w-md leading-relaxed">
                    Copy the game&apos;s page URL from your browser (look for{" "}
                    <code className="text-[11px]">/items/</code> in the address
                    bar), then use <strong className="font-display">Load</strong>{" "}
                    on the home search bar—or paste it here and submit.
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="w-full min-w-0 md:flex-1 md:max-w-3xl">
            <SearchBar initialValue={q} />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-6 px-4 py-3 rounded-lg border text-sm font-display"
            style={{
              background:
                "color-mix(in srgb, var(--accent-secondary) 8%, transparent)",
              borderColor:
                "color-mix(in srgb, var(--accent-secondary) 30%, transparent)",
              color: "var(--accent-secondary)",
            }}
          >
            {error}
          </div>
        )}

        {/* Empty state — no query */}
        {!q.trim() && !loading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="text-6xl mb-6 opacity-20"
              style={{ color: "var(--accent)" }}
            >
              <span className="font-display">⌕</span>
            </div>
            <h3
              className="font-display text-xl mb-2 tracking-widest"
              style={{ color: "var(--accent)" }}
            >
              PASTE A DEKUDEALS GAME URL
            </h3>
            <p
              className="text-sm max-w-sm mx-auto leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              Open the game&apos;s catalog page in your browser, copy the URL
              (it should contain <code className="text-[11px]">/items/</code>),
              paste it above, then press <strong className="font-display">Load</strong>.
              You can try a title search, but results vary.
            </p>
          </div>
        )}

        {/* Results grid */}
        <CollectionGrid
          games={games}
          loading={loading}
          // ⚡ Bolt Performance Optimization:
          // Pass the stable state setter directly instead of recreating `openGameModal`
          // on every render, ensuring `CollectionGrid` memoization works.
          onCardClick={setActiveGame}
        />
      </div>

      <GameCollectionModal game={activeGame} onClose={() => setActiveGame(null)} />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="relative z-10 px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="skeleton h-10 w-48 mb-8" />
            <CollectionGrid games={[]} loading={true} />
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
