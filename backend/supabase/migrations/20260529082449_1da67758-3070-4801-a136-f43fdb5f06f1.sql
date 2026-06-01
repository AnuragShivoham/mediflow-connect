
-- set search_path on updated_at function
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin new.updated_at = now(); return new; end;
$$;

-- Revoke execute from public/anon for sensitive functions; keep has_role for authenticated (needed for RLS)
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.tg_set_updated_at() from public, anon, authenticated;
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
