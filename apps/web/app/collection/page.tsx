"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { GameStatus, DbUserGame } from "@/lib/database.types";
import CollectionGrid from "@/components/CollectionGrid";

type FilterTab = "all" | GameStatus | "lendable";

type PerPage = 10 | 20 | 50 | 100;

const PER_PAGE_OPTIONS: PerPage[] = [10, 20, 50, 100];

const EMPTY_STATUS_COUNTS: Record<GameStatus, number> = {
  owned: 0,
  wishlist: 0,
  playing: 0,
  completed: 0,
  abandoned: 0,
};

type CollectionListResponse = {
  items: DbUserGame[];
  page: number;
  per_page: number;
  total: number;
  filtered_total: number;
  status_counts: Record<GameStatus, number>;
  lendable_count: number;
};

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
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<PerPage>(20);
  const [total, setTotal] = useState(0);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [statusCounts, setStatusCounts] =
    useState<Record<GameStatus, number>>(EMPTY_STATUS_COUNTS);
  const [lendableCount, setLendableCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collectionUrl, setCollectionUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] =
    useState<CollectionImportResult | null>(null);
  /** Full import panel: always open when collection is empty; collapsible when user already has titles. */
  const [importExpanded, setImportExpanded] = useState(false);
  const prevGameCount = useRef<number | null>(null);

  const fetchCollection = useCallback(
    async (opts?: { background?: boolean; pageOverride?: number }) => {
      const background = opts?.background === true;
      const effectivePage = opts?.pageOverride ?? page;
      try {
        if (!background) {
          setLoading(true);
        }
        setError(null);

        const params = new URLSearchParams({
          page: String(effectivePage),
          per_page: String(perPage),
          filter,
        });
        const res = await fetch(`/api/collection?${params}`);

        if (res.status === 401) {
          setError("Sign in to Create and View your collection.");
          setUserGames([]);
          setTotal(0);
          setFilteredTotal(0);
          setStatusCounts(EMPTY_STATUS_COUNTS);
          setLendableCount(0);
          if (!background) {
            setLoading(false);
          }
          return;
        }

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to load collection");
        }

        const data = (await res.json()) as CollectionListResponse;
        setUserGames(data.items);
        setTotal(data.total);
        setFilteredTotal(data.filtered_total);
        setStatusCounts(data.status_counts);
        setLendableCount(data.lendable_count);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        if (!background) {
          setLoading(false);
        }
      }
    },
    [page, perPage, filter],
  );

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
        setPage(1);
        await fetchCollection({ background: true, pageOverride: 1 });
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

  useEffect(() => {
    if (loading) return;
    const maxPage = Math.max(1, Math.ceil(filteredTotal / perPage));
    if (page > maxPage) setPage(maxPage);
  }, [filteredTotal, perPage, page, loading]);

  useEffect(() => {
    if (loading) return;
    const n = total;
    if (n === 0) {
      setImportExpanded(true);
    } else if (prevGameCount.current === 0 && n > 0) {
      setImportExpanded(false);
    }
    prevGameCount.current = n;
  }, [loading, total]);

  const totalPages = Math.max(1, Math.ceil(filteredTotal / perPage));

  const gamesForGrid = userGames
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

  const signInRequired =
    error === "Sign in to Create and View your collection.";
  const showImport = !loading && !signInRequired;
  const hasImportedTitles = total > 0;
  const showImportPanel = !hasImportedTitles || importExpanded || importing;
  const importPanelId = "deku-collection-import-panel";

  return (
    <div className="relative z-10 px-6 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-3xl md:text-4xl font-black font-display uppercase tracking-tighter mb-2"
            style={{ color: "var(--accent)" }}
          >
            MY COLLECTIONS
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {total} title{total !== 1 ? "s" : ""} in your collection
          </p>
        </div>

        {showImport && (
          <div
            className={hasImportedTitles && !showImportPanel ? "mb-4" : "mb-8"}
            aria-label="Import collection"
          >
            {hasImportedTitles && (
              <button
                type="button"
                id="deku-import-toggle"
                aria-expanded={showImportPanel}
                aria-controls={importPanelId}
                disabled={importing}
                onClick={() => setImportExpanded((open) => !open)}
                className="mb-3 flex w-full touch-manipulation items-center justify-center gap-2 rounded-md border px-4 py-2.5 font-display text-xs tracking-[0.12em] transition disabled:opacity-60 sm:w-auto sm:justify-start sm:py-2"
                style={{
                  background: "var(--bg-surface)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              >
                <span className="shrink-0 select-none" aria-hidden>
                  {showImportPanel ? "▼" : "▶"}
                </span>
                {showImportPanel
                  ? "HIDE DEKU IMPORT"
                  : "IMPORT OR REPLACE FROM DEKUDEALS"}
              </button>
            )}

            {showImportPanel && (
              <div
                id={importPanelId}
                role="region"
                aria-labelledby={
                  hasImportedTitles
                    ? "deku-import-toggle"
                    : "deku-import-heading"
                }
                className="rounded-lg p-5 sm:p-6"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  boxShadow:
                    "0 4px 24px color-mix(in srgb, var(--bg-elevated) 40%, transparent)",
                }}
              >
                <h2
                  id="deku-import-heading"
                  className="font-display text-base sm:text-lg tracking-[0.12em] mb-2"
                  style={{ color: "var(--accent)" }}
                >
                  IMPORT FROM DEKUDEALS
                </h2>
                <p
                  className={`text-sm leading-relaxed ${hasImportedTitles ? "mb-4 max-w-2xl" : "mb-6 max-w-xl"}`}
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
                  collection URL. Each import replaces your library with the
                  games from that list (empty scrape results leave your library
                  unchanged).
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
                        placeholder="Enter or Paste a collection URL"
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
                          background: "rgba(23, 144, 151, 1)",
                          color: "var(--bg-root)",
                          boxShadow: "0px 4px 12px 0px rgba(0, 0, 0, 0.15)",
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
                          new title{importResult.imported !== 1 ? "s" : ""}{" "}
                          added
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
                      {importResult.errors &&
                        importResult.errors.length > 0 && (
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
                              {importResult.errors
                                .slice(0, 5)
                                .map((item, idx) => (
                                  <li key={idx}>
                                    {item.url ? (
                                      <>
                                        <span className="break-all">
                                          {item.url}
                                        </span>
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
            )}
          </div>
        )}

        {/* Filter bar — wrap + compact padding so laptop widths avoid horizontal scroll */}
        <div className="mb-8">
          <div
            className="flex flex-wrap gap-1 rounded-lg p-1"
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
                  ? total
                  : key === "lendable"
                    ? lendableCount
                    : statusCounts[key] || 0;
              const selected = filter === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setFilter(key);
                    setPage(1);
                  }}
                  className="flex shrink-0 touch-manipulation items-center gap-1 rounded-md px-2 py-1.5 font-display text-[11px] leading-none tracking-[0.05em] transition-all duration-200 sm:px-2.5 sm:py-2 sm:text-xs"
                  style={{
                    background: selected ? "var(--bg-elevated)" : "transparent",
                    color: selected ? "var(--accent)" : "var(--text-primary)",
                    boxShadow: selected
                      ? "0 0 10px color-mix(in srgb, var(--accent) 20%, transparent)"
                      : "none",
                  }}
                >
                  <span className="shrink-0 text-[10px]" aria-hidden>
                    {icon}
                  </span>
                  {label}
                  <span
                    className="ml-0 shrink-0 rounded-full px-1 py-px text-[9px] font-semibold tabular-nums sm:px-1.5 sm:text-[10px]"
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

        {!loading && !signInRequired && total > 0 && (
          <div
            className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            aria-label="Collection pagination"
          >
            <label
              className="flex flex-wrap items-center gap-2 font-display text-xs tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              <span style={{ color: "var(--text-primary)" }}>PER PAGE</span>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value) as PerPage);
                  setPage(1);
                }}
                className="min-h-9 rounded-md border px-2 py-1.5 text-xs font-display outline-none"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              >
                {PER_PAGE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            {filteredTotal > 0 ? (
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
                <button
                  type="button"
                  className="touch-manipulation rounded-md border px-3 py-2 font-display text-xs tracking-widest transition disabled:opacity-40"
                  style={{
                    background: "var(--bg-surface)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  PREV
                </button>
                <span
                  className="px-2 font-display text-xs tabular-nums"
                  style={{ color: "var(--text-muted)" }}
                >
                  PAGE {page} / {totalPages}
                  <span className="sr-only">
                    {" "}
                    ({filteredTotal} title{filteredTotal !== 1 ? "s" : ""} in
                    this view)
                  </span>
                </span>
                <button
                  type="button"
                  className="touch-manipulation rounded-md border px-3 py-2 font-display text-xs tracking-widest transition disabled:opacity-40"
                  style={{
                    background: "var(--bg-surface)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Next page"
                >
                  NEXT
                </button>
              </div>
            ) : null}
          </div>
        )}

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
        ) : filteredTotal === 0 && filter !== "all" ? (
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
