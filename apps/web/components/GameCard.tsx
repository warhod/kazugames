"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { lendableForStatus } from "@/lib/collection-lending";

export type GameStatus =
  | "owned"
  | "wishlist"
  | "playing"
  | "completed"
  | "abandoned";

export interface GameCardProps {
  id: string;
  title: string;
  deku_url: string;
  image_url: string | null;
  current_price: number | null;
  msrp: number | null;
  platform: string;
  status?: GameStatus;
  showStatus?: boolean;
  /** Main link to `/game?...`. Default fits search / featured / borrow contexts. */
  primaryLinkLabel?: string;
}

const STATUS_CONFIG: Record<
  GameStatus,
  { label: string; className: string; icon: string }
> = {
  owned: { label: "Owned", className: "badge-owned", icon: "✓" },
  wishlist: { label: "Wishlist", className: "badge-wishlist", icon: "♥" },
  playing: { label: "Playing", className: "badge-playing", icon: "▶" },
  completed: { label: "Completed", className: "badge-completed", icon: "★" },
  abandoned: { label: "Abandoned", className: "badge-abandoned", icon: "⌛" },
};

function DiscountBadge({ current, msrp }: { current: number; msrp: number }) {
  const pct = Math.round(((msrp - current) / msrp) * 100);
  if (pct <= 0) return null;
  return (
    <span
      className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold font-display shadow-lg"
      style={{
        background: "var(--neon-green)",
        color: "#000",
        boxShadow: "0 0 12px rgba(57, 255, 20, 0.4)",
      }}
    >
      -{pct}%
    </span>
  );
}

export default function GameCard({
  id,
  title,
  deku_url,
  image_url,
  current_price,
  msrp,
  platform,
  status,
  showStatus = false,
  primaryLinkLabel = "VIEW DETAILS",
}: GameCardProps) {
  const [imgError, setImgError] = useState(false);
  const statusCfg = status ? STATUS_CONFIG[status] : null;

  return (
    <article className="glass-card overflow-hidden flex flex-col group h-full">
      {/* Cover image */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: "220px", background: "var(--bg-elevated)" }}
      >
        {image_url && !imgError ? (
          <Image
            src={image_url}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          /* Fallback placeholder with theme-aware gradient */
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-void) 100%)",
            }}
          >
            <span className="text-4xl opacity-30 grayscale filter">🎮</span>
          </div>
        )}

        {/* Discount badge */}
        {current_price !== null && msrp !== null && (
          <DiscountBadge current={current_price} msrp={msrp} />
        )}

        {/* Platform badge */}
        <span
          className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-display tracking-widest"
          style={{
            background: "var(--bg-void)",
            color: "var(--accent)",
            border: "1px solid var(--border-subtle)",
            opacity: 0.9,
          }}
        >
          {platform}
        </span>
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Title */}
        <h3
          className="text-sm font-semibold leading-snug line-clamp-2 min-h-[2.5rem]"
          style={{ color: "var(--text-primary)" }}
          title={title}
        >
          {title}
        </h3>

        {/* Price row */}
        <div className="flex items-end gap-2">
          {current_price !== null ? (
            <>
              <span
                className={`price-badge ${msrp && current_price < msrp ? "price-badge-sale" : ""}`}
              >
                ${current_price.toFixed(2)}
              </span>
              {msrp && current_price < msrp && (
                <span className="price-msrp-strike">${msrp.toFixed(2)}</span>
              )}
            </>
          ) : (
            <span
              className="text-[10px] font-display"
              style={{ color: "var(--text-muted)" }}
            >
              AVAILABILITY UNKNOWN
            </span>
          )}
        </div>

        {/* Status + lendable (derived from status on collection) */}
        {showStatus && statusCfg && (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className={`badge-status ${statusCfg.className}`}>
              {statusCfg.icon} {statusCfg.label}
            </span>
            {status && lendableForStatus(status) && (
              <span className="badge-status badge-lendable">
                🤲 Lendable
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2 pt-2">
          <Link
            href={`/game?url=${encodeURIComponent(deku_url)}`}
            className="btn-neon btn-neon-cyan flex-1 text-center text-[10px]"
          >
            {primaryLinkLabel}
          </Link>
          <a
            href={deku_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-neon btn-neon-cyan text-[10px] flex items-center justify-center p-2"
            title="Open on DekuDeals"
            aria-label="Open on DekuDeals"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </div>
    </article>
  );
}
