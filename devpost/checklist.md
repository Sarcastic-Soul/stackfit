---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

## Slices

- [x] **1. Live facts are proven on your free keys**
  Becomes usable: `bun run check:gemini` prints, for each candidate model, whether a plain call works, whether the URL context tool read an official pricing page (and which page), whether that combines with JSON output, and whether Exa search returns pages (once `EXA_API_KEY` is set).
  Why now: The whole kernel (live facts with sources) depends on free-tier live lookups, and Google's own docs disagree about them. This is the one allowed technical-only slice: it proves a critical risk and leaves runnable evidence.
  PRD ref: `prd.md > Features and Behavior > Live facts with confidence tags`
  Spec ref: `spec.md > Decisions and Open Issues`, `spec.md > External Services and Dependencies > Gemini API`, `spec.md > External Services and Dependencies > Exa (backup search)`, `spec.md > Stack`
  Build: Bootstrap the project (`package.json` with bun, TypeScript config, `@google/genai`, `.env.example`, MIT `LICENSE`). Write `scripts/check-gemini.ts`: plain call per model, URL context on https://neon.com/pricing per model (answer snippet and pages read), URL context plus JSON schema per working model, and one Exa search limited to neon.com. Record the chosen model in `api/lib/gemini.ts` and the findings under `## Revisions`.
  Verify (mechanical): Run `bun run check:gemini`; at least one model reads the page with URL context and returns valid JSON. Exa shows PASS, or SKIP until the learner adds the key.
  Learner check: Add your free Exa key to `.env`, run `bun run check:gemini`, and look at which models worked, which page they read, and which links Exa returned.
  Commit: `Prove free live facts with Gemini URL context and Exa`

- [x] **2. Paste a hackathon link and see what limits your stack**
  Becomes usable: The app runs locally. You paste a public Devpost link, watch the stage log tick through, and see the hackathon summary (required/sponsor tech, live link needed, platform, notes), styled in the agreed terminal look.
  Why now: First real end-to-end path (page → API → Gemini → streamed stages → screen). It sets up the scaffold, streaming, and the visual direction every later slice reuses.
  PRD ref: `prd.md > The Core Journey` (steps 1–4), `prd.md > Features and Behavior > Hackathon link`, `prd.md > Screens and Layout`, `prd.md > Look and Feel`
  Spec ref: `spec.md > Components > Page shell and flow (web/src/App.tsx)`, `spec.md > Components > Link input (web/src/components/LinkInput.tsx)`, `spec.md > Components > Stage log (web/src/components/StageLog.tsx)`, `spec.md > Components > Stream reader (web/src/lib/stream.ts)`, `spec.md > Components > API app (api/app.ts)`, `spec.md > Components > Page reader (api/lib/fetchPage.ts)`, `spec.md > Components > Hackathon reader (api/lib/readHackathon.ts)`, `spec.md > Look and Feel`, `spec.md > Where It Runs and How Someone Tries It`
  Build: Run the learner's `design-guardrails` pipeline for the visual direction (including its local HTML options for a new product; the learner picks one). Scaffold Vite + React + Tailwind + Phosphor in `web/`, Hono in `api/` with `api/dev.ts` on :8787, Vite proxy, and one `bun run dev`. Implement `fetchPage` (with the URL safety rules), `readHackathon`, the `POST /api/hackathon` NDJSON stream, the stream reader, the link input, the stage log, and the summary view.
  Verify (mechanical): `bun run dev` starts with no errors; `curl -N` to `/api/hackathon` with `https://learn-ai-basics.devpost.com/` streams stage lines then a `summary` event with sensible fields; a `localhost` URL is refused; `bun run build` type-checks and builds.
  Learner check: Open http://localhost:5173, paste a Devpost hackathon link, and check the stages and summary match what you know about that hackathon, and that the look fits what you pictured.
  Commit: `Read a hackathon link into a streamed summary`

- [x] **3. Describe your idea and get a live-checked stack**
  Becomes usable: After the summary, you describe an idea and get one card per layer: pick next to the usual AI default, why it fits, why it beats the default, and facts (free tier limits, local weight, deployed speed), each with a verified / vague / not found tag and source links.
  Why now: This is the unique kernel. It comes right after the first path works, so everything after it is refinement.
  PRD ref: `prd.md > The Core Journey` (steps 4–6), `prd.md > Features and Behavior > Idea description`, `prd.md > Features and Behavior > Stack result`, `prd.md > Features and Behavior > Live facts with confidence tags`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Components > Hackathon summary and idea box (web/src/components/SummaryAndIdea.tsx)`, `spec.md > Components > Stack cards (web/src/components/StackCard.tsx)`, `spec.md > Components > Stack picker (api/lib/pickStack.ts)`, `spec.md > Components > Live fact checker (api/lib/checkFacts.ts)`, `spec.md > Data Model`, `spec.md > Important Failure Modes`
  Build: Implement `pickStack`, `checkFacts` (URL context lookups with Exa backup, 2 at a time, per-lookup timeout, code-enforced tag rules), `POST /api/stack` streaming per-service stages and the result, the idea box, and the stack cards with tags and sources.
  Verify (mechanical): `curl -N` to `/api/stack` with a real summary and idea streams "Checking live limits: …" lines and a `result`; every fact has a tag; no fact without a source URL is `verified`; a forced lookup failure yields `not_found` on that card only; a 429 from Gemini produces the error line.
  Learner check: Run your own real idea for this hackathon. Do the picks and the "instead of" defaults make sense to you? Click a few source links and check the numbers.
  Commit: `Pick a stack with live-checked, tagged facts`

- [x] **4. Unreadable links fall back to pasted text**
  Becomes usable: A private, login-only, or JS-only hackathon page shows "The link you provided isn't accessible from here. Please confirm the link is public." plus a paste box; pasted text continues the same journey.
  Why now: The core journey is proven; this protects it for sites like Devfolio and Unstop before the edit loop adds more surface.
  PRD ref: `prd.md > Features and Behavior > Unreadable link fallback`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Components > Paste fallback (web/src/components/PasteFallback.tsx)`, `spec.md > Components > Page reader (api/lib/fetchPage.ts)`, `spec.md > Data Model > Stream events`
  Build: Emit the `unreadable` event from `/api/hackathon`, accept `{ pastedText }`, and add the paste fallback view.
  Verify (mechanical): `curl -N` with a JS-only or 404 URL streams `unreadable`; posting `pastedText` from that page streams a `summary`.
  Learner check: Paste a link to a hackathon on a site that doesn't render without JavaScript (or a private link), see the message, paste the page text, and continue to a summary.
  Commit: `Fall back to pasted text for unreadable links`

- [x] **5. Edit picks and add past tools to refine the stack**
  Becomes usable: On the result, you change any number of picks and/or type tools you've used before, submit, and only the affected cards update with fresh live facts.
  Why now: Needs a working result to edit; it's the second half of the core loop.
  PRD ref: `prd.md > The Core Journey` (step 7), `prd.md > Features and Behavior > Refine the stack`
  Spec ref: `spec.md > Components > Edit panel (web/src/components/EditPanel.tsx)`, `spec.md > Components > Stack picker (api/lib/pickStack.ts)`, `spec.md > Components > Live fact checker (api/lib/checkFacts.ts)`, `spec.md > The Core Journey Through the System`
  Build: Add the edit panel; extend `/api/stack` to take the previous result, swapped picks, and past tools; recheck only changed layers and return `changed`; keep untouched cards' facts.
  Verify (mechanical): `curl -N` an edit swapping one layer: only that service gets a "Checking live limits" stage and `changed` lists only the affected layers; untouched layers are byte-identical to the input.
  Learner check: Swap two picks and add a past tool (e.g. "Prisma, Render"). Only the cards you touched (or that your past tools changed) should update.
  Commit: `Refine stack with edits and past tools`

- [ ] **6. Copy the whole flow as a prompt**
  Becomes usable: A "Copy as prompt" button copies a self-contained prompt for any AI agent, then shows "Copied".
  Why now: Small and independent; it closes the PRD's journey.
  PRD ref: `prd.md > The Core Journey` (step 8), `prd.md > Features and Behavior > Copy as prompt`
  Spec ref: `spec.md > Components > Copy as prompt (web/src/lib/prompt.ts + button in the result view)`
  Build: Implement `web/src/lib/prompt.ts` and the button with a "Copied" state.
  Verify (mechanical): `bun run build` passes; the built prompt for a sample result contains the hackathon URL, idea, current picks, and the live-lookup, confidence-tag, and source instructions.
  Learner check: Click "Copy as prompt", paste it into Claude Code or another agent, and see whether it runs the same process.
  Commit: `Add copy-as-prompt export`

- [ ] **7. StackFit is live on Vercel**
  Becomes usable: A public Vercel URL runs the full journey.
  Why now: The live link is the learner's choice for sharing; Vercel wiring of Vite + Hono is still unverified, so it gets its own verified step.
  PRD ref: `prd.md > The Core Journey`
  Spec ref: `spec.md > Where It Runs and How Someone Tries It`, `spec.md > External Services and Dependencies > Vercel`, `spec.md > Stack`
  Build: Add the Vercel entry (`api/[[...route]].ts` or zero-config `server.ts`, whichever deploys cleanly) and `vercel.json` only if needed; README with run instructions. The learner logs in to Vercel and sets `GEMINI_API_KEY`; deploy only with the learner's go-ahead.
  Verify (mechanical): The deployed URL serves the page; `curl -N` against the deployed `/api/hackathon` and `/api/stack` streams stages and results; a full run finishes well under 300s.
  Learner check: Open the live URL on your phone or another browser and run one full journey.
  Commit: `Deploy StackFit to Vercel`

## Hands-on Checkpoints

- [x] Early usable behavior explored — after slice 3 (the kernel works end to end locally)
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence:
Route and stops:
Edit outcome:
Reflection:
Activity mode:

## Revisions

- 10 Oct 2026, slice 1: Live facts now use Gemini's URL context tool on official pricing pages, with Exa search as the backup, instead of Google Search grounding. The check showed grounding returns 429 on the free key and Gemini 2.5 models are closed to new users, while URL context works free and combines with JSON output. Model: `gemini-3.5-flash-lite` (about 2s), with `gemini-3.8-flash` as a retry on 503. Learner approved. Spec updated (`Stack`, `Live fact checker`, `Data Model`, `External Services`, `Decisions`).
- 10 Oct 2026, slice 2: Learner picked design option 5 ("The stack", graphite plus soft green) after a second round of options (first round had no layout they liked; they liked option 3's colors). Learner also asked for brand icons on each pick: added Simple Icons (resolved on the server from the `simple-icons` package) to `spec.md > Look and Feel`, `Data Model` and `Stack picker`. Icons ship in slice 3 with the stack cards.
- 10 Oct 2026, slice 3: Each layer now has a `kind` (service or library), because free tier questions don't fit frameworks like Vite; libraries get license, install weight and speed facts, read from their docs and npm pages. Docs URLs off the official domain are dropped before lookup, so a redirect on an official link (vitejs.dev to vite.dev) can still be verified. Picker prompt now says services need a no-card free tier and that build-only tools (Claude Code, Git) aren't runtime layers, after test runs picked Claude API and Express on Render. Spec updated (`Data Model`, `Live fact checker`).
- 10 Oct 2026, after slice 3 hands-on check: Learner found the first visit looked empty and asked for a visual explainer (less text) and an auto-scroll to the finished stack. Added `HowItWorks` (flow track plus an example bar that explains the tags), shown until a summary loads, and a scroll to the result that respects reduced motion.
- 10 Oct 2026, slice 5: Edits go to the same `/api/stack` route with `previous` and `edits`; the picker returns only changed layers and the server keeps the rest byte-identical. Refine prompt keeps `usualDefault` as the usual AI suggestion (not the old pick) and keeps the why lines about the tool, after a test run showed "Chosen by the user in swaps." Spec updated (`The Core Journey`, `Edit panel`, `Stack picker`).
