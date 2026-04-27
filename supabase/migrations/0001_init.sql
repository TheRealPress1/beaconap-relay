-- BeaconAP — initial schema
-- Phase 1: contacts + csv_imports

create extension if not exists "pgcrypto";

-- Contact pipeline status
do $$ begin
  create type contact_status as enum ('Cold', 'Nurture', 'Warm', 'Hot');
exception when duplicate_object then null; end $$;

-- CSV import lifecycle
do $$ begin
  create type csv_import_status as enum ('pending', 'completed', 'failed');
exception when duplicate_object then null; end $$;

create table if not exists contacts (
  id              uuid primary key default gen_random_uuid(),
  first_name      text not null,
  last_name       text,
  full_name       text generated always as (
                    trim(both ' ' from coalesce(first_name, '') || ' ' || coalesce(last_name, ''))
                  ) stored,
  company         text,
  title           text,
  email           text,
  phone           text,
  linkedin_url    text,
  industry        text,
  status          contact_status not null default 'Cold',
  source          text,
  score           numeric(5,2) not null default 0,
  engagement      numeric(5,2) not null default 0,
  last_touch_at   timestamptz,
  gradient        text,
  topics          jsonb not null default '[]'::jsonb,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists contacts_industry_idx on contacts (industry);
create index if not exists contacts_status_idx on contacts (status);
create index if not exists contacts_email_idx on contacts (lower(email)) where email is not null;
create index if not exists contacts_company_name_idx on contacts (lower(company), lower(full_name));
create index if not exists contacts_topics_gin on contacts using gin (topics);

-- Trigger to keep updated_at fresh
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists contacts_set_updated_at on contacts;
create trigger contacts_set_updated_at
  before update on contacts
  for each row execute function set_updated_at();

create table if not exists csv_imports (
  id                 uuid primary key default gen_random_uuid(),
  filename           text not null,
  row_count          integer not null default 0,
  column_map         jsonb,
  status             csv_import_status not null default 'pending',
  imported_at        timestamptz not null default now(),
  raw_csv            text not null,
  new_count          integer not null default 0,
  updated_count      integer not null default 0,
  duplicate_count    integer not null default 0,
  error              text
);

create index if not exists csv_imports_imported_at_idx on csv_imports (imported_at desc);
