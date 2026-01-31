-- Create RPC to atomically increment service sold_quantity
create or replace function public.increment_service_sold_quantity(service_id uuid, increment_by integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.services
  set sold_quantity = coalesce(sold_quantity, 0) + increment_by
  where id = service_id;
end;
$$;

grant execute on function public.increment_service_sold_quantity(uuid, integer) to anon, authenticated;

-- Create RPC to atomically decrement service sold_quantity
create or replace function public.decrement_service_sold_quantity(service_id uuid, decrement_by integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.services
  set sold_quantity = greatest(0, coalesce(sold_quantity, 0) - decrement_by)
  where id = service_id;
end;
$$;

grant execute on function public.decrement_service_sold_quantity(uuid, integer) to anon, authenticated;
