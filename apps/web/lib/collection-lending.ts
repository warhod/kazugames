import type { GameStatus } from '@/lib/database.types';

/** Owned, completed, or dropped titles are offered to the group as borrowable. Wishlist / playing are not. */
export function lendableForStatus(status: GameStatus): boolean {
  return status === 'owned' || status === 'completed' || status === 'abandoned';
}
