'use client';

import SkillCard from './SkillCard';

export default function Section({
  section, items, onRename, onAdd, onRemove, onCycle, onDelete, active, onFocus,
}) {
  return (
    <section
      className={`board-section ${active ? 'active' : ''}`}
      onFocus={onFocus}
      onClick={onFocus}
    >
      <div className="section-head">
        <input
          className="section-title"
          value={section.title}
          onChange={(e) => onRename(e.target.value)}
          aria-label="Section title"
          spellCheck={false}
        />
        <button
          type="button"
          className="section-delete"
          onClick={onDelete}
          aria-label={`Delete section ${section.title}`}
        >
          ×
        </button>
      </div>

      <div className="section-grid">
        {items.map((entry, i) => (
          <SkillCard
            key={entry.uid}
            skill={entry.item}
            level={entry.level}
            onCycle={() => onCycle(entry.uid)}
            onDelete={() => onRemove(entry.uid)}
          />
        ))}

        <button type="button" className="section-add" onClick={onAdd}>
          <span aria-hidden="true">+</span>
          <span>Add skills</span>
        </button>
      </div>
    </section>
  );
}