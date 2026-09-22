import React from 'react';
import { Star, Minus } from 'lucide-react';

export default function PriorityBadge({ type, size = 'md' }) {
  const isMust = type === 'must-cover';
  const small = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wider
        ${small ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}
        ${isMust
          ? 'bg-den-yellow text-black'
          : 'bg-den-border text-den-muted border border-white/5'
        }`}
    >
      {isMust ? <Star size={small ? 9 : 11} fill="black" /> : <Minus size={small ? 9 : 11} />}
      {isMust ? 'Must-Cover' : 'Bare-Min'}
    </span>
  );
}
