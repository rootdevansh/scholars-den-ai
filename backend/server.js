// server.js — Scholar's Den AI Backend Entry Point

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const plansRouter = require('./routes/plans');
const topicsRouter = require('./routes/topics');
const tutorRouter = require('./routes/tutor');
const insightsRouter = require('./routes/insights');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: "Scholar's Den AI", timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/plans', plansRouter);
app.use('/api/topics', topicsRouter);
app.use('/api/tutor', tutorRouter);
app.use('/api/insights', insightsRouter);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║       Scholar's Den AI — Backend          ║
║   Server running on http://localhost:${PORT}  ║
╠═══════════════════════════════════════════╣
║  Supabase: ${process.env.SUPABASE_URL ? '✅ Connected' : '❌ Missing SUPABASE_URL'}             
║  Gemini AI: ${process.env.GEMINI_API_KEY ? '✅ Enabled' : '⚠️  Mock mode (no key)'}            
╚═══════════════════════════════════════════╝
  `);
});
