// server.js — Scholar's Den AI Backend Entry Point

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

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
  res.json({
    status: 'ok',
    service: "Scholar's Den AI",
    timestamp: new Date().toISOString(),
    supabaseConnected: Boolean(process.env.SUPABASE_URL),
    geminiConnected: Boolean(process.env.GEMINI_API_KEY),
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/plans', plansRouter);
app.use('/api/topics', topicsRouter);
app.use('/api/tutor', tutorRouter);
app.use('/api/insights', insightsRouter);

// ── Static Frontend Serving (if frontend/dist is built) ───────────────────────
const frontendDistPath = path.resolve(__dirname, '../frontend/dist');
const localDistPath = path.resolve(__dirname, './dist');

if (fs.existsSync(frontendDistPath)) {
  console.log('Serving frontend from:', frontendDistPath);
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') return next();
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else if (fs.existsSync(localDistPath)) {
  console.log('Serving frontend from local dist:', localDistPath);
  app.use(express.static(localDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') return next();
    res.sendFile(path.join(localDistPath, 'index.html'));
  });
} else {
  // If frontend not yet bundled, show friendly API gateway status on root
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Scholar's Den AI — API Gateway</title>
          <style>
            body { background: #0A0A0A; color: #FAFAF7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
            .card { background: #141414; border: 1px solid #242424; padding: 40px; border-radius: 20px; max-width: 500px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            h1 { color: #FFE500; font-size: 28px; margin-bottom: 10px; }
            p { color: #888; font-size: 14px; line-height: 1.6; }
            a { color: #FFE500; text-decoration: none; font-weight: bold; }
            .badge { display: inline-block; background: #2ED57322; color: #2ED573; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: bold; margin-bottom: 15px; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">● API Live & Running</span>
            <h1>Scholar's Den AI</h1>
            <p>Backend API service is online and ready.</p>
            <p style="margin-top: 20px;">
              🔍 <a href="/health">Health Check</a> &nbsp;|&nbsp; 
              ⚡ <a href="/api/plans/sample/load">Sample Plan</a> &nbsp;|&nbsp;
              📊 <a href="/api/plans">All Plans</a>
            </p>
          </div>
        </body>
      </html>
    `);
  });
}

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
║  Supabase: ${process.env.SUPABASE_URL ? '✅ Connected' : '❌ In-memory mock mode'}             
║  Gemini AI: ${process.env.GEMINI_API_KEY ? '✅ Enabled' : '⚠️  Mock mode (no key)'}            
╚═══════════════════════════════════════════╝
  `);
});
