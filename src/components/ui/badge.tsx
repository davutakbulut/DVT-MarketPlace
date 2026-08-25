import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none tabular-nums",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-white",
        secondary: "border-transparent bg-primary-tint-100 text-primary",
        danger: "border-status-danger-border bg-status-danger-bg text-status-danger-text",
        warning: "border-status-warning-border bg-status-warning-bg text-status-warning-text",
        success: "border-status-success-border bg-status-success-bg text-status-success-text",
        excellent: "border-status-excellent-border bg-status-excellent-bg text-status-excellent-text",
        outline: "border-border text-dark",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
