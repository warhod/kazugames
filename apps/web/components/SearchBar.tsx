"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { isDekuItemUrl } from "@/lib/is-deku-item-url";

interface SearchBarProps {
  initialValue?: string;
}

export default function SearchBar({ initialValue = "" }: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setQuery(initialValue);
    setLoading(false);
  }, [initialValue]);

  const trimmed = query.trim();
  const urlMode = isDekuItemUrl(trimmed);
  const showTitleSearchHint = Boolean(trimmed) && !urlMode;

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!trimmed) return;

      if (urlMode) {
        const target = `/game?url=${encodeURIComponent(trimmed)}`;
        const currentUrlParam = searchParams.get("url")?.trim() ?? "";
        if (pathname === "/game" && currentUrlParam === trimmed) {
          setLoading(false);
          return;
        }
        setLoading(true);
        router.push(target);
        return;
      }

      const target = `/search?q=${encodeURIComponent(trimmed)}`;
      const currentQueryParam = searchParams.get("q")?.trim() ?? "";
      if (pathname === "/search" && currentQueryParam === trimmed) {
        setLoading(false);
        return;
      }
      setLoading(true);
      router.push(target);
    },
    [trimmed, urlMode, router, pathname, searchParams],
  );

  return (
    <form
      onSubmit={handleSearch}
      className="relative flex flex-col gap-1.5 w-full"
    >
      <div className="flex gap-2">
        <div className="relative flex-1 search-bar-matrix">
          <input
            id="game-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a game title"
            className="input-neon input-neon-matrix pl-14 pr-4 py-3 text-base w-full text-left"
            disabled={loading}
            aria-label="Search games"
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
          For the most reliable match, paste the game&apos;s DekuDeals URL (it
          should contain <code className="text-[11px]">/items/</code>).
        </p>
      )}
    </form>
  );
}
