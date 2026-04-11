"use client";

import { useState, useEffect, useCallback } from "react";
import type { GameStatus, DbUserGame } from "@/lib/database.types";
import CollectionGrid from "@/components/CollectionGrid";
import SearchBar from "@/components/SearchBar";

type FilterTab = "all" | GameStatus;

const FILTER_TABS: { key: FilterTab; label: string; icon: string }[] = [
  { key: "all", label: "ALL", icon: "◈" },
  { key: "owned", label: "OWNED", icon: "✓" },
  { key: "wishlist", label: "WISHLIST", icon: "♥" },
  { key: "playing", label: "PLAYING", icon: "▶" },
  { key: "completed", label: "COMPLETED", icon: "★" },
  { key: "abandoned", label: "DROPPED", icon: "⌛" },
];

export default function CollectionPage() {
  const [userGames, setUserGames] = useState<DbUserGame[]>([]);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  const handleStatusChange = async (
    userGameId: string,
    newStatus: GameStatus,
  ) => {
    setUpdatingId(userGameId);
    try {
      const res = await fetch(`/api/collection/${userGameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update status");
      }

      const updated: DbUserGame = await res.json();
      setUserGames((prev) =>
        prev.map((ug) => (ug.id === updated.id ? updated : ug)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleLoanable = async (
    userGameId: string,
    currentLoanable: boolean,
  ) => {
    setUpdatingId(userGameId);
    try {
      const res = await fetch(`/api/collection/${userGameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanable: !currentLoanable }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to toggle lending");
      }

      const updated: DbUserGame = await res.json();
      setUserGames((prev) =>
        prev.map((ug) => (ug.id === updated.id ? updated : ug)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveGame = async (userGameId: string) => {
    if (!confirm("Remove this game from your collection?")) return;

    try {
      const res = await fetch(`/api/collection/${userGameId}`, {
        method: "DELETE",
      });

      if (!res.ok && res.status !== 204) {
        const err = await res.json();
        throw new Error(err.error || "Failed to remove");
      }

      setUserGames((prev) => prev.filter((ug) => ug.id !== userGameId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove");
    }
  };

  const filtered =
    filter === "all"
      ? userGames
      : userGames.filter((ug) => ug.status === filter);

  const statusCounts = userGames.reduce(
    (acc, ug) => {
      acc[ug.status] = (acc[ug.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

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

        {/* Two-column: desktop stats left; mobile filters + grid first, stats after */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
          {/* Stats column — stacked; appears below grid on small screens */}
          {!loading && userGames.length > 0 && (
            <aside
              className="order-2 w-full shrink-0 lg:order-1 lg:w-52 xl:w-56"
              aria-label="Collection status counts"
            >
              <h2
                className="text-xs font-display tracking-[0.2em] uppercase mb-3 hidden lg:block"
                style={{ color: "var(--text-muted)" }}
              >
                Stats
              </h2>
              <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:gap-3 lg:flex lg:flex-col">
                {[
                  {
                    label: "Owned",
                    count: statusCounts["owned"] || 0,
                    color: "var(--neon-green)",
                  },
                  {
                    label: "Wishlist",
                    count: statusCounts["wishlist"] || 0,
                    color: "var(--accent)",
                  },
                  {
                    label: "Playing",
                    count: statusCounts["playing"] || 0,
                    color: "var(--neon-yellow)",
                  },
                  {
                    label: "Completed",
                    count: statusCounts["completed"] || 0,
                    color: "var(--neon-purple)",
                  },
                  {
                    label: "Dropped",
                    count: statusCounts["abandoned"] || 0,
                    color: "var(--text-muted)",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="glass-card flex flex-0 items-center justify-between gap-3 px-4 py-3 sm:flex-col sm:justify-center sm:text-center sm:py-4 lg:flex-row lg:text-left lg:justify-between lg:py-3"
                  >
                    <div
                      className="text-2xl font-bold font-display tabular-nums sm:text-3xl"
                      style={{ color: stat.color }}
                    >
                      {stat.count}
                    </div>
                    <div
                      className="text-xs font-display tracking-[0.12em] uppercase sm:text-[11px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          )}

          <div className="order-1 min-w-0 flex-1 space-y-6 lg:order-2">
            {/* Filter bar */}
            <div>
              <div
                className="text-xs font-display tracking-[0.2em] uppercase mb-2"
                style={{ color: "var(--text-muted)" }}
              >
                Filter
              </div>
              <div
                className="flex flex-wrap gap-1.5 p-1.5 sm:p-2 rounded-xl overflow-x-auto sm:flex-nowrap"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                }}
                role="group"
                aria-label="Filter collection by status"
              >
                {FILTER_TABS.map(({ key, label, icon }) => {
                  const count =
                    key === "all" ? userGames.length : statusCounts[key] || 0;
                  const selected = filter === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setFilter(key)}
                      className="flex min-h-[44px] min-w-0 touch-manipulation items-center gap-2 rounded-lg px-3 py-2.5 font-display text-xs tracking-wide transition-all duration-200 sm:px-4 sm:py-3 sm:text-sm sm:tracking-[0.08em]"
                      style={{
                        background: selected
                          ? "var(--bg-elevated)"
                          : "transparent",
                        color: selected ? "var(--accent)" : "var(--text-muted)",
                        boxShadow: selected
                          ? "0 0 12px color-mix(in srgb, var(--accent) 22%, transparent)"
                          : "none",
                      }}
                    >
                      <span className="shrink-0" aria-hidden>
                        {icon}
                      </span>
                      <span className="truncate">{label}</span>
                      <span
                        className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-xs"
                        style={{
                          background: selected
                            ? "color-mix(in srgb, var(--accent) 18%, transparent)"
                            : "var(--bg-elevated)",
                          color: selected
                            ? "var(--accent)"
                            : "var(--text-muted)",
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
                className="px-4 py-3 rounded-lg border text-sm font-display"
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
              <CollectionGrid games={[]} loading={true} />
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
              <>
                <CollectionGrid games={gamesForGrid} showStatus={true} />

                {/* Inline management controls */}
                {filtered.length > 0 && (
                  <div className="mt-10">
                    <h3
                      className="text-[10px] font-display tracking-[0.2em] uppercase mb-4 border-b pb-3"
                      style={{
                        color: "var(--text-muted)",
                        borderColor: "var(--border-subtle)",
                      }}
                    >
                      MANAGE TITLES
                    </h3>
                    <div className="space-y-2">
                      {filtered.map((ug) => {
                        if (!ug.game) return null;
                        const isUpdating = updatingId === ug.id;
                        return (
                          <div
                            key={ug.id}
                            className="glass-card flex items-center gap-4 px-4 py-3"
                            style={{ opacity: isUpdating ? 0.6 : 1 }}
                          >
                            <div className="min-w-0 flex-1">
                              <p
                                className="text-sm font-semibold truncate"
                                style={{ color: "var(--text-primary)" }}
                              >
                                {ug.game.title}
                              </p>
                            </div>

                            {/* Status selector */}
                            <select
                              value={ug.status}
                              onChange={(e) =>
                                handleStatusChange(
                                  ug.id,
                                  e.target.value as GameStatus,
                                )
                              }
                              disabled={isUpdating}
                              className="input-neon text-xs py-1.5 px-2 w-auto"
                              style={{ background: "var(--bg-elevated)" }}
                            >
                              <option value="owned">Owned</option>
                              <option value="wishlist">Wishlist</option>
                              <option value="playing">Playing</option>
                              <option value="completed">Completed</option>
                              <option value="abandoned">Dropped</option>
                            </select>

                            {/* Loanable toggle */}
                            <button
                              onClick={() =>
                                handleToggleLoanable(ug.id, ug.loanable)
                              }
                              disabled={isUpdating}
                              className="btn-neon text-[9px] px-3 py-1.5 whitespace-nowrap"
                              style={{
                                borderColor: ug.loanable
                                  ? "var(--neon-green)"
                                  : "var(--border-subtle)",
                                color: ug.loanable
                                  ? "var(--neon-green)"
                                  : "var(--text-muted)",
                                background: ug.loanable
                                  ? "rgba(57, 255, 20, 0.08)"
                                  : "transparent",
                              }}
                            >
                              {ug.loanable ? "✓ LENDABLE" : "LEND OFF"}
                            </button>

                            {/* Remove */}
                            <button
                              onClick={() => handleRemoveGame(ug.id)}
                              disabled={isUpdating}
                              className="btn-neon btn-neon-pink text-[9px] px-2 py-1.5"
                              title="Remove from collection"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
