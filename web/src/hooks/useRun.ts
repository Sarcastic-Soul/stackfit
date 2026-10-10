// One streamed API run: its stage log, busy flag, and error line.
import { useState } from "react";
import type { StreamEvent } from "../../../server/lib/types";
import type { Stage } from "../components/StageLog";
import { streamEvents } from "../lib/stream";

export function useRun() {
  const [busy, setBusy] = useState(false);
  const [stages, setStages] = useState<Stage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const finishStages = (state: Stage["state"]) =>
    setStages((s) => s.map((x) => (x.state === "now" ? { ...x, state } : x)));

  function reset() {
    setStages([]);
    setError(null);
  }

  // Streams path and hands every non-stage, non-error event to onEvent.
  async function run(path: string, body: unknown, onEvent: (event: StreamEvent) => void) {
    setBusy(true);
    reset();
    try {
      await streamEvents(path, body, (event) => {
        if (event.type === "stage") {
          setStages((s) => [...s.map((x) => ({ ...x, state: "done" as const })), { label: event.label, state: "now" }]);
        } else if (event.type === "unreadable") {
          finishStages("failed");
          onEvent(event);
        } else if (event.type === "error") {
          finishStages("failed");
          setError(event.message);
        } else {
          finishStages("done");
          onEvent(event);
        }
      });
    } catch {
      finishStages("failed");
      setError("Couldn't reach the StackFit API. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return { busy, stages, error, run, reset };
}
