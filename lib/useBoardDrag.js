'use client';

import { useState, useCallback, useRef } from 'react';

const THRESHOLD = 4;

/**
 * A single drag layer for the whole board.
 *
 * Items live in one of two places — loose on the canvas, or inside a section.
 * Dragging can move an item between them, so the drag state is held here
 * rather than on each item.
 *
 * start(e, payload) begins a drag. On release, onDrop is called with the
 * payload, the drop target found under the cursor, and the pointer position.
 */
export function useBoardDrag(onDrop) {
  const [drag, setDrag] = useState(null);   // { payload, x, y, active }
  const info = useRef(null);

  const start = useCallback(
    (e, payload) => {
      if (e.button !== 0) return;

      const rect = e.currentTarget.getBoundingClientRect();
      info.current = {
        payload,
        px: e.clientX,
        py: e.clientY,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        active: false,
      };

      const move = (ev) => {
        const s = info.current;
        if (!s) return;

        if (!s.active) {
          if (Math.hypot(ev.clientX - s.px, ev.clientY - s.py) < THRESHOLD) return;
          s.active = true;
        }
        setDrag({ payload: s.payload, x: ev.clientX, y: ev.clientY, offsetX: s.offsetX, offsetY: s.offsetY });
      };

      const up = (ev) => {
        const s = info.current;
        info.current = null;
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        setDrag(null);

        if (!s?.active) return;   // a click, not a drag

        // what's under the cursor? sections advertise themselves by data attr
        const el = document.elementFromPoint(ev.clientX, ev.clientY);
        const section = el?.closest('[data-section-id]');

        onDrop({
          payload: s.payload,
          sectionId: section?.dataset.sectionId ?? null,
          x: ev.clientX - s.offsetX,
          y: ev.clientY - s.offsetY,
        });
      };

      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    },
    [onDrop]
  );

  return { drag, start, isDragging: () => Boolean(info.current?.active) };
}