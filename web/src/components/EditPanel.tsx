// Change any number of picks (free text per layer) and list tools you've used
// before. One submit; the API rechecks only the layers that change.
import { useState, type FormEvent } from "react";
import { ArrowsClockwiseIcon, PencilSimpleIcon, XIcon } from "@phosphor-icons/react";
import type { StackResult } from "../../../api/lib/types";

export type Edits = { swaps: Record<string, string>; pastTools: string };

type Props = { result: StackResult; busy: boolean; onSubmit: (edits: Edits) => void };

const inputClass =
  "mt-1.5 block w-full border border-line bg-bg px-3 py-2.5 font-mono text-sm text-ink outline-none placeholder:text-dim/80 focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent read-only:opacity-60";

export function EditPanel({ result, busy, onSubmit }: Props) {
  const [open, setOpen] = useState(false);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [pastTools, setPastTools] = useState("");
  const [problem, setProblem] = useState<string | null>(null);

  function openPanel() {
    if (busy) return;
    setPicks(Object.fromEntries(result.layers.map((l) => [l.layer, l.pick])));
    setProblem(null);
    setOpen(true);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const swaps: Record<string, string> = {};
    for (const layer of result.layers) {
      const pick = picks[layer.layer]?.trim() ?? "";
      if (pick && pick !== layer.pick) swaps[layer.layer] = pick;
    }
    if (!Object.keys(swaps).length && !pastTools.trim()) {
      setProblem("Change a pick or add a tool first.");
      return;
    }
    setProblem(null);
    setOpen(false);
    setPastTools("");
    onSubmit({ swaps, pastTools: pastTools.trim() });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={openPanel}
        aria-disabled={busy}
        className="flex items-center gap-2 border border-line px-3.5 py-2.5 font-mono text-[13px] font-medium text-ink transition-colors hover:border-accent hover:text-accent active:translate-y-px aria-disabled:opacity-60"
      >
        <PencilSimpleIcon size={15} aria-hidden />
        Edit picks
      </button>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="enter w-full border border-line bg-pane p-5" aria-label="Edit picks">
      <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        {result.layers.map((layer) => {
          const changed = (picks[layer.layer] ?? "").trim() !== layer.pick;
          return (
            <div key={layer.layer}>
              <label
                htmlFor={`pick-${layer.layer}`}
                className="font-mono text-xs tracking-[0.08em] text-accent uppercase"
              >
                {layer.layer}
                {changed && <span className="ml-2 tracking-normal text-dim normal-case">changed</span>}
              </label>
              <input
                id={`pick-${layer.layer}`}
                value={picks[layer.layer] ?? ""}
                maxLength={60}
                onChange={(e) => {
                  setProblem(null);
                  setPicks((p) => ({ ...p, [layer.layer]: e.target.value }));
                }}
                className={inputClass}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-5">
        <label htmlFor="past-tools" className="font-mono text-xs text-dim">
          Tools you've used before (optional)
        </label>
        <input
          id="past-tools"
          value={pastTools}
          maxLength={300}
          onChange={(e) => {
            setProblem(null);
            setPastTools(e.target.value);
          }}
          placeholder="Prisma, MongoDB, Render"
          className={inputClass}
        />
      </div>
      {problem && (
        <p role="alert" className="mt-3 font-mono text-xs text-danger">
          {problem}
        </p>
      )}
      <div className="mt-5 flex flex-wrap gap-2.5">
        <button
          type="submit"
          className="flex h-11 items-center gap-2 bg-accent px-4 text-sm font-semibold text-bg transition-transform active:translate-y-px"
        >
          <ArrowsClockwiseIcon size={16} weight="bold" aria-hidden />
          Update stack
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex h-11 items-center gap-2 border border-line px-4 font-mono text-[13px] text-ink hover:border-accent hover:text-accent"
        >
          <XIcon size={14} aria-hidden />
          Cancel
        </button>
      </div>
    </form>
  );
}
