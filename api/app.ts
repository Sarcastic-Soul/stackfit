// The Hono app. Each route streams newline-delimited JSON events
// (see StreamEvent in lib/types.ts) so the page can show stages live.
import { Hono } from "hono";
import { stream } from "hono/streaming";
import { checkAll } from "./lib/checkFacts";
import { fetchPage, UnsafeUrlError } from "./lib/fetchPage";
import { isQuotaError } from "./lib/gemini";
import { pickStack } from "./lib/pickStack";
import { readHackathon } from "./lib/readHackathon";
import type { HackathonSummary, StreamEvent } from "./lib/types";

export const app = new Hono().basePath("/api");

const MAX_IDEA_CHARS = 1200;

// Errors shown to the user as-is (bad input), not logged as failures.
class InputError extends Error {}

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof UnsafeUrlError || err instanceof InputError) return err.message;
  if (isQuotaError(err)) return "Gemini's free daily limit is used up. Try again later.";
  return fallback;
}

function ndjson(c: Parameters<typeof stream>[0], name: string, fallback: string, run: (send: (e: StreamEvent) => Promise<unknown>) => Promise<void>) {
  c.header("content-type", "application/x-ndjson; charset=utf-8");
  return stream(c, async (s) => {
    const send = (event: StreamEvent) => s.write(JSON.stringify(event) + "\n");
    try {
      await run(send);
    } catch (err) {
      if (!(err instanceof UnsafeUrlError || err instanceof InputError)) console.error(`[${name}]`, err);
      await send({ type: "error", message: errorMessage(err, fallback) });
    }
  });
}

app.post("/hackathon", async (c) => {
  const body = await c.req.json<{ url?: string }>().catch(() => ({}) as { url?: string });
  return ndjson(c, "/api/hackathon", "Something went wrong reading that page. Try again.", async (send) => {
    if (!body.url) throw new InputError("Paste a hackathon link first.");
    await send({ type: "stage", label: "Fetching page" });
    const page = await fetchPage(body.url);
    if (!page.ok) {
      await send({ type: "error", message: "The link you provided isn't accessible from here. Please confirm the link is public." });
      return;
    }
    await send({ type: "stage", label: "Reading the rules" });
    const summary = await readHackathon(page.text, page.url);
    await send({ type: "summary", data: summary });
  });
});

// The summary comes back from the page, so only plain, short fields are kept.
function cleanSummary(raw: unknown): HackathonSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const strings = (v: unknown) => (Array.isArray(v) ? v.map((x) => String(x).slice(0, 200)).slice(0, 10) : []);
  return {
    name: String(r.name ?? "").slice(0, 200),
    requiredTech: strings(r.requiredTech),
    liveLinkRequired: r.liveLinkRequired === true || r.liveLinkRequired === false ? r.liveLinkRequired : "unknown",
    platform: ["web", "mobile", "either"].includes(r.platform as string) ? (r.platform as HackathonSummary["platform"]) : "unknown",
    notes: strings(r.notes).slice(0, 5),
  };
}

app.post("/stack", async (c) => {
  const body = await c.req.json<{ hackathon?: unknown; idea?: unknown }>().catch(() => ({}) as Record<string, unknown>);
  return ndjson(c, "/api/stack", "Something went wrong picking the stack. Try again.", async (send) => {
    const summary = cleanSummary(body.hackathon);
    const idea = typeof body.idea === "string" ? body.idea.trim() : "";
    if (!summary) throw new InputError("Read a hackathon link first.");
    if (idea.length < 10) throw new InputError("Describe your idea in a sentence or two.");
    if (idea.length > MAX_IDEA_CHARS) throw new InputError(`Keep the idea under ${MAX_IDEA_CHARS} characters.`);

    await send({ type: "stage", label: "Working out what the idea needs" });
    const result = await pickStack(summary, idea);
    let started = 0;
    const layers = await checkAll(result.layers, (layer) =>
      send({ type: "stage", label: `Checking live limits: ${layer.pick} (${++started} of ${result.layers.length})` }),
    );
    await send({ type: "result", data: { ...result, layers } });
  });
});
