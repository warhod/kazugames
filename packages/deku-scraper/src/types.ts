export interface GameData {
  title: string;
  deku_url: string;
  image_url: string | null;
  current_price: number | null;
  msrp: number | null;
  description: string | null;
  platform: string;
}

export interface SearchResult {
  title: string;
  deku_url: string;
  image_url: string | null;
  current_price: number | null;
}

/**
 * One entry from a DekuDeals public collection grid (`/collection/{id}`), in DOM order.
 */
export interface CollectionItem {
  title: string;
  deku_url: string;
  /**
   * Text from the card's "Status" row when Deku renders it (owner / signed-in views).
   * `null` when the row is absent (e.g. logged-out HTML only shows wishlist/collection CTAs).
   */
  deku_status_label: string | null;
}

/**
 * Hint for downstream importers mapping Deku collection status copy to `user_games.game_status`.
 * "Want to play" is intentionally mapped to `owned` (not `wishlist`) for v1 — see `mapDekuCollectionStatusLabel`.
 */
export type CollectionImportGameStatusHint =
  | 'playing'
  | 'completed'
  | 'abandoned'
  | 'owned'
  | 'wishlist';
