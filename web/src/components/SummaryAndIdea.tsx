import { ArrowSquareOutIcon } from "@phosphor-icons/react";
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

export function SummaryAndIdea({ summary }: { summary: HackathonSummary }) {
  const facts = [
    { label: "required tech", value: summary.requiredTech.length ? summary.requiredTech.join(", ") : "none" },
    { label: "live link", value: liveLink(summary.liveLinkRequired) },
    { label: "platform", value: summary.platform === "either" ? "web or mobile" : summary.platform },
  ];

  return (
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
                <span aria-hidden className="font-mono text-accent">&gt;</span>
                {note}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
