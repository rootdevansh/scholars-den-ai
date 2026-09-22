// routes/topics.js — Topic status updates, mastery changes, doubts per topic

const express = require('express');
const router = express.Router();
const { supabase } = require('../db');
const { replan } = require('../modules/replanner');

// ─── GET /api/topics/:planId — All topics for a plan ─────────────────────────
router.get('/:planId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('plan_id', req.params.planId)
      .order('priority_score', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/topics/:id/status — Update topic status ──────────────────────
// Body: { status: 'completed' | 'skipped', dayTopicId, planId, actualHours? }
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, dayTopicId, planId, actualHours } = req.body;

    if (!['completed', 'skipped', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Update topic status
    const topicUpdate = { status };
    if (status === 'skipped') {
      // Increment skip_count
      const { data: current } = await supabase
        .from('topics')
        .select('skip_count')
        .eq('id', id)
        .single();
      topicUpdate.skip_count = (current?.skip_count || 0) + 1;
    }
    if (status === 'completed' && actualHours) {
      topicUpdate.actual_hours = actualHours;
    }

    const { error: topicErr } = await supabase
      .from('topics')
      .update(topicUpdate)
      .eq('id', id);
    if (topicErr) throw topicErr;

    // Update day_topic status
    if (dayTopicId) {
      await supabase
        .from('day_topics')
        .update({ status })
        .eq('id', dayTopicId);
    }

    // Trigger replan if skipped (redistribute remaining work)
    let replanResult = null;
    if (status === 'skipped' && planId) {
      try {
        await replan(planId, supabase);
        replanResult = true;
      } catch (replanErr) {
        console.warn('Replan warning:', replanErr.message);
      }
    }

    res.json({ success: true, replanned: replanResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/topics/:id/mastery — Update mastery level ────────────────────
router.patch('/:id/mastery', async (req, res) => {
  try {
    const { mastery, planId } = req.body;
    if (!['weak', 'medium', 'strong'].includes(mastery)) {
      return res.status(400).json({ error: 'Invalid mastery value' });
    }

    const { error } = await supabase
      .from('topics')
      .update({ mastery })
      .eq('id', req.params.id);
    if (error) throw error;

    // Replan if planId provided
    if (planId) {
      await replan(planId, supabase).catch((e) =>
        console.warn('Replan after mastery update:', e.message)
      );
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/topics/:id/doubts — Doubts logged for this topic ───────────────
router.get('/:id/doubts', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('doubts')
      .select('*')
      .eq('topic_id', req.params.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
