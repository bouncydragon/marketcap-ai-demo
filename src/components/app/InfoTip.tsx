"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { IconInfo } from "./Icons";

/**
 * An (i) button that reveals a short explanation. Opens on tap/click or keyboard focus,
 * on hover for mouse users, and closes on Escape or a tap elsewhere.
 * Place it next to a card title; the popover stays inside the card's width.
 */
export function InfoTip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span
      className="info-tip"
      ref={ref}
      onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
    >
      <button type="button" className="info-btn" aria-label={label} aria-expanded={open} aria-describedby={open ? id : undefined} onClick={() => setOpen((o) => !o)}>
        <IconInfo width={18} height={18} />
      </button>
      {open && (
        <span role="tooltip" id={id} className="info-pop">
          {children}
        </span>
      )}
    </span>
  );
}
