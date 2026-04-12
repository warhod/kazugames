"use client";

import { useState, useEffect, useCallback } from "react";
import type { GameStatus, DbUserGame } from "@/lib/database.types";
import CollectionGrid from "@/components/CollectionGrid";
import SearchBar from "@/components/SearchBar";
import { loanableForStatus } from "@/lib/collection-lending";

type FilterTab = "all" | GameStatus | "lendable";

const FILTER_TABS: { key: FilterTab; label: string; icon: string }[] = [
  { key: "all", label: "ALL", icon: "◈" },
  { key: "owned", label: "OWNED", icon: "✓" },
  { key: "wishlist", label: "WISHLIST", icon: "♥" },
  { key: "playing", label: "PLAYING", icon: "▶" },
  { key: "completed", label: "COMPLETED", icon: "★" },
  { key: "abandoned", label: "DROPPED", icon: "⌛" },
  { key: "lendable", label: "LENDABLE", icon: "↗" },
];

export default function CollectionPage() {
  const [userGames, setUserGames] = useState<DbUserGame[]>([]);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollection = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/collection");

      if (res.status === 401) {
        setError("Sign in to view your collection.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load collection");
      }

      const data: DbUserGame[] = await res.json();
      setUserGames(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollection();
  }, [fetchCollection]);

  const filtered =
    filter === "all"
      ? userGames
      : filter === "lendable"
        ? userGames.filter((ug) => loanableForStatus(ug.status))
        : userGames.filter((ug) => ug.status === filter);

  const statusCounts = userGames.reduce(
    (acc, ug) => {
      acc[ug.status] = (acc[ug.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const lendableCount = userGames.filter((ug) =>
    loanableForStatus(ug.status),
  ).length;

  const gamesForGrid = filtered
    .filter((ug) => ug.game)
    .map((ug) => ({
      id: ug.game!.id,
      title: ug.game!.title,
      deku_url: ug.game!.deku_url,
      image_url: ug.game!.image_url,
      current_price: ug.game!.current_price,
      msrp: ug.game!.msrp,
      platform: ug.game!.platform,
      status: ug.status,
    }));

  return (
    <div className="relative z-10 px-6 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1
              className="text-3xl md:text-4xl font-black font-display uppercase tracking-tighter mb-2"
              style={{ color: "var(--accent)" }}
            >
              COLLECTION
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {userGames.length} title{userGames.length !== 1 ? "s" : ""} in
              your collection
            </p>
          </div>

          {/* Quick-add search */}
          <div className="w-full md:w-80">
            <SearchBar />
          </div>
        </div>

        {/* Filter bar */}
        <div className="mb-8">
          <div
            className="flex flex-wrap gap-1.5 overflow-x-auto rounded-lg p-1.5 sm:flex-nowrap sm:gap-1 sm:p-1"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
            }}
            role="group"
            aria-label="Filter collection by status or lendable titles"
          >
            {FILTER_TABS.map(({ key, label, icon }) => {
              const count =
                key === "all"
                  ? userGames.length
                  : key === "lendable"
                    ? lendableCount
                    : statusCounts[key] || 0;
              const selected = filter === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setFilter(key)}
                  className="flex shrink-0 touch-manipulation items-center gap-1.5 rounded-md px-3 py-2.5 font-display text-xs tracking-[0.08em] transition-all duration-200 sm:px-4 sm:py-2 sm:text-sm"
                  style={{
                    background: selected
                      ? "var(--bg-elevated)"
                      : "transparent",
                    color: selected ? "var(--accent)" : "var(--text-primary)",
                    boxShadow: selected
                      ? "0 0 10px color-mix(in srgb, var(--accent) 20%, transparent)"
                      : "none",
                  }}
                >
                  <span className="shrink-0" aria-hidden>
                    {icon}
                  </span>
                  {label}
                  <span
                    className="ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold sm:text-xs"
                    style={{
                      background: selected
                        ? "color-mix(in srgb, var(--accent) 15%, transparent)"
                        : "var(--bg-elevated)",
                      color: selected ? "var(--accent)" : "var(--text-primary)",
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error banner */}
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

        {/* Collection management grid */}
        {loading ? (
          <CollectionGrid
            games={[]}
            loading={true}
            primaryLinkLabel="EDIT / REMOVE"
          />
        ) : filtered.length === 0 && filter !== "all" ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <h3
              className="font-display text-lg mb-2 tracking-widest"
              style={{ color: "var(--accent)" }}
            >
              NO {FILTER_TABS.find((t) => t.key === filter)?.label} TITLES
            </h3>
            <p
              className="text-sm max-w-xs mx-auto"
              style={{ color: "var(--text-muted)" }}
            >
              Games with this status will appear here.
            </p>
          </div>
        ) : (
          <CollectionGrid
            games={gamesForGrid}
            showStatus={true}
            primaryLinkLabel="EDIT / REMOVE"
          />
        )}
      </div>
    </div>
  );
}
