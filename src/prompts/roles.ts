// src/prompts/roles.ts

import { CEO_AGENT } from "../agents/ceo";
import { CTO_AGENT } from "../agents/cto";
import { CFO_AGENT } from "../agents/cfo";
import { CMO_AGENT } from "../agents/cmo";
import { VC_AGENT } from "../agents/vc";

const ALL_AGENTS = [CEO_AGENT, CTO_AGENT, CFO_AGENT, CMO_AGENT, VC_AGENT];

export const EXECUTIVE_ROLES = ALL_AGENTS.map(
  (agent) => `
${agent.role} (${agent.title})
${agent.personality.trim()}
`
).join("\n");
