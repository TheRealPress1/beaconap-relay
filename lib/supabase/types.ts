export type ContactStatus = "Cold" | "Nurture" | "Warm" | "Hot";

export type ProposedTopic = {
  topic: string;
  confidence: number;
  source: "claude" | "heuristic";
  proposed_at: string;
};

export type ContactRow = {
  id: string;
  first_name: string;
  last_name: string | null;
  full_name: string;
  company: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  industry: string | null;
  status: ContactStatus;
  source: string | null;
  score: number;
  engagement: number;
  last_touch_at: string | null;
  gradient: string | null;
  topics: string[];
  proposed_topics: ProposedTopic[];
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CsvImportStatus = "pending" | "completed" | "failed";

export type CsvImportRow = {
  id: string;
  filename: string;
  row_count: number;
  column_map: Record<string, string> | null;
  status: CsvImportStatus;
  imported_at: string;
  raw_csv: string;
  new_count: number;
  updated_count: number;
  duplicate_count: number;
  error: string | null;
};

type ContactInsert = Omit<ContactRow, "id" | "full_name" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
  full_name?: never;
};

type CsvImportInsert = Omit<CsvImportRow, "id" | "imported_at"> & {
  id?: string;
  imported_at?: string;
};

export type TopicTaxonomyRow = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

type TopicTaxonomyInsert = {
  id?: string;
  slug: string;
  label: string;
  description?: string | null;
  archived_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type TopicUsageRow = TopicTaxonomyRow & {
  contact_count: number;
};

export type ResearchRunStatus = "queued" | "running" | "done" | "failed";

export type ResearchFindingKind =
  | "podcast"
  | "article"
  | "interview"
  | "linkedin_post"
  | "other";

export type ResearchRunRow = {
  id: string;
  contact_id: string;
  status: ResearchRunStatus;
  started_at: string;
  finished_at: string | null;
  model: string | null;
  search_provider: string | null;
  query_count: number;
  error: string | null;
  talking_points: string[];
  created_at: string;
};

type ResearchRunInsert = {
  id?: string;
  contact_id: string;
  status?: ResearchRunStatus;
  started_at?: string;
  finished_at?: string | null;
  model?: string | null;
  search_provider?: string | null;
  query_count?: number;
  error?: string | null;
  talking_points?: string[];
  created_at?: string;
};

export type ResearchFindingRow = {
  id: string;
  run_id: string;
  contact_id: string;
  kind: ResearchFindingKind;
  title: string;
  url: string | null;
  source: string | null;
  published_at: string | null;
  summary: string | null;
  talking_points: string[];
  raw_excerpt: string | null;
  relevance_score: number;
  created_at: string;
};

type ResearchFindingInsert = {
  id?: string;
  run_id: string;
  contact_id: string;
  kind: ResearchFindingKind;
  title: string;
  url?: string | null;
  source?: string | null;
  published_at?: string | null;
  summary?: string | null;
  talking_points?: string[];
  raw_excerpt?: string | null;
  relevance_score?: number;
  created_at?: string;
};

export type SearchCacheRow = {
  query_hash: string;
  provider: string;
  results: unknown;
  cached_at: string;
};

type SearchCacheInsert = {
  query_hash: string;
  provider: string;
  results: unknown;
  cached_at?: string;
};

export type LatestResearchRow = {
  id: string;
  contact_id: string;
  status: ResearchRunStatus;
  started_at: string;
  finished_at: string | null;
  search_provider: string | null;
  model: string | null;
  talking_points: string[];
  finding_count: number;
};

export type OutreachTone = "warm" | "professional" | "curious" | "provocative";

export type OutreachDraftStatus = "draft" | "copied" | "sent" | "archived";

export type OutreachStyleKind = "good_example" | "bad_example" | "voice_note";

export type OutreachUsedFinding = {
  id: string;
  title: string;
  url: string | null;
};

export type OutreachDraftRow = {
  id: string;
  contact_id: string;
  run_id: string | null;
  tone: OutreachTone;
  status: OutreachDraftStatus;
  subject: string;
  body: string;
  used_findings: OutreachUsedFinding[];
  sent_at: string | null;
  sent_via: string | null;
  created_at: string;
  updated_at: string;
};

type OutreachDraftInsert = {
  id?: string;
  contact_id: string;
  run_id?: string | null;
  tone?: OutreachTone;
  status?: OutreachDraftStatus;
  subject: string;
  body: string;
  used_findings?: OutreachUsedFinding[];
  sent_at?: string | null;
  sent_via?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type OutreachStyleRow = {
  id: string;
  kind: OutreachStyleKind;
  label: string;
  body: string;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

type OutreachStyleInsert = {
  id?: string;
  kind: OutreachStyleKind;
  label: string;
  body: string;
  archived_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type InteractionKind = "meeting" | "email" | "call" | "enrichment" | "note";

export type InteractionSource =
  | "granola"
  | "apollo"
  | "gmail"
  | "outlook"
  | "manual";

export type ContactInteractionRow = {
  id: string;
  contact_id: string;
  kind: InteractionKind;
  source: InteractionSource;
  source_id: string | null;
  occurred_at: string;
  title: string | null;
  summary: string | null;
  raw: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type ContactInteractionInsert = {
  id?: string;
  contact_id: string;
  kind: InteractionKind;
  source: InteractionSource;
  source_id?: string | null;
  occurred_at?: string;
  title?: string | null;
  summary?: string | null;
  raw?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

export type ConnectorSyncStatus = "idle" | "running" | "done" | "failed";

export type ConnectorSyncRow = {
  provider: string;
  last_synced_at: string | null;
  last_cursor: string | null;
  status: ConnectorSyncStatus;
  matched_count: number;
  inserted_count: number;
  error: string | null;
  created_at: string;
  updated_at: string;
};

type ConnectorSyncInsert = {
  provider: string;
  last_synced_at?: string | null;
  last_cursor?: string | null;
  status?: ConnectorSyncStatus;
  matched_count?: number;
  inserted_count?: number;
  error?: string | null;
};

export type LatestInteractionRow = {
  id: string;
  contact_id: string;
  kind: InteractionKind;
  source: InteractionSource;
  occurred_at: string;
  title: string | null;
  summary: string | null;
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      contacts: {
        Row: ContactRow;
        Insert: Partial<ContactInsert> & Pick<ContactInsert, "first_name">;
        Update: Partial<Omit<ContactRow, "id" | "full_name">>;
        Relationships: [];
      };
      csv_imports: {
        Row: CsvImportRow;
        Insert: Partial<CsvImportInsert> & Pick<CsvImportInsert, "filename" | "raw_csv">;
        Update: Partial<Omit<CsvImportRow, "id">>;
        Relationships: [];
      };
      topics_taxonomy: {
        Row: TopicTaxonomyRow;
        Insert: TopicTaxonomyInsert;
        Update: Partial<Omit<TopicTaxonomyRow, "id">>;
        Relationships: [];
      };
      research_runs: {
        Row: ResearchRunRow;
        Insert: ResearchRunInsert;
        Update: Partial<Omit<ResearchRunRow, "id">>;
        Relationships: [];
      };
      research_findings: {
        Row: ResearchFindingRow;
        Insert: ResearchFindingInsert;
        Update: Partial<Omit<ResearchFindingRow, "id">>;
        Relationships: [];
      };
      search_cache: {
        Row: SearchCacheRow;
        Insert: SearchCacheInsert;
        Update: Partial<SearchCacheRow>;
        Relationships: [];
      };
      outreach_drafts: {
        Row: OutreachDraftRow;
        Insert: OutreachDraftInsert;
        Update: Partial<Omit<OutreachDraftRow, "id">>;
        Relationships: [];
      };
      outreach_style: {
        Row: OutreachStyleRow;
        Insert: OutreachStyleInsert;
        Update: Partial<Omit<OutreachStyleRow, "id">>;
        Relationships: [];
      };
      contact_interactions: {
        Row: ContactInteractionRow;
        Insert: ContactInteractionInsert;
        Update: Partial<Omit<ContactInteractionRow, "id">>;
        Relationships: [];
      };
      connector_syncs: {
        Row: ConnectorSyncRow;
        Insert: ConnectorSyncInsert;
        Update: Partial<Omit<ConnectorSyncRow, "provider">>;
        Relationships: [];
      };
    };
    Views: {
      topic_usage: {
        Row: TopicUsageRow;
        Relationships: [];
      };
      latest_research: {
        Row: LatestResearchRow;
        Relationships: [];
      };
      latest_interaction: {
        Row: LatestInteractionRow;
        Relationships: [];
      };
      latest_outreach_draft: {
        Row: OutreachDraftRow;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: {
      contact_status: ContactStatus;
      csv_import_status: CsvImportStatus;
      research_run_status: ResearchRunStatus;
      research_finding_kind: ResearchFindingKind;
      outreach_draft_status: OutreachDraftStatus;
      outreach_tone: OutreachTone;
      outreach_style_kind: OutreachStyleKind;
      interaction_kind: InteractionKind;
      interaction_source: InteractionSource;
      connector_sync_status: ConnectorSyncStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
