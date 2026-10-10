import { useState, type FormEvent } from "react";
import { ArrowSquareOutIcon, StackIcon } from "@phosphor-icons/react";
import type { HackathonSummary } from "../../../api/lib/types";

function liveLink(value: HackathonSummary["liveLinkRequired"]) {
  if (value === true) return "required";
  if (value === false) return "not required";
  return "not stated";
}

function hostOf(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

const MIN_IDEA = 10;
const MAX_IDEA = 1200;

type Props = { summary: HackathonSummary; busy: boolean; onPick: (idea: string) => void };

function IdeaBox({ busy, onPick }: Omit<Props, "summary">) {
  const [idea, setIdea] = useState("");
  const [problem, setProblem] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const text = idea.trim();
    if (text.length < MIN_IDEA) {
      setProblem("Describe your idea in a sentence or two.");
      return;
    }
    setProblem(null);
    onPick(text);
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="enter mt-1 grid gap-3 bg-pane p-5 md:grid-cols-[1fr_auto] md:items-end"
    >
      <div>
        <label htmlFor="idea" className="block font-mono text-xs text-dim">
          Your idea, in a few lines
        </label>
        <textarea
          id="idea"
          rows={3}
          maxLength={MAX_IDEA}
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          readOnly={busy}
          aria-invalid={problem ? true : undefined}
          aria-describedby={problem ? "idea-problem" : undefined}
          placeholder="Turn lecture voice notes into short study cards. Upload audio, get 10 cards back."
          className="mt-2 block w-full resize-y border border-line bg-bg px-3.5 py-3 text-[15px] leading-relaxed text-ink outline-none placeholder:text-dim/80 focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-invalid:border-danger read-only:opacity-60"
        />
        {problem && (
          <p id="idea-problem" className="mt-2 font-mono text-xs text-danger">
            {problem}
          </p>
        )}
      </div>
      <button
        type="submit"
        aria-disabled={busy}
        className="flex h-12 items-center justify-center gap-2 bg-accent px-5 text-sm font-semibold whitespace-nowrap text-bg transition-transform active:translate-y-px aria-disabled:opacity-60"
      >
        <StackIcon size={16} weight="bold" aria-hidden />
        Pick my stack
      </button>
    </form>
  );
}

export function SummaryAndIdea({ summary, busy, onPick }: Props) {
  const facts = [
    { label: "required tech", value: summary.requiredTech.length ? summary.requiredTech.join(", ") : "none" },
    { label: "live link", value: liveLink(summary.liveLinkRequired) },
    { label: "platform", value: summary.platform === "either" ? "web or mobile" : summary.platform },
  ];

  return (
    <div>
      <article className="enter grid border-l-[3px] border-accent bg-pane md:grid-cols-[44px_300px_1fr]">
        <div className="px-5 pt-3 font-mono text-xs tracking-[0.08em] text-accent md:flex md:items-center md:justify-center md:border-r md:border-line md:px-0 md:py-4 md:[writing-mode:vertical-rl] md:rotate-180">
          HACKATHON
        </div>
        <div className="border-b border-line p-5 md:border-b-0 md:border-r">
          <h2 className="font-display text-xl font-bold leading-tight tracking-[-0.04em]">{summary.name}</h2>
          {summary.sourceUrl && (
            <a
              href={summary.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 py-1.5 font-mono text-xs text-dim underline underline-offset-4 hover:text-ink"
            >
              {hostOf(summary.sourceUrl)}
              <ArrowSquareOutIcon size={12} aria-hidden />
            </a>
          )}
        </div>
        <div>
          <dl className="grid sm:grid-cols-3">
            {facts.map((f) => (
              <div key={f.label} className="border-b border-line p-5 sm:border-r sm:last:border-r-0">
                <dt className="font-mono text-xs text-dim">{f.label}</dt>
                <dd className="mt-1.5 font-mono text-[15px] font-medium">{f.value}</dd>
              </div>
            ))}
          </dl>
          {summary.notes.length > 0 && (
            <ul className="space-y-1.5 p-5 text-sm text-dim">
              {summary.notes.map((note, i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden className="font-mono text-accent">
                    &gt;
                  </span>
                  {note}
                </li>
              ))}
            </ul>
          )}
        </div>
      </article>
      <IdeaBox busy={busy} onPick={onPick} />
    </div>
  );
}
