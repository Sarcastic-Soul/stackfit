// The Hono app. Each route streams newline-delimited JSON events
// (see StreamEvent in lib/types.ts) so the page can show stages live.
import { Hono } from "hono";
import { stream } from "hono/streaming";
import { fetchPage, UnsafeUrlError } from "./lib/fetchPage";
import { readHackathon } from "./lib/readHackathon";
import type { StreamEvent } from "./lib/types";

export const app = new Hono().basePath("/api");

function errorMessage(err: unknown) {
  if (err instanceof UnsafeUrlError) return err.message;
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
    return "Gemini's free daily limit is used up. Try again later.";
  }
  return "Something went wrong reading that page. Try again.";
}

app.post("/hackathon", async (c) => {
  const body = await c.req.json<{ url?: string }>().catch(() => ({}) as { url?: string });
  c.header("content-type", "application/x-ndjson; charset=utf-8");
  return stream(c, async (s) => {
    const send = (event: StreamEvent) => s.write(JSON.stringify(event) + "\n");
    try {
      if (!body.url) throw new UnsafeUrlError("Paste a hackathon link first.");
      await send({ type: "stage", label: "Fetching page" });
      const page = await fetchPage(body.url);
      if (!page.ok) {
        await send({ type: "error", message: "The link you provided isn't accessible from here. Please confirm the link is public." });
        return;
      }
      await send({ type: "stage", label: "Reading the rules" });
      const summary = await readHackathon(page.text, page.url);
      await send({ type: "summary", data: summary });
    } catch (err) {
      if (!(err instanceof UnsafeUrlError)) console.error("[/api/hackathon]", err);
      await send({ type: "error", message: errorMessage(err) });
    }
  });
});
