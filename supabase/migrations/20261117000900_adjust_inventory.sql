-- ============================================================================
-- SPMC HMS — stock movements
-- Migration 032. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- One atomic entry point for stock in, stock out and stock-count adjustments.
-- Every movement writes a stock_transactions row, and stock-out deducts batches
-- FIFO so quantities can never go negative.

create or replace function public.adjust_inventory(
  p_item_id uuid,
  p_transaction_type text,
  p_quantity numeric,
  p_reason text default null,
  p_batch_id uuid default null,
  p_batch_number text default null,
  p_expiration_date date default null,
  p_unit_cost numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_item public.inventory_items%rowtype;
  v_batch public.inventory_batches%rowtype;
  v_batch_id uuid;
  v_needed numeric;
  v_take numeric;
  v_delta numeric;
  v_reason text;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_transaction_type is null
    or p_transaction_type not in ('stock_in', 'stock_out', 'adjustment') then
    raise exception 'Unsupported stock movement type' using errcode = '22023';
  end if;

  if p_quantity is null then
    raise exception 'Quantity is required' using errcode = '22023';
  end if;

  select *
  into v_item
  from public.inventory_items
  where id = p_item_id;

  if not found then
    raise exception 'Inventory item not found' using errcode = '22023';
  end if;

  if not v_item.is_active then
    raise exception 'Inventory item is inactive' using errcode = '22023';
  end if;

  v_reason := nullif(btrim(coalesce(p_reason, '')), '');

  -- --------------------------------------------------------------------------
  -- Stock in: receive a new batch
  -- --------------------------------------------------------------------------
  if p_transaction_type = 'stock_in' then
    if not public.has_permission('inventory.stock.in') then
      raise exception 'Insufficient permission' using errcode = '42501';
    end if;

    if p_quantity <= 0 then
      raise exception 'Received quantity must be greater than zero'
        using errcode = '22023';
    end if;

    if p_unit_cost is not null and p_unit_cost < 0 then
      raise exception 'Unit cost cannot be negative' using errcode = '22023';
    end if;

    insert into public.inventory_batches (
      item_id,
      batch_number,
      quantity_received,
      quantity_remaining,
      expiration_date,
      unit_cost,
      created_by
    )
    values (
      p_item_id,
      nullif(btrim(coalesce(p_batch_number, '')), ''),
      p_quantity,
      p_quantity,
      p_expiration_date,
      p_unit_cost,
      v_actor
    )
    returning id into v_batch_id;

    insert into public.stock_transactions (
      item_id,
      batch_id,
      transaction_type,
      quantity,
      reason,
      performed_by
    )
    values (
      p_item_id,
      v_batch_id,
      'stock_in'::public.stock_transaction_type,
      p_quantity,
      v_reason,
      v_actor
    );

    insert into public.audit_logs (
      actor_id,
      action,
      entity_type,
      entity_id,
      description,
      metadata
    )
    values (
      v_actor,
      'inventory.stock_in',
      'inventory_item',
      p_item_id,
      'Received stock into inventory.',
      jsonb_build_object(
        'source', 'adjust_inventory',
        'item_code', v_item.item_code,
        'batch_id', v_batch_id,
        'quantity', p_quantity
      )
    );

    return v_batch_id;
  end if;

  -- --------------------------------------------------------------------------
  -- Stock out: issue FIFO across available batches
  -- --------------------------------------------------------------------------
  if p_transaction_type = 'stock_out' then
    if not public.has_permission('inventory.stock.out') then
      raise exception 'Insufficient permission' using errcode = '42501';
    end if;

    if p_quantity <= 0 then
      raise exception 'Issued quantity must be greater than zero'
        using errcode = '22023';
    end if;

    if v_reason is null then
      raise exception 'A reason is required to issue stock'
        using errcode = '22023';
    end if;

    v_needed := p_quantity;

    for v_batch in
      select *
      from public.inventory_batches
      where item_id = p_item_id
        and quantity_remaining > 0
      order by expiration_date nulls last, received_at
      for update
    loop
      exit when v_needed <= 0;

      v_take := least(v_batch.quantity_remaining, v_needed);

      update public.inventory_batches
      set quantity_remaining = quantity_remaining - v_take
      where id = v_batch.id;

      insert into public.stock_transactions (
        item_id,
        batch_id,
        transaction_type,
        quantity,
        reason,
        performed_by
      )
      values (
        p_item_id,
        v_batch.id,
        'stock_out'::public.stock_transaction_type,
        v_take,
        v_reason,
        v_actor
      );

      v_needed := v_needed - v_take;
    end loop;

    if v_needed > 0 then
      raise exception 'Insufficient stock for %', v_item.item_code
        using errcode = '22023';
    end if;

    insert into public.audit_logs (
      actor_id,
      action,
      entity_type,
      entity_id,
      description,
      metadata
    )
    values (
      v_actor,
      'inventory.stock_out',
      'inventory_item',
      p_item_id,
      'Issued stock from inventory.',
      jsonb_build_object(
        'source', 'adjust_inventory',
        'item_code', v_item.item_code,
        'quantity', p_quantity,
        'reason', v_reason
      )
    );

    return p_item_id;
  end if;

  -- --------------------------------------------------------------------------
  -- Adjustment: record a physical count for one batch
  -- --------------------------------------------------------------------------
  if not public.has_permission('inventory.stock.adjust') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if v_reason is null then
    raise exception 'A reason is required to adjust stock'
      using errcode = '22023';
  end if;

  if p_batch_id is null then
    raise exception 'Select a batch to adjust' using errcode = '22023';
  end if;

  if p_quantity < 0 then
    raise exception 'Counted quantity cannot be negative'
      using errcode = '22023';
  end if;

  select *
  into v_batch
  from public.inventory_batches
  where id = p_batch_id
  for update;

  if not found then
    raise exception 'Inventory batch not found' using errcode = '22023';
  end if;

  if v_batch.item_id <> p_item_id then
    raise exception 'Batch does not belong to the selected item'
      using errcode = '22023';
  end if;

  v_delta := p_quantity - v_batch.quantity_remaining;

  if v_delta = 0 then
    return v_batch.id;
  end if;

  if p_quantity > v_batch.quantity_received then
    raise exception 'Counted quantity exceeds the received quantity for this batch'
      using errcode = '22023';
  end if;

  update public.inventory_batches
  set quantity_remaining = p_quantity
  where id = v_batch.id;

  insert into public.stock_transactions (
    item_id,
    batch_id,
    transaction_type,
    quantity,
    reason,
    performed_by
  )
  values (
    p_item_id,
    v_batch.id,
    'adjustment'::public.stock_transaction_type,
    abs(v_delta),
    v_reason,
    v_actor
  );

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  )
  values (
    v_actor,
    'inventory.adjustment',
    'inventory_item',
    p_item_id,
    'Adjusted a stock count.',
    jsonb_build_object(
      'source', 'adjust_inventory',
      'item_code', v_item.item_code,
      'batch_id', v_batch.id,
      'previous_quantity', v_batch.quantity_remaining,
      'counted_quantity', p_quantity,
      'delta', v_delta,
      'reason', v_reason
    )
  );

  return v_batch.id;
end;
$$;

revoke all on function public.adjust_inventory(
  uuid, text, numeric, text, uuid, text, date, numeric
) from public;

grant execute on function public.adjust_inventory(
  uuid, text, numeric, text, uuid, text, date, numeric
) to authenticated, service_role;
