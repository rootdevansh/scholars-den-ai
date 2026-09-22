import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isToday, isPast } from 'date-fns';
import { RefreshCw, Filter, Calendar as CalIcon, ChevronDown, ChevronUp, Sparkles, CheckCircle2 } from 'lucide-react';
import { api, usePlan } from '../hooks/useApi';
import useStore from '../store/useStore';
import WhyThisSchedule from '../components/WhyThisSchedule';
import TopicCard from '../components/TopicCard';
import TutorChat from '../components/TutorChat';
import toast from 'react-hot-toast';

export default function PlanView() {
  const { activePlanId, setActiveTopic, setTutorOpen, tutorOpen, activeTopic } = useStore();
  const { data: planData, loading, error, refetch } = usePlan(activePlanId);

  const [replanning, setReplanning] = useState(false);
  const [filter, setFilter] = useState('all'); // all, must-cover, bare-minimum, pending, completed
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [expandedDays, setExpandedDays] = useState({});

  const plan = planData?.plan;
  const scheduleDays = planData?.scheduleDays || [];
  const topics = planData?.topics || [];

  // Toggle day expansion
  const toggleDay = (dayId) => {
    setExpandedDays((prev) => ({
      ...prev,
      [dayId]: prev[dayId] === undefined ? false : !prev[dayId],
    }));
  };

  // Replan action
  const handleReplan = async () => {
    if (!activePlanId) return;
    setReplanning(true);
    try {
      await api.post(`/plans/${activePlanId}/replan`);
      toast.success('Schedule adapted & redistributed! ⚡');
      await refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Replan failed');
    } finally {
      setReplanning(false);
    }
  };

  // Topic status updates
  const handleMarkComplete = async (topicId, dayTopicId) => {
    try {
      await api.patch(`/topics/${topicId}/status`, {
        status: 'completed',
        dayTopicId,
        planId: activePlanId,
      });
      toast.success('Topic completed! Great job! 🎉');
      refetch();
    } catch (err) {
      toast.error('Failed to update topic');
    }
  };

  const handleMarkSkipped = async (topicId, dayTopicId) => {
    try {
      await api.patch(`/topics/${topicId}/status`, {
        status: 'skipped',
        dayTopicId,
        planId: activePlanId,
      });
      toast.success('Topic skipped — schedule re-allocated! 🔄');
      refetch();
    } catch (err) {
      toast.error('Failed to skip topic');
    }
  };

  const handleAskTutor = (topic) => {
    setActiveTopic(topic);
    setTutorOpen(true);
  };

  // Filter topics
  const filterTopic = (topic) => {
    if (selectedSubject !== 'all' && topic.subject !== selectedSubject) return false;
    if (filter === 'must-cover' && topic.priority_tag !== 'must-cover') return false;
    if (filter === 'bare-minimum' && topic.priority_tag !== 'bare-minimum') return false;
    if (filter === 'pending' && topic.status === 'completed') return false;
    if (filter === 'completed' && topic.status !== 'completed') return false;
    return true;
  };

  // Unique subjects for filter
  const subjects = useMemo(() => {
    const set = new Set(topics.map((t) => t.subject));
    return Array.from(set);
  }, [topics]);

  if (loading) {
    return (
      <div className="pt-24 pb-16 max-w-5xl mx-auto px-4 space-y-4">
        <div className="skeleton h-40 w-full" />
        <div className="skeleton h-16 w-full" />
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="pt-32 pb-16 text-center max-w-md mx-auto px-4">
        <p className="text-den-danger text-lg font-bold mb-2">Plan Not Found</p>
        <p className="text-den-muted text-sm mb-6">
          {error || 'No active plan loaded. Please load a demo or create a plan first.'}
        </p>
        <a href="/" className="btn-primary inline-flex">Go to Setup</a>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-24 max-w-6xl mx-auto px-4">
      {/* Top Banner / Why this schedule */}
      <WhyThisSchedule plan={plan} topics={topics} />

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6 bg-den-card border border-den-border rounded-2xl p-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-den-muted mr-1 font-semibold uppercase tracking-wider">
            <Filter size={13} /> Filter:
          </div>
          {['all', 'must-cover', 'bare-minimum', 'pending', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors
                ${filter === f
                  ? 'bg-den-yellow text-black'
                  : 'bg-black/40 text-den-muted border border-den-border hover:text-den-text'
                }`}
            >
              {f.replace('-', ' ')}
            </button>
          ))}

          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-black/40 text-den-text text-xs border border-den-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-den-yellow/50 ml-1"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Action Button: Adaptive Re-Plan */}
        <button
          onClick={handleReplan}
          disabled={replanning}
          className="btn-primary flex items-center justify-center gap-2 text-xs py-2.5 px-4 shrink-0 shadow-lg shadow-den-yellow/10"
        >
          <RefreshCw size={14} className={replanning ? 'animate-spin' : ''} />
          {replanning ? 'Re-optimizing...' : 'Adapt & Re-Plan ⚡'}
        </button>
      </div>

      {/* Week Strip / Day Horizon Quick View */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-thin">
        {scheduleDays.slice(0, 14).map((day) => {
          const parsed = parseISO(day.day_date);
          const isCurr = isToday(parsed);
          const isDone = day.status === 'completed';

          return (
            <div
              key={day.id}
              className={`shrink-0 flex flex-col items-center justify-center w-20 py-3 px-2 rounded-xl border transition-all
                ${isCurr
                  ? 'bg-den-yellow text-black border-den-yellow font-bold shadow-md shadow-den-yellow/20'
                  : 'bg-den-card border-den-border text-den-muted hover:border-white/20'
                }`}
            >
              <span className="text-[10px] uppercase tracking-wider font-semibold">
                {format(parsed, 'EEE')}
              </span>
              <span className={`text-base font-syne font-bold ${isCurr ? 'text-black' : 'text-den-text'}`}>
                {format(parsed, 'd')}
              </span>
              <span className="text-[9px] mt-1 opacity-80">
                Day {day.day_number}
              </span>
            </div>
          );
        })}
      </div>

      {/* Schedule Days List */}
      <div className="space-y-4">
        {scheduleDays.map((day) => {
          const dayDate = parseISO(day.day_date);
          const isCurrentDay = isToday(dayDate);
          const isExpanded = expandedDays[day.id] !== false; // default expanded

          // Extract topics belonging to this day
          const dayTopicsList = (day.day_topics || [])
            .map((dt) => ({ ...dt.topics, dayTopicId: dt.id, allocated_hours: dt.allocated_hours }))
            .filter((t) => t && filterTopic(t));

          // Sort must-cover first
          dayTopicsList.sort((a, b) => {
            if (a.priority_tag === 'must-cover' && b.priority_tag !== 'must-cover') return -1;
            if (a.priority_tag !== 'must-cover' && b.priority_tag === 'must-cover') return 1;
            return 0;
          });

          if (dayTopicsList.length === 0 && filter !== 'all') return null;

          return (
            <div
              key={day.id}
              className={`bg-den-card/70 border rounded-2xl overflow-hidden transition-all
                ${isCurrentDay ? 'border-den-yellow/50 yellow-glow-sm' : 'border-den-border'}
              `}
            >
              {/* Day Header Accordion */}
              <div
                onClick={() => toggleDay(day.id)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] select-none"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-syne font-bold text-sm
                      ${isCurrentDay ? 'bg-den-yellow text-black' : 'bg-white/5 text-den-muted'}
                    `}
                  >
                    D{day.day_number}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-syne font-bold text-den-text text-base">
                        {format(dayDate, 'EEEE, MMM d')}
                      </h3>
                      {isCurrentDay && (
                        <span className="bg-den-yellow text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                          TODAY
                        </span>
                      )}
                    </div>
                    <p className="text-den-muted text-xs">
                      {dayTopicsList.length} topic{dayTopicsList.length === 1 ? '' : 's'} scheduled
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronUp size={18} className="text-den-muted" /> : <ChevronDown size={18} className="text-den-muted" />}
                </div>
              </div>

              {/* Day Topics */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4 space-y-3"
                  >
                    {dayTopicsList.length === 0 ? (
                      <p className="text-den-muted text-xs py-3 text-center italic">
                        No topics match active filter for this day.
                      </p>
                    ) : (
                      dayTopicsList.map((t) => (
                        <TopicCard
                          key={t.dayTopicId || t.id}
                          topic={t}
                          dayTopicId={t.dayTopicId}
                          onMarkComplete={handleMarkComplete}
                          onMarkSkipped={handleMarkSkipped}
                          onAskTutor={handleAskTutor}
                        />
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
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
