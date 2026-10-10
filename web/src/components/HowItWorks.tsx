// First-visit explainer: the flow as a track, then one example stack bar that
// shows the "pick, not default" idea and what each fact tag means.
import { ArrowRightIcon, LightbulbIcon, LinkIcon, ListChecksIcon, StackIcon } from "@phosphor-icons/react";
import { siNextdotjs, siReact, siVite } from "simple-icons";
import type { Fact } from "../../../api/lib/types";
import { BrandIcons } from "./BrandIcon";
import { Tag } from "./StackCard";

const STEPS = [
  { Icon: LinkIcon, title: "Hackathon link", note: "rules read for you" },
  { Icon: ListChecksIcon, title: "Its limits", note: "required tech, live link, platform" },
  { Icon: LightbulbIcon, title: "Your idea", note: "a few lines" },
  { Icon: StackIcon, title: "Lightest free stack", note: "one pick per layer" },
];

const TAGS: { tag: Fact["tag"]; note: string }[] = [
  { tag: "verified", note: "a number on the provider's own page" },
  { tag: "vague", note: "found, but not a clear number, or not an official page" },
  { tag: "not_found", note: "the pages don't say. Still shown." },
];

const icon = (i: { title: string; path: string }) => ({ title: i.title, path: i.path });

export function HowItWorks() {
  return (
    <section aria-labelledby="how" className="enter mt-16 md:mt-20">
      <h2 id="how" className="sr-only">
        How StackFit works
      </h2>

      <ol className="grid gap-y-5 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] md:items-start md:gap-x-4">
        {STEPS.map(({ Icon, title, note }, i) => {
          const last = i === STEPS.length - 1;
          return (
            <li key={title} className="contents">
              <div className="flex items-start gap-3.5 md:flex-col md:gap-3">
                <span
                  className={`grid size-12 shrink-0 place-items-center border ${last ? "border-accent bg-accent text-bg" : "border-line bg-pane text-ink"}`}
                >
                  <Icon size={22} weight={last ? "bold" : "regular"} aria-hidden />
                </span>
                <div>
                  <p className={`font-display text-[15px] font-bold tracking-[-0.03em] ${last ? "text-accent" : ""}`}>
                    {title}
                  </p>
                  <p className="mt-1 font-mono text-xs text-dim">{note}</p>
                </div>
              </div>
              {!last && (
                <span aria-hidden className="hidden h-12 items-center text-line md:flex">
                  <span className="w-6 border-t border-dashed border-dim/50 lg:w-12" />
                  <ArrowRightIcon size={14} className="-ml-1 text-dim" />
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-12 grid border-l-[3px] border-line bg-pane md:grid-cols-[44px_300px_1fr]">
        <div className="px-5 pt-4 font-mono text-xs tracking-[0.08em] text-dim uppercase md:flex md:items-center md:justify-center md:border-r md:border-line md:px-0 md:py-4 md:[writing-mode:vertical-rl] md:rotate-180">
          example
        </div>
        <div className="border-b border-line p-5 md:border-r md:border-b-0">
          <div className="flex items-start gap-3.5">
            <BrandIcons icons={[icon(siVite), icon(siReact)]} size={30} className="text-ink" />
            <div>
              <p className="font-display text-lg leading-tight font-bold tracking-[-0.04em]">Vite + React</p>
              <p className="mt-1.5 flex items-center gap-1.5 font-mono text-xs text-dim">
                not
                <BrandIcons icons={[icon(siNextdotjs)]} size={13} />
                <span className="line-through decoration-dim/60">Next.js</span>
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-dim">The pick, next to what an AI chat would usually say.</p>
        </div>
        <ul className="grid content-start sm:grid-cols-3">
          {TAGS.map(({ tag, note }) => (
            <li
              key={tag}
              className="flex flex-col gap-2 border-b border-line px-5 py-4 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0"
            >
              <Tag tag={tag} />
              <span className="text-sm leading-relaxed text-dim">{note}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="flex flex-wrap justify-between gap-2 bg-pane-2 px-5 py-2.5 font-mono text-xs text-dim">
        <span>every fact links to its source</span>
        <span>no login · nothing saved · refresh starts over</span>
      </p>
    </section>
  );
}
