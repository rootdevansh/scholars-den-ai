// routes/plans.js — Plan CRUD + schedule generation + replan

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../db');
const { generateSchedule } = require('../modules/scheduler');
const { replan } = require('../modules/replanner');
const { getSmartReminders } = require('../modules/reminderEngine');

// ─── GET /api/plans — List all plans ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/plans/sample/load — Get the seeded sample plan ─────────────────
router.get('/sample/load', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('plans')
      .select('id, name')
      .eq('name', 'JEE Advanced 2027 Prep')
      .single();
    if (error || !data) {
      return res.status(404).json({ error: 'Sample plan not found. Run schema.sql in Supabase first.' });
    }
    res.json({ planId: data.id, name: data.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/plans/:id — Get plan with full schedule ────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: plan, error: planErr } = await supabase
      .from('plans')
      .select('*')
      .eq('id', id)
      .single();
    if (planErr) return res.status(404).json({ error: 'Plan not found' });

    const { data: scheduleDays, error: daysErr } = await supabase
      .from('schedule_days')
      .select(`
        *,
        day_topics (
          *,
          topics (*)
        )
      `)
      .eq('plan_id', id)
      .order('day_number', { ascending: true });
    if (daysErr) throw daysErr;

    const { data: topics } = await supabase
      .from('topics')
      .select('*')
      .eq('plan_id', id)
      .order('priority_score', { ascending: false });

    res.json({ plan, scheduleDays, topics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/plans/:id/today — Today's study session ────────────────────────
router.get('/:id/today', async (req, res) => {
  try {
    const { id } = req.params;
    const today = new Date().toISOString().split('T')[0];

    const { data: dayData, error } = await supabase
      .from('schedule_days')
      .select(`
        *,
        day_topics (
          *,
          topics (*)
        )
      `)
      .eq('plan_id', id)
      .eq('day_date', today)
      .single();

    if (error || !dayData) {
      // Return next available day if no exact today match
      const { data: nextDay } = await supabase
        .from('schedule_days')
        .select(`*, day_topics (*, topics (*))`)
        .eq('plan_id', id)
        .gte('day_date', today)
        .eq('status', 'pending')
        .order('day_date', { ascending: true })
        .limit(1)
        .single();
      return res.json(nextDay || { day_date: today, day_topics: [] });
    }
    res.json(dayData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/plans/:id/reminders — Smart reminders ─────────────────────────
router.get('/:id/reminders', async (req, res) => {
  try {
    const reminders = await getSmartReminders(req.params.id, supabase);
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/plans — Create plan + generate schedule ───────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, exam_date, daily_hours, topics: rawTopics } = req.body;
    if (!name || !exam_date || !daily_hours || !rawTopics?.length) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Insert plan
    const { data: plan, error: planErr } = await supabase
      .from('plans')
      .insert({ name, exam_date, daily_hours })
      .select()
      .single();
    if (planErr) throw planErr;

    // 2. Insert topics
    const topicsToInsert = rawTopics.map((t) => ({
      plan_id: plan.id,
      subject: t.subject,
      name: t.name,
      weightage: t.weightage,
      mastery: t.mastery || 'medium',
      estimated_hours: t.estimated_hours || 2,
      status: 'pending',
    }));

    const { data: topics, error: topicErr } = await supabase
      .from('topics')
      .insert(topicsToInsert)
      .select();
    if (topicErr) throw topicErr;

    // 3. Generate schedule
    const schedule = generateSchedule(plan, topics);

    // 4. Persist schedule days and day_topics
    for (const day of schedule) {
      const { data: insertedDay, error: dayErr } = await supabase
        .from('schedule_days')
        .insert({
          id: uuidv4(),
          plan_id: plan.id,
          day_date: day.day_date,
          day_number: day.day_number,
          status: 'pending',
        })
        .select('id')
        .single();
      if (dayErr) throw dayErr;

      if (day.topics.length) {
        const dtRows = day.topics.map((t) => ({
          id: uuidv4(),
          day_id: insertedDay.id,
          topic_id: t.topic_id,
          allocated_hours: t.allocated_hours,
          status: 'pending',
        }));
        await supabase.from('day_topics').insert(dtRows);
      }
    }

    // 5. Update topics with priority scores/tags from schedule
    for (const day of schedule) {
      for (const t of day.topics) {
        await supabase
          .from('topics')
          .update({ priority_tag: t.priority_tag })
          .eq('id', t.topic_id);
      }
    }

    res.status(201).json({ plan, topicsCount: topics.length, scheduleDays: schedule.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/plans/:id/replan — Adaptive replan ────────────────────────────
router.post('/:id/replan', async (req, res) => {
  try {
    const newSchedule = await replan(req.params.id, supabase);
    res.json({ success: true, newScheduleDays: newSchedule.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
