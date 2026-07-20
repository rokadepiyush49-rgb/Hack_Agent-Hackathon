import { describe, it, expect } from "vitest";
import { validateBoardroomResponse } from "./validator";
import { BoardroomResponse } from "../types/boardroom";

function validResponse(): BoardroomResponse {
  return {
    conversation: [{ speaker: "Alex", role: "CEO", message: "Let's begin." }],
    scores: {
      ceo: { score: 7, vote: "INVEST", reason: "Strong vision" },
      cto: { score: 6, vote: "CONSIDER", reason: "Feasible but risky" },
      cfo: { score: 5, vote: "CONSIDER", reason: "Thin margins" },
      cmo: { score: 8, vote: "INVEST", reason: "Clear market fit" },
      vc: { score: 7, vote: "INVEST", reason: "Good exit potential" },
    },
    strengths: ["Strong team", "Large market"],
    risks: ["Unproven demand", "High CAC"],
    decision: { verdict: "INVEST", confidence: 75, summary: "Solid pitch." },
    report: "A reasonably promising early-stage opportunity.",
  } as BoardroomResponse;
}

describe("validateBoardroomResponse", () => {
  it("accepts a well-formed response", () => {
    expect(validateBoardroomResponse(validResponse())).toBe(true);
  });

  it("rejects non-object input", () => {
    expect(validateBoardroomResponse(null)).toBe(false);
    expect(validateBoardroomResponse("not json")).toBe(false);
  });

  it("rejects a score out of range", () => {
    const bad = validResponse();
    bad.scores.ceo.score = 11;
    expect(validateBoardroomResponse(bad)).toBe(false);
  });

  it("rejects an invalid vote value", () => {
    const bad = validResponse();
    // @ts-expect-error intentionally invalid for the test
    bad.scores.cfo.vote = "MAYBE";
    expect(validateBoardroomResponse(bad)).toBe(false);
  });

  it("rejects confidence out of range", () => {
    const bad = validResponse();
    bad.decision.confidence = 150;
    expect(validateBoardroomResponse(bad)).toBe(false);
  });

  it("rejects a missing conversation array", () => {
    const bad = validResponse();
    // @ts-expect-error intentionally invalid for the test
    delete bad.conversation;
    expect(validateBoardroomResponse(bad)).toBe(false);
  });

  it("rejects a non-string report", () => {
    const bad = validResponse();
    // @ts-expect-error intentionally invalid for the test
    bad.report = 12345;
    expect(validateBoardroomResponse(bad)).toBe(false);
  });
});