-- ─────────────────────────────────────────────
-- 20260603000000_otp_only_auth.sql
-- Switch MediFlow to OTP-only auth:
--   * Drop the foreign key from profiles.id to auth.users (we no longer
--     use Supabase Auth).
--   * Make profiles.email unique (it's the login lookup key now).
--   * Create email_otps for storing 6-digit verification codes (signup,
--     login).
-- ─────────────────────────────────────────────

-- Drop FK to auth.users if it exists.
alter table public.profiles
  drop constraint if exists profiles_id_fkey;

-- Add unique constraint on email if it isn't already there.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_email_key'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles add constraint profiles_email_key unique (email);
  end if;
end $$;

-- Email OTP table.
create table if not exists public.email_otps (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  otp_hash    text not null,
  purpose     text not null check (purpose in ('signup', 'login')),
  payload     jsonb,
  expires_at  timestamptz not null,
  consumed_at timestamptz,
  created_at  timestamptz not null default now()
);

-- Fast lookup of "latest active OTP for this email + purpose".
create index if not exists email_otps_lookup_idx
  on public.email_otps (email, purpose, created_at desc)
  where consumed_at is null;
