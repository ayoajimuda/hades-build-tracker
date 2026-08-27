'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { effectText } from '@/lib/skills';

const GODS = [
  { code: 'APH', name: 'Aphrodite' },
  { code: 'ARE', name: 'Ares' },
  { code: 'ART', name: 'Artemis' },
  { code: 'ATH', name: 'Athena' },
  { code: 'DEM', name: 'Demeter' },
  { code: 'DIO', name: 'Dionysus' },
  { code: 'HER', name: 'Hermes' },
  { code: 'POS', name: 'Poseidon' },
  { code: 'ZEU', name: 'Zeus' },
  { code: 'CHA', name: 'Chaos' },
];

export default function SkillPicker({ candidates = [], slotLabel = '', onPick, onClose }) {
  const [search, setSearch] = useState('');
  const [gods, setGods] = useState([]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // only show god chips when the candidate list actually has gods in it
  const availableGods = useMemo(() => {
    const present = new Set(candidates.map((c) => c.god).filter(Boolean));
    return GODS.filter((g) => present.has(g.code));
  }, [candidates]);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    return candidates.filter((c) => {
      if (gods.length && !gods.includes(c.god)) return false;
      if (!q) return true;
      return `${c.title} ${c.text ?? c.description ?? ''}`.toLowerCase().includes(q);
    });
  }, [candidates, search, gods]);

  const toggleGod = (code) =>
    setGods((prev) => (prev.includes(code) ? prev.filter((g) => g !== code) : [...prev, code]));

  return (
    <div className="overlay" onClick={onClose}>
      <div className="picker" onClick={(e) => e.stopPropagation()}>
        <div className="picker-head">
          <p className="picker-title">{slotLabel}</p>
          <input
            className="picker-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type to search..."
            spellCheck={false}
            autoFocus
          />
          <button type="button" className="board-button" onClick={onClose}>
            Go Back
          </button>
        </div>

        {availableGods.length > 1 && (
          <div className="picker-filters">
            {availableGods.map((g) => (
              <button
                key={g.code}
                type="button"
                className={`filter-chip ${gods.includes(g.code) ? 'on' : ''}`}
                onClick={() => toggleGod(g.code)}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}

        <div className="picker-body">
          {results.length === 0 ? (
            <p className="picker-empty">Nothing matches those filters.</p>
          ) : (
            results.map((c) => (
              <button
                key={c.id}
                type="button"
                className="picker-row"
                onClick={() => onPick(c)}
              >
                <Image src={c.iconsrc} alt="" width={56} height={56} draggable={false} />
                <span className="picker-row-text">
                  <span className="picker-row-name">{c.title}</span>
                  <span className="picker-row-effect">{effectText(c, {})}</span>
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}