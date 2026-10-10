import { CheckIcon, CircleNotchIcon, XIcon } from "@phosphor-icons/react";

export type Stage = { label: string; state: "now" | "done" | "failed" };

export function StageLog({ stages }: { stages: Stage[] }) {
  return (
    <ol aria-live="polite" className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-[13px]">
      {stages.map((stage, i) => (
        <li key={i} className={`flex items-center gap-2 ${stage.state === "now" ? "text-ink" : "text-dim"}`}>
          {stage.state === "done" && <CheckIcon size={14} className="text-accent" aria-hidden />}
          {stage.state === "now" && <CircleNotchIcon size={14} className="animate-spin text-accent" aria-hidden />}
          {stage.state === "failed" && <XIcon size={14} className="text-danger" aria-hidden />}
          {stage.label}
          <span className="sr-only">{stage.state === "now" ? " (working)" : ` (${stage.state})`}</span>
        </li>
      ))}
    </ol>
  );
}
