'use client';

import SkillCard from './SkillCard';
import { useDrag } from '@/lib/useDrag';

export default function Section({
  section, items, onRename, onAdd, onRemove, onCycle, onDelete, onMove, active, onFocus,
}) {
  const onPointerDown = useDrag(section.position, onMove);

  return (
    <section
      className={`board-section ${active ? 'active' : ''}`}
      style={{ left: section.position.x, top: section.position.y }}
      onPointerDown={onFocus}
    >
      <div className="section-head" onPointerDown={onPointerDown}>
        <span className="drag-handle" aria-hidden="true">⠿</span>
        <input
          className="section-title"
          value={section.title}
          onChange={(e) => onRename(e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Section title"
          spellCheck={false}
        />
        <button
          type="button"
          className="section-delete"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onDelete}
          aria-label={`Delete section ${section.title}`}
        >
          ×
        </button>
      </div>

      <div className="section-grid">
        {items.map((entry) => (
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