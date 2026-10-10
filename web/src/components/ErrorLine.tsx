import { WarningIcon } from "@phosphor-icons/react";

export function ErrorLine({ message }: { message: string }) {
  return (
    <p role="alert" className="enter flex items-start gap-3 border border-danger/50 bg-pane px-5 py-4 font-mono text-sm">
      <WarningIcon size={16} weight="bold" className="mt-0.5 shrink-0 text-danger" aria-hidden />
      {message}
    </p>
  );
}
