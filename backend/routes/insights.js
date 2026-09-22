// routes/insights.js — Performance insights and analytics

const express = require('express');
const router = express.Router();
const { supabase } = require('../db');

// ─── GET /api/insights/:planId ────────────────────────────────────────────────
router.get('/:planId', async (req, res) => {
  try {
    const { planId } = req.params;

    // ── Fetch all topics ────────────────────────────────────────────────────
    const { data: topics, error: tErr } = await supabase
      .from('topics')
      .select('*')
      .eq('plan_id', planId);
    if (tErr) throw tErr;

    // ── Fetch schedule days + day_topics ────────────────────────────────────
    const { data: days } = await supabase
      .from('schedule_days')
      .select('*, day_topics(*, topics(subject, name))')
      .eq('plan_id', planId)
      .order('day_date', { ascending: true });

    // ── Planned vs Actual per subject ───────────────────────────────────────
    const subjectMap = {};
    for (const t of topics) {
      if (!subjectMap[t.subject]) {
        subjectMap[t.subject] = { subject: t.subject, planned_hours: 0, actual_hours: 0 };
      }
      subjectMap[t.subject].planned_hours += parseFloat(t.estimated_hours) || 0;
      subjectMap[t.subject].actual_hours += parseFloat(t.actual_hours) || 0;
    }
    const planned_vs_actual = Object.values(subjectMap);

    // ── Flagged topics (skipped 2+ times) ───────────────────────────────────
    const flagged_topics = topics.filter((t) => t.skip_count >= 2);

    // ── Completion rate ──────────────────────────────────────────────────────
    const total = topics.length;
    const completed = topics.filter((t) => t.status === 'completed').length;
    const completion_rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // ── Subject breakdown ────────────────────────────────────────────────────
    const subjectBreakdown = {};
    for (const t of topics) {
      if (!subjectBreakdown[t.subject]) {
        subjectBreakdown[t.subject] = {
          subject: t.subject,
          completed: 0,
          pending: 0,
          skipped: 0,
          must_cover_done: 0,
          must_cover_total: 0,
        };
      }
      const sb = subjectBreakdown[t.subject];
      if (t.status === 'completed') sb.completed++;
      else if (t.status === 'skipped') sb.skipped++;
      else sb.pending++;
      if (t.priority_tag === 'must-cover') {
        sb.must_cover_total++;
        if (t.status === 'completed') sb.must_cover_done++;
      }
    }
    const subject_breakdown = Object.values(subjectBreakdown);

    // ── Daily completion for last 14 days ────────────────────────────────────
    const today = new Date();
    const daily_completion = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayData = days?.find((day) => day.day_date === dateStr);
      const dayTopics = dayData?.day_topics || [];
      daily_completion.push({
        date: dateStr,
        completed_count: dayTopics.filter((dt) => dt.status === 'completed').length,
        total_count: dayTopics.length,
      });
    }

    // ── Streak calculation ───────────────────────────────────────────────────
    let streak = 0;
    for (let i = daily_completion.length - 1; i >= 0; i--) {
      const dc = daily_completion[i];
      if (dc.total_count > 0 && dc.completed_count > 0) streak++;
      else if (dc.total_count > 0) break;
    }

    // ── Priority summary ─────────────────────────────────────────────────────
    const mustCoverTopics = topics.filter((t) => t.priority_tag === 'must-cover');
    const bareMinTopics = topics.filter((t) => t.priority_tag === 'bare-minimum');

    const priority_summary = {
      must_cover: {
        total: mustCoverTopics.length,
        completed: mustCoverTopics.filter((t) => t.status === 'completed').length,
        pending: mustCoverTopics.filter((t) => t.status === 'pending').length,
      },
      bare_minimum: {
        total: bareMinTopics.length,
        completed: bareMinTopics.filter((t) => t.status === 'completed').length,
        pending: bareMinTopics.filter((t) => t.status === 'pending').length,
      },
    };

    res.json({
      planned_vs_actual,
      flagged_topics,
      completion_rate,
      streak,
      subject_breakdown,
      daily_completion,
      priority_summary,
      totals: { total, completed, pending: total - completed - topics.filter(t => t.status === 'skipped').length },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
