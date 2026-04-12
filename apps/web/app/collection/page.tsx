"use client";

import { useState, useEffect, useCallback } from "react";
import type { GameStatus, DbUserGame } from "@/lib/database.types";
import CollectionGrid from "@/components/CollectionGrid";
import SearchBar from "@/components/SearchBar";
import { loanableForStatus } from "@/lib/collection-lending";

type FilterTab = "all" | GameStatus | "lendable";

type CollectionImportResult = {
  imported: number;
  skipped: number;
  failed: number;
  errors?: { message: string; url?: string }[];
};

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
  const [collectionUrl, setCollectionUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<CollectionImportResult | null>(
    null,
  );

  const fetchCollection = useCallback(async (opts?: { background?: boolean }) => {
    const background = opts?.background === true;
    try {
      if (!background) {
        setLoading(true);
      }
      setError(null);

      const res = await fetch("/api/collection");

      if (res.status === 401) {
        setError("Sign in to view your collection.");
        if (!background) {
          setLoading(false);
        }
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
      if (!background) {
        setLoading(false);
      }
    }
  }, []);

  const handleCollectionImport = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const url = collectionUrl.trim();
      if (!url || importing) return;

      setImporting(true);
      setImportError(null);
      setImportResult(null);

      try {
        const res = await fetch("/api/collection/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ collection_url: url }),
        });

        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          imported?: number;
          skipped?: number;
          failed?: number;
          errors?: { message: string; url?: string }[];
        };

        if (!res.ok) {
          setImportError(body.error || "Import failed");
          return;
        }

        const result: CollectionImportResult = {
          imported: body.imported ?? 0,
          skipped: body.skipped ?? 0,
          failed: body.failed ?? 0,
          errors: body.errors,
        };
        setImportResult(result);
        await fetchCollection({ background: true });
      } catch (err) {
        setImportError(
          err instanceof Error ? err.message : "Something went wrong",
        );
      } finally {
        setImporting(false);
      }
    },
    [collectionUrl, importing, fetchCollection],
  );

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
        ) : userGames.length === 0 && !error ? (
          <div className="flex flex-col gap-8" aria-label="Import collection">
            <div
              className="rounded-lg p-6 sm:p-8"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "0 4px 24px color-mix(in srgb, var(--bg-elevated) 40%, transparent)",
              }}
            >
              <h2
                className="font-display text-lg sm:text-xl tracking-[0.12em] mb-2"
                style={{ color: "var(--accent)" }}
              >
                IMPORT FROM DEKUDEALS
              </h2>
              <p
                className="text-sm mb-6 max-w-xl leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                Paste a public{" "}
                <a
                  href="https://www.dekudeals.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                  style={{ color: "var(--accent)" }}
                >
                  DekuDeals
                </a>{" "}
                collection URL. Imports merge into this library; separate Deku
                lists are not recreated here.
              </p>

              <form
                onSubmit={handleCollectionImport}
                className="flex flex-col gap-4"
                aria-busy={importing}
              >
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="deku-collection-url"
                    className="font-display text-xs tracking-widest"
                    style={{ color: "var(--text-primary)" }}
                  >
                    COLLECTION URL
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                    <input
                      id="deku-collection-url"
                      type="url"
                      name="collection_url"
                      autoComplete="off"
                      placeholder="https://www.dekudeals.com/collection/…"
                      value={collectionUrl}
                      onChange={(ev) => setCollectionUrl(ev.target.value)}
                      disabled={importing}
                      className="min-h-11 w-full flex-1 rounded-md border px-3 py-2.5 text-sm outline-none transition focus:ring-2 disabled:opacity-60"
                      style={{
                        background: "var(--bg-elevated)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--text-primary)",
                        caretColor: "var(--accent)",
                      }}
                    />
                    <button
                      type="submit"
                      disabled={importing || !collectionUrl.trim()}
                      className="font-display shrink-0 touch-manipulation rounded-md px-5 py-2.5 text-sm tracking-widest transition disabled:opacity-50"
                      style={{
                        background: "var(--accent)",
                        color: "var(--bg-root)",
                      }}
                    >
                      {importing ? "IMPORTING…" : "IMPORT"}
                    </button>
                  </div>
                </div>

                {importing && (
                  <div
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-display"
                    style={{
                      background: "var(--bg-elevated)",
                      color: "var(--text-muted)",
                    }}
                    role="status"
                    aria-live="polite"
                  >
                    <span
                      className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
                      style={{ color: "var(--accent)" }}
                      aria-hidden
                    />
                    Scraping your collection and adding games…
                  </div>
                )}

                {importError && (
                  <div
                    className="rounded-md border px-3 py-2.5 text-sm font-display"
                    style={{
                      background:
                        "color-mix(in srgb, var(--accent-secondary) 8%, transparent)",
                      borderColor:
                        "color-mix(in srgb, var(--accent-secondary) 30%, transparent)",
                      color: "var(--accent-secondary)",
                    }}
                    role="alert"
                  >
                    {importError}
                  </div>
                )}

                {importResult && !importing && (
                  <div
                    className="rounded-md border px-4 py-3 text-sm"
                    style={{
                      background: "var(--bg-elevated)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                    role="status"
                    aria-live="polite"
                  >
                    <p className="font-display mb-2 tracking-wide text-xs text-[var(--text-muted)]">
                      IMPORT SUMMARY
                    </p>
                    <ul className="mb-3 list-inside list-disc space-y-1">
                      <li>
                        <span className="font-semibold">
                          {importResult.imported}
                        </span>{" "}
                        new title{importResult.imported !== 1 ? "s" : ""} added
                      </li>
                      <li>
                        <span className="font-semibold">
                          {importResult.skipped}
                        </span>{" "}
                        skipped (already in your library)
                      </li>
                      <li>
                        <span className="font-semibold">
                          {importResult.failed}
                        </span>{" "}
                        failed
                      </li>
                    </ul>
                    {importResult.errors && importResult.errors.length > 0 && (
                      <div
                        className="mt-2 border-t pt-3 text-xs"
                        style={{
                          borderColor: "var(--border-subtle)",
                          color: "var(--text-muted)",
                        }}
                      >
                        <p className="mb-1 font-display tracking-wide">
                          SAMPLE ERRORS
                        </p>
                        <ul className="space-y-1.5">
                          {importResult.errors.slice(0, 5).map((item, idx) => (
                            <li key={idx}>
                              {item.url ? (
                                <>
                                  <span className="break-all">{item.url}</span>
                                  {" — "}
                                  {item.message}
                                </>
                              ) : (
                                item.message
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>
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
