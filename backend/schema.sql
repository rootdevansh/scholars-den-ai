-- ============================================================
-- Scholar's Den AI — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  exam_date DATE NOT NULL,
  daily_hours NUMERIC(4,2) NOT NULL DEFAULT 6,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Topics table
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  name TEXT NOT NULL,
  weightage INTEGER NOT NULL CHECK (weightage BETWEEN 1 AND 10),
  mastery TEXT NOT NULL CHECK (mastery IN ('weak','medium','strong')),
  estimated_hours NUMERIC(5,2) NOT NULL DEFAULT 2,
  priority_score NUMERIC(8,2),
  priority_tag TEXT CHECK (priority_tag IN ('must-cover','bare-minimum')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','skipped')),
  skip_count INTEGER DEFAULT 0,
  actual_hours NUMERIC(6,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Schedule days table
CREATE TABLE IF NOT EXISTS schedule_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  day_date DATE NOT NULL,
  day_number INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','partial','missed'))
);

-- Day-topic assignments
CREATE TABLE IF NOT EXISTS day_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES schedule_days(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  allocated_hours NUMERIC(5,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','skipped'))
);

-- Study sessions (for tracking actual time spent)
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 0
);

-- AI Tutor doubts log
CREATE TABLE IF NOT EXISTS doubts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  subject TEXT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_topics_plan ON topics(plan_id);
CREATE INDEX IF NOT EXISTS idx_schedule_days_plan ON schedule_days(plan_id);
CREATE INDEX IF NOT EXISTS idx_schedule_days_date ON schedule_days(day_date);
CREATE INDEX IF NOT EXISTS idx_day_topics_day ON day_topics(day_id);
CREATE INDEX IF NOT EXISTS idx_day_topics_topic ON day_topics(topic_id);
CREATE INDEX IF NOT EXISTS idx_doubts_plan ON doubts(plan_id);
-- Disable Row Level Security so server and backend queries are never blocked
ALTER TABLE IF EXISTS plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS topics DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS schedule_days DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS day_topics DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS study_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS doubts DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- Sample Data Seed — JEE Advanced 2027 Prep
-- Run AFTER creating tables. Safe to re-run (uses DO block).
-- ============================================================
DO $$
DECLARE
  plan_id UUID;
  exam_dt DATE := CURRENT_DATE + INTERVAL '90 days';

  -- Physics topic IDs
  t_mech UUID; t_thermo UUID; t_em UUID; t_optics UUID; t_modern UUID;
  -- Chemistry topic IDs
  t_organic UUID; t_inorganic UUID; t_physical UUID; t_electrochem UUID;
  -- Mathematics topic IDs
  t_calculus UUID; t_algebra UUID; t_trig UUID; t_coord UUID; t_prob UUID;

  -- Schedule day IDs (we'll create first 14 days)
  day_ids UUID[];
  d UUID;
  i INT;
  day_dt DATE;
BEGIN
  -- Skip if sample data already exists
  IF EXISTS (SELECT 1 FROM plans WHERE name = 'JEE Advanced 2027 Prep') THEN
    RAISE NOTICE 'Sample data already exists, skipping seed.';
    RETURN;
  END IF;

  -- Insert plan
  INSERT INTO plans (name, exam_date, daily_hours)
  VALUES ('JEE Advanced 2027 Prep', exam_dt, 6)
  RETURNING id INTO plan_id;

  -- ── Physics Topics ──────────────────────────────────────────
  INSERT INTO topics (plan_id,subject,name,weightage,mastery,estimated_hours,priority_score,priority_tag)
  VALUES (plan_id,'Physics','Mechanics',9,'weak',12,27,'must-cover') RETURNING id INTO t_mech;

  INSERT INTO topics (plan_id,subject,name,weightage,mastery,estimated_hours,priority_score,priority_tag)
  VALUES (plan_id,'Physics','Thermodynamics',7,'medium',8,14,'must-cover') RETURNING id INTO t_thermo;

  INSERT INTO topics (plan_id,subject,name,weightage,mastery,estimated_hours,priority_score,priority_tag)
  VALUES (plan_id,'Physics','Electromagnetism',10,'weak',14,30,'must-cover') RETURNING id INTO t_em;

  INSERT INTO topics (plan_id,subject,name,weightage,mastery,estimated_hours,priority_score,priority_tag)
  VALUES (plan_id,'Physics','Optics',6,'medium',6,12,'must-cover') RETURNING id INTO t_optics;

  INSERT INTO topics (plan_id,subject,name,weightage,mastery,estimated_hours,priority_score,priority_tag)
  VALUES (plan_id,'Physics','Modern Physics',7,'strong',5,7,'bare-minimum') RETURNING id INTO t_modern;

  -- ── Chemistry Topics ────────────────────────────────────────
  INSERT INTO topics (plan_id,subject,name,weightage,mastery,estimated_hours,priority_score,priority_tag)
  VALUES (plan_id,'Chemistry','Organic Chemistry',10,'weak',16,30,'must-cover') RETURNING id INTO t_organic;

  INSERT INTO topics (plan_id,subject,name,weightage,mastery,estimated_hours,priority_score,priority_tag)
  VALUES (plan_id,'Chemistry','Inorganic Chemistry',7,'medium',10,14,'must-cover') RETURNING id INTO t_inorganic;

  INSERT INTO topics (plan_id,subject,name,weightage,mastery,estimated_hours,priority_score,priority_tag)
  VALUES (plan_id,'Chemistry','Physical Chemistry',8,'weak',12,24,'must-cover') RETURNING id INTO t_physical;

  INSERT INTO topics (plan_id,subject,name,weightage,mastery,estimated_hours,priority_score,priority_tag)
  VALUES (plan_id,'Chemistry','Electrochemistry',5,'strong',4,5,'bare-minimum') RETURNING id INTO t_electrochem;

  -- ── Mathematics Topics ──────────────────────────────────────
  INSERT INTO topics (plan_id,subject,name,weightage,mastery,estimated_hours,priority_score,priority_tag)
  VALUES (plan_id,'Mathematics','Calculus',10,'medium',14,20,'must-cover') RETURNING id INTO t_calculus;

  INSERT INTO topics (plan_id,subject,name,weightage,mastery,estimated_hours,priority_score,priority_tag)
  VALUES (plan_id,'Mathematics','Algebra',8,'medium',10,16,'must-cover') RETURNING id INTO t_algebra;

  INSERT INTO topics (plan_id,subject,name,weightage,mastery,estimated_hours,priority_score,priority_tag)
  VALUES (plan_id,'Mathematics','Trigonometry',6,'strong',5,6,'bare-minimum') RETURNING id INTO t_trig;

  INSERT INTO topics (plan_id,subject,name,weightage,mastery,estimated_hours,priority_score,priority_tag)
  VALUES (plan_id,'Mathematics','Coordinate Geometry',7,'weak',8,21,'must-cover') RETURNING id INTO t_coord;

  INSERT INTO topics (plan_id,subject,name,weightage,mastery,estimated_hours,priority_score,priority_tag)
  VALUES (plan_id,'Mathematics','Probability',5,'medium',6,10,'bare-minimum') RETURNING id INTO t_prob;

  -- ── Generate 30 schedule days ───────────────────────────────
  -- Day 1-2: Electromagnetism (6h each = 12h of 14)
  FOR i IN 1..30 LOOP
    day_dt := CURRENT_DATE + ((i-1) * INTERVAL '1 day');
    INSERT INTO schedule_days (plan_id, day_date, day_number)
    VALUES (plan_id, day_dt, i)
    RETURNING id INTO d;

    -- Assign topics per day based on priority order
    IF i = 1 THEN
      INSERT INTO day_topics (day_id,topic_id,allocated_hours) VALUES (d,t_em,6);
    ELSIF i = 2 THEN
      INSERT INTO day_topics (day_id,topic_id,allocated_hours) VALUES (d,t_em,6);
    ELSIF i = 3 THEN
      INSERT INTO day_topics (day_id,topic_id,allocated_hours) VALUES (d,t_em,2),(d,t_organic,4);
    ELSIF i = 4 THEN
      INSERT INTO day_topics (day_id,topic_id,allocated_hours) VALUES (d,t_organic,6);
    ELSIF i = 5 THEN
      INSERT INTO day_topics (day_id,topic_id,allocated_hours) VALUES (d,t_organic,6);
    ELSIF i = 6 THEN
      INSERT INTO day_topics (day_id,topic_id,allocated_hours) VALUES (d,t_mech,6);
    ELSIF i = 7 THEN
      INSERT INTO day_topics (day_id,topic_id,allocated_hours) VALUES (d,t_mech,6);
    ELSIF i = 8 THEN
      INSERT INTO day_topics (day_id,topic_id,allocated_hours) VALUES (d,t_physical,6);
    ELSIF i = 9 THEN
      INSERT INTO day_topics (day_id,topic_id,allocated_hours) VALUES (d,t_physical,6);
    ELSIF i = 10 THEN
      INSERT INTO day_topics (day_id,topic_id,allocated_hours) VALUES (d,t_calculus,6);
    ELSIF i = 11 THEN
      INSERT INTO day_topics (day_id,topic_id,allocated_hours) VALUES (d,t_calculus,6);
    ELSIF i = 12 THEN
      INSERT INTO day_topics (day_id,topic_id,allocated_hours) VALUES (d,t_calculus,2),(d,t_coord,4);
    ELSIF i = 13 THEN
      INSERT INTO day_topics (day_id,topic_id,allocated_hours) VALUES (d,t_coord,4),(d,t_thermo,2);
    ELSIF i = 14 THEN
      INSERT INTO day_topics (day_id,topic_id,allocated_hours) VALUES (d,t_thermo,6);
    ELSIF i = 15 THEN
      INSERT INTO day_topics (day_id,topic_id,allocated_hours) VALUES (d,t_algebra,6);
    ELSIF i = 16 THEN
      INSERT INTO day_topics (day_id,topic_id,allocated_hours) VALUES (d,t_algebra,4),(d,t_inorganic,2);
    ELSIF i = 17 THEN
      INSERT INTO day_topics (day_id,topic_id,allocated_hours) VALUES (d,t_inorganic,6);
    ELSIF i = 18 THEN
      INSERT INTO day_topics (day_id,topic_id,allocated_hours) VALUES (d,t_inorganic,2),(d,t_optics,4);
    ELSIF i = 19 THEN
      INSERT INTO day_topics (day_id,topic_id,allocated_hours) VALUES (d,t_optics,2),(d,t_prob,4);
    ELSIF i = 20 THEN
      INSERT INTO day_topics (day_id,topic_id,allocated_hours) VALUES (d,t_prob,2),(d,t_trig,4);
    ELSIF i = 21 THEN
      INSERT INTO day_topics (day_id,topic_id,allocated_hours) VALUES (d,t_trig,1),(d,t_modern,5);
    ELSIF i = 22 THEN
      INSERT INTO day_topics (day_id,topic_id,allocated_hours) VALUES (d,t_electrochem,4),(d,t_mech,2);
    ELSE
      -- Revision days
      INSERT INTO day_topics (day_id,topic_id,allocated_hours) VALUES
        (d,t_em,2),(d,t_organic,2),(d,t_calculus,2);
    END IF;
  END LOOP;

  RAISE NOTICE 'Sample data seeded successfully. Plan ID: %', plan_id;
END $$;
