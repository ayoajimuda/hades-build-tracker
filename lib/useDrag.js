'use client';

import { useRef, useCallback } from 'react';

/**
 * Pointer-based dragging. Returns an onPointerDown to put on a handle.
 * Reports the new { x, y } as the pointer moves.
 */
export function useDrag(position, onMove) {
  const start = useRef(null);

  return useCallback(
    (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);

      start.current = { px: e.clientX, py: e.clientY, x: position.x, y: position.y };

      const move = (ev) => {
        if (!start.current) return;
        onMove({
          x: Math.max(0, start.current.x + ev.clientX - start.current.px),
          y: Math.max(0, start.current.y + ev.clientY - start.current.py),
        });
      };

      const up = () => {
        start.current = null;
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };

      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    },
    [position.x, position.y, onMove]
  );
}