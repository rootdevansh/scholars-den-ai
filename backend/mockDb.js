// mockDb.js — In-memory pre-seeded database fallback
// Used when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not yet configured in .env.
// Allows the entire app to be demoed out-of-the-box with all 7 features!

const { v4: uuidv4 } = require('uuid');

const samplePlanId = 'c0000000-0000-0000-0000-000000000001';

// Seeded sample plan
const plans = [
  {
    id: samplePlanId,
    name: 'JEE Advanced 2027 Prep',
    exam_date: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    daily_hours: 6,
    created_at: new Date().toISOString(),
    is_active: true,
  },
];

// Seeded topics
const topics = [
  { id: uuidv4(), plan_id: samplePlanId, subject: 'Physics', name: 'Electromagnetism', weightage: 10, mastery: 'weak', estimated_hours: 14, priority_score: 30, priority_tag: 'must-cover', status: 'pending', skip_count: 0, actual_hours: 0 },
  { id: uuidv4(), plan_id: samplePlanId, subject: 'Chemistry', name: 'Organic Chemistry', weightage: 10, mastery: 'weak', estimated_hours: 16, priority_score: 30, priority_tag: 'must-cover', status: 'pending', skip_count: 0, actual_hours: 0 },
  { id: uuidv4(), plan_id: samplePlanId, subject: 'Physics', name: 'Mechanics', weightage: 9, mastery: 'weak', estimated_hours: 12, priority_score: 27, priority_tag: 'must-cover', status: 'pending', skip_count: 0, actual_hours: 0 },
  { id: uuidv4(), plan_id: samplePlanId, subject: 'Chemistry', name: 'Physical Chemistry', weightage: 8, mastery: 'weak', estimated_hours: 12, priority_score: 24, priority_tag: 'must-cover', status: 'pending', skip_count: 0, actual_hours: 0 },
  { id: uuidv4(), plan_id: samplePlanId, subject: 'Mathematics', name: 'Coordinate Geometry', weightage: 7, mastery: 'weak', estimated_hours: 8, priority_score: 21, priority_tag: 'must-cover', status: 'pending', skip_count: 0, actual_hours: 0 },
  { id: uuidv4(), plan_id: samplePlanId, subject: 'Mathematics', name: 'Calculus', weightage: 10, mastery: 'medium', estimated_hours: 14, priority_score: 20, priority_tag: 'must-cover', status: 'pending', skip_count: 0, actual_hours: 0 },
  { id: uuidv4(), plan_id: samplePlanId, subject: 'Mathematics', name: 'Algebra', weightage: 8, mastery: 'medium', estimated_hours: 10, priority_score: 16, priority_tag: 'must-cover', status: 'pending', skip_count: 0, actual_hours: 0 },
  { id: uuidv4(), plan_id: samplePlanId, subject: 'Physics', name: 'Thermodynamics', weightage: 7, mastery: 'medium', estimated_hours: 8, priority_score: 14, priority_tag: 'must-cover', status: 'pending', skip_count: 0, actual_hours: 0 },
  { id: uuidv4(), plan_id: samplePlanId, subject: 'Chemistry', name: 'Inorganic Chemistry', weightage: 7, mastery: 'medium', estimated_hours: 10, priority_score: 14, priority_tag: 'must-cover', status: 'pending', skip_count: 0, actual_hours: 0 },
  { id: uuidv4(), plan_id: samplePlanId, subject: 'Physics', name: 'Optics', weightage: 6, mastery: 'medium', estimated_hours: 6, priority_score: 12, priority_tag: 'must-cover', status: 'pending', skip_count: 0, actual_hours: 0 },
  { id: uuidv4(), plan_id: samplePlanId, subject: 'Mathematics', name: 'Probability', weightage: 5, mastery: 'medium', estimated_hours: 6, priority_score: 10, priority_tag: 'bare-minimum', status: 'pending', skip_count: 0, actual_hours: 0 },
  { id: uuidv4(), plan_id: samplePlanId, subject: 'Physics', name: 'Modern Physics', weightage: 7, mastery: 'strong', estimated_hours: 5, priority_score: 7, priority_tag: 'bare-minimum', status: 'pending', skip_count: 0, actual_hours: 0 },
  { id: uuidv4(), plan_id: samplePlanId, subject: 'Mathematics', name: 'Trigonometry', weightage: 6, mastery: 'strong', estimated_hours: 5, priority_score: 6, priority_tag: 'bare-minimum', status: 'pending', skip_count: 0, actual_hours: 0 },
  { id: uuidv4(), plan_id: samplePlanId, subject: 'Chemistry', name: 'Electrochemistry', weightage: 5, mastery: 'strong', estimated_hours: 4, priority_score: 5, priority_tag: 'bare-minimum', status: 'pending', skip_count: 0, actual_hours: 0 },
];

// Seeded schedule days (30 days)
const schedule_days = [];
const day_topics = [];

for (let i = 0; i < 30; i++) {
  const dDate = new Date();
  dDate.setDate(dDate.getDate() + i);
  const dayId = uuidv4();
  schedule_days.push({
    id: dayId,
    plan_id: samplePlanId,
    day_date: dDate.toISOString().split('T')[0],
    day_number: i + 1,
    status: 'pending',
  });

  // Assign 1-2 topics per day
  const topicIdx1 = i % topics.length;
  const topicIdx2 = (i + 1) % topics.length;
  day_topics.push({
    id: uuidv4(),
    day_id: dayId,
    topic_id: topics[topicIdx1].id,
    allocated_hours: 3.5,
    status: 'pending',
  });
  day_topics.push({
    id: uuidv4(),
    day_id: dayId,
    topic_id: topics[topicIdx2].id,
    allocated_hours: 2.5,
    status: 'pending',
  });
}

const doubts = [];
const study_sessions = [];

const collections = {
  plans,
  topics,
  schedule_days,
  day_topics,
  doubts,
  study_sessions,
};

// Builder-style query simulator for Supabase syntax
class MockQueryBuilder {
  constructor(tableName) {
    this.tableName = tableName;
    this.items = [...(collections[tableName] || [])];
    this.isSingle = false;
  }

  select(fields = '*') {
    return this;
  }

  eq(field, val) {
    this.items = this.items.filter((item) => String(item[field]) === String(val));
    return this;
  }

  neq(field, val) {
    this.items = this.items.filter((item) => String(item[field]) !== String(val));
    return this;
  }

  gte(field, val) {
    this.items = this.items.filter((item) => item[field] >= val);
    return this;
  }

  lte(field, val) {
    this.items = this.items.filter((item) => item[field] <= val);
    return this;
  }

  in(field, values) {
    const valSet = new Set(values.map(String));
    this.items = this.items.filter((item) => valSet.has(String(item[field])));
    return this;
  }

  order(field, { ascending = true } = {}) {
    this.items.sort((a, b) => {
      if (a[field] < b[field]) return ascending ? -1 : 1;
      if (a[field] > b[field]) return ascending ? 1 : -1;
      return 0;
    });
    return this;
  }

  limit(num) {
    this.items = this.items.slice(0, num);
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  insert(records) {
    const arr = Array.isArray(records) ? records : [records];
    const inserted = [];
    for (const r of arr) {
      const item = { id: uuidv4(), ...r };
      collections[this.tableName].push(item);
      inserted.push(item);
    }
    const res = Array.isArray(records) ? inserted : inserted[0];
    return {
      select: () => ({
        single: async () => ({ data: res, error: null }),
        then: (resolve) => resolve({ data: Array.isArray(records) ? inserted : [res], error: null }),
      }),
      single: async () => ({ data: res, error: null }),
      then: (resolve) => resolve({ data: res, error: null }),
    };
  }

  update(patch) {
    for (const item of this.items) {
      Object.assign(item, patch);
      const original = collections[this.tableName].find((x) => x.id === item.id);
      if (original) Object.assign(original, patch);
    }
    const res = this.items;
    return {
      select: () => ({
        single: async () => ({ data: res[0], error: null }),
        then: (resolve) => resolve({ data: res, error: null }),
      }),
      single: async () => ({ data: res[0], error: null }),
      then: (resolve) => resolve({ data: res, error: null }),
    };
  }

  delete() {
    this.isDelete = true;
    return this;
  }

  // Thenable to resolve as promise
  then(resolve) {
    if (this.isDelete) {
      const ids = new Set(this.items.map((x) => x.id));
      collections[this.tableName] = collections[this.tableName].filter((x) => !ids.has(x.id));
      return resolve({ data: null, error: null });
    }

    // Populate joins if requesting nested data
    if (this.tableName === 'schedule_days') {
      const hydrated = this.items.map((day) => {
        const dts = collections.day_topics
          .filter((dt) => dt.day_id === day.id)
          .map((dt) => ({
            ...dt,
            topics: collections.topics.find((t) => t.id === dt.topic_id),
          }));
        return { ...day, day_topics: dts };
      });
      return resolve({
        data: this.isSingle ? (hydrated[0] || null) : hydrated,
        error: this.isSingle && !hydrated[0] ? { message: 'Row not found' } : null,
      });
    }

    if (this.tableName === 'doubts') {
      const hydrated = this.items.map((doubt) => ({
        ...doubt,
        topics: collections.topics.find((t) => t.id === doubt.topic_id),
      }));
      return resolve({
        data: this.isSingle ? (hydrated[0] || null) : hydrated,
        error: null,
      });
    }

    const result = this.isSingle ? (this.items[0] || null) : this.items;
    return resolve({
      data: result,
      error: this.isSingle && !result ? { message: 'Row not found' } : null,
    });
  }
}

const mockSupabase = {
  from: (tableName) => new MockQueryBuilder(tableName),
};

module.exports = { mockSupabase, collections };
