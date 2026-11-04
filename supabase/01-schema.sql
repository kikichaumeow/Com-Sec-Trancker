-- 喺 Supabase 後台 SQL Editor 貼上並按 Run（只需做一次）

create table if not exists store (
  collection text not null,
  id         text not null,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);

-- 按你要求：唔做登入。開放畀 anon key 讀寫（知道 key 嘅人就可以讀寫，請唔好公開個網址）
alter table store enable row level security;
drop policy if exists "open" on store;
create policy "open" on store for all using (true) with check (true);

-- 修改／刪除歷史：任何紀錄被改或被刪，舊內容會自動留底（Activity Log 除外），方便救返
create table if not exists store_history (
  hid        bigserial primary key,
  collection text,
  id         text,
  data       jsonb,
  op         text,
  changed_at timestamptz not null default now()
);
alter table store_history enable row level security;   -- 無 policy = 只有你喺後台先睇到

create or replace function log_store_change() returns trigger
language plpgsql security definer as $$
begin
  if old.collection <> 'activityLogs' and (TG_OP = 'DELETE' or old.data is distinct from new.data) then
    insert into store_history(collection, id, data, op) values (old.collection, old.id, old.data, TG_OP);
  end if;
  if TG_OP = 'DELETE' then return old; end if;
  return new;
end $$;

drop trigger if exists store_history_trg on store;
create trigger store_history_trg before update or delete on store
  for each row execute function log_store_change();

create index if not exists store_collection_idx on store(collection);
