// Copies the prompt from lib/prompt.ts and shows "Copied" for a few seconds.
import { useEffect, useState } from "react";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";

export function CopyPrompt({ getText }: { getText: () => string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const t = setTimeout(() => setState("idle"), 2500);
    return () => clearTimeout(t);
  }, [state]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(getText());
      setState("copied");
    } catch {
      setState("failed");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-2 border border-line px-3.5 py-2.5 font-mono text-[13px] font-medium text-ink transition-colors hover:border-accent hover:text-accent active:translate-y-px"
    >
      {state === "copied" ? (
        <CheckIcon size={15} weight="bold" className="text-accent" aria-hidden />
      ) : (
        <CopyIcon size={15} aria-hidden />
      )}
      <span aria-live="polite">
        {state === "copied" ? "Copied" : state === "failed" ? "Copy failed, try again" : "Copy as prompt"}
      </span>
    </button>
  );
}
