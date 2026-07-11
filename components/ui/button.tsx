import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-base font-bold tracking-tight transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_4px_0_0_theme(colors.amber.600)] hover:brightness-105 active:shadow-[0_1px_0_0_theme(colors.amber.600)] active:translate-y-[3px]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[0_4px_0_0_theme(colors.ink.800)] hover:brightness-125 active:shadow-[0_1px_0_0_theme(colors.ink.800)] active:translate-y-[3px]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_4px_0_0_theme(colors.ink.950)] hover:brightness-105 active:shadow-[0_1px_0_0_theme(colors.ink.950)] active:translate-y-[3px]",
        outline:
          "border-[3px] border-ink-950 bg-background text-ink-950 hover:bg-ink-950 hover:text-cream-100",
        ghost: "text-ink-950 hover:bg-ink-950/8",
        link: "text-ink-950 underline underline-offset-4 hover:no-underline",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 text-sm",
        lg: "h-16 px-9 text-lg",
        xl: "h-20 px-11 text-xl",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
