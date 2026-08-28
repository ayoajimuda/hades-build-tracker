'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { boons, hammers, aspects, duos, keepsakes, companions, wares, curses } from '@/data';
import { effectText } from '@/lib/skills';

const GODS = [
  { code: 'APH', name: 'Aphrodite' }, { code: 'ARE', name: 'Ares' },
  { code: 'ART', name: 'Artemis' },   { code: 'ATH', name: 'Athena' },
  { code: 'DEM', name: 'Demeter' },   { code: 'DIO', name: 'Dionysus' },
  { code: 'HER', name: 'Hermes' },    { code: 'POS', name: 'Poseidon' },
  { code: 'ZEU', name: 'Zeus' },      { code: 'CHA', name: 'Chaos' },
];

const WEAPONS = [
  { id: 'rail', name: 'Adamant Rail' },   { id: 'bow', name: 'Heart-Seeking Bow' },
  { id: 'shield', name: 'Shield of Chaos' }, { id: 'spear', name: 'Eternal Spear' },
  { id: 'blade', name: 'Stygian Blade' },  { id: 'fists', name: 'Twin Fists' },
];

const alpha = (l) => [...l].sort((a, b) => a.title.localeCompare(b.title));

const CATEGORIES = [
  { id: 'boons',     label: 'Boons',          items: alpha(boons.filter((b) => !b.legendary)), groupBy: 'god' },
  { id: 'duos',      label: 'Duos',           items: alpha(duos),                              groupBy: null },
  { id: 'legendary', label: 'Legendary',      items: alpha(boons.filter((b) => b.legendary)),  groupBy: 'god' },
  { id: 'hammers',   label: 'Hammers',        items: alpha(hammers),                           groupBy: 'weapon' },
  { id: 'aspects',   label: 'Aspects',        items: alpha(aspects),                           groupBy: 'weapon' },
  { id: 'keepsakes', label: 'Keepsakes',      items: alpha([...keepsakes, ...companions]),     groupBy: null },
  { id: 'wares',     label: 'Well of Charon', items: alpha(wares),                             groupBy: null },
  { id: 'curses',    label: 'Curses',         items: alpha(curses),                            groupBy: null },
];

export default function SkillBrowser({ onPick, onInspect, selectedId, onClose }) {
  const [tab, setTab] = useState('boons');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState([]);

  const category = CATEGORIES.find((c) => c.id === tab);
  const filterSet = category.groupBy === 'god' ? GODS
    : category.groupBy === 'weapon' ? WEAPONS : null;

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    return category.items.filter((item) => {
    if (filters.length) {
    const keys = category.groupBy === 'god'
        ? (item.gods ?? (item.god ? [item.god] : []))
        : [item.weaponId ?? item.weapon].filter(Boolean);
    if (!keys.some((k) => filters.includes(k))) return false;
    }
      if (!q) return true;
      return `${item.title} ${item.text ?? ''} ${item.description ?? ''}`
        .toLowerCase().includes(q);
    });
  }, [category, search, filters]);

  /** Split results into labelled groups, or one unlabelled group. */
  const groups = useMemo(() => {
    if (!category.groupBy || search.trim()) return [{ label: null, items: results }];
    const set = category.groupBy === 'god' ? GODS : WEAPONS;
    const key = category.groupBy === 'god'
    ? (i) => i.god
    : (i) => i.weaponId ?? i.weapon; 
    return set
      .map((g) => ({
        label: g.name,
        items: results.filter((i) => key(i) === (g.code ?? g.id)),
      }))
      .filter((g) => g.items.length);
  }, [category, results, search]);

  function switchTab(id) {
    setTab(id);
    setFilters([]);
  }

  const toggle = (v) =>
    setFilters((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));

  return (
    <div className="browser">
      <div className="browser-head">
        <h1 className="browser-title">Skill Selection</h1>
        <button type="button" className="board-button" onClick={onClose}>Go Back</button>
        <input
          className="picker-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Type to search..."
          spellCheck={false}
          autoFocus
        />
        <span className="browser-count">{results.length} of {category.items.length}</span>
      </div>

      <div className="browser-tabs" role="tablist">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={tab === c.id}
            className={`browser-tab ${tab === c.id ? 'on' : ''}`}
            onClick={() => switchTab(c.id)}
          >
            {c.label}
            <span className="tab-count">{c.items.length}</span>
          </button>
        ))}
      </div>

      {filterSet && (
        <div className="browser-filters">
          <span className="filter-label">Filter</span>
          <div className="filter-chips">
            {filterSet.map((f) => {
              const key = f.code ?? f.id;
              return (
                <button
                  key={key}
                  type="button"
                  className={`filter-chip ${filters.includes(key) ? 'on' : ''}`}
                  onClick={() => toggle(key)}
                >
                  {f.name}
                </button>
              );
            })}
          </div>
          {filters.length > 0 && (
            <button type="button" className="filter-clear" onClick={() => setFilters([])}>
              Clear
            </button>
          )}
        </div>
      )}

      <div className="browser-body">
        {results.length === 0 ? (
          <p className="picker-empty">Nothing matches those filters.</p>
        ) : (
          groups.map((g, i) => (
            <section key={g.label ?? i} className="browser-group">
              {g.label && <h2 className="group-heading">{g.label}</h2>}
              <div className="browser-grid">
                {g.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`browse-card ${selectedId === item.id ? 'selected' : ''}`}
                    onClick={() => onPick(item)}
                    onContextMenu={(e) => { e.preventDefault(); onInspect?.(item); }}
                  >
                    <Image src={item.iconsrc} alt="" width={64} height={64} draggable={false} />
                    <span className="browse-card-text">
                      <span className="browse-card-name">{item.title}</span>
                      <span className="browse-card-effect">{effectText(item, {})}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}