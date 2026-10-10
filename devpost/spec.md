---
doc: spec
status: approved
---

# StackFit — Technical Spec

## How This Works, In Plain Language
StackFit is one web page plus a small API, deployed together on Vercel.

- **The page** (React) walks the user through the steps: link, idea, stack, edit. It shows stage names while the API works and draws the stack cards.
- **The API** (Hono) does the work in two calls:
  1. **Read the hackathon.** It downloads the hackathon page, strips it to plain text, and asks Gemini to pull out what limits the stack (required or sponsor tech, live link needed, web or mobile). If the page can't be read, the user pastes the text instead.
  2. **Pick the stack.** It asks Gemini to work out what the idea needs and choose the lightest free pick per layer, next to the usual AI default. Then, for each pick, Gemini **reads the provider's official pricing or limits page live** (URL context tool) and pulls out the current free tier limits. If that page can't be read, StackFit searches for the right page with **Exa** and Gemini reads the results instead. Each fact comes back with the web pages it came from, and StackFit tags it **verified**, **vague**, or **not found**.
- **Nothing is stored.** No database and no accounts. The page holds everything in memory, and a refresh starts over.

Why this shape: it's the lightest thing that proves the kernel. One project, one deploy, one dev process on an 8 GB laptop, no Docker. It's also the kind of stack StackFit itself would recommend.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.

1. The user pastes a link and presses Enter. The page sends `POST /api/hackathon` with `{ url }`.
2. The API streams stage updates back ("Fetching page", "Reading the rules") while it fetches the page, strips it to text, and asks Gemini for a `HackathonSummary`.
3. If the page can't be read, the API streams an `unreadable` event. The page shows the PRD message and a paste box, and the pasted text goes to the same endpoint as `{ pastedText }`.
4. The page shows the summary and the idea box. On submit it sends `POST /api/stack` with `{ hackathon, idea }`.
5. The API streams stages: "Working out what your idea needs", "Choosing the lightest stack", then "Checking live limits: <service>" once per pick.
6. The API streams the finished `StackResult`, and the page draws one card per layer.
7. On edit, the page sends `POST /api/stack` again with the previous result, the swapped picks, and any past tools. The API changes and rechecks only the affected layers and returns the full result. Untouched cards keep their earlier facts.
8. "Copy as prompt" builds the prompt text on the page itself and copies it to the clipboard. No API call.

## Stack
Learner agreed to all choices below (4-spec interview). Versions are the latest on npm as of 10 Oct 2026; pin them at install.

- **bun 1.3** — package manager and local runner. The learner's pick for speed. https://bun.sh/docs
- **Vite 8 + React 19 + TypeScript** — the page. Lighter than Next.js; no server rendering needed. https://vite.dev/guide/ · https://react.dev
- **Hono 4.13** — the API. Tiny, Web-standard, and Vercel supports it with zero config plus streaming. https://hono.dev · https://vercel.com/docs/frameworks/backend/hono
- **@google/genai 2.28** — Gemini SDK, with the URL context tool. https://ai.google.dev/gemini-api/docs/url-context
- **Exa search API** — backup search when an official page can't be read (plain `fetch`, no SDK). https://exa.ai/docs/reference/search
- **Tailwind CSS 4.3** (via `@tailwindcss/vite`) — styling. https://tailwindcss.com/docs
- **@phosphor-icons/react 2.1** — icons (learner rule: never Lucide). https://phosphoricons.com
- **Vercel Hobby** — hosting. Learner's choice for a live link.

Tradeoff accepted: Next.js would bundle the page and API routes together for free, but it's heavier and is the exact default StackFit argues against.

**Checked in build step 1 (10 Oct 2026, `bun run check:gemini`):**
- Google Search grounding is **not usable on the free key**: 429 quota errors on Gemini 3.x, and Gemini 2.5 models return 404 "no longer available to new users".
- The **URL context tool works free** on `gemini-3.5-flash-lite` (about 2s) and `gemini-3.8-flash` (about 25s, often 503 "high demand"). Both read https://neon.com/pricing.
- URL context **combines with JSON-schema output** (`responseJsonSchema`) in one call.

**Still unverified:**
- Exa search on the learner's free key (checked by the same script once `EXA_API_KEY` is set).
- The exact way to serve a Vite build and a Hono API from one Vercel project (`api/` catch-all with `hono/vercel` versus zero-config `server.ts`). Pick whichever deploys cleanly.

## Where It Runs and How Someone Tries It
- **Local:** `bun install`, put `GEMINI_API_KEY=...` in `.env` (git-ignored; `.env.example` committed), then `bun run dev`. That starts Vite on http://localhost:5173 and the Hono API on http://localhost:8787 in one command; Vite forwards `/api/*` to the API. Open http://localhost:5173.
- **Requirements:** bun 1.3+, a Gemini API key (free tier).
- **Deploy (learner's choice):** Vercel Hobby, connected to the public GitHub repo. Set `GEMINI_API_KEY` in the Vercel project's environment variables. Every push to `main` redeploys.
- **Demo recording:** use the live Vercel URL with a real Devpost hackathon link (for example this hackathon, https://learn-ai-basics.devpost.com/) and a real idea, then do one edit. The submission also needs the public GitHub repo; the live link is extra.

## Look and Feel
From `prd.md > Look and Feel`. Final details come from the learner's `design-guardrails` skill at build time; don't re-ask.

- Techy, terminal-like feel. Dark by default.
- Monospace for data (limits, numbers, stage log); a clean sans for headings and body.
- Flat, solid colors. **No gradients, no gradient text**, nothing blue/purple "AI".
- Tags as clear solid badges: verified, vague, not found. Each must be readable without relying on color alone (label text always shown).
- Stage progress reads like a short log of lines that tick to done.
- Phosphor icons only.
- Interface copy is short and direct, like a CLI tool.

## Components

### Page shell and flow (`web/src/App.tsx`)
Holds the current step (`start`, `working`, `summary`, `result`) and all data in React state. Swaps the visible section in place on one page.
PRD ref: `prd.md > Screens and Layout`, `prd.md > States and Boundaries`.

### Link input (`web/src/components/LinkInput.tsx`)
A single input plus Enter. Only accepts `http(s)://` URLs; disabled while a run is in progress.
PRD ref: `prd.md > Features and Behavior > Hackathon link`.

### Paste fallback (`web/src/components/PasteFallback.tsx`)
Shows "The link you provided isn't accessible from here. Please confirm the link is public." plus a textarea. Submits `{ pastedText }`.
PRD ref: `prd.md > Features and Behavior > Unreadable link fallback`.

### Stage log (`web/src/components/StageLog.tsx`)
Renders stage events from the stream as lines; the current one is animated, finished ones show a check.
PRD ref: `prd.md > Features and Behavior > Hackathon link`, `prd.md > States and Boundaries > Working`.

### Hackathon summary and idea box (`web/src/components/SummaryAndIdea.tsx`)
Shows the `HackathonSummary` fields, then a short textarea for the idea.
PRD ref: `prd.md > Features and Behavior > Idea description`.

### Stack cards (`web/src/components/StackCard.tsx`)
One card per layer: the pick, the usual AI default beside it, why it fits, why it beats the default, then a facts list (free tier limits, local weight, deployed speed). Each fact has its tag and source links.
PRD ref: `prd.md > Features and Behavior > Stack result`, `prd.md > Features and Behavior > Live facts with confidence tags`.

### Edit panel (`web/src/components/EditPanel.tsx`)
Lets the user change any number of picks (free text per layer) and type past tools. Submits once and marks changed layers.
PRD ref: `prd.md > Features and Behavior > Refine the stack`.

### Copy as prompt (`web/src/lib/prompt.ts` + button in the result view)
Builds a self-contained prompt from the hackathon URL, idea, and current stack, and tells any AI agent to repeat StackFit's process (read the hackathon, infer needs, pick the lightest free stack, look up limits live, tag confidence, cite sources). Copies it with `navigator.clipboard` and shows "Copied".
PRD ref: `prd.md > Features and Behavior > Copy as prompt`.

### Stream reader (`web/src/lib/stream.ts`)
Calls an API endpoint and reads the newline-delimited JSON response line by line, handing each event to the page.

### API app (`api/app.ts`)
The Hono app with two `POST` routes. Each streams newline-delimited JSON events (see `Data Model > Stream events`).

### Page reader (`api/lib/fetchPage.ts`)
Fetches the hackathon URL with a 10s timeout, strips scripts, styles, and tags to plain text, and caps the text at about 30k characters. It reports `unreadable` when the request fails, the status isn't 200, or under about 500 characters of text are left (typical of JS-only sites). Safety: it only allows `http`/`https` and refuses localhost and private network addresses.
PRD ref: `prd.md > Features and Behavior > Hackathon link`, `prd.md > Features and Behavior > Unreadable link fallback`.

### Hackathon reader (`api/lib/readHackathon.ts`)
One Gemini call (no search) on the page text, returning a `HackathonSummary` as JSON.
PRD ref: `prd.md > Features and Behavior > Hackathon link`.

### Stack picker (`api/lib/pickStack.ts`)
One Gemini call (no search). Input: summary, idea, optional past tools and swapped picks. Output: the inferred needs plus one `Layer` per needed layer (pick, default, why, whyBeatsDefault). On an edit it receives the previous result, keeps unchanged layers as they are, and returns which layers changed. The prompt tells it to prefer the lightest tool that meets the needs, respect sponsor-required tech, and favor free tiers that don't sleep or pause when a live link is needed.
PRD ref: `prd.md > Features and Behavior > Idea description`, `prd.md > Features and Behavior > Stack result`, `prd.md > Features and Behavior > Refine the stack`.

### Live fact checker (`api/lib/checkFacts.ts`)
For each new or changed pick, the stack picker has already named the provider's official domain and its pricing or limits page URL(s). Then:
1. One Gemini call **with the URL context tool**, given those URLs, asks for the current free tier limits, rate limits, local weight, and deployed speed numbers as JSON. Sources are the pages listed as read successfully in `urlContextMetadata`.
2. If none of the pages could be read (wrong or moved URL, blocked), one **Exa search** (`type: "fast"`, `includeDomains: [official domain]`, about 3 results with page text) finds the right pages. If that returns nothing, a second Exa search runs without the domain filter. Gemini (no tools) reads the returned text and answers in the same JSON. Sources are the Exa result URLs.

Tag rules, enforced in code after the model answers:
- **verified:** a stated number backed by at least one source on the provider's own domain.
- **vague:** found but only on third-party pages, conflicting, or not stated as a number.
- **not found:** no answer or no sources.

A fact with no source URL can never be `verified`. Runs at most 2 lookups at once to stay under free tier per-minute limits. Streams "Checking live limits: <service>" before each one.
PRD ref: `prd.md > Features and Behavior > Live facts with confidence tags`, `prd.md > States and Boundaries > Lookup failed or unclear`.

## Data Model
All data lives in the browser's React state for one visit. The server is stateless. A refresh clears everything (PRD: nothing saved).

```ts
type HackathonSummary = {
  name: string;
  sourceUrl?: string;
  requiredTech: string[];        // must-use tools or sponsor tech
  liveLinkRequired: boolean | "unknown";
  platform: "web" | "mobile" | "either" | "unknown";
  notes: string[];               // other limits worth knowing (deadline, rules)
};

type Fact = {
  label: string;                 // e.g. "Free requests per day"
  value: string;                 // e.g. "500" or "Not stated"
  tag: "verified" | "vague" | "not_found";
  sources: { title: string; url: string }[];
};

type Layer = {
  layer: string;                 // "frontend", "backend", "database", "hosting", "llm", ...
  pick: string;                  // "Vite + React"
  usualDefault: string;          // "Next.js"
  why: string;                   // why it fits this idea
  whyBeatsDefault: string;
  officialDomain: string;        // "neon.com"; a "verified" source must be on this domain
  docsUrls: string[];            // official pricing or limits page(s) the fact checker reads
  facts: Fact[];                 // limits, local weight, deployed speed
};

type StackResult = {
  needs: string[];               // inferred from the idea, e.g. "LLM calls", "no realtime"
  layers: Layer[];
};
```

### Stream events
Each line of an API response is one JSON object:
- `{ "type": "stage", "label": "Reading the rules" }`
- `{ "type": "unreadable" }` (hackathon route only)
- `{ "type": "summary", "data": HackathonSummary }`
- `{ "type": "result", "data": StackResult, "changed": string[] }`
- `{ "type": "error", "message": "..." }`

## File Structure
```
project/
├── api/
│   ├── app.ts                 # Hono app: POST /api/hackathon, POST /api/stack (streams NDJSON)
│   ├── dev.ts                 # local-only: runs the Hono app on :8787 with bun
│   ├── [[...route]].ts        # Vercel entry (or zero-config server.ts; decided in step 1)
│   └── lib/
│       ├── fetchPage.ts       # download + strip page, unreadable check, URL safety
│       ├── gemini.ts          # one shared Gemini client + model choice + JSON helper
│       ├── readHackathon.ts   # page text -> HackathonSummary
│       ├── pickStack.ts       # summary + idea (+ edits) -> layers
│       ├── checkFacts.ts      # grounded live lookups -> facts with tags + sources
│       └── types.ts           # shared types (also imported by web/)
├── web/
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx            # step state + layout
│       ├── index.css          # Tailwind + theme tokens
│       ├── components/        # LinkInput, PasteFallback, StageLog, SummaryAndIdea, StackCard, EditPanel
│       └── lib/
│           ├── stream.ts      # NDJSON reader
│           └── prompt.ts      # copy-as-prompt text builder
├── scripts/
│   └── check-gemini.ts        # build step 1: tests models, URL context, JSON output, and Exa on the keys
├── devpost/                   # Devpost learning workspace
├── .env.example               # GEMINI_API_KEY=, EXA_API_KEY=
├── vite.config.ts             # root: web/, proxy /api -> :8787
├── vercel.json                # only if needed for the Vite + API setup
├── package.json
├── LICENSE                    # MIT
└── README.md
```

## External Services and Dependencies

### Gemini API
- **Docs:** https://ai.google.dev/gemini-api/docs · URL context: https://ai.google.dev/gemini-api/docs/url-context · pricing: https://ai.google.dev/gemini-api/docs/pricing · deprecations: https://ai.google.dev/gemini-api/docs/deprecations
- **Key:** `GEMINI_API_KEY`, free tier (learner has one).
- **Calls:** `@google/genai` `models.generateContent`, wrapped by `api/lib/gemini.ts`. Plain calls for the hackathon reader and stack picker, JSON output via `responseJsonSchema`. The fact checker passes `tools: [{ urlContext: {} }]` with JSON output, and reads `candidates[0].urlContextMetadata.urlMetadata[]` (`retrievedUrl`, `urlRetrievalStatus` = `URL_RETRIEVAL_STATUS_SUCCESS`) for sources.
- **Grounding free tier facts as read on 10 Oct 2026 (the docs contradict each other; build step 1 found grounding isn't free on the learner's key):**
  - Pricing page: Gemini 2.5 Flash / Flash-Lite include grounding free up to **500 requests/day** (shared). Gemini 3.x grounding is listed under the **paid tier only** (5,000/month, then $14 per 1,000).
  - Grounding page: describes a **5,000/month free allowance** for Gemini 3 and newer.
  - Deprecations page: 2.5 models have no shutdown date, but access is limited to users who have **used 2.5 before**.
  - Rate limits page: per-model free limits are only shown in AI Studio.
- **Usage per run:** about 1 call to read the hackathon + 1 to pick + 4–6 URL context lookups (plus a few plain calls when Exa is used). URL context is billed as normal input tokens, with no separate search quota.
- **Model choice (build step 1):** `gemini-3.5-flash-lite`, with `gemini-3.8-flash` as a one-time retry when Gemini answers 503 "high demand". Recorded in `api/lib/gemini.ts`.

### Exa (backup search)
- **Docs:** https://exa.ai/docs/reference/search · pricing: https://exa.ai/pricing
- **Key:** `EXA_API_KEY`. Free plan: $10 credit each month, about 2,500 fast searches, no card (read 10 Oct 2026).
- **Call:** `POST https://api.exa.ai/search` with header `x-api-key`. Body: `query`, `type: "fast"`, `numResults`, `includeDomains`, `contents: { text: { maxCharacters } }`. Uses `results[].url` and `results[].text`.
- Used only when URL context can't read the official page, so most runs make zero Exa calls.
- Tavily (1,000 credits/month, no card) stays the next option if Exa stops being free.

### Vercel
- Docs: https://vercel.com/docs/functions/limitations · https://vercel.com/docs/frameworks/backend/hono
- Hobby: functions up to **300s**, 2 GB memory, response up to 4.5 MB, streaming supported (docs updated 24 Aug 2026). One full stack run must finish within 300s.

## Important Failure Modes
- **Page unreadable** (private, login, blocked, JS-only) → the PRD message plus the paste box.
- **Gemini free quota hit** (429) → error line in the stage log: "Gemini's free daily limit is used up. Try again later." The run stops cleanly.
- **One lookup fails or times out** (URL context and Exa both) → that pick still shows, with its facts tagged `not_found` and any sources found. Other cards are unaffected.
- **Model returns invalid JSON** → one retry with a stricter prompt, then an error line.
- **Run nears 300s** → lookups run 2 at a time with a per-lookup timeout (about 40s), so the whole run stays well under the limit.

## What Was Simplified and Why
- **In-memory state** instead of a database — PRD says nothing is saved; no extra service.
- **Plain fetch and text strip** instead of a headless browser or scraping service — light, free, works for Devpost; JS-only sites use the paste fallback. A full version would need Playwright or a scraping API.
- **Free-text pick editing** instead of a searchable catalog of services — proves the edit loop without building a catalog.
- **Model-plus-code tagging** instead of a hand-curated verified list — matches the PRD's "look up live on every request"; the code rule (no source means not verified) keeps it honest.
- **Copy-as-prompt built on the page** instead of a skill download — the full Claude skill is in `prd.md > Possible Later Enhancements`.

## Decisions and Open Issues
**Learner decisions (this interview):**
- Vite + React + Hono, no database, bun — agreed. Keeps it light locally and in production; the tradeoff of not having Next.js's built-in API routes is accepted.
- Plain page fetch with paste fallback — agreed.
- Gemini free tier key for live facts — agreed. After build step 1 showed Google Search grounding isn't free on the key, the learner approved Gemini URL context on official pages first, with Exa search as the backup.
- Deploy on Vercel for a live link — agreed.

**Implementation details derived from those (agent):** NDJSON streaming for stage updates, 2-at-a-time lookups, code-enforced tag rules, URL safety checks, file layout.

**One useful unknown (resolved in build step 1):** the Gemini free tier itself. Google's own pricing, grounding, and deprecations pages disagree about which models get free Google Search grounding, which is the exact problem StackFit exists to solve. Testing with the learner's key showed grounding isn't free (429 on 3.x, 2.5 closed to new users), while the URL context tool works free and combines with JSON output. The plan switched to URL context plus Exa (see `Live fact checker`).

**Open issues (resolve in build, not blocking approval):**
- Vercel wiring for Vite plus the Hono API (see `Stack > Unverified`).
- Desired learning outcome is still not established (profile); no extra exercise planned.

Carried from `prd.md > Open Questions`: none open.
