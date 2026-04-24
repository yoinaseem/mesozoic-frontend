import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex h-5 items-center rounded-full px-2 text-xs font-medium",
  {
    variants: {
      variant: {
        muted: "bg-muted text-muted-foreground",
        success:
          "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
        warning:
          "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
        destructive: "bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: {
      variant: "muted",
    },
  },
);

type StatusBadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof statusBadgeVariants>;

export function StatusBadge({
  className,
  variant,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(statusBadgeVariants({ variant }), className)}
      {...props}
    />
  );
}
