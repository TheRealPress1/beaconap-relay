-- BeaconAP — Phase 2: topic taxonomy
-- Adds a CEO-curated topic vocabulary plus AI-proposed staging field on contacts.

create table if not exists topics_taxonomy (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  label       text not null,
  description text,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists topics_taxonomy_active_idx
  on topics_taxonomy (archived_at)
  where archived_at is null;

drop trigger if exists topics_taxonomy_set_updated_at on topics_taxonomy;
create trigger topics_taxonomy_set_updated_at
  before update on topics_taxonomy
  for each row execute function set_updated_at();

-- Seed the starter taxonomy. ON CONFLICT no-op so re-running migrations is safe.
insert into topics_taxonomy (slug, label, description) values
  ('asset-management',  'Asset Management',  'Mutual funds, ETFs, separately managed accounts, institutional asset managers.'),
  ('private-credit',    'Private Credit',    'Direct lending, mezzanine, distressed debt, BDCs.'),
  ('private-equity',    'Private Equity',    'Buyouts, growth equity, secondaries.'),
  ('hedge-funds',       'Hedge Funds',       'Long/short equity, multi-strategy, global macro.'),
  ('m-and-a',           'M&A',               'Mergers, acquisitions, strategic transactions.'),
  ('ipo-markets',       'IPO Markets',       'Equity capital markets, public offerings, listings.'),
  ('multi-asset',       'Multi-Asset',       'Allocation strategy across equities, fixed income, alternatives.'),
  ('macro-rates',       'Macro & Rates',     'Interest rates, central bank policy, FX, sovereign credit.'),
  ('risk-compliance',   'Risk & Compliance', 'Model risk, regulatory exams, governance, audit.'),
  ('ai-in-finance',     'AI in Finance',     'Models, LLMs, agentic systems applied to investing & operations.'),
  ('esg',               'ESG',               'Sustainable investing, climate, social, governance.'),
  ('crypto-digital',    'Crypto / Digital',  'Digital assets, stablecoins, tokenization, DeFi.'),
  ('trading-tech',      'Trading Tech',      'Execution, market microstructure, low-latency systems.'),
  ('market-making',     'Market Making',     'Liquidity provision in equities, options, fixed income.')
on conflict (slug) do nothing;

-- AI-proposed topics live on the contact until the CEO approves them, at which point
-- they migrate into the existing `topics` jsonb (Phase 1 column).
alter table contacts
  add column if not exists proposed_topics jsonb not null default '[]'::jsonb;

create index if not exists contacts_proposed_topics_gin
  on contacts using gin (proposed_topics);

-- Helper view: topics with active contact counts (useful for taxonomy UI + dashboard).
create or replace view topic_usage as
  select
    t.id,
    t.slug,
    t.label,
    t.description,
    t.archived_at,
    coalesce(counts.contact_count, 0) as contact_count
  from topics_taxonomy t
  left join lateral (
    select count(*)::integer as contact_count
    from contacts c
    where c.topics ? t.label
  ) counts on true;
