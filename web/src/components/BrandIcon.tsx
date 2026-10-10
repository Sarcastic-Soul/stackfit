// Draws Simple Icons paths in the current text color. A cube stands in
// when no brand icon was found (Simple Icons has no OpenAI logo, for example).
import { CubeIcon } from "@phosphor-icons/react";
import type { Icon } from "../../../api/lib/types";

export function BrandIcons({ icons, size, className = "" }: { icons: Icon[]; size: number; className?: string }) {
  if (!icons.length) return <CubeIcon size={size} className={`shrink-0 ${className}`} aria-hidden />;
  return (
    <span className={`flex shrink-0 gap-1.5 ${className}`}>
      {icons.map((icon) => (
        <svg key={icon.title} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d={icon.path} />
        </svg>
      ))}
    </span>
  );
}
