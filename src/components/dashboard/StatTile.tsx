import type { LucideIcon } from "lucide-react";

type Props = {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  accent?: "primary" | "accent" | "muted";
};

const ACCENTS = {
  primary: "border-primary/20 bg-primary/5 text-primary",
  accent: "border-accent/30 bg-accent/10 text-accent-foreground",
  muted: "border-base bg-surface text-base-color",
} as const;

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  accent = "muted",
}: Props) {
  return (
    <div
      className={`flex flex-col justify-between gap-3 rounded-xl border p-5 shadow-sm ${ACCENTS[accent]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-muted text-xs font-semibold uppercase tracking-wider">
          {label}
        </p>
        {Icon ? (
          <Icon className="text-primary/60 size-5" aria-hidden />
        ) : null}
      </div>
      <div>
        <p className="text-primary text-3xl font-bold leading-tight">{value}</p>
        {hint ? <p className="text-muted mt-1 text-xs">{hint}</p> : null}
      </div>
    </div>
  );
}
