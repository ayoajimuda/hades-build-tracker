'use client';

import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import SlotIcon from '@/components/SlotIcon';
import SkillPicker from '@/components/SkillPicker';
import { SLOTS, EMPTY_SLOTS } from '@/lib/slots';
import { boonsById, boonsForSlot } from '@/data/boons';
import { initialLevel, cycleLevel } from '@/lib/skills';
import { subscribe, getSnapshot, getServerSnapshot, saveBuilds } from '@/lib/buildsStore';
import '@/styles/create.css';

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function uniqueSlug(base, builds) {
  let slug = base || 'untitled';
  let n = 2;
  while (builds.some((b) => b.slug === slug)) slug = `${base}-${n++}`;
  return slug;
}

export default function Create() {
  const builds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const [title, setTitle] = useState('');
  const [slots, setSlots] = useState(EMPTY_SLOTS);
  const [currentSlug, setCurrentSlug] = useState(null);
  const [picking, setPicking] = useState(null);   // slot id, or null
  const [loadOpen, setLoadOpen] = useState(false);
  const [status, setStatus] = useState(null);

  const loadRef = useRef(null);

  useEffect(() => {
    if (!loadOpen) return;
    const onDown = (e) => {
      if (loadRef.current && !loadRef.current.contains(e.target)) setLoadOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setLoadOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [loadOpen]);

  const boonOf = (id) => boonsById.get(id);

  function assign(boon) {
    setSlots((prev) => ({ ...prev, [picking]: { id: boon.id, level: initialLevel(boon) } }));
    setPicking(null);
    setStatus(null);
  }

  function cycle(slotId) {
    setSlots((prev) => {
      const entry = prev[slotId];
      if (!entry) return prev;
      return { ...prev, [slotId]: { ...entry, level: cycleLevel(boonOf(entry.id), entry.level) } };
    });
  }

  function clear(slotId) {
    setSlots((prev) => ({ ...prev, [slotId]: null }));
  }

  function handleSave() {
    const name = title.trim();
    if (!name) {
      setStatus({ type: 'error', text: 'Give your build a name first.' });
      return;
    }

    const slug = currentSlug ?? uniqueSlug(slugify(name), builds);

    const icons = SLOTS
      .map((slot) => ({ slot, entry: slots[slot.id] }))
      .filter(({ entry }) => entry)
      .map(({ slot, entry }) => {
        const b = boonOf(entry.id);
        return { src: b.iconsrc, alt: b.title, name: b.title, detail: slot.label };
      });

    const build = { slug, name, slots, icons, updatedAt: Date.now() };
    const next = builds.some((b) => b.slug === slug)
      ? builds.map((b) => (b.slug === slug ? build : b))
      : [...builds, build];

    try {
      saveBuilds(next);
      setCurrentSlug(slug);
      setStatus({ type: 'ok', text: 'Saved.' });
    } catch {
      setStatus({ type: 'error', text: "Couldn't save — storage may be full." });
    }
  }

  function handleLoad(build) {
    setTitle(build.name);
    setSlots({ ...EMPTY_SLOTS, ...(build.slots ?? {}) });
    setCurrentSlug(build.slug);
    setLoadOpen(false);
    setStatus(null);
  }

  function handleNew() {
    setTitle('');
    setSlots(EMPTY_SLOTS);
    setCurrentSlug(null);
    setStatus(null);
  }

  return (
    <main>
      <div className="board-toolbar">
        <input
          className="board-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter Title"
          aria-label="Build title"
          spellCheck={false}
        />

        <div className="toolbar-actions">
          <button className="board-button" onClick={handleNew}>New Build</button>
          <button className="board-button" onClick={handleSave}>Save Build</button>

          <div className="load-wrap" ref={loadRef}>
            <button
              className="board-button"
              onClick={() => setLoadOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={loadOpen}
            >
              Load Build
            </button>

            {loadOpen && (
              <ul className="load-menu" role="menu">
                {builds.length === 0 ? (
                  <li className="load-empty">No saved builds</li>
                ) : (
                  builds.map((b) => (
                    <li key={b.slug}>
                      <button role="menuitem" className="load-item" onClick={() => handleLoad(b)}>
                        {b.name}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </div>
      </div>

      {status && (
        <p className={`board-status ${status.type}`} role="status">{status.text}</p>
      )}

      <div className="board">
        <div className="slot-column">
          {SLOTS.map((slot) => {
            const entry = slots[slot.id];
            return (
              <SlotIcon
                key={slot.id}
                slot={slot}
                boon={entry ? boonOf(entry.id) : null}
                level={entry?.level}
                onPick={() => setPicking(slot.id)}
                onCycle={() => cycle(slot.id)}
                onClear={() => clear(slot.id)}
              />
            );
          })}
        </div>
      </div>

      {picking && (
        <SkillPicker
          candidates={boonsForSlot(picking)}
          slotLabel={SLOTS.find((s) => s.id === picking).label}
          onPick={assign}
          onClose={() => setPicking(null)}
        />
      )}
    </main>
  );
}