"use client";

import { useRef, useState } from "react";

const SWIPE_THRESHOLD = 100;
const EXIT_DISTANCE = 600;
const EXIT_DURATION = 220;

interface SwipeCardProps {
  children: React.ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  disabled?: boolean;
  className?: string;
}

/** Tinder-style drag-to-decide card. Pointer Events cover mouse, touch, and
 * pen with one handler set, so the same code drives both the touch-swipe and
 * mouse-drag paths, no separate touch/mouse branches needed. */
export default function SwipeCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  disabled,
  className,
}: SwipeCardProps) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting] = useState<"left" | "right" | null>(null);
  const startX = useRef(0);
  const pointerId = useRef<number | null>(null);

  function handlePointerDown(e: React.PointerEvent) {
    if (disabled || exiting) return;
    startX.current = e.clientX;
    pointerId.current = e.pointerId;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging || pointerId.current !== e.pointerId) return;
    setDragX(e.clientX - startX.current);
  }

  function commitSwipe(direction: "left" | "right") {
    setExiting(direction);
    setDragging(false);
    setTimeout(() => {
      if (direction === "right") onSwipeRight();
      else onSwipeLeft();
    }, EXIT_DURATION);
  }

  function handlePointerUp() {
    if (!dragging) return;
    setDragging(false);
    if (dragX > SWIPE_THRESHOLD) {
      commitSwipe("right");
    } else if (dragX < -SWIPE_THRESHOLD) {
      commitSwipe("left");
    } else {
      setDragX(0);
    }
  }

  const x = exiting ? (exiting === "right" ? EXIT_DISTANCE : -EXIT_DISTANCE) : dragX;
  const rotate = Math.max(-12, Math.min(12, x / 18));
  const likeOpacity = Math.min(1, Math.max(0, dragX / SWIPE_THRESHOLD));
  const nopeOpacity = Math.min(1, Math.max(0, -dragX / SWIPE_THRESHOLD));

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        transform: `translateX(${x}px) rotate(${rotate}deg)`,
        transition: dragging ? "none" : `transform ${EXIT_DURATION}ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
        touchAction: "pan-y",
      }}
      className={`relative select-none ${dragging ? "cursor-grabbing" : "cursor-grab"} ${className ?? ""}`}
    >
      <span
        style={{ opacity: exiting === "right" ? 1 : likeOpacity }}
        className="pointer-events-none absolute left-5 top-5 z-10 -rotate-12 rounded-xl border-4 border-hit px-3 py-1 text-xl font-extrabold uppercase text-hit"
      >
        Buy
      </span>
      <span
        style={{ opacity: exiting === "left" ? 1 : nopeOpacity }}
        className="pointer-events-none absolute right-5 top-5 z-10 rotate-12 rounded-xl border-4 border-ink-400 px-3 py-1 text-xl font-extrabold uppercase text-ink-400"
      >
        Skip
      </span>
      {children}
    </div>
  );
}
