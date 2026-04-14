'use client';

import { collectionImportCopy } from '@/lib/collection-import-copy';
import GameCard, { type GameCardProps } from './GameCard';

interface CollectionGridProps {
  games: GameCardProps[];
  showStatus?: boolean;
  loading?: boolean;
  /** Passed through to each `GameCard` (e.g. `EDIT / REMOVE` on /collection). */
  primaryLinkLabel?: string;
  /** Optional card interaction handler for quick actions in lists (e.g. search). */
  onCardClick?: (game: GameCardProps) => void;
}

function SkeletonCard() {
  return (
    <div className="glass-card overflow-hidden">
      <div className="skeleton w-full h-48" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton h-6 w-1/3" />
      </div>
    </div>
  );
}

export default function CollectionGrid({
  games,
  showStatus = false,
  loading = false,
  primaryLinkLabel,
  onCardClick,
}: CollectionGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!games.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div 
          className="text-6xl mb-6 opacity-20"
          style={{ color: 'var(--accent)' }}
        >
          <span className="font-display">∅</span>
        </div>
        <h3 className="font-display text-xl mb-2 tracking-widest" style={{ color: 'var(--accent)' }}>
          VAULT EMPTY
        </h3>
        <div
          className="text-sm max-w-md mx-auto space-y-3"
          style={{ color: 'var(--text-muted)' }}
        >
          <p>{collectionImportCopy.emptyVaultPrimary}</p>
          <p>{collectionImportCopy.mergeIntoSingleLibrary}</p>
          <p>{collectionImportCopy.reimportSkipsExisting}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {games.map((game) => (
        <GameCard
          key={game.id}
          {...game}
          showStatus={showStatus}
          primaryLinkLabel={primaryLinkLabel}
          onPrimaryAction={onCardClick ? () => onCardClick(game) : undefined}
          onCardClick={onCardClick ? () => onCardClick(game) : undefined}
        />
      ))}
    </div>
  );
}
