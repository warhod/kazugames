import type { Metadata } from 'next';
import SearchBar from '@/components/SearchBar';
import CollectionGrid from '@/components/CollectionGrid';

export const metadata: Metadata = {
  title: 'CartridgeVault — Track Your Game Collection',
  description: 'Discover deals on Nintendo Switch games, track your collection and wishlist, and share with your friend group.',
};

// Demo games shown on the landing page (will be replaced by DB data post-auth)
const FEATURED_GAMES = [
  {
    id: '1',
    title: 'The Legend of Zelda: Tears of the Kingdom',
    deku_url: 'https://www.dekudeals.com/items/the-legend-of-zelda-tears-of-the-kingdom',
    image_url: null,
    current_price: 51.99,
    msrp: 69.99,
    platform: 'Switch',
  },
  {
    id: '2',
    title: 'Super Mario Odyssey',
    deku_url: 'https://www.dekudeals.com/items/super-mario-odyssey',
    image_url: null,
    current_price: 39.99,
    msrp: 59.99,
    platform: 'Switch',
  },
  {
    id: '3',
    title: 'Mario Kart 8 Deluxe',
    deku_url: 'https://www.dekudeals.com/items/mario-kart-8-deluxe',
    image_url: null,
    current_price: 49.99,
    msrp: 59.99,
    platform: 'Switch',
  },
  {
    id: '4',
    title: 'Metroid Prime Remastered',
    deku_url: 'https://www.dekudeals.com/items/metroid-prime-remastered',
    image_url: null,
    current_price: 29.99,
    msrp: 39.99,
    platform: 'Switch',
  },
];

export default function HomePage() {
  return (
    <div className="relative z-10">
      {/* ── HERO ─────────────────────────────────── */}
      <section className="relative px-6 pt-16 pb-20 text-center overflow-hidden">
        {/* Ambient glow blobs */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px] pointer-events-none opacity-20 transition-colors duration-1000"
          style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-0 left-1/4 w-[400px] h-[200px] rounded-full blur-[100px] pointer-events-none opacity-10 transition-colors duration-1000"
          style={{ background: 'radial-gradient(circle, var(--accent-secondary) 0%, transparent 70%)' }}
        />

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 border text-[10px] font-display tracking-[0.2em]"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)', color: 'var(--accent)' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
          LIVE PRICES FROM DEKUDEALS
        </div>

        {/* Main headline */}
        <h1 className="text-5xl md:text-7xl font-black mb-4 leading-none font-display uppercase tracking-tighter">
          <span style={{ color: 'var(--accent)' }}>TRACK.</span>{' '}
          <span style={{ color: 'var(--accent-secondary)' }}>COLLECT.</span>{' '}
          <span style={{ color: 'var(--text-primary)' }}>SHARE.</span>
        </h1>

        <p className="text-lg md:text-xl mb-10 max-w-xl mx-auto text-text-muted">
          Your crew&apos;s Nintendo Switch game vault. Track collections, spot deals, and lend games to friends.
        </p>

        {/* Search */}
        <div className="max-w-2xl mx-auto">
          <SearchBar />
        </div>

        {/* CTA badges */}
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          {['Friend Groups', 'Game Lending', 'Live Prices', 'Wishlist Alerts'].map((feat) => (
            <span
              key={feat}
              className="px-3 py-1 rounded-full text-[10px] border font-display tracking-wider"
              style={{
                borderColor: 'var(--border-subtle)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-muted)',
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
          <div className="flex items-center justify-between mb-8 border-b pb-4" style={{ borderColor: 'var(--border-subtle)' }}>
            <h2 className="text-xl font-bold font-display text-text-primary tracking-widest uppercase">
              <span style={{ color: 'var(--accent)' }}>★</span> FEATURED DEALS
            </h2>
            <span className="text-[10px] font-display text-text-muted tracking-[0.3em] uppercase">
              POWERED BY DEKUDEALS
            </span>
          </div>
          <CollectionGrid games={FEATURED_GAMES} />
        </div>
      </section>
    </div>
  );
}
