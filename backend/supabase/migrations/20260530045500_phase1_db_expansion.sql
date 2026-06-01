
-- Order status enum
create type public.order_status as enum ('pending', 'accepted', 'packed', 'out_for_delivery', 'delivered', 'rejected');

-- Inventory items table
create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  quantity integer not null default 0,
  batch_number text,
  expiry_date timestamptz,
  low_stock_threshold integer not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Contacts table (Relationship between Doctor and MR)
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, contact_id)
);

-- Orders table
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  mr_id uuid not null references auth.users(id) on delete cascade,
  status public.order_status not null default 'pending',
  preferred_delivery_date date,
  preferred_delivery_time text,
  delivery_method text,
  special_instructions text,
  delivery_notes text,
  delivery_timestamp timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Order items table
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  quantity integer not null check (quantity > 0)
);

-- Messages table
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  content text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.inventory_items enable row level security;
alter table public.contacts enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.messages enable row level security;

-- Policies for inventory_items
create policy "Users can view own inventory"
  on public.inventory_items for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can manage own inventory"
  on public.inventory_items for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Doctor can view MR inventory for ordering"
  on public.inventory_items for select to authenticated
  using (
    exists (
      select 1 from public.contacts
      where user_id = auth.uid() and contact_id = inventory_items.user_id
    )
  );

-- Policies for contacts
create policy "Users can view own contacts"
  on public.contacts for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can manage own contacts"
  on public.contacts for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policies for orders
create policy "Users can view own orders"
  on public.orders for select to authenticated
  using (auth.uid() = doctor_id or auth.uid() = mr_id);

create policy "Doctors can create orders"
  on public.orders for insert to authenticated
  with check (auth.uid() = doctor_id);

create policy "Involved users can update orders"
  on public.orders for update to authenticated
  using (auth.uid() = doctor_id or auth.uid() = mr_id);

-- Policies for order_items
create policy "Users can view order items"
  on public.order_items for select to authenticated
  using (
    exists (
      select 1 from public.orders
      where id = order_items.order_id and (doctor_id = auth.uid() or mr_id = auth.uid())
    )
  );

create policy "Doctors can insert order items"
  on public.order_items for insert to authenticated
  with check (
    exists (
      select 1 from public.orders
      where id = order_items.order_id and doctor_id = auth.uid()
    )
  );

-- Policies for messages
create policy "Users can view own messages"
  on public.messages for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages"
  on public.messages for insert to authenticated
  with check (auth.uid() = sender_id);

-- Updated_at triggers
create trigger set_inventory_items_updated_at
  before update on public.inventory_items
  for each row execute function public.tg_set_updated_at();

create trigger set_orders_updated_at
  before update on public.orders
  for each row execute function public.tg_set_updated_at();

-- Grants
grant select, insert, update, delete on public.inventory_items to authenticated;
grant select, insert, update, delete on public.contacts to authenticated;
grant select, insert, update on public.orders to authenticated;
grant select, insert on public.order_items to authenticated;
grant select, insert, update on public.messages to authenticated;
