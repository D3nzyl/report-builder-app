"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";

export function Tooltip({ text, subtext, children }: { text: string; subtext?: string; children: React.ReactNode }) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const ref = useRef<HTMLSpanElement>(null);

  return (
    <span
      ref={ref}
      style={{ display: "inline" }}
      onMouseEnter={() => setRect(ref.current?.getBoundingClientRect() ?? null)}
      onMouseLeave={() => setRect(null)}
    >
      {children}
      {rect && createPortal(
        <div
          style={{
            position: "fixed",
            top: rect.top - 8,
            left: rect.left + rect.width / 2,
            transform: "translate(-50%, -100%)",
            zIndex: 9999,
            pointerEvents: "none",
          }}
        >
          <div className="bg-gray-900 text-white text-[11px] rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-xl">
            {subtext && (
              <div className="font-normal opacity-60 text-[10px] leading-none mb-1">{subtext}</div>
            )}
            <div className="font-medium leading-none">{text}</div>
          </div>
          <div
            className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
            style={{
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              borderTop: "4px solid #111827",
            }}
          />
        </div>,
        document.body
      )}
    </span>
  );
}
