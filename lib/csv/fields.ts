export const CONTACT_FIELDS = [
  "first_name",
  "last_name",
  "full_name",
  "email",
  "company",
  "title",
  "phone",
  "linkedin_url",
  "industry",
  "source",
  "notes",
] as const;

export type ContactField = (typeof CONTACT_FIELDS)[number];

export type ColumnMap = Record<string, ContactField | "ignore">;
