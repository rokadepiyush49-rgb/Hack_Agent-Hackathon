/**
 * API contracts. Route handlers (`app/api/.../route.ts`) build responses
 * shaped like these; feature `service.ts` files (client side) parse
 * responses typed as these. Keep this file the single source of truth —
 * if a field changes here, both sides feel it via a type error, not a
 * silent runtime mismatch.
 */

export interface ApiError {
  error: string;
  /** Machine-readable code for client-side branching (e.g. "NOT_FOUND"). */
  code?: string;
}

// ---- Pitches / meetings ----------------------------------------------

export interface CreatePitchRequest {
  startupName: string;
  oneLiner: string;
  industry: string;
  stage: string;
  pitch: string;
  /** Executive persona ids to seat for this session — see lib/ai/executives.ts. */
  executiveIds: string[];
}

export interface CreatePitchResponse {
  meetingId: string;
  status: "queued" | "in-progress";
}

export type MeetingStatus = "scheduled" | "in-progress" | "completed";

export interface MeetingTranscriptMessage {
  id: string;
  speakerId: string;
  speakerName: string;
  role: string;
  message: string;
  createdAt: string;
}

export interface MeetingResponse {
  id: string;
  startupName: string;
  status: MeetingStatus;
  transcript: MeetingTranscriptMessage[];
  /** Present once at least one executive has voted. */
  votes?: Record<string, "yes" | "no" | "conditional">;
  /** Present once the session has produced a final report. */
  reportId?: string;
}

export interface AdvanceDebateRequest {
  /** Optional founder reply to the board's last question — omit to let the next executive speak unprompted. */
  founderMessage?: string;
}

export interface AdvanceDebateResponse {
  message: MeetingTranscriptMessage;
  /** True once every seated executive has spoken and voted. */
  isComplete: boolean;
}

// ---- Reports ------------------------------------------------------------

export interface ReportListResponse {
  reports: Array<{
    id: string;
    startupName: string;
    oneLiner: string;
    industry: string;
    investmentScore: number;
    verdict: "Strong buy" | "Conditional" | "Pass";
    generatedAt: string;
  }>;
}

// Full report detail reuses features/reports/types.ts's ReportDetail shape
// server-side — see lib/server/reports.ts.

// ---- Executives -----------------------------------------------------------

export interface ExecutiveListResponse {
  executives: Array<{
    id: string;
    name: string;
    role: string;
    trait: string;
    bio: string;
    focusAreas: string[];
  }>;
}

// ---- History --------------------------------------------------------------

export interface HistoryListResponse {
  entries: Array<{
    id: string;
    title: string;
    description: string;
    timestamp: string;
    changeType: "Report" | "Pitch deck" | "PRD" | "Financials";
  }>;
}
