// Shared between the API and the page (web/ imports this file directly).

export type HackathonSummary = {
  name: string;
  sourceUrl?: string;
  requiredTech: string[]; // must-use tools or sponsor tech
  liveLinkRequired: boolean | "unknown";
  platform: "web" | "mobile" | "either" | "unknown";
  notes: string[]; // other limits worth knowing (deadline, rules)
};

export type StreamEvent =
  | { type: "stage"; label: string }
  | { type: "unreadable" }
  | { type: "summary"; data: HackathonSummary }
  | { type: "error"; message: string };
