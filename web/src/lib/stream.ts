// Posts JSON to an API route and hands each newline-delimited JSON event
// to onEvent as soon as it arrives.
import type { StreamEvent } from "../../../api/lib/types";

export async function streamEvents(path: string, body: unknown, onEvent: (event: StreamEvent) => void) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) throw new Error(`Request failed (${res.status})`);

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let end: number;
    while ((end = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, end).trim();
      buffer = buffer.slice(end + 1);
      if (line) onEvent(JSON.parse(line));
    }
  }
  if (buffer.trim()) onEvent(JSON.parse(buffer));
}
