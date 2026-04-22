import { Lock } from "lucide-react";

type LockedNoticeProps = {
  title: string;
  reason: string;
};

export function LockedNotice({ title, reason }: LockedNoticeProps) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-base">
        <Lock className="size-6 text-muted" aria-hidden />
      </span>
      <h3 className="text-lg font-semibold text-primary">{title}</h3>
      <p className="text-muted max-w-md text-sm">{reason}</p>
    </div>
  );
}
