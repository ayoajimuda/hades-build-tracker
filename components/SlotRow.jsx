'use client';

import Image from 'next/image';
import SkillCard from './SkillCard';

export default function SlotRow({ slot, skill, level, onPick, onCycle, onClear }) {
  return (
    <div className="slot-row">
      <button
        className="slot-icon"
        onClick={onPick}
        aria-label={skill ? `Change ${slot.label} boon` : `Choose a ${slot.label} boon`}
      >
        <Image src={slot.image} alt="" width={110} height={110} draggable={false} />
        <span className="slot-label">{slot.label}</span>
      </button>

      <div className="slot-content">
        {skill ? (
          <SkillCard
            skill={skill}
            level={level}
            onCycle={onCycle}
            onDelete={onClear}
          />
        ) : (
          <button className="slot-empty" onClick={onPick}>
            <span aria-hidden="true">+</span>
            <span>Add a {slot.label.toLowerCase()} boon</span>
          </button>
        )}
      </div>
    </div>
  );
}