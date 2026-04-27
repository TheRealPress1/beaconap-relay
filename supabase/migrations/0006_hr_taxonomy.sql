-- BeaconAP — Phase 5.5: swap deal-side seed taxonomy for HR-flavored topics
-- Michael's actual book is People/Talent leaders at large asset managers, not
-- deal/portfolio side. The 0002 seed topics are archived (not deleted) so any
-- existing classifications stay intact and the CEO can restore individual
-- topics from /settings/taxonomy if needed.

update topics_taxonomy
set archived_at = now()
where slug in (
  'asset-management',
  'private-credit',
  'private-equity',
  'hedge-funds',
  'm-and-a',
  'ipo-markets',
  'multi-asset',
  'macro-rates',
  'risk-compliance',
  'ai-in-finance',
  'esg',
  'crypto-digital',
  'trading-tech',
  'market-making'
)
and archived_at is null;

insert into topics_taxonomy (slug, label, description) values
  ('talent-acquisition',     'Talent Acquisition',          'Sourcing, hiring, recruiting strategy and pipelines.'),
  ('executive-search',       'Executive Search',            'Senior leadership, C-suite, and partner-level hires.'),
  ('compensation',           'Compensation & Benefits',     'Salary, bonus, equity, deferred comp, total rewards.'),
  ('performance-promotion',  'Performance & Promotion',     'Performance management, calibration, promotion cycles.'),
  ('learning-development',   'L&D / Learning',              'Onboarding, leadership development, upskilling.'),
  ('workforce-planning',     'Workforce Planning',          'Headcount, role design, succession, org design.'),
  ('dei',                    'DEI & Inclusion',             'Diversity, equity, inclusion, belonging programs.'),
  ('employer-brand',         'Employer Brand',              'External narrative, recruiting marketing, careers site.'),
  ('hr-tech',                'HR Tech / HRIS',              'Workday, Greenhouse, Lattice, ATS, HRIS modernization.'),
  ('employment-law',         'Compliance & Employment Law', 'Wage & hour, classification, employment counsel.'),
  ('ai-in-hr',               'AI in HR',                    'LLMs and agentic systems applied to talent workflows.'),
  ('human-capital-esg',      'ESG & Human Capital',         'Human capital reporting, social pillar of ESG.'),
  ('hybrid-rto',             'Hybrid & Return-to-Office',   'Workplace policy, RTO mandates, flexibility.'),
  ('asset-management-context','Asset Management (industry)','Industry context for asset-management HR leaders.')
on conflict (slug) do nothing;
