-- BeaconAP — Phase 5: Granola + Apollo connectors

do $$ begin
  create type interaction_kind as enum ('meeting', 'email', 'call', 'enrichment', 'note');
exception when duplicate_object then null; end $$;

do $$ begin
  create type interaction_source as enum ('granola', 'apollo', 'gmail', 'outlook', 'manual');
exception when duplicate_object then null; end $$;

do $$ begin
  create type connector_sync_status as enum ('idle', 'running', 'done', 'failed');
exception when duplicate_object then null; end $$;

create table if not exists contact_interactions (
  id            uuid primary key default gen_random_uuid(),
  contact_id    uuid not null references contacts(id) on delete cascade,
  kind          interaction_kind not null,
  source        interaction_source not null,
  source_id     text,
  occurred_at   timestamptz not null default now(),
  title         text,
  summary       text,
  raw           jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index if not exists contact_interactions_source_unique
  on contact_interactions (source, source_id)
  where source_id is not null;

create index if not exists contact_interactions_contact_idx
  on contact_interactions (contact_id, occurred_at desc);

drop trigger if exists contact_interactions_set_updated_at on contact_interactions;
create trigger contact_interactions_set_updated_at
  before update on contact_interactions
  for each row execute function set_updated_at();

create table if not exists connector_syncs (
  provider          text primary key,
  last_synced_at    timestamptz,
  last_cursor       text,
  status            connector_sync_status not null default 'idle',
  matched_count     integer not null default 0,
  inserted_count    integer not null default 0,
  error             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists connector_syncs_set_updated_at on connector_syncs;
create trigger connector_syncs_set_updated_at
  before update on connector_syncs
  for each row execute function set_updated_at();

-- Convenience view: most recent interaction per contact (for the timeline tease).
create or replace view latest_interaction as
  select distinct on (contact_id)
    id,
    contact_id,
    kind,
    source,
    occurred_at,
    title,
    summary
  from contact_interactions
  order by contact_id, occurred_at desc;
