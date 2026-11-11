-- Subscriptions: one row per user, written ONLY by the server (service role) from Stripe events.
create table public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text not null unique,
  stripe_subscription_id text unique,
  status text not null default 'incomplete',
  price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- Users can read their own subscription. No insert/update/delete policies exist,
-- so only the service role (which bypasses RLS) can change billing state.
create policy "Users read own subscription"
  on public.subscriptions for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- True when the signed-in user has a paid (or trialing) subscription.
-- (Superseded by 20261111184149, which makes this SECURITY INVOKER.)
create function public.has_active_subscription()
returns boolean
language sql
stable
security definer
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

-- Watchlist: each row belongs to one user.
create table public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  symbol text not null check (symbol ~ '^[A-Z][A-Z0-9.\-]{0,9}$'),
  created_at timestamptz not null default now(),
  unique (user_id, symbol)
);

create index watchlist_items_user_id_idx on public.watchlist_items (user_id);

alter table public.watchlist_items enable row level security;

create policy "Users read own watchlist"
  on public.watchlist_items for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Saving a stock requires the paid plan, enforced here rather than in the UI.
create policy "Paid users add to own watchlist"
  on public.watchlist_items for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and public.has_active_subscription()
  );

-- Anyone can remove their own rows (so a lapsed subscriber can still tidy up).
create policy "Users remove from own watchlist"
  on public.watchlist_items for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Cap the watchlist so polling stays inside the market-data rate limit.
create function public.enforce_watchlist_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.watchlist_items w where w.user_id = new.user_id) >= 10 then
    raise exception 'watchlist_limit_reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger watchlist_limit
  before insert on public.watchlist_items
  for each row execute function public.enforce_watchlist_limit();

-- Signed-out visitors get nothing from these tables.
revoke all on public.subscriptions from anon;
revoke all on public.watchlist_items from anon;
