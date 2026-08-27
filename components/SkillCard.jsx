'use client';

import Image from 'next/image';
import { effectText, raritiesOf } from '@/lib/skills';

export default function SkillCard({
  skill,
  level,
  onCycle,
  onInfo,
  onDelete,
  draggable = false,
  onDragStart,
  onDragEnter,
  onDragEnd,
  dragging = false,
  mini = false,
}) {
  if (!skill) return null;

  const rarity = level?.rarity;
  const rank = level?.rank;
  const levelClass = rarity ?? (rank ? `rank${rank}` : '');
  const canCycle = raritiesOf(skill).length > 1;

  return (
    <div
      className={`skill ${mini ? 'mini' : ''} ${levelClass} ${dragging ? 'dragging' : ''}`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onClick={canCycle ? onCycle : undefined}
      onContextMenu={(e) => {
        e.preventDefault();
        onInfo?.(skill);
      }}
    >
      <Image
        className="icon"
        src={skill.iconsrc}
        alt=""
        width={96}
        height={96}
        draggable={false}
      />

      <div className="skill-body">
        <p className="skill-title">{skill.title}</p>
        <p className="skill-effect">{effectText(skill, level ?? {})}</p>
      </div>

      {skill.tags?.slice(0, 2).map((tag, i) => (
        <Image
          key={tag}
          className={`tag ${i === 1 ? 'left-tag' : ''}`}
          src={`/img/Tags/${tag}.webp`}
          alt=""
          width={32}
          height={32}
          draggable={false}
        />
      ))}

      {rank != null && (
        <p className="skill-rank">{rank} / {raritiesOf(skill).length}</p>
      )}

      {onDelete && (
        <button
          type="button"
          className="skill-deleter"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          aria-label={`Remove ${skill.title}`}
        >
          ×
        </button>
      )}
    </div>
  );
}