import { useState } from "react";
import type { HackathonSummary, StackResult } from "../../api/lib/types";
import { ErrorLine } from "./components/ErrorLine";
import { LinkInput } from "./components/LinkInput";
import { StackView } from "./components/StackView";
import { StageLog } from "./components/StageLog";
import { SummaryAndIdea } from "./components/SummaryAndIdea";
import { useRun } from "./hooks/useRun";

export function App() {
  const hackathon = useRun();
  const stack = useRun();
  const [summary, setSummary] = useState<HackathonSummary | null>(null);
  const [result, setResult] = useState<StackResult | null>(null);

  function readLink(url: string) {
    setSummary(null);
    setResult(null);
    stack.reset();
    hackathon.run("/api/hackathon", { url }, (event) => {
      if (event.type === "summary") setSummary(event.data);
    });
  }

  function pickStack(idea: string) {
    setResult(null);
    stack.run("/api/stack", { hackathon: summary, idea }, (event) => {
      if (event.type === "result") setResult(event.data);
    });
  }

  const untouched = !hackathon.busy && !summary && !hackathon.error && hackathon.stages.length === 0;

  return (
    <main className="mx-auto max-w-[1180px] px-4 pb-24 pt-10 md:pt-16">
      <section className="grid items-end gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        <h1 className="font-display text-[clamp(64px,10vw,112px)] font-bold leading-[0.92] tracking-[-0.07em]">
          stack
          <br />
          <span className="text-accent">fit</span>
        </h1>
        <div>
          <p className="max-w-[46ch] text-[17px] leading-relaxed text-dim">
            Paste a hackathon link, describe your idea, get the lightest free stack. Limits read live from each
            provider's own page.
          </p>
          <LinkInput busy={hackathon.busy || stack.busy} onSubmit={readLink} />
        </div>
      </section>

      <div className="mt-12 space-y-4">
        {hackathon.stages.length > 0 && <StageLog stages={hackathon.stages} />}
        {hackathon.error && <ErrorLine message={hackathon.error} />}
        {summary && <SummaryAndIdea summary={summary} busy={stack.busy} onPick={pickStack} />}
        {untouched && <p className="font-mono text-xs text-dim">Nothing is saved. Refresh to start over.</p>}
      </div>

      {(stack.stages.length > 0 || stack.error || result) && (
        <div className="mt-10 space-y-4">
          {stack.stages.length > 0 && <StageLog stages={stack.stages} />}
          {stack.error && <ErrorLine message={stack.error} />}
          {result && <StackView result={result} />}
        </div>
      )}
    </main>
  );
}
