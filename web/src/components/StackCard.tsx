import { ArrowSquareOutIcon, MinusIcon, QuestionIcon, SealCheckIcon } from "@phosphor-icons/react";
import type { Fact, Layer } from "../../../api/lib/types";
import { BrandIcons } from "./BrandIcon";

const TAGS = {
  verified: { text: "verified", Icon: SealCheckIcon, className: "bg-accent text-bg" },
  vague: { text: "vague", Icon: QuestionIcon, className: "border border-dim text-ink" },
  not_found: { text: "not found", Icon: MinusIcon, className: "border border-dashed border-dim text-dim" },
} as const;

export function Tag({ tag }: { tag: Fact["tag"] }) {
  const { text, Icon, className } = TAGS[tag];
  return (
    <span className={`inline-flex w-fit items-center gap-1 px-1.5 py-px font-mono text-xs font-medium ${className}`}>
      <Icon size={12} weight="bold" aria-hidden />
      {text}
    </span>
  );
}

function shortUrl(url: string) {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/$/, "");
    return u.hostname.replace(/^www\./, "") + (path.length > 28 ? path.slice(0, 27) + "…" : path);
  } catch {
    return url;
  }
}

function FactCell({ fact }: { fact: Fact }) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-line px-5 py-4 last:border-b-0 sm:border-r sm:last:border-b sm:even:border-r-0 xl:even:border-r xl:[&:nth-child(3n)]:border-r-0">
      <span className="font-mono text-xs text-dim">{fact.label}</span>
      <span className={`font-mono text-[15px] font-medium ${fact.tag === "not_found" ? "text-dim" : ""}`}>{fact.value}</span>
      <Tag tag={fact.tag} />
      {fact.sources.map((s) => (
        <a
          key={s.url}
          href={s.url}
          target="_blank"
          rel="noreferrer"
          title={s.title}
          className="inline-flex w-fit items-center gap-1 py-0.5 font-mono text-xs break-all text-dim underline underline-offset-4 hover:text-ink"
        >
          {shortUrl(s.url)}
          <ArrowSquareOutIcon size={11} className="shrink-0" aria-hidden />
        </a>
      ))}
    </div>
  );
}

export function StackCard({ layer, index, updated }: { layer: Layer; index: number; updated: boolean }) {
  return (
    <article
      className={`enter grid border-l-[3px] bg-pane transition-colors hover:border-accent md:grid-cols-[44px_300px_1fr] ${updated ? "border-accent" : "border-line"}`}
      style={{ animationDelay: `${index * 50}ms` }}
      aria-label={`${layer.layer}: ${layer.pick}`}
    >
      <div className="px-5 pt-4 font-mono text-xs tracking-[0.08em] text-accent uppercase md:flex md:items-center md:justify-center md:border-r md:border-line md:px-0 md:py-4 md:[writing-mode:vertical-rl] md:rotate-180">
        {layer.layer}
      </div>
      <div className="border-b border-line p-5 md:border-r md:border-b-0">
        <div className="flex items-start gap-3.5">
          <BrandIcons icons={layer.icons} size={30} className="text-ink" />
          <div className="min-w-0">
            {updated && <p className="mb-1 font-mono text-xs text-accent">updated</p>}
            <h3 className="font-display text-lg leading-tight font-bold tracking-[-0.04em]">{layer.pick}</h3>
            <p className="mt-1.5 flex items-center gap-1.5 font-mono text-xs text-dim">
              not
              <BrandIcons icons={layer.defaultIcons} size={13} />
              <span className="line-through decoration-dim/60">{layer.usualDefault}</span>
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-ink/85">{layer.why}</p>
        <p className="mt-2 text-sm leading-relaxed text-dim">{layer.whyBeatsDefault}</p>
      </div>
      <div className="grid content-start sm:grid-cols-2 xl:grid-cols-3">
        {layer.facts.map((fact, i) => (
          <FactCell key={i} fact={fact} />
        ))}
      </div>
    </article>
  );
}
