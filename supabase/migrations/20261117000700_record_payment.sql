-- ============================================================================
-- SPMC HMS — record and refund payments
-- Migration 030. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- record_payment applies a completed payment to an invoice and recomputes the
-- balance and invoice status atomically. refund_payment reverses a single
-- completed payment without deleting it, so the financial history is preserved.

create or replace function public.record_payment(
  p_invoice_id uuid,
  p_amount numeric,
  p_payment_method text,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_amount numeric(12,2);
  v_invoice public.invoices%rowtype;
  v_payment_id uuid;
  v_reference text;
  v_balance numeric(12,2);
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('billing.payment.create') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_amount is null then
    raise exception 'Payment amount is required' using errcode = '22023';
  end if;

  v_amount := round(p_amount, 2);

  if v_amount <= 0 then
    raise exception 'Payment amount must be greater than zero'
      using errcode = '22023';
  end if;

  if p_payment_method is null
    or p_payment_method not in (
      'Cash',
      'Credit card',
      'Debit card',
      'Bank transfer',
      'Check',
      'HMO',
      'Insurance'
    ) then
    raise exception 'Unsupported payment method' using errcode = '22023';
  end if;

  select *
  into v_invoice
  from public.invoices
  where id = p_invoice_id
  for update;

  if not found then
    raise exception 'Invoice not found' using errcode = '22023';
  end if;

  if v_invoice.status in ('cancelled', 'refunded') then
    raise exception 'Invoice is not payable' using errcode = '22023';
  end if;

  if v_invoice.balance <= 0 then
    raise exception 'Invoice is already paid' using errcode = '22023';
  end if;

  if v_amount > v_invoice.balance then
    raise exception 'Payment exceeds the outstanding balance'
      using errcode = '22023';
  end if;

  v_reference := public.generate_reference_number('PAY');
  v_balance := v_invoice.balance - v_amount;

  insert into public.payments (
    payment_reference,
    invoice_id,
    amount,
    payment_method,
    payment_status,
    received_by,
    notes
  )
  values (
    v_reference,
    p_invoice_id,
    v_amount,
    p_payment_method,
    'completed',
    v_actor,
    nullif(btrim(coalesce(p_notes, '')), '')
  )
  returning id into v_payment_id;

  update public.invoices
  set amount_paid = v_invoice.amount_paid + v_amount,
      balance = v_balance,
      status = case when v_balance <= 0 then 'paid' else 'partially_paid' end,
      updated_by = v_actor
  where id = p_invoice_id;

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
    'payment.record',
    'payment',
    v_payment_id,
    'Recorded a patient payment.',
    jsonb_build_object(
      'source', 'record_payment',
      'invoice_id', p_invoice_id,
      'payment_reference', v_reference,
      'amount', v_amount
    )
  );

  return v_payment_id;
end;
$$;

create or replace function public.refund_payment(
  p_payment_id uuid,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_payment public.payments%rowtype;
  v_invoice public.invoices%rowtype;
  v_amount_paid numeric(12,2);
  v_balance numeric(12,2);
  v_reason text;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('billing.refund') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select *
  into v_payment
  from public.payments
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'Payment not found' using errcode = '22023';
  end if;

  if v_payment.payment_status <> 'completed' then
    raise exception 'Only completed payments can be refunded'
      using errcode = '22023';
  end if;

  select *
  into v_invoice
  from public.invoices
  where id = v_payment.invoice_id
  for update;

  if not found then
    raise exception 'Invoice not found' using errcode = '22023';
  end if;

  if v_payment.amount > v_invoice.amount_paid then
    raise exception 'Refund exceeds the recorded amount paid'
      using errcode = '22023';
  end if;

  v_reason := nullif(btrim(coalesce(p_reason, '')), '');
  v_amount_paid := v_invoice.amount_paid - v_payment.amount;
  v_balance := v_invoice.total_amount - v_amount_paid;

  -- The charge still stands after a refund, so the invoice returns to the
  -- unpaid or partially paid state and can be collected again.
  update public.invoices
  set amount_paid = v_amount_paid,
      balance = v_balance,
      status = case
        when v_amount_paid <= 0 then 'unpaid'
        else 'partially_paid'
      end,
      updated_by = v_actor
  where id = v_payment.invoice_id;

  update public.payments
  set payment_status = 'refunded',
      notes = concat_ws(
        ' | ',
        nullif(btrim(coalesce(notes, '')), ''),
        case when v_reason is not null then 'Refund: ' || v_reason end
      )
  where id = p_payment_id;

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
    'payment.refund',
    'payment',
    p_payment_id,
    'Refunded a patient payment.',
    jsonb_build_object(
      'source', 'refund_payment',
      'invoice_id', v_payment.invoice_id,
      'payment_reference', v_payment.payment_reference,
      'amount', v_payment.amount,
      'reason', v_reason
    )
  );

  return p_payment_id;
end;
$$;

revoke all on function public.record_payment(uuid, numeric, text, text)
  from public;
revoke all on function public.refund_payment(uuid, text) from public;

grant execute on function public.record_payment(uuid, numeric, text, text)
  to authenticated, service_role;
grant execute on function public.refund_payment(uuid, text)
  to authenticated, service_role;
