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

const SAMPLE_TOPICS = [
  { subject: 'Physics', name: 'Electromagnetism', weightage: 10, mastery: 'weak', estimated_hours: 14 },
  { subject: 'Chemistry', name: 'Organic Chemistry', weightage: 10, mastery: 'weak', estimated_hours: 16 },
  { subject: 'Physics', name: 'Mechanics', weightage: 9, mastery: 'weak', estimated_hours: 12 },
  { subject: 'Chemistry', name: 'Physical Chemistry', weightage: 8, mastery: 'weak', estimated_hours: 12 },
  { subject: 'Mathematics', name: 'Coordinate Geometry', weightage: 7, mastery: 'weak', estimated_hours: 8 },
  { subject: 'Mathematics', name: 'Calculus', weightage: 10, mastery: 'medium', estimated_hours: 14 },
  { subject: 'Mathematics', name: 'Algebra', weightage: 8, mastery: 'medium', estimated_hours: 10 },
  { subject: 'Physics', name: 'Thermodynamics', weightage: 7, mastery: 'medium', estimated_hours: 8 },
  { subject: 'Chemistry', name: 'Inorganic Chemistry', weightage: 7, mastery: 'medium', estimated_hours: 10 },
  { subject: 'Physics', name: 'Optics', weightage: 6, mastery: 'medium', estimated_hours: 6 },
  { subject: 'Mathematics', name: 'Probability', weightage: 5, mastery: 'medium', estimated_hours: 6 },
  { subject: 'Physics', name: 'Modern Physics', weightage: 7, mastery: 'strong', estimated_hours: 5 },
  { subject: 'Mathematics', name: 'Trigonometry', weightage: 6, mastery: 'strong', estimated_hours: 5 },
  { subject: 'Chemistry', name: 'Electrochemistry', weightage: 5, mastery: 'strong', estimated_hours: 4 },
];

async function seedPlanOnTheFly(sb) {
  const examDate = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];

  // 1. Insert plan
  const { data: plan, error: pErr } = await sb
    .from('plans')
    .insert({
      name: 'JEE Advanced 2027 Prep',
      exam_date: examDate,
      daily_hours: 6,
    })
    .select()
    .single();

  if (pErr) throw pErr;

  // 2. Insert topics
  const rows = SAMPLE_TOPICS.map((t) => ({
    plan_id: plan.id,
    subject: t.subject,
    name: t.name,
    weightage: t.weightage,
    mastery: t.mastery,
    estimated_hours: t.estimated_hours,
    status: 'pending',
  }));

  const { data: insertedTopics, error: tErr } = await sb
    .from('topics')
    .insert(rows)
    .select();

  if (tErr) throw tErr;

  // 3. Generate schedule
  const schedule = generateSchedule(plan, insertedTopics || rows);

  // 4. Insert schedule days
  for (const day of schedule) {
    const { data: dayRow } = await sb
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

    if (dayRow && day.topics && day.topics.length) {
      const dtRows = day.topics.map((t) => ({
        id: uuidv4(),
        day_id: dayRow.id,
        topic_id: t.topic_id,
        allocated_hours: t.allocated_hours,
        status: 'pending',
      }));
      await sb.from('day_topics').insert(dtRows);
    }
  }

  return { id: plan.id, name: plan.name };
}

// ─── GET /api/plans/sample/load — Get the seeded sample plan ─────────────────
router.get('/sample/load', async (req, res) => {
  try {
    // 1. Try finding by name (limit 1 to avoid throwing if 0 found)
    const { data: planList } = await supabase
      .from('plans')
      .select('id, name')
      .eq('name', 'JEE Advanced 2027 Prep')
      .limit(1);

    if (planList && planList.length > 0) {
      return res.json({ planId: planList[0].id, name: planList[0].name });
    }

    // 2. Check if ANY plan exists in the database
    const { data: anyPlans } = await supabase
      .from('plans')
      .select('id, name')
      .order('created_at', { ascending: false })
      .limit(1);

    if (anyPlans && anyPlans.length > 0) {
      return res.json({ planId: anyPlans[0].id, name: anyPlans[0].name });
    }

    // 3. If zero plans exist, auto-seed right now on the fly
    console.log('⚡ No plan found in database — auto-seeding sample plan now...');
    const seeded = await seedPlanOnTheFly(supabase);
    res.json({ planId: seeded.id, name: seeded.name });
  } catch (err) {
    console.error('Error loading sample plan:', err);
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
