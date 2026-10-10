// The Hono app. Each route streams newline-delimited JSON events
// (see StreamEvent in lib/types.ts) so the page can show stages live.
import { Hono } from "hono";
import { stream } from "hono/streaming";
import { checkAll } from "./lib/checkFacts.js";
import { fetchPage, fetchViaExa, UnsafeUrlError } from "./lib/fetchPage.js";
import { isQuotaError } from "./lib/gemini.js";
import { pickStack, refineStack, type Edits } from "./lib/pickStack.js";
import { readHackathon } from "./lib/readHackathon.js";
import type { HackathonSummary, Layer, StackResult, StreamEvent } from "./lib/types.js";

export const app = new Hono().basePath("/api");

const MAX_IDEA_CHARS = 1200;
const MIN_PASTED_CHARS = 200;
const MAX_PASTED_CHARS = 30_000;

// Errors shown to the user as-is (bad input), not logged as failures.
class InputError extends Error {}

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof UnsafeUrlError || err instanceof InputError) return err.message;
  if (isQuotaError(err)) return "Gemini's free daily limit is used up. Try again later.";
  return fallback;
}

function ndjson(
  c: Parameters<typeof stream>[0],
  name: string,
  fallback: string,
  run: (send: (e: StreamEvent) => Promise<unknown>) => Promise<void>,
) {
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

// Only kept as the summary's source link, never fetched.
function linkOrUndefined(raw: unknown) {
  if (typeof raw !== "string") return undefined;
  try {
    const u = new URL(raw);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

// { url } fetches and reads the page. If it can't be read, the stream sends
// `unreadable` and the page asks for the text, which comes back as { pastedText, url }.
app.post("/hackathon", async (c) => {
  type Body = { url?: unknown; pastedText?: unknown };
  const body = await c.req.json<Body>().catch(() => ({}) as Body);
  return ndjson(c, "/api/hackathon", "Something went wrong reading that page. Try again.", async (send) => {
    if (typeof body.pastedText === "string") {
      const text = body.pastedText.trim();
      if (text.length < MIN_PASTED_CHARS)
        throw new InputError("That's too short. Paste the whole page: rules, prizes and requirements.");
      await send({ type: "stage", label: "Reading the rules" });
      const summary = await readHackathon(text.slice(0, MAX_PASTED_CHARS), linkOrUndefined(body.url));
      await send({ type: "summary", data: summary });
      return;
    }
    if (typeof body.url !== "string" || !body.url) throw new InputError("Paste a hackathon link first.");
    await send({ type: "stage", label: "Fetching page" });
    let page = await fetchPage(body.url);
    if (!page.ok) {
      console.warn(`[hackathon] direct fetch failed for ${body.url}: ${page.reason}`);
      page = await fetchViaExa(body.url);
    }
    if (!page.ok) {
      console.warn(`[hackathon] unreadable ${body.url}: ${page.reason}`);
      await send({ type: "unreadable" });
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
    platform: ["web", "mobile", "either"].includes(r.platform as string)
      ? (r.platform as HackathonSummary["platform"])
      : "unknown",
    notes: strings(r.notes).slice(0, 5),
  };
}

// The previous result comes back from the page. Untouched layers are returned
// exactly as sent, so only the shape is checked here.
function cleanPrevious(raw: unknown): StackResult | null {
  const r = raw as { needs?: unknown; layers?: unknown } | null;
  if (!r || !Array.isArray(r.layers) || !r.layers.length || r.layers.length > 6) return null;
  const ok = r.layers.every(
    (l: Partial<Layer>) => typeof l?.layer === "string" && typeof l.pick === "string" && Array.isArray(l.facts),
  );
  return ok ? { needs: Array.isArray(r.needs) ? r.needs : [], layers: r.layers } : null;
}

function cleanEdits(raw: unknown, previous: StackResult): Edits {
  const r = (raw ?? {}) as { swaps?: unknown; pastTools?: unknown };
  const swaps: Record<string, string> = {};
  for (const layer of previous.layers) {
    const value = (r.swaps as Record<string, unknown> | undefined)?.[layer.layer];
    const pick = typeof value === "string" ? value.trim().slice(0, 60) : "";
    if (pick && pick !== layer.pick) swaps[layer.layer] = pick;
  }
  const pastTools = typeof r.pastTools === "string" ? r.pastTools.trim().slice(0, 300) : "";
  return { swaps, pastTools };
}

// { hackathon, idea } picks a new stack. Adding { previous, edits } applies the
// user's swaps and past tools, and rechecks only the layers that change.
app.post("/stack", async (c) => {
  type Body = { hackathon?: unknown; idea?: unknown; previous?: unknown; edits?: unknown };
  const body = await c.req.json<Body>().catch(() => ({}) as Body);
  return ndjson(c, "/api/stack", "Something went wrong picking the stack. Try again.", async (send) => {
    const summary = cleanSummary(body.hackathon);
    const idea = typeof body.idea === "string" ? body.idea.trim() : "";
    if (!summary) throw new InputError("Read a hackathon link first.");
    if (idea.length < 10) throw new InputError("Describe your idea in a sentence or two.");
    if (idea.length > MAX_IDEA_CHARS) throw new InputError(`Keep the idea under ${MAX_IDEA_CHARS} characters.`);

    if (body.previous !== undefined) {
      const previous = cleanPrevious(body.previous);
      if (!previous) throw new InputError("Pick a stack first, then edit it.");
      const edits = cleanEdits(body.edits, previous);
      if (!Object.keys(edits.swaps).length && !edits.pastTools)
        throw new InputError("Change a pick or add a tool first.");

      await send({ type: "stage", label: "Applying your changes" });
      const changedLayers = await refineStack(summary, idea, previous, edits);
      let started = 0;
      const checked = await checkAll(changedLayers, (layer) =>
        send({ type: "stage", label: `Checking live limits: ${layer.pick} (${++started} of ${changedLayers.length})` }),
      );
      const byName = new Map(checked.map((l) => [l.layer, l]));
      const layers = previous.layers.map((l) => byName.get(l.layer) ?? l);
      await send({ type: "result", data: { needs: previous.needs, layers }, changed: [...byName.keys()] });
      return;
    }

    await send({ type: "stage", label: "Working out what the idea needs" });
    const result = await pickStack(summary, idea);
    let started = 0;
    const layers = await checkAll(result.layers, (layer) =>
      send({ type: "stage", label: `Checking live limits: ${layer.pick} (${++started} of ${result.layers.length})` }),
    );
    await send({ type: "result", data: { ...result, layers } });
  });
});
