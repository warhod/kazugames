"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { DbGame, DbUserGame, GameStatus } from "@/lib/database.types";
import type { GameCardProps } from "@/components/GameCard";
import GameDescriptionClamp from "@/components/GameDescriptionClamp";
import useScrollLock from "@/lib/useScrollLock";

type CollectionEntry = Pick<DbUserGame, "id" | "status" | "lendable">;

const STATUSES: { value: GameStatus; label: string; icon: string }[] = [
  { value: "owned", label: "Owned", icon: "✓" },
  { value: "playing", label: "Playing", icon: "▶" },
  { value: "completed", label: "Completed", icon: "★" },
  { value: "abandoned", label: "Dropped", icon: "⌛" },
];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface GameCollectionModalProps {
  game: GameCardProps | null;
  onClose: () => void;
}

export default function GameCollectionModal({
  game,
  onClose,
}: GameCollectionModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  useScrollLock(Boolean(game));

  const [details, setDetails] = useState<DbGame | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [collectionEntry, setCollectionEntry] =
    useState<CollectionEntry | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<GameStatus | "">("");
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [collectionBusy, setCollectionBusy] = useState(false);
  const [collectionErr, setCollectionErr] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const fallbackGameId = game && UUID_RE.test(game.id) ? game.id : null;
  const resolvedGameId = details?.id ?? fallbackGameId;

  useEffect(() => {
    if (!game) return;
    let cancelled = false;

    setDetailsLoading(true);
    setDetails(null);
    setCollectionEntry(null);
    setSelectedStatus("");
    setCollectionErr(null);
    setImgError(false);

    fetch(`/api/games?url=${encodeURIComponent(game.deku_url)}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<DbGame>;
      })
      .then((data) => {
        if (!cancelled) setDetails(data);
      })
      .catch(() => {
        if (!cancelled) setDetails(null);
      })
      .finally(() => {
        if (!cancelled) setDetailsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [game]);

  useEffect(() => {
    if (!game) return;
    let cancelled = false;
    setMembershipLoading(true);
    setCollectionErr(null);

    if (!resolvedGameId) {
      setMembershipLoading(false);
      setCollectionEntry(null);
      return;
    }

    fetch(
      `/api/collection/lookup?game_id=${encodeURIComponent(resolvedGameId)}`,
    )
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401) {
          setCollectionEntry(null);
          return;
        }
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }
        const data: { entry: CollectionEntry | null } = await res.json();
        if (!cancelled) {
          setCollectionEntry(data.entry);
          if (data.entry) setSelectedStatus(data.entry.status);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setCollectionErr(
            e instanceof Error ? e.message : "Could not load collection state",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setMembershipLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [game, resolvedGameId]);

  useEffect(() => {
    if (!game) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [game, onClose]);

  if (!game) return null;

  const resolvedTitle = details?.title ?? game.title;
  const resolvedImage = details?.image_url ?? game.image_url;
  const resolvedPlatform = details?.platform ?? game.platform;
  const resolvedPrice = details?.current_price ?? game.current_price;
  const resolvedMsrp = details?.msrp ?? game.msrp;
  const resolvedDescription = details?.description;

  const goToLogin = () => {
    const current =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : pathname;
    router.push(`/login?next=${encodeURIComponent(current)}`);
  };

  const refreshCollectionEntry = async (gameId: string) => {
    const res = await fetch(
      `/api/collection/lookup?game_id=${encodeURIComponent(gameId)}`,
    );
    if (res.status === 401) {
      setCollectionEntry(null);
      return;
    }
    if (!res.ok) return;
    const data: { entry: CollectionEntry | null } = await res.json();
    setCollectionEntry(data.entry);
    if (data.entry) setSelectedStatus(data.entry.status);
  };

  const addToCollection = async () => {
    if (!selectedStatus || collectionBusy) return;
    if (!resolvedGameId) {
      setCollectionErr("Game is still loading. Please try again in a moment.");
      return;
    }
    setCollectionBusy(true);
    setCollectionErr(null);
    try {
      const res = await fetch("/api/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_id: resolvedGameId,
          status: selectedStatus,
        }),
      });
      if (res.status === 401) {
        goToLogin();
        return;
      }
      if (res.status === 409) {
        await refreshCollectionEntry(resolvedGameId);
        setCollectionErr("This title is already in your collection.");
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to add to collection");
      }
      const row: DbUserGame = await res.json();
      setCollectionEntry({
        id: row.id,
        status: row.status,
        lendable: row.lendable,
      });
      setSelectedStatus(row.status);
    } catch (e) {
      setCollectionErr(e instanceof Error ? e.message : "Could not add game");
    } finally {
      setCollectionBusy(false);
    }
  };

  const updateStatus = async (next: GameStatus) => {
    if (!collectionEntry || collectionBusy) return;
    setCollectionBusy(true);
    setCollectionErr(null);
    setSelectedStatus(next);
    try {
      const res = await fetch(`/api/collection/${collectionEntry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.status === 401) {
        goToLogin();
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to update status");
      }
      const row: DbUserGame = await res.json();
      setCollectionEntry({
        id: row.id,
        status: row.status,
        lendable: row.lendable,
      });
      setSelectedStatus(row.status);
    } catch (e) {
      setSelectedStatus(collectionEntry.status);
      setCollectionErr(
        e instanceof Error ? e.message : "Could not update status",
      );
    } finally {
      setCollectionBusy(false);
    }
  };

  const removeFromCollection = async () => {
    if (!collectionEntry || collectionBusy) return;
    setCollectionBusy(true);
    setCollectionErr(null);
    try {
      const res = await fetch(`/api/collection/${collectionEntry.id}`, {
        method: "DELETE",
      });
      if (res.status === 401) {
        goToLogin();
        return;
      }
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to remove game");
      }
      setCollectionEntry(null);
      setSelectedStatus("");
    } catch (e) {
      setCollectionErr(
        e instanceof Error ? e.message : "Could not remove game",
      );
    } finally {
      setCollectionBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Edit or remove ${resolvedTitle} from your collection`}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div
        className="relative w-full max-w-3xl rounded-t-2xl sm:rounded-2xl border overflow-hidden"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <div className="md:flex">
          <div
            className="relative md:w-72 flex-shrink-0"
            style={{ minHeight: "230px", background: "var(--bg-elevated)" }}
          >
            {resolvedImage && !imgError ? (
              <Image
                src={resolvedImage}
                alt={resolvedTitle}
                fill
                className="object-cover"
                onError={() => setImgError(true)}
                sizes="(max-width: 768px) 100vw, 288px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl opacity-20">🎮</span>
              </div>
            )}
          </div>

          <div className="flex-1 p-5 md:p-7 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  className="text-xl font-display leading-tight"
                  style={{ color: "var(--text-primary)" }}
                >
                  {resolvedTitle}
                </h2>
                <p
                  className="text-[11px] mt-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  {resolvedPlatform}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="btn-neon text-xs px-4 py-2"
              >
                X
              </button>
            </div>

            <div className="text-sm" style={{ color: "var(--text-primary)" }}>
              {resolvedPrice !== null ? (
                <div className="flex items-center gap-2">
                  <span className="price-badge">
                    ${resolvedPrice.toFixed(2)}
                  </span>
                  {resolvedMsrp && resolvedPrice < resolvedMsrp && (
                    <span className="price-msrp-strike">
                      ${resolvedMsrp.toFixed(2)}
                    </span>
                  )}
                </div>
              ) : (
                <span style={{ color: "var(--text-muted)" }}>
                  Availability unknown
                </span>
              )}
            </div>

            {detailsLoading ? (
              <div className="skeleton h-16 w-full rounded-md" />
            ) : (
              <GameDescriptionClamp description={resolvedDescription ?? ""} />
            )}

            <div
              className="pt-3 border-t"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <p
                className="text-[12px] font-display tracking-[0.15em] uppercase mb-2"
                style={{ color: "var(--accent)" }}
              >
                CHOOSE A COLLECTION
              </p>

              {membershipLoading ? (
                <div className="skeleton h-12 w-full rounded-md" />
              ) : (
                <div className="flex flex-col gap-3">
                  <select
                    value={selectedStatus}
                    onChange={(e) => {
                      const next = e.target.value as GameStatus;
                      if (collectionEntry) void updateStatus(next);
                      else setSelectedStatus(next);
                    }}
                    disabled={collectionBusy}
                    className="input-neon text-sm py-3 px-3 w-full"
                    style={{ background: "var(--bg-elevated)" }}
                  >
                    {!collectionEntry && (
                      <option value="" disabled>
                        Select status
                      </option>
                    )}
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.icon} {s.label}
                      </option>
                    ))}
                  </select>

                  {!collectionEntry ? (
                    <button
                      type="button"
                      onClick={() => void addToCollection()}
                      disabled={!selectedStatus || collectionBusy}
                      className="btn-neon btn-neon-solid text-sm py-3 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {collectionBusy
                        ? "ADDING…"
                        : selectedStatus
                          ? "ADD TO COLLECTION"
                          : "SELECT STATUS TO ADD"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void removeFromCollection()}
                      disabled={collectionBusy}
                      className="btn-neon btn-neon-pink text-sm py-3 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {collectionBusy ? "WORKING…" : "REMOVE FROM COLLECTION"}
                    </button>
                  )}
                </div>
              )}

              {collectionErr && (
                <p
                  className="mt-2 text-xs"
                  style={{ color: "var(--accent-secondary)" }}
                >
                  {collectionErr}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="btn-neon text-sm py-3 w-full"
            >
              BACK TO RESULTS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
