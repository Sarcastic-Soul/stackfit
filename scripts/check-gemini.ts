// Build step 1: prove the live-facts path works on this free API key.
// Google Search grounding is not free on this key (429 on 3.x, 2.5 closed to
// new users), so StackFit reads official pages with Gemini's URL context tool
// and falls back to Exa search when a page can't be read. We test instead of
// trusting the docs.
import { GoogleGenAI } from "@google/genai";

const MODELS = ["gemini-3.8-flash", "gemini-3.5-flash-lite"];
const PAGE = "https://neon.com/pricing";
const QUESTION = `Read ${PAGE}. What are the current Neon Postgres free plan limits (storage, compute hours, number of projects)? Answer in 3 short bullet points.`;

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is missing. Add it to .env (see .env.example).");
  process.exit(1);
}
const ai = new GoogleGenAI({ apiKey });

function short(text: string | undefined, max = 160) {
  const flat = (text ?? "").replace(/\s+/g, " ").trim();
  return flat.length > max ? flat.slice(0, max) + "…" : flat;
}

function errorText(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  return short(msg, 200);
}

async function checkPlain(model: string) {
  try {
    const res = await ai.models.generateContent({ model, contents: "Reply with the single word OK." });
    return `PASS  ${model}  plain call: ${short(res.text, 40)}`;
  } catch (err) {
    return `FAIL  ${model}  plain call: ${errorText(err)}`;
  }
}

async function checkUrlContext(model: string) {
  const started = Date.now();
  try {
    const res = await ai.models.generateContent({
      model,
      contents: QUESTION,
      config: { tools: [{ urlContext: {} }] },
    });
    const pages = res.candidates?.[0]?.urlContextMetadata?.urlMetadata ?? [];
    const read = pages
      .filter((p) => p.urlRetrievalStatus === "URL_RETRIEVAL_STATUS_SUCCESS")
      .map((p) => p.retrievedUrl ?? "?");
    return { model, ok: read.length > 0 && Boolean(res.text), ms: Date.now() - started, answer: short(res.text), read };
  } catch (err) {
    return { model, ok: false, ms: Date.now() - started, error: errorText(err), read: [] as string[] };
  }
}

async function checkUrlContextWithJson(model: string) {
  try {
    const res = await ai.models.generateContent({
      model,
      contents: QUESTION,
      config: {
        tools: [{ urlContext: {} }],
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: "object",
          properties: {
            facts: {
              type: "array",
              items: {
                type: "object",
                properties: { label: { type: "string" }, value: { type: "string" } },
                required: ["label", "value"],
              },
            },
          },
          required: ["facts"],
        },
      },
    });
    const parsed = JSON.parse(res.text ?? "");
    const pages = res.candidates?.[0]?.urlContextMetadata?.urlMetadata?.length ?? 0;
    return `works (valid JSON, ${parsed.facts?.length ?? 0} facts, ${pages} page(s) read)`;
  } catch (err) {
    return `fails: ${errorText(err)}`;
  }
}

async function checkExa() {
  const key = process.env.EXA_API_KEY;
  if (!key) return "SKIP  EXA_API_KEY is empty. Get a free key (no card) at https://dashboard.exa.ai/api-keys";
  try {
    const res = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key },
      body: JSON.stringify({
        query: "Neon Postgres free plan limits",
        type: "fast",
        numResults: 3,
        includeDomains: ["neon.com"],
        contents: { text: { maxCharacters: 2000 } },
      }),
    });
    if (!res.ok) return `FAIL  Exa HTTP ${res.status}: ${short(await res.text(), 200)}`;
    const data = (await res.json()) as { results?: { url: string; text?: string }[] };
    const results = data.results ?? [];
    if (!results.length) return "FAIL  Exa returned no results";
    return ["PASS  Exa search", ...results.map((r) => `      source: ${r.url} (${r.text?.length ?? 0} chars)`)].join("\n");
  } catch (err) {
    return `FAIL  Exa: ${errorText(err)}`;
  }
}

console.log("Plain calls per model...\n");
for (const model of MODELS) console.log(await checkPlain(model));

console.log(`\nURL context (reading ${PAGE}) per model...\n`);
const working: string[] = [];
for (const model of MODELS) {
  const r = await checkUrlContext(model);
  if (r.ok) working.push(model);
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${model}  (${r.ms} ms)`);
  if ("error" in r && r.error) console.log(`      error: ${r.error}`);
  if ("answer" in r && r.answer) console.log(`      answer: ${r.answer}`);
  for (const url of r.read) console.log(`      read: ${url}`);
  console.log();
}

if (!working.length) {
  console.log("No model could read the page with URL context. Stop and revise the plan.");
  process.exit(2);
}
for (const model of working) console.log(`URL context + JSON schema on ${model}: ${await checkUrlContextWithJson(model)}`);
console.log();

console.log("Exa search (backup when an official page can't be read)...\n");
console.log(await checkExa());
