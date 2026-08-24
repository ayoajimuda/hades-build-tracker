'use client';

import { useState, useMemo } from 'react';
import SkillCard from './SkillCard';
import { initialLevel } from '@/lib/skills';

const GODS = ['APH','ARE','ART','ATH','DEM','DIO','POS','ZEU','HER','CHA'];

export default function SkillPicker({ data, onPick, onClose }) {
  const [search, setSearch] = useState('');
  const [gods, setGods] = useState([]);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.categories
      .map(({ name, skills }) => ({
        name,
        skills: skills.filter((s) => {
          if (gods.length && !s.tags?.some((t) => gods.includes(t))) return false;
          if (!q) return true;
          const hay = [s.title, s.text, ...(s.effect ?? [])].join(' ').toLowerCase();
          return hay.includes(q);
        }),
      }))
      .filter((c) => c.skills.length > 0);
  }, [data, search, gods]);

  function toggleGod(g) {
    setGods((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="picker" onClick={(e) => e.stopPropagation()}>
        <div className="picker-head">
          <p className="picker-title">Skill Selection</p>
          <input
            className="picker-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type to search..."
            spellCheck={false}
            autoFocus
          />
          <button className="board-button" onClick={onClose}>Go Back</button>
        </div>

        <div className="picker-filters">
          {GODS.map((g) => (
            <button
              key={g}
              className={`filter-chip ${gods.includes(g) ? 'on' : ''}`}
              onClick={() => toggleGod(g)}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="picker-body">
          {results.length === 0 ? (
            <p className="picker-empty">
              Nothing matches those filters. Try loosening them.
            </p>
          ) : (
            results.map(({ name, skills }) => (
              <section key={name}>
                <p className="picker-category">{name}</p>
                <div className="skill-grid">
                  {skills.map((s) => (
                    <SkillCard
                      key={s.id}
                      skill={s}
                      level={initialLevel(s)}
                      onCycle={() => onPick(s)}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}