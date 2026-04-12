import type { GameStatus } from "@/lib/database.types";
import type { CollectionImportGameStatusHint } from "@/lib/deku-scraper";

/**
 * How DekuDeals collection import maps into `user_games.status`:
 *
 * - **Dropped (our UI)** is stored as **`abandoned`**. DekuDeals labels that state **"Abandoned"** on collection cards — same meaning; we only use a different word in the app.
 * - Other labels follow `mapDekuCollectionStatusLabel` in `@/lib/deku-scraper` (e.g. "Currently playing" → `playing`).
 */

/**
 * Maps a normalized hint from `mapDekuCollectionStatusLabel` to our `GameStatus`.
 * In particular, hint `"abandoned"` is Deku's "Abandoned" row, which we show as **Dropped** in the collection UI.
 */
export function mapDekuImportHintToGameStatus(
  hint: CollectionImportGameStatusHint,
): GameStatus {
  switch (hint) {
    case "playing":
    case "completed":
    case "wishlist":
      return hint;
    case "abandoned":
      // Deku "Abandoned" → DB `abandoned` → UI copy "Dropped"
      return "abandoned";
    case "owned":
    default:
      return "owned";
  }
}
