'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // If it looks like a DekuDeals URL, go directly to scrape
    if (query.includes('dekudeals.com/items/')) {
      setLoading(true);
      router.push(`/game?url=${encodeURIComponent(query.trim())}`);
      return;
    }

    setLoading(true);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }, [query, router]);

  return (
    <form onSubmit={handleSearch} className="relative flex gap-2">
      <div className="relative flex-1">
        <span
          className="absolute left-4 top-1/2 -translate-y-1/2 text-base pointer-events-none"
          style={{ color: 'var(--accent)', opacity: 0.7 }}
        >
          ⌕
        </span>
        <input
          id="game-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search games or paste a DekuDeals URL..."
          className="input-neon pl-10 pr-4 py-3 text-base"
          disabled={loading}
          aria-label="Search for a game"
        />
      </div>
      <button
        type="submit"
        disabled={loading || !query.trim()}
        className="btn-neon btn-neon-solid px-6 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border-2 border-void border-t-transparent animate-spin" />
            Scanning...
          </span>
        ) : (
          'SEARCH'
        )}
      </button>
    </form>
  );
}
