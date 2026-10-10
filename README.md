# StackFit

Paste a hackathon link, describe your idea, and get the lightest free tech stack for it: one pick per layer, shown next to what an AI chat would usually suggest. Free tier limits are read live from each provider's own pricing pages, tagged **verified**, **vague** or **not found**, and linked to their sources.

- Reads the hackathon page and pulls out what limits the stack (required tech, live link, web or mobile). If the page can't be read, paste its text instead.
- Picks the stack with Gemini, then checks each pick's limits live (Gemini URL context on the official pages, with Exa search as the backup).
- Edit any pick or list tools you've used before; only the changed layers are looked up again.
- "Copy as prompt" gives you a prompt that makes any AI agent repeat the same process.
- No accounts, nothing saved. Refreshing starts over.

## Run it locally

Needs [bun](https://bun.sh) 1.3 or newer and a free [Gemini API key](https://aistudio.google.com/apikey). An [Exa API key](https://dashboard.exa.ai/api-keys) is optional (free, no card) and is used when an official page can't be read.

```sh
bun install
cp .env.example .env   # then fill in GEMINI_API_KEY (and EXA_API_KEY if you have one)
bun run dev
```

Open http://localhost:5173. Vite serves the page and forwards `/api/*` to the Hono API on port 8787.

## Deploy to Vercel

Live at https://stackfit-psi.vercel.app.

The repo is set up for Vercel as it is: `vercel.json` builds the page into `dist/`, and `api/[[...route]].ts` sends every `/api/*` request to the Hono app in `server/`. Set `GEMINI_API_KEY` (and optionally `EXA_API_KEY`) in the project's environment variables, then deploy.

## How it's built

| Part | Where |
|---|---|
| Page (Vite, React, Tailwind) | `web/src/` |
| API routes, streamed as NDJSON (Hono) | `server/app.ts` |
| Hackathon reader | `server/lib/readHackathon.ts` |
| Stack picker and edits | `server/lib/pickStack.ts` |
| Live fact checker and tags | `server/lib/checkFacts.ts` |
| Vercel entry | `api/[[...route]].ts` |

## How it was planned

Built with the [Devpost Learn Skill Pack](https://github.com/challengepost/learn-ai-basics) (`skills-lock.json` records the version). The planning docs are in `devpost/`:

| File | What it holds |
|---|---|
| `devpost/scope.md` | The idea, who it's for, and what's in and out of the proof of concept |
| `devpost/prd.md` | Screens, behavior and edge cases |
| `devpost/spec.md` | Technical plan: stack, components, data, services |
| `devpost/checklist.md` | The 7 build slices, each checked by hand, plus a log of plan changes |
| `devpost/app-map.html` | One-page map of how the code fits together |

`design-options/` holds the six HTML design directions explored before picking the look.

## License

MIT
