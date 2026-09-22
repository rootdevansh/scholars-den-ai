import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Play, Pause, RotateCcw, Bot, CheckCircle2, AlertCircle, Flame, Sparkles } from 'lucide-react';
import { api, useToday, useReminders } from '../hooks/useApi';
import useStore from '../store/useStore';
import TopicCard from '../components/TopicCard';
import TutorChat from '../components/TutorChat';
import toast from 'react-hot-toast';

export default function DailyStudy() {
  const { activePlanId, setActiveTopic, setTutorOpen, tutorOpen, activeTopic } = useStore();
  const { data: dayData, loading, error, refetch } = useToday(activePlanId);
  const { data: reminders = [] } = useReminders(activePlanId);

  // Timer state (in seconds)
  const [timerSeconds, setTimerSeconds] = useState(25 * 60); // 25m Pomodoro
  const [isRunning, setIsRunning] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' :
    hour < 18 ? 'Good afternoon' : 'Good evening';

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (isRunning && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds((prev) => prev - 1), 1000);
    } else if (timerSeconds === 0 && isRunning) {
      setIsRunning(false);
      toast.success('Study block complete! Take a breather 🧘');
    }
    return () => clearInterval(interval);
  }, [isRunning, timerSeconds]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleMarkComplete = async (topicId, dayTopicId) => {
    try {
      await api.patch(`/topics/${topicId}/status`, {
        status: 'completed',
        dayTopicId,
        planId: activePlanId,
      });
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
      toast.success('Topic completed! Streak active 🔥');
      refetch();
    } catch (err) {
      toast.error('Failed to complete topic');
    }
  };

  const handleMarkSkipped = async (topicId, dayTopicId) => {
    try {
      await api.patch(`/topics/${topicId}/status`, {
        status: 'skipped',
        dayTopicId,
        planId: activePlanId,
      });
      toast.success('Topic skipped — replanned in background 🔄');
      refetch();
    } catch (err) {
      toast.error('Failed to skip topic');
    }
  };

  const handleAskTutor = (topic) => {
    setActiveTopic(topic);
    setTutorOpen(true);
  };

  // Topics for today
  const dayTopics = (dayData?.day_topics || []).map((dt) => ({
    ...dt.topics,
    dayTopicId: dt.id,
    allocated_hours: dt.allocated_hours,
  }));

  const completedCount = dayTopics.filter((t) => t.status === 'completed').length;
  const totalCount = dayTopics.length;
  const allCompleted = totalCount > 0 && completedCount === totalCount;

  if (loading) {
    return (
      <div className="pt-24 pb-16 max-w-4xl mx-auto px-4 space-y-4">
        <div className="skeleton h-24 w-full" />
        <div className="skeleton h-48 w-full" />
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="pt-24 pb-24 max-w-4xl mx-auto px-4 relative">
      {/* Confetti Animation Overlay */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
          <div className="text-6xl animate-bounce">🎉✨⚡</div>
        </div>
      )}

      {/* Header Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-den-yellow font-bold text-xs uppercase tracking-widest">
            {format(new Date(), 'EEEE, MMMM d')}
          </span>
          <h1 className="font-syne font-black text-3xl sm:text-4xl text-den-text mt-1">
            {greeting}, let's lock in! ⚡
          </h1>
        </div>

        {/* Today's Mini Progress */}
        {totalCount > 0 && (
          <div className="bg-den-card border border-den-border px-4 py-3 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-den-yellow/10 flex items-center justify-center text-den-yellow font-bold font-syne text-sm">
              {completedCount}/{totalCount}
            </div>
            <div>
              <p className="text-xs font-semibold text-den-text">Daily Target</p>
              <p className="text-[11px] text-den-muted">
                {allCompleted ? 'All completed! 🏆' : `${totalCount - completedCount} topics left`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Smart Reminders Alert Banner */}
      {reminders.length > 0 && (
        <div className="space-y-2 mb-6">
          {reminders.slice(0, 2).map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs leading-relaxed
                ${r.urgency === 'high'
                  ? 'bg-den-danger/10 border-den-danger/30 text-den-text'
                  : 'bg-den-yellow/10 border-den-yellow/30 text-den-text'
                }
              `}
            >
              <AlertCircle
                size={16}
                className={`shrink-0 mt-0.5 ${r.urgency === 'high' ? 'text-den-danger' : 'text-den-yellow'}`}
              />
              <span className="flex-1 font-medium">{r.message}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Focus Timer Card */}
      <div className="bg-den-card border border-den-border rounded-3xl p-6 mb-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-den-yellow/50 to-transparent" />
        <span className="text-[11px] font-semibold text-den-muted uppercase tracking-wider">
          Focused Study Timer (Pomodoro)
        </span>
        <div className="font-syne font-black text-6xl text-den-yellow my-3 tracking-tight">
          {formatTimer(timerSeconds)}
        </div>
        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="btn-primary flex items-center gap-2 py-2 px-6 text-sm"
          >
            {isRunning ? <Pause size={16} /> : <Play size={16} />}
            {isRunning ? 'Pause' : 'Start Focus'}
          </button>
          <button
            onClick={() => {
              setIsRunning(false);
              setTimerSeconds(25 * 60);
            }}
            className="btn-secondary py-2 px-4 text-xs flex items-center gap-1.5"
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      {/* Today's Topic Queue */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-syne font-bold text-xl text-den-text">Today's Curriculum</h2>
          <span className="text-xs text-den-muted">Allocated for today</span>
        </div>

        {dayTopics.length === 0 ? (
          <div className="bg-den-card border border-den-border rounded-2xl p-8 text-center">
            <Sparkles size={32} className="text-den-yellow mx-auto mb-3" />
            <p className="font-syne font-bold text-lg text-den-text">No topics scheduled for today!</p>
            <p className="text-den-muted text-xs mt-1 mb-4">
              You can rest or check upcoming topics in your Master Plan.
            </p>
            <a href="/plan" className="btn-secondary inline-flex text-xs py-2 px-4">
              View Entire Plan
            </a>
          </div>
        ) : allCompleted ? (
          <div className="bg-den-card border border-den-success/30 rounded-2xl p-8 text-center yellow-glow-sm">
            <span className="text-4xl">🎉</span>
            <h3 className="font-syne font-bold text-xl text-den-text mt-2">Today's Goal Achieved!</h3>
            <p className="text-den-muted text-xs mt-1 mb-4">
              You finished all topics planned for today. High five! 🙌
            </p>
            <a href="/dashboard" className="btn-primary inline-flex text-xs py-2 px-5">
              Check Your Stats & Streak →
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {dayTopics.map((topic) => (
              <TopicCard
                key={topic.dayTopicId || topic.id}
                topic={topic}
                dayTopicId={topic.dayTopicId}
                onMarkComplete={handleMarkComplete}
                onMarkSkipped={handleMarkSkipped}
                onAskTutor={handleAskTutor}
              />
            ))}
          </div>
        )}
      </div>

      {/* Slide-out Tutor Chat */}
      <AnimatePresence>
        {tutorOpen && activeTopic && (
          <TutorChat
            topicId={activeTopic.id}
            topicName={activeTopic.name}
            subject={activeTopic.subject}
            planId={activePlanId}
            onClose={() => setTutorOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
