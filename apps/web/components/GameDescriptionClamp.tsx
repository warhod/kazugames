"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

export default function GameDescriptionClamp({
  description,
}: {
  description: string;
}) {
  const textId = useId();
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [hasClampOverflow, setHasClampOverflow] = useState(false);

  const measureOverflow = useCallback(() => {
    const el = paragraphRef.current;
    if (!el || expanded) return;
    const tolerance = 1;
    setHasClampOverflow(el.scrollHeight > el.clientHeight + tolerance);
  }, [expanded]);

  useLayoutEffect(() => {
    setExpanded(false);
    setHasClampOverflow(false);
  }, [description]);

  useLayoutEffect(() => {
    measureOverflow();
  }, [measureOverflow, description, expanded]);

  useEffect(() => {
    const onResize = () => measureOverflow();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measureOverflow]);

  if (!description.trim()) return null;

  const showToggle = hasClampOverflow || expanded;

  return (
    <div className="flex flex-col gap-1">
      <p
        ref={paragraphRef}
        id={textId}
        className={`text-sm leading-relaxed ${expanded ? "" : "line-clamp-4"}`}
        style={{ color: "var(--text-muted)" }}
      >
        {description}
      </p>
      {showToggle && (
        <button
          type="button"
          className="self-start text-[11px] font-display tracking-wide hover:underline"
          style={{ color: "var(--accent)" }}
          aria-expanded={expanded}
          aria-controls={textId}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Less" : "More"}
        </button>
      )}
    </div>
  );
}
