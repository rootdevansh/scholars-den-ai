// db.js — Supabase client with smart in-memory fallback
// When SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY are set, connects to real Supabase PostgreSQL.
// When not yet configured, automatically uses the in-memory mock database so the prototype is 100% demo-ready!

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { mockSupabase } = require('./mockDb');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && SUPABASE_URL.startsWith('http')) {
  console.log('⚡ Initializing Supabase client with PostgreSQL connection...');
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
} else {
  console.log('ℹ️  No SUPABASE_URL detected in .env — using in-memory pre-seeded mock database.');
  console.log('💡  To connect real Supabase: paste credentials in backend/.env & run backend/schema.sql in Supabase SQL Editor.');
  supabase = mockSupabase;
}

module.exports = { supabase };
