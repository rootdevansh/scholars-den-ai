import React from 'react';
import { motion } from 'framer-motion';
import { Check, SkipForward, Bot, Clock, AlertTriangle } from 'lucide-react';
import PriorityBadge from './PriorityBadge';

// Subject accent colors
const SUBJECT_COLORS = {
  Physics:     '#818CF8',
  Chemistry:   '#34D399',
  Mathematics: '#FB923C',
  Biology:     '#F472B6',
};

function getSubjectColor(subject) {
  return SUBJECT_COLORS[subject] || '#9CA3AF';
}

export default function TopicCard({ topic, dayTopicId, onMarkComplete, onMarkSkipped, onAskTutor }) {
  const isCompleted = topic.status === 'completed';
  const isSkipped   = topic.status === 'skipped';
  const color       = getSubjectColor(topic.subject);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className={`relative bg-den-card border rounded-2xl p-4 card-hover transition-all
        ${isCompleted ? 'border-den-success/30 opacity-70' : ''}
        ${isSkipped   ? 'border-den-danger/20 opacity-60' : ''}
        ${!isCompleted && !isSkipped ? 'border-den-border' : ''}
      `}
    >
      {/* Subject color bar */}
      <div
        className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full"
        style={{ backgroundColor: color }}
      />

      <div className="pl-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: color + '22', color }}
              >
                {topic.subject}
              </span>
              <PriorityBadge type={topic.priority_tag} size="sm" />
              {topic.skip_count >= 2 && (
                <span className="flex items-center gap-1 text-xs text-den-danger">
                  <AlertTriangle size={10} /> Skipped {topic.skip_count}×
                </span>
              )}
            </div>
            <h3 className={`font-syne font-bold text-den-text ${isCompleted ? 'line-through text-den-muted' : ''}`}>
              {topic.name}
            </h3>
          </div>

          {/* Completion indicator */}
          {isCompleted && (
            <div className="shrink-0 w-7 h-7 rounded-full bg-den-success/20 flex items-center justify-center">
              <Check size={14} className="text-den-success" />
            </div>
          )}
          {isSkipped && (
            <div className="shrink-0 w-7 h-7 rounded-full bg-den-danger/20 flex items-center justify-center">
              <SkipForward size={14} className="text-den-danger" />
            </div>
          )}
        </div>

        {/* Hours */}
        <div className="flex items-center gap-1 text-den-muted text-xs mb-3">
          <Clock size={11} />
          <span>{topic.estimated_hours}h estimated</span>
          {topic.actual_hours > 0 && (
            <span className="text-den-success ml-1">· {topic.actual_hours}h logged</span>
          )}
        </div>

        {/* Action buttons — hide if completed/skipped */}
        {!isCompleted && !isSkipped && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onMarkComplete?.(topic.id, dayTopicId)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-den-success/10 text-den-success
                         text-xs font-semibold hover:bg-den-success/20 transition-colors"
            >
              <Check size={13} /> Done
            </button>
            <button
              onClick={() => onMarkSkipped?.(topic.id, dayTopicId)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-den-border text-den-muted
                         text-xs font-semibold hover:text-den-danger hover:border-den-danger/30 border border-transparent transition-colors"
            >
              <SkipForward size={13} /> Skip
            </button>
            <button
              onClick={() => onAskTutor?.(topic)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-den-yellow/10 text-den-yellow
                         text-xs font-semibold hover:bg-den-yellow/20 transition-colors ml-auto"
            >
              <Bot size={13} /> Ask AI
            </button>
          </div>
        )}

        {isCompleted && (
          <p className="text-xs text-den-success font-medium">✓ Completed</p>
        )}
        {isSkipped && (
          <p className="text-xs text-den-danger font-medium">↷ Skipped — rescheduled</p>
        )}
      </div>
    </motion.div>
  );
}
