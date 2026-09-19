-- Run once in your Supabase project's SQL Editor.
-- Each verified institute account can access only its own calculator worksheet.
begin;
create table if not exists public.calculator_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null check (jsonb_typeof(data) = 'object' and data->>'version' = '1'),
  updated_at timestamptz not null default now()
);
alter table public.calculator_states enable row level security;
revoke all on public.calculator_states from anon, authenticated;
grant select, insert, update, delete on public.calculator_states to authenticated;

create policy "Read own calculator" on public.calculator_states for select to authenticated
using ((select auth.uid()) = user_id and lower((select auth.jwt())->>'email') like '%@iiits.in');
create policy "Create own calculator" on public.calculator_states for insert to authenticated
with check ((select auth.uid()) = user_id and lower((select auth.jwt())->>'email') like '%@iiits.in');
create policy "Update own calculator" on public.calculator_states for update to authenticated
using ((select auth.uid()) = user_id and lower((select auth.jwt())->>'email') like '%@iiits.in')
with check ((select auth.uid()) = user_id and lower((select auth.jwt())->>'email') like '%@iiits.in');
create policy "Delete own calculator" on public.calculator_states for delete to authenticated
using ((select auth.uid()) = user_id and lower((select auth.jwt())->>'email') like '%@iiits.in');

create or replace function public.touch_calculator_state()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger touch_calculator_state before update on public.calculator_states
for each row execute function public.touch_calculator_state();
commit;
