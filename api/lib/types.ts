// Shared between the API and the page (web/ imports this file directly).

export type HackathonSummary = {
  name: string;
  sourceUrl?: string;
  requiredTech: string[]; // must-use tools or sponsor tech
  liveLinkRequired: boolean | "unknown";
  platform: "web" | "mobile" | "either" | "unknown";
  notes: string[]; // other limits worth knowing (deadline, rules)
};

export type Source = { title: string; url: string };

export type Fact = {
  label: string; // e.g. "Free requests per day"
  value: string; // e.g. "500" or "Not found"
  tag: "verified" | "vague" | "not_found";
  sources: Source[];
};

// Resolved on the server from the simple-icons package (24x24 viewBox).
export type Icon = { title: string; path: string };

export type Layer = {
  layer: string; // "frontend", "backend", "database", "hosting", "llm", ...
  pick: string; // "Vite + React"
  kind: "service" | "library"; // hosted service with a free tier, or a tool you install
  usualDefault: string; // "Next.js"
  why: string; // why it fits this idea
  whyBeatsDefault: string;
  officialDomain: string; // "neon.com"; a "verified" source must be on this domain
  icons: Icon[]; // pick's brand icon(s), empty when none found
  defaultIcons: Icon[];
  docsUrls: string[]; // official pricing or limits page(s) the fact checker reads
  facts: Fact[]; // limits, local weight, deployed speed
};

export type StackResult = {
  needs: string[]; // inferred from the idea, e.g. "LLM calls", "no realtime"
  layers: Layer[];
};

export type StreamEvent =
  | { type: "stage"; label: string }
  | { type: "unreadable" }
  | { type: "summary"; data: HackathonSummary }
  | { type: "result"; data: StackResult }
  | { type: "error"; message: string };
