import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertTriangle, TrendingUp, Lightbulb, Clock, ArrowUpRight } from 'lucide-react';
import { api, useInsights } from '../hooks/useApi';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

export default function Insights() {
  const { activePlanId } = useStore();
  const { data: insights, loading, refetch } = useInsights(activePlanId);

  const handlePrioritize = async (topicId) => {
    try {
      await api.patch(`/topics/${topicId}/mastery`, {
        mastery: 'weak',
        planId: activePlanId,
      });
      toast.success('Topic upgraded to High Priority! ⚡');
      refetch();
    } catch (err) {
      toast.error('Failed to update priority');
    }
  };

  if (loading) {
    return (
      <div className="pt-24 pb-16 max-w-5xl mx-auto px-4 space-y-4">
        <div className="skeleton h-24 w-full" />
        <div className="skeleton h-64 w-full" />
        <div className="skeleton h-48 w-full" />
      </div>
    );
  }

  const plannedVsActual = insights?.planned_vs_actual || [];
  const flaggedTopics = insights?.flagged_topics || [];

  return (
    <div className="pt-24 pb-24 max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="mb-8">
        <span className="text-xs uppercase tracking-widest text-den-yellow font-bold">
          Optimization & Audit
        </span>
        <h1 className="font-syne font-black text-3xl sm:text-4xl text-den-text mt-1">
          Performance Insights 🔬
        </h1>
        <p className="text-den-muted text-sm mt-1">
          Analyze planned study allocations vs actual behavior to prevent syllabus debt.
        </p>
      </div>

      {/* Flagged Topics Alert Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={18} className="text-den-danger" />
          <h2 className="font-syne font-bold text-lg text-den-text">
            Flagged Topics (Consistently Skipped)
          </h2>
        </div>

        {flaggedTopics.length === 0 ? (
          <div className="bg-den-card border border-den-border rounded-2xl p-5 text-sm text-den-muted flex items-center gap-3">
            <span className="text-den-success font-bold text-base">✓ Clean Record:</span>
            No topics have been repeatedly skipped. Your execution velocity is optimal!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flaggedTopics.map((topic) => (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-den-card border border-den-danger/30 rounded-2xl p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-den-danger/20 text-den-danger text-[11px] font-bold px-2 py-0.5 rounded-full">
                      Skipped {topic.skip_count}×
                    </span>
                    <span className="text-xs text-den-muted">{topic.subject}</span>
                  </div>
                  <h3 className="font-syne font-bold text-den-text text-base">
                    {topic.name}
                  </h3>
                  <p className="text-xs text-den-muted mt-0.5">
                    Needs prompt attention before exam window closes.
                  </p>
                </div>

                <button
                  onClick={() => handlePrioritize(topic.id)}
                  className="btn-primary shrink-0 text-xs py-2 px-3 flex items-center gap-1.5"
                >
                  Prioritize <ArrowUpRight size={13} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Planned vs Actual Chart */}
      <div className="bg-den-card border border-den-border rounded-3xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="font-syne font-bold text-lg text-den-text">
              Planned vs Actual Study Hours
            </h3>
            <p className="text-den-muted text-xs">
              Compare syllabus hourly estimates against your logged revision time
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={plannedVsActual} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="subject"
                stroke="#666666"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="#666666"
                fontSize={12}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#141414',
                  borderColor: '#242424',
                  borderRadius: '12px',
                  color: '#FAFAF7',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="planned_hours" name="Planned Hours" fill="#FFE500" radius={[6, 6, 0, 0]} />
              <Bar dataKey="actual_hours" name="Actual Hours" fill="#FAFAF7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Adaptive Recommendations */}
      <div className="bg-den-card border border-den-border rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={20} className="text-den-yellow" />
          <h3 className="font-syne font-bold text-lg text-den-text">
            Smart Recommendations
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-black/30 border border-den-border rounded-2xl p-4">
            <span className="text-xs text-den-yellow font-bold block mb-1">
              ⚡ High-Yield Adjustment
            </span>
            <p className="text-xs text-den-muted leading-relaxed">
              Ensure you review topics tagged <span className="text-den-text font-semibold">Must-Cover</span> during morning study sessions when cognitive focus is highest.
            </p>
          </div>

          <div className="bg-black/30 border border-den-border rounded-2xl p-4">
            <span className="text-xs text-den-success font-bold block mb-1">
              🎯 Spaced Repetition Window
            </span>
            <p className="text-xs text-den-muted leading-relaxed">
              Re-test yourself on recently completed topics after 48 hours to secure long-term synaptic retention.
            </p>
          </div>

          <div className="bg-black/30 border border-den-border rounded-2xl p-4">
            <span className="text-xs text-purple-400 font-bold block mb-1">
              🤖 AI Tutor Practice
            </span>
            <p className="text-xs text-den-muted leading-relaxed">
              Ask the AI Tutor for worked examples of tricky conceptual questions before starting practice sets.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
