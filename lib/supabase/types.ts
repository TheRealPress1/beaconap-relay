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
    };
    Views: {
      topic_usage: {
        Row: TopicUsageRow;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: {
      contact_status: ContactStatus;
      csv_import_status: CsvImportStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
