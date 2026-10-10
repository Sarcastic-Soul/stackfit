// Shown when the hackathon page can't be read from the server (private,
// login-only, blocked, or built with JavaScript). The pasted text takes the link's place.
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRightIcon, ClipboardTextIcon, WarningIcon } from "@phosphor-icons/react";

const MIN_CHARS = 200;

type Props = { busy: boolean; onSubmit: (text: string) => void };

export function PasteFallback({ busy, onSubmit }: Props) {
  const [text, setText] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => boxRef.current?.focus(), []);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (text.trim().length < MIN_CHARS) {
      setProblem("That's too short. Paste the whole page: rules, prizes and requirements.");
      return;
    }
    setProblem(null);
    onSubmit(text.trim());
  }

  return (
    <form onSubmit={submit} noValidate className="enter border border-danger/50 bg-pane">
      <p role="alert" className="flex items-start gap-3 px-5 pt-4 font-mono text-sm">
        <WarningIcon size={16} weight="bold" className="mt-0.5 shrink-0 text-danger" aria-hidden />
        The link you provided isn't accessible from here. Please confirm the link is public.
      </p>
      <div className="grid gap-3 p-5 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <label htmlFor="pasted" className="flex items-center gap-2 font-mono text-xs text-dim">
            <ClipboardTextIcon size={14} aria-hidden />
            Or paste the page text (select all on the hackathon page, copy, paste here)
          </label>
          <textarea
            id="pasted"
            ref={boxRef}
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            readOnly={busy}
            aria-invalid={problem ? true : undefined}
            aria-describedby={problem ? "pasted-problem" : undefined}
            className="mt-2 block w-full resize-y border border-line bg-bg px-3.5 py-3 font-mono text-[13px] leading-relaxed text-ink outline-none focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-invalid:border-danger read-only:opacity-60"
          />
          {problem && (
            <p id="pasted-problem" className="mt-2 font-mono text-xs text-danger">
              {problem}
            </p>
          )}
        </div>
        <button
          type="submit"
          aria-disabled={busy}
          className="flex h-12 items-center justify-center gap-2 bg-accent px-5 text-sm font-semibold whitespace-nowrap text-bg transition-transform active:translate-y-px aria-disabled:opacity-60"
        >
          <ArrowRightIcon size={16} weight="bold" aria-hidden />
          Read pasted text
        </button>
      </div>
    </form>
  );
}
