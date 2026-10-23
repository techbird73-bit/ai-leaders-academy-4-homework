-- 개인 가계부 스키마
-- Supabase 대시보드 > SQL Editor 에 전체를 붙여넣고 Run 하세요.

-- 1) 카테고리 (2단계: parent_id 가 null 이면 대분류, 값이 있으면 소분류)
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type        text not null check (type in ('expense', 'income')),
  name        text not null,
  parent_id   uuid references public.categories(id) on delete cascade,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

create unique index if not exists categories_unique_name
  on public.categories (user_id, type, coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), name);

-- 2) 거래 내역
create table if not exists public.transactions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type            text not null check (type in ('expense', 'income')),
  occurred_at     timestamptz not null,
  category_id     uuid references public.categories(id) on delete set null,
  payment_method  text not null check (payment_method in ('card', 'cash')),
  amount          bigint not null check (amount >= 0),
  memo            text,
  created_at      timestamptz not null default now()
);

create index if not exists transactions_user_date
  on public.transactions (user_id, occurred_at);

-- 3) RLS: 로그인한 본인 데이터만 읽기/쓰기
alter table public.categories   enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "own categories" on public.categories;
create policy "own categories" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own transactions" on public.transactions;
create policy "own transactions" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
