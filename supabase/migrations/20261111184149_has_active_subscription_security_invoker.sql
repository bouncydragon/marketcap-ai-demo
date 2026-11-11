-- The caller can already read their own subscription row under RLS, so no elevated rights are needed.
create or replace function public.has_active_subscription()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = (select auth.uid())
      and s.status in ('active', 'trialing')
  );
$$;

revoke all on function public.has_active_subscription() from public, anon;
grant execute on function public.has_active_subscription() to authenticated;
