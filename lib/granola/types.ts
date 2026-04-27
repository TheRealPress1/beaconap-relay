export type GranolaAttendee = {
  email?: string;
  name?: string;
};

export type GranolaMeeting = {
  id: string;
  title: string;
  occurred_at: string;
  duration_minutes?: number;
  attendees: GranolaAttendee[];
  summary?: string;
  transcript?: string;
};

export type GranolaListResult = {
  meetings: GranolaMeeting[];
  next_cursor?: string;
};
