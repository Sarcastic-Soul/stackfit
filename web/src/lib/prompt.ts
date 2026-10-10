// Builds a self-contained prompt that asks any AI agent to repeat StackFit's
// process for this hackathon and idea, starting from the current stack.
import type { HackathonSummary, StackResult } from "../../../api/lib/types";

function hackathonPart(summary: HackathonSummary) {
  const limits = [
    summary.requiredTech.length ? `Required tech: ${summary.requiredTech.join(", ")}` : "",
    `Live link required: ${summary.liveLinkRequired}`,
    `Platform: ${summary.platform}`,
    ...summary.notes.map((n) => `Note: ${n}`),
  ].filter(Boolean);
  const where = summary.sourceUrl ? `${summary.name} (${summary.sourceUrl})` : summary.name;
  return `Hackathon: ${where}\n${limits.map((l) => `- ${l}`).join("\n")}`;
}

export function buildPrompt(summary: HackathonSummary, idea: string, result: StackResult) {
  const picks = result.layers.map((l) => `- ${l.layer}: ${l.pick} (instead of ${l.usualDefault})`).join("\n");
  return `Help me pick the tech stack for a hackathon project. Follow these steps in order.

1. Read the hackathon.${summary.sourceUrl ? " Open the link below and read the rules, prizes and requirements." : ""} Note anything that limits the stack: required or sponsor tech, whether a live link is required, and web or mobile.
2. Work out what my idea needs and doesn't need (for example "LLM calls", "no realtime", "no login"). Don't change my idea.
3. Pick the lightest free tool for each layer the project needs (frontend, backend, database, hosting, plus llm, auth or storage if needed). Lightest means fast to set up, small to run, quick to deploy, and a free tier that needs no card and doesn't sleep if a live link is required. Respect required tech. Never pick a paid-only API or a deprecated tool. For each pick, also name what an AI assistant would usually suggest and say in one sentence why the pick beats it here.
4. Look up current free tier limits for each pick live on the provider's own pricing or limits page. Don't use what you remember: limits change often. For libraries, look up license, install size and speed instead.
5. Tag every fact: "verified" if the provider's own page states a number, "vague" if it was found but isn't a clear number or isn't on an official page, "not found" if no page says it. Show not found facts too.
6. Cite the source URL for every fact.
7. Answer with one short section per layer: pick, usual default, why, then the tagged facts with sources.

${hackathonPart(summary)}

My idea:
${idea}

Stack so far (check it, and change a pick only if you find a lighter free one that meets the needs):
${picks}`;
}
