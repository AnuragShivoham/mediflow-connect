
-- Function to handle stock subtraction when an order is delivered
create or replace function public.handle_stock_transfer()
returns trigger as $$
declare
  item_record record;
begin
  -- Only proceed if the status has changed to 'delivered'
  if (NEW.status = 'delivered' and OLD.status != 'delivered') then
    
    -- Iterate through all items in this order
    for item_record in 
      select inventory_item_id, quantity 
      from public.order_items 
      where order_id = NEW.id 
    loop
      -- Decrement the quantity in inventory
      update public.inventory_items
      set quantity = quantity - item_record.quantity
      where id = item_record.inventory_item_id;
      
      -- Optional: We could add a check here to ensure quantity doesn't go below zero
      -- but for medical supplies, sometimes 'negative' stock might be useful to track 
      -- over-commitments, depends on business logic. 
      -- For now, we just subtract.
    end loop;
    
  end if;
  
  return NEW;
end;
$$ language plpgsql security definer;

-- Trigger to execute the stock transfer after an order update
create trigger trigger_update_stock_on_delivery
  after update on public.orders
  for each row
  execute function public.handle_stock_transfer();

-- Add a comment for documentation
comment on function public.handle_stock_transfer() is 'Automatically decrements inventory quantity when an order status is updated to delivered.';
