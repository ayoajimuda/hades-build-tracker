'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import SkillCard from '@/components/SkillCard';
import SkillPicker from '@/components/SkillPicker';
import { loadSkillData, initialLevel, cycleLevel } from '@/lib/skills';
import { getSnapshot, saveBuilds } from '@/lib/buildsStore';
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
  const [data, setData] = useState(null);
  const [title, setTitle] = useState('');
  const [entries, setEntries] = useState([]); // { uid, id, level }
  const [currentSlug, setCurrentSlug] = useState(null);
  const [picking, setPicking] = useState(false);
  const [loadOpen, setLoadOpen] = useState(false);
  const [status, setStatus] = useState(null);

  const dragFrom = useRef(null);
  const uid = useRef(0);

  useEffect(() => {
    loadSkillData().then(setData).catch(() =>
      setStatus({ type: 'error', text: "Couldn't load skill data." })
    );
  }, []);

  const skillOf = (id) => data?.byId.get(id);

  function addSkill(skill) {
    setEntries((prev) => [
      ...prev,
      { uid: `e${uid.current++}`, id: skill.id, level: initialLevel(skill) },
    ]);
  }

  function cycle(entryUid) {
    setEntries((prev) =>
      prev.map((e) =>
        e.uid === entryUid
          ? { ...e, level: cycleLevel(skillOf(e.id), e.level) }
          : e
      )
    );
  }

  function remove(entryUid) {
    setEntries((prev) => prev.filter((e) => e.uid !== entryUid));
  }

  function reorder(toIndex) {
    const from = dragFrom.current;
    if (from == null || from === toIndex) return;
    setEntries((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    dragFrom.current = toIndex;
  }

  function handleSave() {
    const name = title.trim();
    if (!name) {
      setStatus({ type: 'error', text: 'Give your build a name first.' });
      return;
    }

    const existing = getSnapshot();
    const slug = currentSlug ?? uniqueSlug(slugify(name), existing);

    // icons drive the preview tiles on /builds
    const icons = entries.slice(0, 4).map((e) => {
      const s = skillOf(e.id);
      return {
        src: s.iconsrc,
        alt: s.title,
        name: s.title,
        detail: e.level.rarity ?? `Rank ${e.level.rank}`,
      };
    });

    const build = { slug, name, entries, icons, updatedAt: Date.now() };
    const next = existing.some((b) => b.slug === slug)
      ? existing.map((b) => (b.slug === slug ? build : b))
      : [...existing, build];

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
    setEntries(build.entries ?? []);
    setCurrentSlug(build.slug);
    setLoadOpen(false);
    setStatus(null);
    uid.current = (build.entries?.length ?? 0) + 1;
  }

  return (
    <div>
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
            <button className="board-button" onClick={() => setPicking(true)} disabled={!data}>
              Add Skills
            </button>
            <button className="board-button" onClick={handleSave}>Save Build</button>
            <div className="load-wrap">
              <button className="board-button" onClick={() => setLoadOpen((o) => !o)}>
                Load Build
              </button>
              {loadOpen && (
                <ul className="load-menu">
                  {getSnapshot().length === 0 ? (
                    <li className="load-empty">No saved builds</li>
                  ) : (
                    getSnapshot().map((b) => (
                      <li key={b.slug}>
                        <button className="load-item" onClick={() => handleLoad(b)}>
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

        {status && <p className={`board-status ${status.type}`} role="status">{status.text}</p>}

        <div className="board">
          <div className="skill-grid board-grid">
            {entries.map((e, i) => {
              const skill = skillOf(e.id);
              if (!skill) return null;
              return (
                <SkillCard
                  key={e.uid}
                  skill={skill}
                  level={e.level}
                  draggable
                  onDragStart={() => (dragFrom.current = i)}
                  onDragEnter={() => reorder(i)}
                  onDragEnd={() => (dragFrom.current = null)}
                  onCycle={() => cycle(e.uid)}
                  onDelete={() => remove(e.uid)}
                />
              );
            })}
          </div>
          {entries.length === 0 && (
            <p className="board-empty">Click <strong>Add Skills</strong> to start your build.</p>
          )}
        </div>

        {picking && data && (
          <SkillPicker data={data} onPick={addSkill} onClose={() => setPicking(false)} />
        )}
      </main>
    </div>
  );
}