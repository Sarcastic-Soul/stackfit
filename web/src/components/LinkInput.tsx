import { useState, type FormEvent } from "react";
import { ArrowRightIcon } from "@phosphor-icons/react";

type Props = { busy: boolean; onSubmit: (url: string) => void };

export function LinkInput({ busy, onSubmit }: Props) {
  const [value, setValue] = useState("");
  const [problem, setProblem] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const url = value.trim();
    if (!/^https?:\/\/\S+\.\S+/i.test(url)) {
      setProblem("Paste a full link starting with http:// or https://");
      return;
    }
    setProblem(null);
    onSubmit(url);
  }

  return (
    <form onSubmit={submit} className="mt-5" noValidate>
      <label htmlFor="link" className="block font-mono text-xs text-dim">
        Hackathon link (public page)
      </label>
      <div className="mt-2 flex border border-line bg-pane focus-within:border-accent has-[input[aria-invalid]]:border-danger has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-accent">
        <input
          id="link"
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          readOnly={busy}
          aria-invalid={problem ? true : undefined}
          aria-describedby={problem ? "link-problem" : undefined}
          className="min-w-0 flex-1 bg-transparent px-3.5 py-3.5 font-mono text-sm text-ink outline-none placeholder:text-dim read-only:opacity-60"
          placeholder="https://your-hackathon.devpost.com/"
        />
        <button
          type="submit"
          aria-disabled={busy}
          className="flex items-center gap-2 bg-accent px-5 text-sm font-semibold text-bg transition-transform active:translate-y-px aria-disabled:opacity-60"
        >
          <ArrowRightIcon size={16} weight="bold" aria-hidden />
          Read
        </button>
      </div>
      {problem && (
        <p id="link-problem" className="mt-2 font-mono text-xs text-danger">
          {problem}
        </p>
      )}
    </form>
  );
}
