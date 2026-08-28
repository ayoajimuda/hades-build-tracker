'use client';

import SkillCard from './SkillCard';

export default function Section({
  section, items, onRename, onAdd, onRemove, onCycle, onInfo,
  onDelete, onHeadPointerDown, onCardPointerDown, active, onFocus, dragOver,
}) {
  return (
    <section
      data-section-id={section.id}
      className={`board-section ${active ? 'active' : ''} ${dragOver ? 'drop-target' : ''}`}
      style={{ left: section.position.x, top: section.position.y }}
      onPointerDown={onFocus}
    >
      <div
        className="section-head"
        onPointerDown={(e) => {
          if (e.target.closest('button, input')) return;
          onHeadPointerDown(e);
        }}
      >
        <span className="drag-handle" aria-hidden="true">⠿</span>
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
          X
        </button>
      </div>

      <div className="section-grid">
        {items.map((entry) => (
          <div
            key={entry.uid}
            onPointerDown={(e) => {
              if (e.target.closest('button')) return;
              onCardPointerDown(e, entry);
            }}
          >
            <SkillCard
              skill={entry.item}
              level={entry.level}
              onCycle={() => onCycle(entry.uid)}
              onDelete={() => onRemove(entry.uid)}
              onInfo={() => onInfo?.(entry)}
            />
          </div>
        ))}

        <button type="button" className="section-add" onClick={onAdd}>
          <span aria-hidden="true">+</span>
          <span>Add skills</span>
        </button>
      </div>
    </section>
  );
}