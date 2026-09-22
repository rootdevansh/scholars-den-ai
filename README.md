# Scholar's Den AI ⚡
> **AI-Powered Personalized Study Planner & Doubt-Clearing Tutor**  
> *Built for Track 4: Education*

---

## 🌟 Concept

Traditional schedules are rigid and generic. **Scholar's Den AI** builds a dynamic study plan around real constraints — time remaining, daily hours, syllabus weightage, and student mastery levels. When days or topics are skipped, the engine automatically **adapts and redistributes** the remaining syllabus rather than shifting dates, and provides a context-grounded **AI Tutor** for instant doubt clearance.

---

## 🎨 Design System & Aesthetic (Gen Z Editorial)
- **Palette**: Electric Yellow (`#FFE500`), Deep Night (`#0A0A0A`), Off-White (`#FAFAF7`), Accent Border (`#242424`)
- **Typography**: [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) (Technical/Geometric body) + [Syne](https://fonts.google.com/specimen/Syne) (High-contrast editorial display headings)
- **Visuals**: Noise grain texture, glassy backdrop blur, animated study timer, interactive Recharts donut chart, 14-day study heatmap, and glowing priority badges.

---

## 🚀 7 Core Features Implemented

1. **Constraint-Based Planning Engine (`backend/modules/scheduler.js`)**
   - Inputs: Target exam date, daily available study hours, topics with weightage (1–10), and self-assessed mastery (`weak` / `medium` / `strong`).
   - Formula: `priority_score = weightage × mastery_multiplier` (`weak` = 3x, `medium` = 2x, `strong` = 1x).
   - Generates a day-by-day study schedule front-loading high-yield, low-mastery topics.

2. **Topic Prioritization (`backend/modules/prioritizer.js`)**
   - Calculates cumulative weightage distribution.
   - Topics in the top 70% of total weightage are automatically tagged **Must-Cover** (`#FFE500` badge) and locked into the first 60% of the schedule.
   - Lower-yield topics are tagged **Bare-Minimum** (`#242424` badge).

3. **Adaptive Re-Planning Engine (`backend/modules/replanner.js`)**
   - Triggered automatically on topic skip, mastery change, or via the **"Adapt & Re-Plan ⚡"** button.
   - Clears future pending days and re-runs the greedy allocation algorithm across remaining days.

4. **Progress Dashboard (`frontend/src/pages/Dashboard.jsx`)**
   - Interactive Recharts Donut chart displaying Must-Cover vs Bare-Minimum completion.
   - Subject-wise progress bars and 14-day consistency activity heatmap.
   - Animated daily streak counter (`StreakCounter.jsx`).

5. **Smart Reminders Engine (`backend/modules/reminderEngine.js`)**
   - Proactive nudges before a Must-Cover topic's study window closes.
   - Alerts for topics skipped 2+ times to stop syllabus debt.
   - Exam proximity warnings when within 14 days of exam date.

6. **Performance Insights & Audit (`frontend/src/pages/Insights.jsx`)**
   - Side-by-side Recharts BarChart comparing **Planned Hours vs Actual Logged Hours** per subject.
   - Flagged topics section for re-prioritizing consistently delayed topics with a single click.

7. **Context-Grounded AI Tutor (`frontend/src/pages/AITutor.jsx` & `TutorChat.jsx`)**
   - Seamlessly accessible as a slide-out drawer from any topic card or via the dedicated AI Tutor page.
   - Grounded with the currently active topic and subject context in prompt engineering.
   - One-click **"Explain like I'm new to this"** analogy generator.
   - Real-time logging of past doubts with query history.
   - Powered by **Google Gemini API** (`gemini-1.5-flash`) with realistic fallback mode.

---

## ⚡ Quick Start (Run Locally)

### 1. Clone & Install
```bash
git clone <your-repo>
cd "Scholar's Den Ai"

# Install all dependencies (root, backend, frontend)
npm run install:all
```

### 2. Run Both Frontend and Backend Concurrently
```bash
npm run dev
```
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3001](http://localhost:3001)

> 💡 **Out-of-the-box Demo:** The app ships with an in-memory database pre-loaded with **JEE Advanced 2027** syllabus data and an AI mock mode! Click **"Quick Demo 🚀"** on the landing page to demo immediately.

---

## 🗄️ Supabase Setup (PostgreSQL)

To connect your own cloud database:

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** → **New Query**, copy the contents of [`backend/schema.sql`](backend/schema.sql) and click **Run**.
3. Copy your project URL and **Service Role Key** from **Project Settings → API**.
4. In `backend/.env`, set:
```env
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GEMINI_API_KEY=your_gemini_api_key_here
```
5. Restart backend (`npm run dev --prefix backend`). The app will switch from mock mode to live Supabase!

---

## ☁️ Deployment Guide

### Deploying Frontend (Vercel)
1. Push your repository to GitHub.
2. Sign in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Select your repository:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **Environment Variables**, add:
   - `VITE_API_URL` = `https://your-backend-url.onrender.com/api` (or Railway URL)
5. Click **Deploy**.

---

### Deploying Backend (Railway or Render)

#### Option A: Render (Free Web Service)
1. Sign in to [Render](https://render.com) and select **"New + → Web Service"**.
2. Connect your GitHub repository:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
3. Under **Environment Variables**, add:
   - `PORT` = `3001`
   - `SUPABASE_URL` = `https://your-project.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = `<your-service-role-key>`
   - `GEMINI_API_KEY` = `<your-gemini-api-key>`
4. Click **Create Web Service**.

#### Option B: Railway
1. Sign in to [Railway](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. Set root directory to `/backend`.
3. Add environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `PORT=3001`).
4. Generate a public domain under **Settings → Networking**.
