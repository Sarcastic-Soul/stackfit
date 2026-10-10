import type { StackResult } from "../../../api/lib/types";
import { StackCard } from "./StackCard";

export function StackView({ result, changed }: { result: StackResult; changed: string[] }) {
  const facts = result.layers.flatMap((l) => l.facts);
  const count = (tag: string) => facts.filter((f) => f.tag === tag).length;

  return (
    <section aria-label="Your stack" className="space-y-1">
      {result.needs.length > 0 && (
        <p className="enter flex flex-wrap gap-x-4 gap-y-1 pb-3 font-mono text-[13px] text-dim">
          <span className="text-ink">needs</span>
          {result.needs.map((need, i) => (
            <span key={i}>{need}</span>
          ))}
        </p>
      )}
      {result.layers.map((layer, i) => (
        <StackCard key={layer.layer + i} layer={layer} index={i} updated={changed.includes(layer.layer)} />
      ))}
      <p className="flex flex-wrap justify-between gap-2 bg-pane-2 px-5 py-2.5 font-mono text-xs text-dim">
        <span>
          {result.layers.length} layers · verified {count("verified")} · vague {count("vague")} · not found{" "}
          {count("not_found")}
        </span>
        <span>verified = a number stated on the provider's own page</span>
      </p>
    </section>
  );
}
