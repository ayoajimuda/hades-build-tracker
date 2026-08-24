'use client';

import Image from 'next/image';
import { effectIndex, isRankBased, maxLevel } from '@/lib/skills';

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
  const rarityClass = level?.rarity ?? (level?.rank ? `rank${level.rank}` : '');
  const effect = skill.effect?.[effectIndex(skill, level ?? {})];

  return (
    <div
      className={`skill ${mini ? 'mini' : ''} ${rarityClass} ${dragging ? 'dragging' : ''}`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onClick={onCycle}
      onContextMenu={(e) => {
        e.preventDefault();
        onInfo?.(skill);
      }}
    >
      <Image className="icon" src={skill.iconsrc} alt="" width={96} height={96} draggable={false} />

      <div className="skill-body">
        <p className="skill-title">{skill.title}</p>
        <p className="skill-text">{skill.text}</p>
        {effect && <p className="skill-effect">▸ {effect}</p>}
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

      {level?.rank != null && (
        <p className="skill-rank">{level.rank} / {maxLevel(skill)}</p>
      )}
      {skill.price != null && <p className="skill-price">{skill.price}</p>}

      {onDelete && (
        <button
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