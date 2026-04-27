export type ApolloEnrichment = {
  source_id: string | null;
  title: string | null;
  seniority: string | null;
  industry: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  github_url: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  employment_history: Array<{
    title: string;
    company: string;
    start: string | null;
    end: string | null;
  }>;
};

export type ApolloSequenceResult = {
  sequence_id: string;
  contact_apollo_id: string | null;
  status: "added" | "already_in_sequence" | "skipped";
  message: string;
};
