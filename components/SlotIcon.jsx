'use client';

import Image from 'next/image';
import { effectText } from '@/lib/skills';

export default function SlotIcon({ slot, boon, level, onPick, onCycle, onClear }) {
  const filled = Boolean(boon);

  return (
    <div className={`slot ${filled ? 'filled' : ''} ${level?.rarity ?? ''}`}>
      <button
        className="slot-diamond"
        onClick={filled ? onCycle : onPick}
        onContextMenu={(e) => { e.preventDefault(); onPick(); }}
        aria-label={
          filled
            ? `${slot.label}: ${boon.title}, ${level.rarity}. Click to change rarity, right-click to swap.`
            : `Choose a ${slot.label} boon`
        }
        title={filled ? boon.title : slot.label}
      >
        <span className="slot-plate" aria-hidden="true" />
        <Image
          src={filled ? boon.iconsrc : slot.image}
          alt=""
          width={86}
          height={86}
          draggable={false}
        />
      </button>

      <div className="slot-text">
        {filled ? (
          <>
            <p className="slot-name">{boon.title}</p>
            <p className="slot-effect">{effectText(boon, level)}</p>
            <button className="slot-clear" onClick={onClear} aria-label={`Remove ${boon.title}`}>
              ×
            </button>
          </>
        ) : (
          <p className="slot-placeholder">{slot.label}</p>
        )}
      </div>
    </div>
  );
}