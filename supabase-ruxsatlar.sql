-- Supabase -> SQL Editor -> New query: butun matnni qo'yib "Run" bosing.
-- Ishchi faqat o'zi qo'shgan ishni o'zgartira/o'chira oladi. Admin hamma ishni. Egasi yo'q eski ishlar hamma uchun ochiq.
-- (Ilovaning o'zida ham shu qoida bor; bu fayl uni ma'lumotlar bazasi darajasida ham majburiy qiladi.)

alter table public.jobs add column if not exists created_by text;

create or replace function public.me_username() returns text
language sql stable security definer set search_path = public as $$
  select username from public.profiles where email = (auth.jwt() ->> 'email') limit 1
$$;

create or replace function public.me_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where email = (auth.jwt() ->> 'email') limit 1), false)
$$;

drop policy if exists "jobs_auth_all" on public.jobs;
drop policy if exists "jobs_select" on public.jobs;
drop policy if exists "jobs_insert" on public.jobs;
drop policy if exists "jobs_update" on public.jobs;
drop policy if exists "jobs_delete" on public.jobs;

create policy "jobs_select" on public.jobs for select to authenticated using (true);
create policy "jobs_insert" on public.jobs for insert to authenticated
  with check (public.me_is_admin() or created_by is null or created_by = public.me_username());
create policy "jobs_update" on public.jobs for update to authenticated
  using (public.me_is_admin() or created_by is null or created_by = public.me_username())
  with check (public.me_is_admin() or created_by is null or created_by = public.me_username());
create policy "jobs_delete" on public.jobs for delete to authenticated
  using (public.me_is_admin() or created_by is null or created_by = public.me_username());
