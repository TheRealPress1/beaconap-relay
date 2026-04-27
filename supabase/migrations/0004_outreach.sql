-- BeaconAP — Phase 4: outreach drafting

do $$ begin
  create type outreach_draft_status as enum ('draft', 'copied', 'sent', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type outreach_tone as enum ('warm', 'professional', 'curious', 'provocative');
exception when duplicate_object then null; end $$;

do $$ begin
  create type outreach_style_kind as enum ('good_example', 'bad_example', 'voice_note');
exception when duplicate_object then null; end $$;

create table if not exists outreach_drafts (
  id              uuid primary key default gen_random_uuid(),
  contact_id      uuid not null references contacts(id) on delete cascade,
  run_id          uuid references research_runs(id) on delete set null,
  tone            outreach_tone not null default 'warm',
  status          outreach_draft_status not null default 'draft',
  subject         text not null,
  body            text not null,
  used_findings   jsonb not null default '[]'::jsonb,
  sent_at         timestamptz,
  sent_via        text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists outreach_drafts_contact_idx
  on outreach_drafts (contact_id, created_at desc);
create index if not exists outreach_drafts_status_idx
  on outreach_drafts (status);

drop trigger if exists outreach_drafts_set_updated_at on outreach_drafts;
create trigger outreach_drafts_set_updated_at
  before update on outreach_drafts
  for each row execute function set_updated_at();

create table if not exists outreach_style (
  id          uuid primary key default gen_random_uuid(),
  kind        outreach_style_kind not null,
  label       text not null,
  body        text not null,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists outreach_style_active_idx
  on outreach_style (kind)
  where archived_at is null;

drop trigger if exists outreach_style_set_updated_at on outreach_style;
create trigger outreach_style_set_updated_at
  before update on outreach_style
  for each row execute function set_updated_at();

-- Latest draft per contact (any status). Useful for the contact detail page.
create or replace view latest_outreach_draft as
  select distinct on (contact_id)
    id,
    contact_id,
    run_id,
    tone,
    status,
    subject,
    body,
    used_findings,
    sent_at,
    sent_via,
    created_at,
    updated_at
  from outreach_drafts
  order by contact_id, created_at desc;
