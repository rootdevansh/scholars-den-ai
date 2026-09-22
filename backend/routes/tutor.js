// routes/tutor.js — AI Tutor chat endpoint + doubts log

const express = require('express');
const router = express.Router();
const { supabase } = require('../db');

// ─── POST /api/tutor/ask ──────────────────────────────────────────────────────
// Body: { planId, topicId?, subject, topicName, question, conversationHistory? }
router.post('/ask', async (req, res) => {
  try {
    const {
      planId,
      topicId,
      subject = 'General',
      topicName = 'General Studies',
      question,
      conversationHistory = [],
    } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({ error: 'Question is required' });
    }

    let answer;

    // ── Try Gemini API ─────────────────────────────────────────────────────
    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const systemInstruction = `You are Scholar's Den AI Tutor, an expert educational assistant helping students prepare for competitive exams like JEE, NEET, UPSC, and CAT.
You are currently helping a student studying: ${subject} — ${topicName}.
Your role is ONLY to:
- Explain concepts clearly with structured steps
- Provide worked examples and practice problems
- Simplify explanations using analogies when asked
- Give exam-focused, concise answers
Keep responses focused, well-structured (use numbered steps or bullet points), and exam-relevant.
Never discuss topics outside of education and exam preparation.
Always start with a one-line direct answer, then elaborate.`;

        // Build chat history for context
        const history = conversationHistory.slice(-6).map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        }));

        const chat = model.startChat({
          history,
          systemInstruction,
        });

        const result = await chat.sendMessage(question);
        answer = result.response.text();
      } catch (geminiErr) {
        console.warn('Gemini API error, falling back to mock:', geminiErr.message);
        answer = getMockAnswer(subject, topicName, question);
      }
    } else {
      // ── Fallback mock answer ─────────────────────────────────────────────
      answer = getMockAnswer(subject, topicName, question);
    }

    // ── Save to doubts table ───────────────────────────────────────────────
    const { data: doubt, error: doubtErr } = await supabase
      .from('doubts')
      .insert({
        plan_id: planId,
        topic_id: topicId || null,
        subject,
        question,
        answer,
      })
      .select('id')
      .single();
    if (doubtErr) console.warn('Doubt save error:', doubtErr.message);

    res.json({ answer, doubtId: doubt?.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/tutor/doubts/:planId — All doubts grouped by topic ──────────────
router.get('/doubts/:planId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('doubts')
      .select('*, topics(name, subject)')
      .eq('plan_id', req.params.planId)
      .order('created_at', { ascending: false });
    if (error) throw error;

    // Group by topic
    const grouped = {};
    for (const d of data || []) {
      const key = d.topic_id || 'general';
      const label = d.topics?.name || 'General';
      if (!grouped[key]) grouped[key] = { topic_name: label, subject: d.subject, doubts: [] };
      grouped[key].doubts.push(d);
    }

    res.json({ doubts: data, grouped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Mock Answer Generator ────────────────────────────────────────────────────
function getMockAnswer(subject, topicName, question) {
  const lq = question.toLowerCase();

  if (lq.includes('simpl') || lq.includes('eli5') || lq.includes('new to')) {
    return `**Simple Explanation — ${topicName}** 🎓

Think of it this way: imagine you're learning ${topicName} for the very first time.

**The Core Idea:**
${topicName} is a fundamental concept in ${subject} that deals with how things interact and change under specific conditions.

**Step-by-step breakdown:**
1. Start with the basic principle — every system has a natural state it wants to return to
2. When you apply a force or change a variable, the system responds predictably
3. The mathematical relationship captures this response as an equation

**Real-world analogy:**
Think of it like a rubber band — the further you stretch it, the stronger it pulls back. The same proportional logic applies to most ${subject} concepts.

**Key formula to remember:**
The relationship is typically expressed as F ∝ x, where F is the effect and x is the cause.

💡 **Exam tip:** Questions often test whether you can identify which variable is changing and in what direction.`;
  }

  return `**${topicName} — ${subject}** 📚

**Direct Answer:**
This is a core concept tested heavily in competitive exams. Here's what you need to know:

**Key Principles:**
1. **Foundation**: ${topicName} builds on the fundamental laws of ${subject}
2. **Application**: This concept appears in 2-3 questions per exam section on average
3. **Common mistakes**: Students often confuse the direction of the effect or misapply the formula

**Worked Example:**
Consider a standard problem: given initial conditions, find the final state.
- **Step 1**: Identify all given quantities and what's asked
- **Step 2**: Choose the correct formula/law from ${topicName}
- **Step 3**: Substitute values carefully (watch units!)
- **Step 4**: Verify the answer makes physical/logical sense

**Important formulas:**
These are the relationships you must memorize for ${topicName} in ${subject}.

**Practice approach:**
Start with single-concept problems, then move to mixed problems where ${topicName} combines with related topics.

💡 **Pro tip**: Draw a diagram for every problem — it reveals relationships that equations alone don't show.

_Ask "explain simpler" if you want a more basic breakdown, or ask a specific follow-up question!_`;
}

module.exports = router;
