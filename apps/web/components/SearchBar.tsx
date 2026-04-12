"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isDekuItemUrl } from "@/lib/is-deku-item-url";

interface SearchBarProps {
  initialValue?: string;
}

export default function SearchBar({ initialValue = "" }: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  const trimmed = query.trim();
  const urlMode = isDekuItemUrl(trimmed);
  const showTitleSearchHint = Boolean(trimmed) && !urlMode;

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!trimmed) return;

      if (urlMode) {
        setLoading(true);
        router.push(`/game?url=${encodeURIComponent(trimmed)}`);
        return;
      }

      setLoading(true);
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    },
    [trimmed, urlMode, router],
  );

  return (
    <form
      onSubmit={handleSearch}
      className="relative flex flex-col gap-1.5 w-full"
    >
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            id="game-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a game title or DekuDeals item URL"
            className="input-neon pl-14 pr-4 py-3 text-base w-full"
            disabled={loading}
            aria-label="Enter a game title or DekuDeals item URL"
            aria-describedby={
              showTitleSearchHint ? "search-bar-title-hint" : undefined
            }
          />
        </div>
        <button
          type="submit"
          disabled={loading || !trimmed}
          className="btn-neon btn-neon-solid px-6 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border-2 border-void border-t-transparent animate-spin" />
              {urlMode ? "Loading…" : "Searching…"}
            </span>
          ) : urlMode ? (
            "LOAD"
          ) : (
            "SEARCH"
          )}
        </button>
      </div>
      {showTitleSearchHint && (
        <p
          id="search-bar-title-hint"
          className="text-xs pl-1 leading-snug"
          style={{ color: "var(--text-muted)" }}
        >
          Title search often returns nothing. For a reliable match, paste the
          item link from DekuDeals.
        </p>
      )}
    </form>
  );
}
