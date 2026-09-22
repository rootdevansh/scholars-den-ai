import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Target, CheckCircle, Clock, Zap, BookOpen } from 'lucide-react';
import { useInsights, usePlan } from '../hooks/useApi';
import useStore from '../store/useStore';
import StreakCounter from '../components/StreakCounter';

const DONUT_COLORS = [
  '#FFE500', // Must-cover completed (bright yellow)
  '#716300', // Must-cover pending (dark yellow/gold)
  '#2ED573', // Bare-min completed (success green)
  '#242424', // Bare-min pending (dark gray)
];

const SUBJECT_COLORS = {
  Physics:     '#818CF8',
  Chemistry:   '#34D399',
  Mathematics: '#FB923C',
  Biology:     '#F472B6',
};

export default function Dashboard() {
  const { activePlanId } = useStore();
  const { data: insights, loading: inLoading } = useInsights(activePlanId);
  const { data: planData, loading: plLoading } = usePlan(activePlanId);

  const loading = inLoading || plLoading;

  if (loading) {
    return (
      <div className="pt-24 pb-16 max-w-5xl mx-auto px-4 space-y-4">
        <div className="skeleton h-28 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="skeleton h-64 w-full" />
          <div className="skeleton h-64 w-full" />
        </div>
      </div>
    );
  }

  const pSum = insights?.priority_summary || {
    must_cover: { total: 0, completed: 0, pending: 0 },
    bare_minimum: { total: 0, completed: 0, pending: 0 },
  };

  const donutData = [
    { name: 'Must-Cover (Done)', value: pSum.must_cover.completed },
    { name: 'Must-Cover (Pending)', value: pSum.must_cover.pending },
    { name: 'Bare-Min (Done)', value: pSum.bare_minimum.completed },
    { name: 'Bare-Min (Pending)', value: pSum.bare_minimum.pending },
  ].filter((d) => d.value > 0);

  const totalTopics = insights?.totals?.total || 0;
  const completedTopics = insights?.totals?.completed || 0;
  const completionRate = insights?.completion_rate || 0;
  const streak = insights?.streak || 0;
  const mustCoverTotal = pSum.must_cover.total || 1;
  const mustCoverRate = Math.round((pSum.must_cover.completed / mustCoverTotal) * 100);

  return (
    <div className="pt-24 pb-24 max-w-6xl mx-auto px-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs uppercase tracking-widest text-den-yellow font-bold">
            Analytics & Progress
          </span>
          <h1 className="font-syne font-black text-3xl sm:text-4xl text-den-text mt-1">
            Progress Command 📊
          </h1>
        </div>

        {/* Streak Counter */}
        <div className="bg-den-card border border-den-border px-5 py-2.5 rounded-2xl">
          <StreakCounter streak={streak} />
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Overall Completion', val: `${completionRate}%`, icon: Zap, color: '#FFE500' },
          { label: 'Topics Done', val: `${completedTopics}/${totalTopics}`, icon: CheckCircle, color: '#2ED573' },
          { label: 'Must-Cover Mastery', val: `${mustCoverRate}%`, icon: Target, color: '#FFE500' },
          { label: 'Daily Streak', val: `${streak} Days`, icon: Clock, color: '#FB923C' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-den-card border border-den-border rounded-2xl p-4 card-hover"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-den-muted font-medium">{item.label}</span>
              <item.icon size={16} style={{ color: item.color }} />
            </div>
            <div className="font-syne font-black text-2xl sm:text-3xl text-den-text">
              {item.val}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Donut Chart: Coverage Breakdown */}
        <div className="bg-den-card border border-den-border rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-syne font-bold text-lg text-den-text mb-1">
              Coverage & Weight Breakdown
            </h3>
            <p className="text-den-muted text-xs">
              Must-Cover vs Bare-Minimum completion distribution
            </p>
          </div>

          <div className="h-64 my-2 relative flex items-center justify-center">
            {donutData.length === 0 ? (
              <p className="text-den-muted text-xs italic">No topic data available</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#141414',
                      borderColor: '#242424',
                      borderRadius: '12px',
                      color: '#FAFAF7',
                      fontSize: '12px',
                      fontFamily: 'Space Grotesk',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}

            {/* Inner Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-syne font-bold text-2xl text-den-yellow">
                {completionRate}%
              </span>
              <span className="text-[10px] text-den-muted uppercase font-bold tracking-wider">
                Covered
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-den-border/60 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FFE500]" />
              <span className="text-den-muted">Must-Cover (Done)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#716300]" />
              <span className="text-den-muted">Must-Cover (Pending)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#2ED573]" />
              <span className="text-den-muted">Bare-Min (Done)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#242424] border border-white/20" />
              <span className="text-den-muted">Bare-Min (Pending)</span>
            </div>
          </div>
        </div>

        {/* Subject-Wise Progress */}
        <div className="bg-den-card border border-den-border rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-syne font-bold text-lg text-den-text mb-1">
              Subject Mastery Breakdown
            </h3>
            <p className="text-den-muted text-xs">
              Topic completion rate per academic subject
            </p>
          </div>

          <div className="space-y-4 my-auto py-4">
            {(insights?.subject_breakdown || []).map((sb) => {
              const total = sb.completed + sb.pending + sb.skipped || 1;
              const pct = Math.round((sb.completed / total) * 100);
              const color = SUBJECT_COLORS[sb.subject] || '#FFE500';

              return (
                <div key={sb.subject} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-den-text flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      {sb.subject}
                    </span>
                    <span className="text-den-muted font-medium">
                      {sb.completed}/{total} topics ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-black/50 border border-den-border rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white/[0.02] border border-den-border rounded-xl p-3 text-xs text-den-muted">
            💡 <span className="text-den-text font-semibold">Tip:</span> Must-cover subjects are locked in early schedule slots to maximize memory retention.
          </div>
        </div>
      </div>

      {/* 14-Day Activity Heatmap */}
      <div className="bg-den-card border border-den-border rounded-3xl p-6">
        <h3 className="font-syne font-bold text-lg text-den-text mb-1">
          Recent Study Consistency
        </h3>
        <p className="text-den-muted text-xs mb-4">
          14-day study activity heatmap
        </p>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {(insights?.daily_completion || []).map((day, i) => {
            const hasActivity = day.completed_count > 0;
            return (
              <div key={i} className="flex-1 min-w-[42px] flex flex-col items-center gap-1.5">
                <div
                  className={`w-full aspect-square rounded-xl flex items-center justify-center border transition-all
                    ${hasActivity
                      ? 'bg-den-yellow text-black font-bold border-den-yellow shadow-sm shadow-den-yellow/20'
                      : 'bg-black/40 border-den-border text-den-muted/40'
                    }`}
                >
                  <span className="text-xs">{day.completed_count}</span>
                </div>
                <span className="text-[10px] text-den-muted">
                  {day.date.split('-').slice(1).join('/')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
