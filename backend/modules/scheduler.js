// modules/scheduler.js
// Constraint-based study schedule generator.
// Inputs: plan metadata + topics array → Output: day-by-day schedule.

const { tagTopics } = require('./prioritizer');

/**
 * Generate a full study schedule from constraints.
 * @param {Object} plan   - { exam_date, daily_hours }
 * @param {Array}  topics - topic objects (pending only)
 * @returns {Array}       - [{ day_date, day_number, topics: [{topic_id, allocated_hours, priority_tag}] }]
 */
function generateSchedule(plan, topics) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const examDate = new Date(plan.exam_date);
  examDate.setHours(0, 0, 0, 0);

  const totalDays = Math.max(
    1,
    Math.floor((examDate - today) / (1000 * 60 * 60 * 24))
  );
  const dailyHours = parseFloat(plan.daily_hours);

  // Tag and prioritize
  const taggedTopics = tagTopics(
    topics.filter((t) => !t.status || t.status === 'pending')
  );

  // Build work queue with remaining hours per topic
  const workQueue = taggedTopics.map((t) => ({
    topic_id: t.id,
    priority_tag: t.priority_tag,
    hours_remaining: parseFloat(t.estimated_hours) || 1,
  }));

  const scheduleDays = [];

  for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
    if (workQueue.every((w) => w.hours_remaining <= 0)) break;

    const dayDate = new Date(today);
    dayDate.setDate(today.getDate() + (dayNum - 1));

    let hoursLeft = dailyHours;
    const dayTopics = [];

    for (const item of workQueue) {
      if (hoursLeft <= 0.01) break;
      if (item.hours_remaining <= 0) continue;

      const allocated = Math.min(item.hours_remaining, hoursLeft);
      dayTopics.push({
        topic_id: item.topic_id,
        allocated_hours: parseFloat(allocated.toFixed(2)),
        priority_tag: item.priority_tag,
      });
      item.hours_remaining = parseFloat((item.hours_remaining - allocated).toFixed(2));
      hoursLeft = parseFloat((hoursLeft - allocated).toFixed(2));
    }

    if (dayTopics.length > 0) {
      scheduleDays.push({
        day_date: dayDate.toISOString().split('T')[0],
        day_number: dayNum,
        topics: dayTopics,
      });
    }
  }

  return scheduleDays;
}

module.exports = { generateSchedule };
