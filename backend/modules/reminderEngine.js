// modules/reminderEngine.js
// Smart reminder engine — generates nudges based on spaced repetition logic,
// exam proximity, and skip patterns. Not generic "study now" alerts.

/**
 * Generate smart reminders for a plan.
 * @param {string} planId
 * @param {Object} supabase
 * @returns {Array} reminders - [{ type, topic_name, subject, message, urgency }]
 */
async function getSmartReminders(planId, supabase) {
  const reminders = [];
  const today = new Date().toISOString().split('T')[0];
  const in3Days = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];

  // Fetch plan for exam date context
  const { data: plan } = await supabase
    .from('plans')
    .select('exam_date')
    .eq('id', planId)
    .single();

  // 1. Urgent: Must-cover topics scheduled within next 3 days that are still pending
  const { data: urgentDays } = await supabase
    .from('schedule_days')
    .select('id, day_date')
    .eq('plan_id', planId)
    .gte('day_date', today)
    .lte('day_date', in3Days);

  if (urgentDays?.length) {
    const dayIds = urgentDays.map((d) => d.id);
    const { data: urgentDayTopics } = await supabase
      .from('day_topics')
      .select('topic_id, allocated_hours, day_id')
      .in('day_id', dayIds)
      .eq('status', 'pending');

    if (urgentDayTopics?.length) {
      const topicIds = [...new Set(urgentDayTopics.map((dt) => dt.topic_id))];
      const { data: topics } = await supabase
        .from('topics')
        .select('id, name, subject, priority_tag')
        .in('id', topicIds)
        .eq('priority_tag', 'must-cover');

      for (const t of topics || []) {
        const scheduled = urgentDays.find((d) =>
          urgentDayTopics.some((dt) => dt.topic_id === t.id && dt.day_id === d.id)
        );
        reminders.push({
          type: 'window-closing',
          topic_name: t.name,
          subject: t.subject,
          message: `⚡ ${t.name} is scheduled for ${scheduled?.day_date} — a MUST-COVER topic. Don't skip it!`,
          urgency: 'high',
        });
      }
    }
  }

  // 2. Consistently skipped topics (skip_count >= 2)
  const { data: skippedTopics } = await supabase
    .from('topics')
    .select('id, name, subject, skip_count, priority_tag')
    .eq('plan_id', planId)
    .gte('skip_count', 2)
    .neq('status', 'completed');

  for (const t of skippedTopics || []) {
    reminders.push({
      type: 'focus-needed',
      topic_name: t.name,
      subject: t.subject,
      message: `🔁 You've skipped ${t.name} ${t.skip_count}x. It needs dedicated focus soon${t.priority_tag === 'must-cover' ? ' — it\'s a MUST-COVER!' : '.'}`,
      urgency: t.priority_tag === 'must-cover' ? 'high' : 'medium',
    });
  }

  // 3. Exam proximity alert (≤ 14 days away)
  if (plan?.exam_date) {
    const daysLeft = Math.floor(
      (new Date(plan.exam_date) - new Date()) / 86400000
    );
    if (daysLeft <= 14 && daysLeft > 0) {
      const { data: remaining } = await supabase
        .from('topics')
        .select('id')
        .eq('plan_id', planId)
        .eq('status', 'pending')
        .eq('priority_tag', 'must-cover');

      reminders.push({
        type: 'exam-proximity',
        topic_name: null,
        subject: null,
        message: `🎯 ${daysLeft} days to exam — ${remaining?.length || 0} must-cover topics still pending. Time to accelerate!`,
        urgency: daysLeft <= 7 ? 'high' : 'medium',
      });
    }
  }

  return reminders;
}

module.exports = { getSmartReminders };
