// modules/prioritizer.js
// Tags each topic as 'must-cover' or 'bare-minimum' based on weightage distribution.
// Must-cover = topics that cumulatively account for the top 70% of total weightage.

/**
 * Tags topics with priority_score and priority_tag.
 * @param {Array} topics - raw topic objects with { id, weightage, mastery, ... }
 * @returns {Array} - sorted topics with priority_score and priority_tag added
 */
function tagTopics(topics) {
  const masteryMultiplier = { weak: 3, medium: 2, strong: 1 };

  const scored = topics.map((t) => ({
    ...t,
    priority_score: t.weightage * (masteryMultiplier[t.mastery] || 2),
  }));

  // Sort descending by priority_score
  scored.sort((a, b) => b.priority_score - a.priority_score);

  const totalWeightage = scored.reduce((sum, t) => sum + t.weightage, 0);
  const threshold = totalWeightage * 0.7;

  let cumulative = 0;
  return scored.map((t) => {
    cumulative += t.weightage;
    return {
      ...t,
      priority_tag: cumulative <= threshold ? 'must-cover' : 'bare-minimum',
    };
  });
}

module.exports = { tagTopics };
