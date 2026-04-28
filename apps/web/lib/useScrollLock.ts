"use client";

import { useEffect } from "react";

let activeLockCount = 0;
let lockScrollY = 0;
let previousHtmlOverflow = "";
let previousHtmlOverscrollBehavior = "";
let previousBodyOverflow = "";
let previousBodyOverscrollBehavior = "";
let previousBodyPosition = "";
let previousBodyTop = "";
let previousBodyWidth = "";
let stylesSaved = false;

function applyScrollLock() {
  if (typeof document === "undefined" || typeof window === "undefined") return;

  const html = document.documentElement;
  const { body } = document;

  if (!stylesSaved) {
    lockScrollY = window.scrollY;
    previousHtmlOverflow = html.style.overflow;
    previousHtmlOverscrollBehavior = html.style.overscrollBehavior;
    previousBodyOverflow = body.style.overflow;
    previousBodyOverscrollBehavior = body.style.overscrollBehavior;
    previousBodyPosition = body.style.position;
    previousBodyTop = body.style.top;
    previousBodyWidth = body.style.width;
    stylesSaved = true;
  }

  html.style.overflow = "hidden";
  html.style.overscrollBehavior = "none";
  body.style.overflow = "hidden";
  body.style.overscrollBehavior = "none";
  body.style.position = "fixed";
  body.style.top = `-${lockScrollY}px`;
  body.style.width = "100%";
}

function releaseScrollLock() {
  if (typeof document === "undefined" || typeof window === "undefined") return;

  const html = document.documentElement;
  const { body } = document;

  if (stylesSaved) {
    html.style.overflow = previousHtmlOverflow;
    html.style.overscrollBehavior = previousHtmlOverscrollBehavior;
    body.style.overflow = previousBodyOverflow;
    body.style.overscrollBehavior = previousBodyOverscrollBehavior;
    body.style.position = previousBodyPosition;
    body.style.top = previousBodyTop;
    body.style.width = previousBodyWidth;
    window.scrollTo(0, lockScrollY);
    stylesSaved = false;
  }
}

export default function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    activeLockCount += 1;
    if (activeLockCount === 1) {
      applyScrollLock();
    }

    return () => {
      activeLockCount = Math.max(0, activeLockCount - 1);
      if (activeLockCount === 0) {
        releaseScrollLock();
      }
    };
  }, [locked]);
}
