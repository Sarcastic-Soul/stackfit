import { useState } from "react";
import { WarningIcon } from "@phosphor-icons/react";
import type { HackathonSummary } from "../../api/lib/types";
import { LinkInput } from "./components/LinkInput";
import { StageLog, type Stage } from "./components/StageLog";
import { SummaryAndIdea } from "./components/SummaryAndIdea";
import { streamEvents } from "./lib/stream";

export function App() {
  const [busy, setBusy] = useState(false);
  const [stages, setStages] = useState<Stage[]>([]);
  const [summary, setSummary] = useState<HackathonSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const finishStages = (state: Stage["state"]) =>
    setStages((s) => s.map((x) => (x.state === "now" ? { ...x, state } : x)));

  async function readLink(url: string) {
    setBusy(true);
    setStages([]);
    setSummary(null);
    setError(null);
    try {
      await streamEvents("/api/hackathon", { url }, (event) => {
        if (event.type === "stage") {
          setStages((s) => [...s.map((x) => ({ ...x, state: "done" as const })), { label: event.label, state: "now" }]);
        } else if (event.type === "summary") {
          finishStages("done");
          setSummary(event.data);
        } else if (event.type === "error") {
          finishStages("failed");
          setError(event.message);
        }
      });
    } catch {
      finishStages("failed");
      setError("Couldn't reach the StackFit API. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

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
          <LinkInput busy={busy} onSubmit={readLink} />
        </div>
      </section>

      <div className="mt-12 space-y-4">
        {stages.length > 0 && <StageLog stages={stages} />}
        {error && (
          <p role="alert" className="enter flex items-start gap-3 border border-danger/50 bg-pane px-5 py-4 font-mono text-sm">
            <WarningIcon size={16} weight="bold" className="mt-0.5 shrink-0 text-danger" aria-hidden />
            {error}
          </p>
        )}
        {summary && <SummaryAndIdea summary={summary} />}
        {!busy && !summary && !error && stages.length === 0 && (
          <p className="font-mono text-xs text-dim">Nothing is saved. Refresh to start over.</p>
        )}
      </div>
    </main>
  );
}
