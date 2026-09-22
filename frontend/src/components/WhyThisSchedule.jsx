import React from 'react';
import { motion } from 'framer-motion';
import { differenceInDays, parseISO } from 'date-fns';
import { Calendar, Clock, Target, Lock, Info } from 'lucide-react';

export default function WhyThisSchedule({ plan, topics }) {
  if (!plan || !topics) return null;

  const daysLeft = differenceInDays(parseISO(plan.exam_date), new Date());
  const dailyHours = parseFloat(plan.daily_hours);
  const totalHours = daysLeft * dailyHours;

  const weakTopics     = topics.filter((t) => t.mastery === 'weak').length;
  const mustCover      = topics.filter((t) => t.priority_tag === 'must-cover').length;
  const totalTopics    = topics.length;

  const constraints = [
    { icon: Calendar, label: `${daysLeft} days to exam`, color: '#FFE500' },
    { icon: Clock,    label: `${dailyHours}h/day available`, color: '#818CF8' },
    { icon: Target,   label: `${weakTopics} weak topics front-loaded`, color: '#FF4757' },
    { icon: Lock,     label: `${mustCover}/${totalTopics} must-cover locked first`, color: '#2ED573' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-den-card border border-den-yellow/20 rounded-2xl p-5 mb-6 overflow-hidden"
    >
      {/* Yellow left accent */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-den-yellow rounded-l-2xl" />

      <div className="pl-2">
        <div className="flex items-center gap-2 mb-4">
          <Info size={16} className="text-den-yellow" />
          <h3 className="font-syne font-bold text-den-text">Why this schedule?</h3>
        </div>

        {/* Days remaining — big number */}
        <div className="flex items-end gap-3 mb-5">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-syne font-black text-5xl text-den-yellow leading-none"
          >
            {daysLeft}
          </motion.span>
          <div className="pb-1">
            <p className="text-den-text font-semibold">days remaining</p>
            <p className="text-den-muted text-xs">{totalHours.toFixed(0)} total study hours available</p>
          </div>
        </div>

        {/* Constraint pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {constraints.map(({ icon: Icon, label, color }) => (
            <div
              key={label}
              className="flex items-center gap-2 bg-black/30 rounded-xl px-3 py-2"
            >
              <Icon size={14} style={{ color }} className="shrink-0" />
              <span className="text-xs text-den-muted font-medium leading-tight">{label}</span>
            </div>
          ))}
        </div>

        <p className="text-den-muted text-xs mt-3 leading-relaxed">
          Topics are ordered by{' '}
          <span className="text-den-yellow font-semibold">weightage × difficulty</span> — highest priority topics are scheduled first so you never run out of time for what matters most.
        </p>
      </div>
    </motion.div>
  );
}
