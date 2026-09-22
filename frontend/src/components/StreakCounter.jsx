import React from 'react';
import { motion } from 'framer-motion';

export default function StreakCounter({ streak = 0 }) {
  const color =
    streak >= 7 ? '#FB923C' :
    streak >= 3 ? '#FFE500' :
    '#666666';

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="flex items-center gap-2"
    >
      <motion.span
        animate={streak >= 3 ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
        className="text-3xl leading-none"
      >
        🔥
      </motion.span>
      <div>
        <p className="font-syne font-black text-2xl leading-none" style={{ color }}>
          {streak}
        </p>
        <p className="text-den-muted text-xs font-medium">day streak</p>
      </div>
    </motion.div>
  );
}
