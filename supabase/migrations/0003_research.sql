-- BeaconAP — Phase 3: research pipeline
-- On-demand client briefings (podcasts, articles, interviews, LinkedIn).

do $$ begin
  create type research_run_status as enum ('queued', 'running', 'done', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type research_finding_kind as enum (
    'podcast', 'article', 'interview', 'linkedin_post', 'other'
  );
exception when duplicate_object then null; end $$;

create table if not exists research_runs (
  id              uuid primary key default gen_random_uuid(),
  contact_id      uuid not null references contacts(id) on delete cascade,
  status          research_run_status not null default 'queued',
  started_at      timestamptz not null default now(),
  finished_at     timestamptz,
  model           text,
  search_provider text,
  query_count     integer not null default 0,
  error           text,
  talking_points  jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists research_runs_contact_started_idx
  on research_runs (contact_id, started_at desc);

create index if not exists research_runs_status_idx
  on research_runs (status)
  where status in ('queued', 'running');

create table if not exists research_findings (
  id               uuid primary key default gen_random_uuid(),
  run_id           uuid not null references research_runs(id) on delete cascade,
  contact_id       uuid not null references contacts(id) on delete cascade,
  kind             research_finding_kind not null,
  title            text not null,
  url              text,
  source           text,
  published_at     timestamptz,
  summary          text,
  talking_points   jsonb not null default '[]'::jsonb,
  raw_excerpt      text,
  relevance_score  numeric(3,2) not null default 0.5,
  created_at       timestamptz not null default now()
);

create index if not exists research_findings_run_idx
  on research_findings (run_id);
create index if not exists research_findings_contact_idx
  on research_findings (contact_id, kind);

-- 24h dedupe cache for billable provider calls.
create table if not exists search_cache (
  query_hash  text not null,
  provider    text not null,
  results     jsonb not null,
  cached_at   timestamptz not null default now(),
  primary key (query_hash, provider)
);

create index if not exists search_cache_age_idx on search_cache (cached_at);

-- Convenience view: latest done run per contact + finding counts.
create or replace view latest_research as
  select distinct on (r.contact_id)
    r.id,
    r.contact_id,
    r.status,
    r.started_at,
    r.finished_at,
    r.search_provider,
    r.model,
    r.talking_points,
    coalesce(counts.finding_count, 0) as finding_count
  from research_runs r
  left join lateral (
    select count(*)::integer as finding_count
    from research_findings f
    where f.run_id = r.id
  ) counts on true
  where r.status = 'done'
  order by r.contact_id, r.started_at desc;
