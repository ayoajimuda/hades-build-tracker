'use client';

import Image from 'next/image';
import { effectText, maxLevel } from '@/lib/skills';

export default function SkillCard({
  skill,
  level,
  onCycle,
  onInfo,
  onDelete,
  mini = false,
}) {
  if (!skill) return null;

  const rarity = level?.rarity;
  const rank = level?.rank;
  const levelClass = rarity ?? (rank ? `rank${rank}` : '');
  const levels = maxLevel(skill);
  const canCycle = levels > 1;

  return (
    <div
      className={`skill ${mini ? 'mini' : ''} ${levelClass}`}
      onClick={canCycle ? onCycle : undefined}
      style={canCycle ? undefined : { cursor: 'default' }}
      onContextMenu={(e) => {
        e.preventDefault();
        onInfo?.(skill);
      }}
      title={canCycle ? 'Click to change rarity · right-click for details' : 'Right-click for details'}
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

      {rank != null && <p className="skill-rank">{rank} / {levels}</p>}

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