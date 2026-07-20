// src/ai/validator.ts

import {
  BoardroomResponse,
  VoteType,
} from "../types/boardroom";

const VALID_VOTES: VoteType[] = [
  "INVEST",
  "CONSIDER",
  "PASS",
];

export function validateBoardroomResponse(
  data: unknown
): data is BoardroomResponse {
  if (!data || typeof data !== "object") {
    return false;
  }

  const boardroom = data as BoardroomResponse;

  if (!Array.isArray(boardroom.conversation)) {
    return false;
  }

  if (!boardroom.scores) {
    return false;
  }

  if (!Array.isArray(boardroom.strengths)) {
    return false;
  }

  if (!Array.isArray(boardroom.risks)) {
    return false;
  }

  if (!boardroom.decision) {
    return false;
  }

  if (typeof boardroom.report !== "string") {
    return false;
  }

  const scores = [
    boardroom.scores.ceo,
    boardroom.scores.cto,
    boardroom.scores.cfo,
    boardroom.scores.cmo,
    boardroom.scores.vc,
  ];

  for (const score of scores) {
    if (!score) {
      return false;
    }

    if (
      typeof score.score !== "number" ||
      score.score < 0 ||
      score.score > 10
    ) {
      return false;
    }

    if (!VALID_VOTES.includes(score.vote)) {
      return false;
    }

    if (typeof score.reason !== "string") {
      return false;
    }
  }

  if (
    typeof boardroom.decision.confidence !== "number" ||
    boardroom.decision.confidence < 0 ||
    boardroom.decision.confidence > 100
  ) {
    return false;
  }

  if (
    !VALID_VOTES.includes(
      boardroom.decision.verdict
    )
  ) {
    return false;
  }

  return true;
}