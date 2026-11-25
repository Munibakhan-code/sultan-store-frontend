import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./LoadingSpinner";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-display font-semibold uppercase tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-gradient-gold text-primary-foreground shadow-gold hover:brightness-110",
        outline:
          "border border-primary/50 text-primary hover:bg-primary/10 hover:border-primary bg-transparent",
        surface: "bg-surface-elevated text-foreground border border-border hover:border-primary/50",
        ghost: "text-muted-foreground hover:text-primary hover:bg-primary/10",
        destructive: "bg-destructive text-destructive-foreground hover:brightness-110",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
      full: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", full: false },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean | undefined;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, full, isLoading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, full }), className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <LoadingSpinner size="sm" /> : null}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

export { buttonVariants };
