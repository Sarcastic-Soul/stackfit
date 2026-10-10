// Brand icons from the simple-icons package, looked up by slug on the server
// so the page only receives the few SVG paths it draws.
import * as simpleIcons from "simple-icons";
import type { Icon } from "./types";

type SimpleIcon = { title: string; slug: string; path: string };

const bySlug = new Map<string, SimpleIcon>();
for (const icon of Object.values(simpleIcons) as unknown[]) {
  const i = icon as SimpleIcon;
  if (i && typeof i.slug === "string") bySlug.set(i.slug, i);
}

// Simple Icons slugs are lowercase with "." -> "dot" and "+" -> "plus" (e.g. "nextdotjs").
function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/\+/g, "plus")
    .replace(/\./g, "dot")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}

export function resolveIcons(slugs: string[]): Icon[] {
  const icons: Icon[] = [];
  for (const raw of slugs.slice(0, 3)) {
    const found = bySlug.get(raw.toLowerCase()) ?? bySlug.get(toSlug(raw));
    if (found && !icons.some((i) => i.title === found.title)) icons.push({ title: found.title, path: found.path });
  }
  return icons;
}
