'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { GODS } from '@/data/boons';

export default function SkillPicker({ candidates, slotLabel, onPick, onClose }) {
  const [search, setSearch] = useState('');
  const [gods, setGods] = useState([]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    return candidates.filter((b) => {
      if (gods.length && !gods.includes(b.god)) return false;
      if (!q) return true;
      return `${b.title} ${b.text}`.toLowerCase().includes(q);
    });
  }, [candidates, search, gods]);

  const toggleGod = (code) =>
    setGods((prev) => (prev.includes(code) ? prev.filter((g) => g !== code) : [...prev, code]));

  return (
    <div className="overlay" onClick={onClose}>
      <div className="picker" onClick={(e) => e.stopPropagation()}>
        <div className="picker-head">
          <p className="picker-title">{slotLabel} Boons</p>
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
              key={g.code}
              className={`filter-chip ${gods.includes(g.code) ? 'on' : ''}`}
              onClick={() => toggleGod(g.code)}
            >
              {g.name}
            </button>
          ))}
        </div>

        <div className="picker-body">
          {results.length === 0 ? (
            <p className="picker-empty">No {slotLabel.toLowerCase()} boons match those filters.</p>
          ) : (
            results.map((b) => (
              <button key={b.id} className="picker-row" onClick={() => onPick(b)}>
                <Image src={b.iconsrc} alt="" width={72} height={72} draggable={false} />
                <span className="picker-row-text">
                  <span className="picker-row-name">{b.title}</span>
                  <span className="picker-row-effect">{b.text}</span>
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}