'use client';

import { useRef, useCallback } from 'react';

/** Pixels of movement before a press counts as a drag rather than a click. */
const THRESHOLD = 4;

/**
 * Pointer-based dragging for absolutely-positioned elements.
 *
 * Capture is deliberately deferred until the pointer has actually moved.
 * Capturing on pointerdown retargets the following click to the capturing
 * element, which silently breaks any click handler on a child.
 *
 * Returns { onPointerDown, isDragging } — call isDragging() in a click
 * handler to tell a real click from the end of a drag.
 */
export function useDrag(position, onMove) {
  const state = useRef(null);
  const dragged = useRef(false);

  const onPointerDown = useCallback(
    (e) => {
      if (e.button !== 0) return;

      const el = e.currentTarget;
      dragged.current = false;
      state.current = {
        px: e.clientX,
        py: e.clientY,
        x: position.x,
        y: position.y,
        active: false,
      };

      const move = (ev) => {
        const s = state.current;
        if (!s) return;

        const dx = ev.clientX - s.px;
        const dy = ev.clientY - s.py;

        if (!s.active) {
          if (Math.hypot(dx, dy) < THRESHOLD) return;
          s.active = true;
          dragged.current = true;
          el.setPointerCapture?.(ev.pointerId);
        }

        onMove({ x: Math.max(0, s.x + dx), y: Math.max(0, s.y + dy) });
      };

      const up = (ev) => {
        if (state.current?.active && el.hasPointerCapture?.(ev.pointerId)) {
          el.releasePointerCapture(ev.pointerId);
        }
        state.current = null;
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };

      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    },
    [position.x, position.y, onMove]
  );

  return { onPointerDown, isDragging: () => dragged.current };
}