-- ============================================================================
-- SPMC HMS — extensions and helpers
-- Migration 001 of 22. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================

-- Supabase already provides these helpers, but the extension is declared
-- explicitly so a plain PostgreSQL instance can run the schema too.
create extension if not exists pgcrypto;
