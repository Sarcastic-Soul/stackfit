---
doc: prd
status: approved
---

# StackFit — Product Requirements

A web app for hackathon builders: paste a hackathon link, describe your idea, and get the lightest, fastest free stack for it, with every free tier limit looked up live and its sources shown.
Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`.

## The Core Journey
Develops `scope.md > The Core Loop`.

1. The user opens StackFit and sees the name, a short line on what it does, and one input for a hackathon link.
2. They paste a public hackathon link and press Enter.
3. StackFit reads the page and shows which stage it's on while it works.
4. StackFit shows what it found about the hackathon (what limits the stack) and asks the user to describe their project idea in a few lines.
5. They submit the idea. StackFit shows stage progress again while it picks the stack and looks up current limits.
6. The stack appears: one pick per layer, each with its reasons, its limits, a confidence tag, and sources.
7. The user can swap any number of picks and/or tell StackFit tools they've used before, then ask for an updated stack.
8. They can copy the whole result as a prompt to paste into their own AI agent.

Success: a real hackathon link and a real idea go in, and a stack comes out whose limits are each tagged and sourced.

## Screens and Layout
One page that moves through steps in place. No separate pages or navigation.

- **Start:** project name and title at the top, a short description below, a single link input.
- **Progress:** the current stage name, shown while StackFit works (after the link, and again after the idea).
- **Hackathon summary + idea:** what StackFit found about the hackathon, then a short text box for the idea.
- **Stack result:** one card per layer, plus the edit controls and the "copy as prompt" button.
- **Unreadable link fallback:** the error message plus a box to paste the page text.

## Look and Feel
- Techy, terminal-like feel.
- **No gradients**, especially the typical blue/purple "AI" gradient look. No gradient text.
- Phosphor icons (never Lucide).
- Follow the learner's `design-guardrails` skill at build time for the rest (fonts, banned patterns, motion).
- "A well thought out design," not a bare form.

## Features and Behavior

### Hackathon link
Develops `scope.md > The Core Loop` step 1.
- As a hackathon builder, I want to paste a hackathon link so StackFit knows what the event requires.
  - [ ] Pasting a public link and pressing Enter starts processing; the current stage name is visible until it finishes.
  - [ ] When done, the user sees what StackFit found that limits the stack (for example: required or sponsor tech, whether a live link is required, web or mobile).

### Unreadable link fallback
- [ ] If the page can't be read (private, behind a login, blocked), the user sees: "The link you provided isn't accessible from here. Please confirm the link is public."
- [ ] A box appears where the user can paste the page text instead; submitting it continues the journey as if the link had worked.

### Idea description
- As a builder, I want to describe my idea in a few lines so the stack fits what I'm actually building, not just the event.
  - [ ] After the hackathon summary, a short text box asks for the idea; submitting it starts stack selection with visible stage progress.
  - [ ] StackFit works out the project's needs (long jobs, realtime, database, LLM calls, scale) from the idea text alone; it asks no follow-up questions.
  - [ ] StackFit does not suggest ideas (see Non-Goals).

### Stack result
Develops `scope.md > The Unique Kernel` and `scope.md > What "Working" Looks Like`.
- As a builder, I want one pick per layer with honest, current facts so I can trust it more than an AI chat's default.
  - [ ] One card per layer (frontend, backend, database, hosting, plus any layer the idea needs, such as an LLM API).
  - [ ] Each card shows: the pick, why it fits this project, why it beats the popular default (for example "React instead of Next.js", "Neon instead of Supabase"), free tier limits, how heavy it is to run locally, and how fast it is deployed (published numbers where they exist).
  - [ ] The usual AI default is visible next to StackFit's pick, so the difference is obvious at a glance.

### Live facts with confidence tags
Develops `scope.md > The POC Boundary` (free tier facts not from model memory). Changed from scope: facts are looked up live on every request instead of from a hand-checked list.
- [ ] Free tier limits and rate limits are looked up live on every request, never taken from model memory.
- [ ] Every fact shows its source link(s).
- [ ] Every fact carries one tag: **verified**, **vague**, or **not found**. StackFit shows whatever it found and how confident it is; it never hides a pick because a lookup failed.

### Refine the stack
- As a builder, I want to change several picks and tell StackFit what I've used before, so the recommendation fits me.
  - [ ] The user can swap any number of picks, not just one.
  - [ ] The user can type tools they've used before (for example "Prisma, MongoDB, Render").
  - [ ] After submitting changes, only the affected layers are rechecked and updated; untouched cards stay as they were. Updated cards keep the same details, tags, and sources.

### Copy as prompt
Develops `scope.md > The POC Boundary`.
- [ ] A "copy as prompt" button copies a prompt the user can paste into their own AI agent to run the same process (read the hackathon, take the idea, pick the lightest free stack, look up limits live, tag confidence, cite sources).
- [ ] Clicking it gives a visible "copied" confirmation.

## States and Boundaries
- **First visit:** only the title, description, and link input.
- **Working:** current stage name visible; inputs can't be resubmitted mid-run.
- **Unreadable link:** error message plus paste-text fallback.
- **Lookup failed or unclear:** the pick still shows, with its tag set to vague or not found and whatever sources were checked.
- **Persistence:** nothing is saved between visits; refreshing the page starts over. No accounts.

## Product Decisions
- Web app first; a Claude Code skill version comes later — the learner wants to see how the web app works before adding features.
- No idea suggestions; the user describes their own idea — the learner chose to keep the cut from scope to keep focus on the stack.
- Live lookup on every request — "you don't know when it will change"; a saved list could go stale overnight.
- Show everything found with a confidence tag rather than hiding uncertain results — "just tell the user whatever we found and if we are confident about it."
- Unreadable link falls back to pasted page text — the link has to be public for StackFit to read it.
- Users can edit multiple picks at once — editing only one "wouldn't make sense."
- Needs are inferred from the idea text, not asked — asking many questions puts users off.
- After an edit, only affected layers update — the learner's choice.
- Benchmarks come later — "first build the web app and see how it works, then add features as we go."

## What We're Building
- Single-page flow: link → hackathon summary → idea → stack result → refine → copy as prompt.
- Stage progress during both processing steps.
- Unreadable-link fallback with pasted text.
- Stack cards with default comparison, reasons, limits, local weight, deployed speed, confidence tag, and sources.
- Live lookup of limits on every request.
- Multi-pick editing and past-tools input, with an updated stack.
- Copy-as-prompt button.

## Deferred From the POC
- **Saved history or accounts:** returning to past results would need storage and sign-in; not needed to prove the kernel.
- **Reading the user's GitHub repos:** typing past tools covers the same need for now (`scope.md > Later`).
- **Real benchmarks:** need deploying sample stacks; too big for 2–4 hours (`scope.md > Later`).

## Possible Later Enhancements
- Requirement checkboxes on the result (tick or untick needs like realtime or database) that change the stack live.
- Downloadable Claude Code skill version of the flow.
- Mobile app stacks.
- Pre-checked list of common services as a fallback when live lookup is slow.

## Non-Goals
- **Idea suggestions:** cut in scope and confirmed here; StackFit is about the stack.
- **Past hackathon or winner summaries:** the learner's existing research step (`scope.md > Explicitly Cut`).
- **Competition stats:** data isn't reliably public (`scope.md > Explicitly Cut`).
- **Reading private or login-only pages:** the user pastes the text instead.

## Open Questions
None blocking. Resolved during review:
- Requirements are worked out from the idea text alone; no follow-up questions (users won't like answering many). Changed from `scope.md > The Core Loop`, which planned a few requirement questions.
- After an edit, only the affected layers are rechecked.
- Nothing is saved between visits.
