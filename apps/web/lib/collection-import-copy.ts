/**
 * User-facing strings for DekuDeals collection import: one merged library and
 * idempotent re-imports (existing rows skipped).
 */
export const collectionImportCopy = {
  /** Primary empty-vault call to action */
  emptyVaultPrimary: "Use the search bar to add games.",
  /** How Deku lists relate to this app */
  mergeIntoSingleLibrary:
    "DekuDeals collection pages merge into this single library. Separate Deku lists or categories are not recreated here.",
  /** Re-import and skipped-row behavior */
  reimportSkipsExisting:
    "Importing the same collection again only adds games you do not have yet. Titles already in your vault are skipped, and we do not change your statuses or notes.",
} as const;

export type ImportSummaryCounts = {
  imported: number;
  skipped: number;
  failed: number;
};

/**
 * Builds a short headline and optional detail for the import result panel.
 * Skipped count is explained explicitly so re-imports read clearly.
 */
export function formatImportSummary(counts: ImportSummaryCounts): {
  headline: string;
  detail?: string;
} {
  const { imported, skipped, failed } = counts;
  const parts: string[] = [];

  if (imported > 0) {
    parts.push(
      `${imported} new ${imported === 1 ? "title" : "titles"} added to your library`,
    );
  }
  if (skipped > 0) {
    parts.push(
      `${skipped} skipped because ${skipped === 1 ? "it was" : "they were"} already in your collection`,
    );
  }
  if (failed > 0) {
    parts.push(
      `${failed} could not be imported`,
    );
  }

  let headline: string;
  if (parts.length === 0) {
    headline = "Nothing new to add from that collection.";
  } else {
    headline = parts.join(" · ") + ".";
  }

  const detail =
    skipped > 0
      ? "Skipped rows keep your existing game entries as they are—no duplicates and no overwrites."
      : undefined;

  return { headline, detail };
}
