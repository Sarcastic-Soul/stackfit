---
doc: scope
status: approved
---

# StackFit

A web app that picks the lightest, fastest free stack for your hackathon project, based on the hackathon's rules, what your project actually needs, and the tools you already know.

## The Unique Kernel
It asks about your requirements first, then recommends the lightest tools that meet them, checked against current free tier rules. That's the opposite of asking an AI chat, which gives the popular default from its training data (Next.js + Supabase) whether or not the project needs it. Every pick says why it beats that default: plain React instead of Next.js when there's no server rendering, Neon instead of Supabase (Supabase pauses after a week without use and allows only 2 free projects), Drizzle instead of Prisma, bun or pnpm instead of npm.

Lighter matters in two places: on your laptop while building, and in the deployed app judges actually use. A lighter stack loads faster and starts faster on free hosting, so even someone with a strong PC gets a better demo out of it.

## Who It's For
Hackathon builders who want a fast, free, deployed project. The sharpest case is builders like the learner: often students, entering many hackathons back to back, deploying only on free tiers, and coding on low-spec laptops (8 GB RAM) with several projects and AI agents running at once. Most hackathons want a live link. Today they ask Claude and get a training-data default, or fall back on habit (Next.js on Vercel). Then they find the limits mid-build: serverless breaks when the project needs a server that stays on, Vercel's free tier caps function run time, Render's free tier sleeps after 15 minutes without traffic, Supabase pauses, AWS risks a surprise bill, and Docker or heavy dev tools crash the laptop.

## The Core Loop
1. Paste a hackathon link. The app pulls out what limits the stack: required or sponsor tech, whether a live link is needed, web or mobile.
2. Describe the project idea. The app asks a few questions about requirements (long-running jobs, realtime, database, file storage, scale).
3. List the tools you already know.
4. Get a recommended stack, one pick per layer (frontend, backend, database, hosting). Each pick shows its free tier limits, how heavy it is to run locally, how fast it is once deployed (published numbers like bundle size or cold start, where they exist), and why it beats the popular default.
5. Optionally, copy the whole thing as a prompt to paste into your own AI agent, so you don't have to come back to the site.

They come back at the start of every new hackathon.

## Inspiration & Identity
Not discussed yet. `3-prd` will ask.

## Why This Matters to the Learner
They build for many hackathons in parallel on an 8 GB laptop that crashes under Docker, Playwright and multiple agents. In their words: when you ask Claude, "it does not ask you what are your requirements ... it directly suggests the tech stack based on your previous trained data," and "if it is a very simple project, you can use lightweight tools for faster development and easier deployment."

## What "Working" Looks Like
Open the web app, paste a real hackathon link, describe an idea, answer a few questions, list known tools, and get a stack card for each layer with free tier limits, local weight, and reasons.

The "oh, that's cool" moment: the app shows the usual AI default ("Next.js + Supabase") next to its own pick for this project, and each swap comes with a concrete reason, like "Supabase pauses after 7 days idle; Neon scales to zero and keeps your data."

## The POC Boundary
- A web app (web only).
- Input: hackathon link, project idea, a few requirement questions, known tools typed in.
- Output: one recommended stack per layer, with free tier limits, how heavy it is locally, how fast it is deployed (published numbers where they exist), and why it beats the default.
- Free tier facts come from a small, hand-checked list of services, each with its source link and the date it was checked, not from the model's memory.
- A "copy as prompt" button that exports the same flow for use in your own AI agent.

## Later
- Read the user's GitHub repos to learn their experience automatically, instead of typing it.
- A downloadable Claude Code skill version of the same flow.
- Refresh free tier facts automatically instead of checking them by hand.
- Run real benchmarks (load time, cold start) on a deployed sample of the recommended stack vs the default, and show the stats.
- Mobile app stacks.

## Explicitly Cut
- **Past hackathon and winner summaries:** that's the learner's existing Claude research step, not the stack problem.
- **Competition stats:** real competition data isn't public, beyond Devpost's registered count, so it can't be done reliably.
- **Project idea generation:** a separate problem that would blur the kernel.
