// src/types/boardroom.ts

export type ExecutiveRole =
  | "CEO"
  | "CTO"
  | "CFO"
  | "CMO"
  | "VC";

export type VoteType =
  | "INVEST"
  | "CONSIDER"
  | "PASS";

export interface StartupInput {
  startupName: string;
  industry: string;
  problem: string;
  solution: string;
  targetMarket: string;
  businessModel: string;
  competition: string;
  fundingRequired: string;
}

export interface ConversationMessage {
  speaker: string;
  role: ExecutiveRole;
  message: string;
}

export interface ExecutiveScore {
  score: number;
  vote: VoteType;
  reason: string;
}

export interface BoardroomResponse {
  conversation: ConversationMessage[];

  scores: {
    ceo: ExecutiveScore;
    cto: ExecutiveScore;
    cfo: ExecutiveScore;
    cmo: ExecutiveScore;
    vc: ExecutiveScore;
  };

  strengths: string[];
  risks: string[];

  decision: {
    verdict: VoteType;
    confidence: number;
    summary: string;
  };

  report: string;

  createdAt?: string;
}