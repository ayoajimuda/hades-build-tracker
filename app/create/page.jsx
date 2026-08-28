'use client';

import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import SlotIcon from '@/components/SlotIcon';
import Section from '@/components/Section';
import SkillCard from '@/components/SkillCard';
import SkillInfo from '@/components/SkillInfo';
import SkillPicker from '@/components/SkillPicker';
import SkillBrowser from '@/components/SkillBrowser';
import { SLOTS, EMPTY_SLOTS } from '@/lib/slots';
import { byId, forSlot } from '@/data';
import { initialLevel, cycleLevel } from '@/lib/skills';
import { useDrag } from '@/lib/useDrag';
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

/** A skill sitting directly on the board, outside any section. */
function LooseSkill({ entry, onMove, onCycle, onRemove, onInfo }) {
  const onPointerDown = useDrag(entry.position, onMove);
  const moved = useRef(false);

  return (
    <div
      className="loose-skill"
      style={{ left: entry.position.x, top: entry.position.y }}
      onPointerDown={(e) => {
        // let buttons inside the card handle their own clicks
        if (e.target.closest('button')) return;
        moved.current = false;
        onPointerDown(e);
      }}
      onPointerMove={() => { moved.current = true; }}
    >
      <SkillCard
        skill={entry.item}
        level={entry.level}
        onCycle={() => { if (!moved.current) onCycle(); }}
        onDelete={onRemove}
        onInfo={onInfo}
      />
    </div>
  );
}

export default function Create() {
  const builds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const [title, setTitle] = useState('');
  const [slots, setSlots] = useState(EMPTY_SLOTS);
  const [sections, setSections] = useState([]);   // { id, title, position, entries }
  const [loose, setLoose] = useState([]);         // { uid, id, level, position }
  const [activeSection, setActiveSection] = useState(null);
  const [inspecting, setInspecting] = useState(null); 
  const [currentSlug, setCurrentSlug] = useState(null);
  const [picking, setPicking] = useState(null);   // { kind, target } — slot pickers only
  const [browsing, setBrowsing] = useState(false);
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

  /* ------------------------------------------------------------------ slots */

  function cycleSlot(slotId) {
    setSlots((prev) => {
      const entry = prev[slotId];
      const item = entry && byId(entry.id);
      if (!item) return prev;
      return { ...prev, [slotId]: { ...entry, level: cycleLevel(item, entry.level) } };
    });
  }

  const clearSlot = (slotId) => setSlots((prev) => ({ ...prev, [slotId]: null }));

  /* --------------------------------------------------------------- sections */

  /** Stagger new sections so they don't stack in one spot. */
  function nextPosition(count) {
    return { x: 40 + (count % 3) * 60, y: 40 + (count % 3) * 60 };
  }

  function addSection() {
    const id = `s${nextId.current++}`;
    setSections((prev) => [
      ...prev,
      { id, title: `Section ${prev.length + 1}`, position: nextPosition(prev.length), entries: [] },
    ]);
    setActiveSection(id);
    return id;
  }

  const moveSection = (id, position) =>
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, position } : s)));

  const renameSection = (id, title) =>
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, title } : s)));

  function deleteSection(id) {
    setSections((prev) => prev.filter((s) => s.id !== id));
    setActiveSection((cur) => (cur === id ? null : cur));
  }

  const removeFromSection = (sectionId, uid) =>
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, entries: s.entries.filter((e) => e.uid !== uid) } : s
      )
    );

  const cycleInSection = (sectionId, uid) =>
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          entries: s.entries.map((e) => {
            if (e.uid !== uid) return e;
            const item = byId(e.id);
            return item ? { ...e, level: cycleLevel(item, e.level) } : e;
          }),
        };
      })
    );

  /* ------------------------------------------------------------ loose skills */

  const moveLoose = (uid, position) =>
    setLoose((prev) => prev.map((e) => (e.uid === uid ? { ...e, position } : e)));

  const removeLoose = (uid) => setLoose((prev) => prev.filter((e) => e.uid !== uid));

  const cycleLoose = (uid) =>
    setLoose((prev) =>
      prev.map((e) => {
        if (e.uid !== uid) return e;
        const item = byId(e.id);
        return item ? { ...e, level: cycleLevel(item, e.level) } : e;
      })
    );

  /* ------------------------------------------------------------------ adding */

  /**
   * From the browser: drop into the active section if there is one, otherwise
   * straight onto the board. No section is required.
   */
function addFromBrowser(item) {
  const entry = { uid: `e${nextId.current++}`, id: item.id, level: initialLevel(item) };

  if (activeSection && sections.some((s) => s.id === activeSection)) {
    setSections((prev) =>
      prev.map((s) => (s.id === activeSection ? { ...s, entries: [...s.entries, entry] } : s))
    );
  } else {
    setLoose((prev) => [...prev, { ...entry, position: nextPosition(prev.length) }]);
  }

  setStatus(null);
  setBrowsing(false);   // ← back to the board
}

  /** From a section's own + button. */
  function addToSection(sectionId, item) {
    setSections((prev) =>
      prev.map((s) =>
        s.id !== sectionId
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
    setPicking(null);
  }

  function assignSlot(slotId, item) {
    setSlots((prev) => ({ ...prev, [slotId]: { id: item.id, level: initialLevel(item) } }));
    setPicking(null);
    setStatus(null);
  }

  /* ------------------------------------------------------------- save / load */

  function buildIcons() {
    return [
      ...SLOTS.map((slot) => ({ label: slot.label, entry: slots[slot.id] })),
      ...sections.flatMap((s) => s.entries.map((e) => ({ label: s.title, entry: e }))),
      ...loose.map((e) => ({ label: 'Extra', entry: e })),
    ]
      .filter(({ entry }) => entry)
      .map(({ label, entry }) => ({ label, item: byId(entry.id) }))
      .filter(({ item }) => item)
      .slice(0, 4)
      .map(({ label, item }) => ({
        src: item.iconsrc, alt: item.title, name: item.title, detail: label,
      }));
  }

  function handleSave() {
    const name = title.trim();
    if (!name) {
      setStatus({ type: 'error', text: 'Give your build a name first.' });
      return;
    }

    const slug = currentSlug ?? uniqueSlug(slugify(name), builds);
    const build = { slug, name, slots, sections, loose, icons: buildIcons(), updatedAt: Date.now() };

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
    const loadedSlots = { ...EMPTY_SLOTS };
    for (const [key, entry] of Object.entries(build.slots ?? {})) {
      if (entry && byId(entry.id)) loadedSlots[key] = entry;
    }

    const loadedSections = (build.sections ?? []).map((s, i) => ({
      ...s,
      position: s.position ?? nextPosition(i),
      entries: (s.entries ?? []).filter((e) => byId(e.id)),
    }));

    const loadedLoose = (build.loose ?? [])
      .filter((e) => byId(e.id))
      .map((e, i) => ({ ...e, position: e.position ?? nextPosition(i) }));

    setTitle(build.name ?? '');
    setSlots(loadedSlots);
    setSections(loadedSections);
    setLoose(loadedLoose);
    setCurrentSlug(build.slug);
    setActiveSection(null);
    setLoadOpen(false);
    setStatus(null);

  const usedCount = loadedSections.reduce((n, s) => n + s.entries.length, 0);
  nextId.current = usedCount + loadedSections.length + loadedLoose.length + 1;
  }

  function handleNew() {
    setTitle('');
    setSlots(EMPTY_SLOTS);
    setSections([]);
    setLoose([]);
    setActiveSection(null);
    setCurrentSlug(null);
    setStatus(null);
  }

  /* -------------------------------------------------------------------- view */

  if (browsing) {
    return (
      <div className="browser-layout">
        <SkillBrowser
          onPick={addFromBrowser}
          onInspect={(item) => setInspecting({ item, level: initialLevel(item) })}
          selectedId={inspecting?.item?.id}
          onClose={() => setBrowsing(false)}
        />
        <SkillInfo item={inspecting?.item} level={inspecting?.level} />
      </div>
    );
  }

  return (
    <main className="board-page">
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
          <button type="button" className="board-button" onClick={() => setBrowsing(true)}>
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
        onCycle={() => {
          console.log('CLICK', {
            title: item.title,
            kind: item.kind,
            rarities: item.rarities,
            levelBefore: e.level,
          });
          cycleLoose(e.uid);
        }}
        <div
          className="board-canvas"
          onPointerDown={(e) => {
            if (e.target.classList.contains('board-canvas')) setActiveSection(null);
          }}
        >
          {sections.map((s) => (
            <Section
              key={s.id}
              section={s}
              active={s.id === activeSection}
              items={s.entries.map((e) => ({ ...e, item: byId(e.id) })).filter((e) => e.item)}
              onFocus={() => setActiveSection(s.id)}
              onMove={(p) => moveSection(s.id, p)}
              onRename={(t) => renameSection(s.id, t)}
              onAdd={() => setPicking({ kind: 'section', target: s.id })}
              onRemove={(uid) => removeFromSection(s.id, uid)}
              onCycle={(uid) => cycleInSection(s.id, uid)}
              onDelete={() => deleteSection(s.id)}
            />
          ))}

          {loose.map((e) => {
            const item = byId(e.id);
            if (!item) return null;
            return (
              <LooseSkill
                key={e.uid}
                entry={{ ...e, item }}
                onMove={(p) => moveLoose(e.uid, p)}
                onCycle={() => cycleLoose(e.uid)}
                onRemove={() => removeLoose(e.uid)}
                onInfo={() => setInspecting({ item, level: e.level })}
              />
            );
          })}

          {sections.length === 0 && loose.length === 0 && (
            <p className="canvas-empty">
              Click <strong>Add Skills</strong> to browse boons, or <strong>Add Section</strong> to group them.
            </p>
          )}
        </div>
        <SkillInfo
            item={inspecting?.item}
            level={inspecting?.level}
            onClose={() => setInspecting(null)}
          />
      </div>

      {picking && (
        <SkillPicker
          candidates={picking.kind === 'slot' ? forSlot(picking.target) : []}
          slotLabel={SLOTS.find((s) => s.id === picking.target)?.label ?? 'Section'}
          onPick={(item) =>
            picking.kind === 'slot'
              ? assignSlot(picking.target, item)
              : addToSection(picking.target, item)
          }
          onClose={() => setPicking(null)}
        />
      )}
    </main>
  );
}