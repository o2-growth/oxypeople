import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * O2 Design System — Button (section 6.1)
 *
 * Pill-shaped button with two variants (primary/ghost) and two sizes.
 * Drop-in compatible with the shadcn Button API: same `variant`, `size`,
 * `asChild`, `className` and standard HTML button attributes.
 *
 * Visual contract:
 * - shape: rounded-full (pill)
 * - default padding: 22×14 (px-[22px] py-[14px])
 * - sm padding: 14×9 (px-[14px] py-[9px])
 * - typography: Montserrat 14/600 (sm: 11/600)
 * - transitions: transform/filter/background/border (150–200ms)
 * - mobile (<768px): full width, centered content
 */
const o2ButtonVariants = cva(
  [
    // base layout
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    // shape
    "rounded-full border",
    // typography
    "font-body font-semibold",
    // motion
    "transition-[transform,filter,background-color,border-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
    // active press
    "active:translate-y-[1px]",
    // a11y (uses shadcn `--primary` which Phase 1 mapped to Lima)
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    // disabled
    "disabled:pointer-events-none disabled:opacity-50",
    // mobile-first: full width by default, auto from sm
    "w-full sm:w-auto",
    // icon sizing helper
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        // shadcn `--accent` is HOVER SURFACE (neutral), NOT brand.
        // Lima brand color lives in `--primary` (mapped in Phase 1).
        primary: [
          "bg-primary text-primary-foreground border-transparent",
          "hover:brightness-110",
        ].join(" "),
        ghost: [
          "bg-transparent text-foreground border border-border",
          "hover:bg-muted hover:border-muted-foreground/40",
        ].join(" "),
      },
      size: {
        default: "px-[22px] py-[14px] text-[14px] [&_svg]:size-4",
        sm: "px-[14px] py-[9px] text-[11px] [&_svg]:size-3",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface O2ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof o2ButtonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, O2ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(o2ButtonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "O2Button";

export { Button, o2ButtonVariants };
