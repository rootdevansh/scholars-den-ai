// modules/replanner.js
// Adaptive re-planning engine for Supabase backend.
// On skip/miss: clears future pending schedule, re-runs scheduling algorithm,
// and persists the new schedule to Supabase.

const { v4: uuidv4 } = require('uuid');
const { generateSchedule } = require('./scheduler');

/**
 * Replan the schedule from today onwards for a given plan.
 * @param {string} planId
 * @param {Object} supabase - Supabase client instance
 * @returns {Array} newSchedule
 */
async function replan(planId, supabase) {
  const today = new Date().toISOString().split('T')[0];

  // 1. Fetch the plan
  const { data: plan, error: planErr } = await supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single();
  if (planErr) throw new Error('Plan not found: ' + planErr.message);

  // 2. Fetch all pending topics
  const { data: pendingTopics, error: topicErr } = await supabase
    .from('topics')
    .select('*')
    .eq('plan_id', planId)
    .neq('status', 'completed');
  if (topicErr) throw new Error('Topics fetch failed: ' + topicErr.message);
  if (!pendingTopics?.length) return [];

  // 3. Find future day IDs (today and onwards)
  const { data: futureDays } = await supabase
    .from('schedule_days')
    .select('id')
    .eq('plan_id', planId)
    .gte('day_date', today);

  if (futureDays?.length) {
    const futureDayIds = futureDays.map((d) => d.id);

    // Delete pending day_topics in future days
    await supabase
      .from('day_topics')
      .delete()
      .in('day_id', futureDayIds)
      .eq('status', 'pending');

    // Delete future schedule_days (cascade deletes day_topics too)
    await supabase
      .from('schedule_days')
      .delete()
      .in('id', futureDayIds);
  }

  // 4. Generate new schedule
  const newSchedule = generateSchedule(plan, pendingTopics);

  // 5. Get current max day_number to offset new days
  const { data: maxDayRow } = await supabase
    .from('schedule_days')
    .select('day_number')
    .eq('plan_id', planId)
    .order('day_number', { ascending: false })
    .limit(1)
    .single();

  const baseNum = maxDayRow?.day_number || 0;

  // 6. Persist new schedule
  const daysToInsert = newSchedule.map((day) => ({
    id: uuidv4(),
    plan_id: planId,
    day_date: day.day_date,
    day_number: baseNum + day.day_number,
    status: 'pending',
    _topics: day.topics, // temp field, stripped before insert
  }));

  for (const day of daysToInsert) {
    const topicsForDay = day._topics;
    delete day._topics;

    const { data: insertedDay, error: dayErr } = await supabase
      .from('schedule_days')
      .insert(day)
      .select('id')
      .single();
    if (dayErr) throw new Error('Day insert failed: ' + dayErr.message);

    const dayTopicsToInsert = topicsForDay.map((t) => ({
      id: uuidv4(),
      day_id: insertedDay.id,
      topic_id: t.topic_id,
      allocated_hours: t.allocated_hours,
      status: 'pending',
    }));

    if (dayTopicsToInsert.length) {
      await supabase.from('day_topics').insert(dayTopicsToInsert);
    }
  }

  return newSchedule;
}

module.exports = { replan };
