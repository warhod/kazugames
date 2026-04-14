"use client";

import React from "react";
import { useTheme, type Theme } from "@/lib/ThemeContext";

/** Neon city grid — circuit / skyline vibe */
function IconCyberpunk({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M4 18V6l8-4 8 4v12l-8 4-8-4Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="color-mix(in srgb, currentColor 18%, transparent)"
      />
      <path
        d="M12 8v8M8 12h8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

/** Triple peaks — adventure / overworld vibe (generic mountains, not a franchise mark) */
function IconZelda({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M3 18 L7.5 9 L12 14 L16.5 6 L21 18 Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
        fill="color-mix(in srgb, currentColor 14%, transparent)"
      />
      <path
        d="M9 18 L12 12 L15 18"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  );
}

/** Rounded leaf — cozy island / nature vibe */
function IconAnimalCrossing({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 3 Q8 8 8 14 Q8 19 12 21 Q16 19 16 14 Q16 8 12 3 Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
        fill="color-mix(in srgb, currentColor 14%, transparent)"
      />
      <path
        d="M12 8v10"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

const THEME_OPTIONS: {
  id: Theme;
  label: string;
  hint: string;
  Icon: React.FC<{ className?: string }>;
}[] = [
  {
    id: "cyberpunk",
    label: "Cyberpunk",
    hint: "Neon grid night city",
    Icon: IconCyberpunk,
  },
  {
    id: "zelda",
    label: "Zelda",
    hint: "Gold, forest, epic skies",
    Icon: IconZelda,
  },
  {
    id: "animal-crossing",
    label: "Animal Crossing",
    hint: "Soft pastels and leaf",
    Icon: IconAnimalCrossing,
  },
];

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const currentIndex = Math.max(
    0,
    THEME_OPTIONS.findIndex((o) => o.id === theme),
  );
  const current = THEME_OPTIONS[currentIndex]!;
  const next = THEME_OPTIONS[(currentIndex + 1) % THEME_OPTIONS.length]!;
  const { Icon } = current;

  const cycle = () => {
    setTheme(next.id);
  };

  return (
    <button
      type="button"
      onClick={cycle}
      className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 transition-all duration-200 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 md:h-8 md:gap-2 md:px-3"
      style={{
        borderColor: "color-mix(in srgb, var(--accent) 28%, transparent)",
        background: "color-mix(in srgb, var(--bg-elevated) 85%, transparent)",
        boxShadow:
          "0 0 0 1px color-mix(in srgb, var(--border-subtle) 50%, transparent), 0 0 10px color-mix(in srgb, var(--accent) 22%, transparent), inset 0 0 0 1px color-mix(in srgb, var(--accent) 28%, transparent)",
        color: "var(--accent)",
        outlineColor: "var(--accent)",
      }}
      title={`${current.label} — ${current.hint}. Click to switch to ${next.label}.`}
      aria-label={`Visual theme ${current.label}. Click to switch to ${next.label}.`}
    >
      <span className="select-none text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] sm:text-xs">
        THEME
      </span>
      <Icon className="h-[1.15rem] w-[1.15rem] shrink-0 md:h-4 md:w-4" />
    </button>
  );
};

export default ThemeToggle;
