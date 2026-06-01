
-- Audit Logs table
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

-- Enable RLS for logs
alter table public.audit_logs enable row level security;

-- Only admins/service role can view all logs, users can view their own associated logs
create policy "Users can view own entity logs"
  on public.audit_logs for select to authenticated
  using (
    user_id = auth.uid() or 
    exists (
      select 1 from public.orders o 
      where o.id = entity_id and (o.doctor_id = auth.uid() or o.mr_id = auth.uid())
    )
  );

-- Function to log changes
create or replace function public.log_entity_change()
returns trigger as $$
begin
  insert into public.audit_logs (user_id, action, entity_type, entity_id, old_data, new_data)
  values (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    case when TG_OP = 'DELETE' then OLD.id else NEW.id end,
    case when TG_OP = 'INSERT' then null else to_jsonb(OLD) end,
    case when TG_OP = 'DELETE' then null else to_jsonb(NEW) end
  );
  return null;
end;
$$ language plpgsql security definer;

-- Triggers for logging
create trigger log_inventory_changes
  after insert or update or delete on public.inventory_items
  for each row execute function public.log_entity_change();

create trigger log_order_changes
  after insert or update or delete on public.orders
  for each row execute function public.log_entity_change();

-- Rate limiting (Supabase doesn't have a simple SQL-only rate limit table easily, but we can mock it or use a simple table)
-- For now, PostgreSQL RLS is the strongest security measure we have.
