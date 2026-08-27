'use client';

import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import SlotIcon from '@/components/SlotIcon';
import Section from '@/components/Section';
import SkillPicker from '@/components/SkillPicker';
import { SLOTS, EMPTY_SLOTS } from '@/lib/slots';
import { byId, forSlot, boons, hammers, keepsakeSlot, duos } from '@/data';
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

/** Anything that can go in a free-form section. */
const ALL_PICKABLE = [...boons, ...hammers, ...keepsakeSlot, ...duos];

export default function Create() {
  const builds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const [title, setTitle] = useState('');
  const [slots, setSlots] = useState(EMPTY_SLOTS);
  const [sections, setSections] = useState([]);   // { id, title, entries: [{uid, id, level}] }
  const [activeSection, setActiveSection] = useState(null);
  const [currentSlug, setCurrentSlug] = useState(null);
  const [picking, setPicking] = useState(null);   // { kind: 'slot'|'section', target }
  const [loadOpen, setLoadOpen] = useState(false);
  const [status, setStatus] = useState(null);

  const loadRef = useRef(null);
  const nextId = useRef(1);

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

  /* ---------------------------------------------------------------- slots */

  function cycleSlot(slotId) {
    setSlots((prev) => {
      const entry = prev[slotId];
      if (!entry) return prev;
      return { ...prev, [slotId]: { ...entry, level: cycleLevel(byId(entry.id), entry.level) } };
    });
  }

  const clearSlot = (slotId) => setSlots((prev) => ({ ...prev, [slotId]: null }));

  /* ------------------------------------------------------------- sections */

  function addSection() {
    const id = `s${nextId.current++}`;
    setSections((prev) => [...prev, { id, title: `Section ${prev.length + 1}`, entries: [] }]);
    setActiveSection(id);
    return id;
  }

  function renameSection(id, title) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, title } : s)));
  }

  function deleteSection(id) {
    setSections((prev) => prev.filter((s) => s.id !== id));
    setActiveSection((cur) => (cur === id ? null : cur));
  }

  function removeFromSection(sectionId, uid) {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, entries: s.entries.filter((e) => e.uid !== uid) } : s
      )
    );
  }

  function cycleInSection(sectionId, uid) {
    setSections((prev) =>
      prev.map((s) =>
        s.id !== sectionId
          ? s
          : {
              ...s,
              entries: s.entries.map((e) =>
                e.uid === uid ? { ...e, level: cycleLevel(byId(e.id), e.level) } : e
              ),
            }
      )
    );
  }

  /** Toolbar button: add to the active section, creating one if needed. */
  function handleAddSkills() {
    const target = activeSection ?? sections.at(-1)?.id ?? addSection();
    setPicking({ kind: 'section', target });
  }

  /* --------------------------------------------------------------- picker */

  function assign(item) {
    if (picking.kind === 'slot') {
      setSlots((prev) => ({
        ...prev,
        [picking.target]: { id: item.id, level: initialLevel(item) },
      }));
    } else {
      setSections((prev) =>
        prev.map((s) =>
          s.id !== picking.target
            ? s
            : {
                ...s,
                entries: [
                  ...s.entries,
                  { uid: `e${nextId.current++}`, id: item.id, level: initialLevel(item) },
                ],
              }
        )
      );
    }
    setPicking(null);
    setStatus(null);
  }

  const pickerProps = () => {
    if (!picking) return null;
    if (picking.kind === 'slot') {
      return {
        candidates: forSlot(picking.target),
        slotLabel: SLOTS.find((s) => s.id === picking.target).label,
      };
    }
    return {
      candidates: ALL_PICKABLE,
      slotLabel: sections.find((s) => s.id === picking.target)?.title ?? 'Section',
    };
  };

  /* ------------------------------------------------------------ save/load */

  function handleSave() {
    const name = title.trim();
    if (!name) {
      setStatus({ type: 'error', text: 'Give your build a name first.' });
      return;
    }

  const slug = currentSlug ?? uniqueSlug(slugify(name), builds);

  const icons = [
    ...SLOTS.map((slot) => ({ label: slot.label, entry: slots[slot.id] })),
    ...sections.flatMap((s) => s.entries.map((e) => ({ label: s.title, entry: e }))),
  ]
    .filter(({ entry }) => entry)
    .map(({ label, entry }) => ({ label, item: byId(entry.id) }))
    .filter(({ item }) => item)                     // ← drop unresolved ids
    .slice(0, 4)
    .map(({ label, item }) => ({
      src: item.iconsrc, alt: item.title, name: item.title, detail: label,
    }));


    const build = { slug, name, slots, sections, icons, updatedAt: Date.now() };
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
    setSections(build.sections ?? []);
    setCurrentSlug(build.slug);
    setActiveSection(null);
    setLoadOpen(false);
    setStatus(null);
    // keep uid generation ahead of anything loaded
    const used = (build.sections ?? []).flatMap((s) => s.entries.map((e) => e.uid));
    nextId.current = used.length + (build.sections?.length ?? 0) + 1;
  }

  function handleNew() {
    setTitle('');
    setSlots(EMPTY_SLOTS);
    setSections([]);
    setActiveSection(null);
    setCurrentSlug(null);
    setStatus(null);
  }

  /* ----------------------------------------------------------------- view */

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
          <button type="button" className="board-button" onClick={addSection}>
            Add Section
          </button>

          <button type="button" className="board-button" onClick={handleAddSkills}>
            Add Skills
          </button>

          <button type="button" className="board-button" onClick={handleSave}>
            Save Build
          </button>

          <div className="load-wrap" ref={loadRef}>
            <button
              type="button"
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
                      <button
                        type="button"
                        role="menuitem"
                        className="load-item"
                        onClick={() => handleLoad(b)}
                      >
                        {b.name}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          <button type="button" className="board-button" onClick={handleNew}>
            New Build
          </button>
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
                boon={entry ? byId(entry.id) : null}
                level={entry?.level}
                onPick={() => setPicking({ kind: 'slot', target: slot.id })}
                onCycle={() => cycleSlot(slot.id)}
                onClear={() => clearSlot(slot.id)}
              />
            );
          })}
        </div>

        {sections.length > 0 && (
          <div className="section-column">
            {sections.map((s) => (
              <Section
                key={s.id}
                section={s}
                active={s.id === activeSection}
                items={s.entries.map((e) => ({ ...e, item: byId(e.id) })).filter((e) => e.item)}
                onFocus={() => setActiveSection(s.id)}
                onRename={(t) => renameSection(s.id, t)}
                onAdd={() => setPicking({ kind: 'section', target: s.id })}
                onRemove={(uid) => removeFromSection(s.id, uid)}
                onCycle={(uid) => cycleInSection(s.id, uid)}
                onDelete={() => deleteSection(s.id)}
              />
            ))}
          </div>
        )}
      </div>

      {picking && <SkillPicker {...pickerProps()} onPick={assign} onClose={() => setPicking(null)} />}
    </main>
  );
}