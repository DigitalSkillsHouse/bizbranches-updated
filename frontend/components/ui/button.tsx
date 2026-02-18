import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

// Helper to extract text from children for glitch effect
function extractText(children: React.ReactNode): string {
  if (typeof children === 'string') {
    return children
  }
  if (typeof children === 'number') {
    return String(children)
  }
  if (Array.isArray(children)) {
    return children.map(extractText).join(' ')
  }
  if (React.isValidElement(children) && children.props.children) {
    return extractText(children.props.children)
  }
  return 'BUTTON'
}

const buttonVariants = cva(
  "relative overflow-visible inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-transparent text-gray-900 dark:text-white border border-transparent",
        destructive:
          "bg-transparent text-gray-900 dark:text-white border border-transparent",
        outline:
          "bg-transparent text-gray-900 dark:text-primary border border-primary/30",
        secondary:
          "bg-transparent text-gray-900 border border-gray-300 dark:text-gray-100 dark:border-gray-600",
        ghost:
          "bg-transparent text-gray-900 dark:text-white hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 border border-transparent",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80 border-0 bg-transparent",
      },
      size: {
        default: "h-10 px-5 py-2.5 has-[>svg]:px-4",
        sm: "h-8 rounded-md gap-1.5 px-3.5 has-[>svg]:px-2.5 text-xs",
        lg: "h-12 rounded-lg px-8 has-[>svg]:px-6 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /** Set to false to opt-out of the global CTA animation for specific buttons */
    animated?: boolean
  }

function Button({
  className,
  variant,
  size,
  asChild = false,
  animated = true,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : ("button" as const)

  // Get button text for glitch effect
  const buttonText = extractText(children)

  const buttonClasses = cn(
    buttonVariants({ variant, size }),
    "select-none",
    className
  )

  if (asChild) {
    return (
      <Comp data-slot="button" data-text={buttonText} className={buttonClasses} {...props}>
        {children}
      </Comp>
    )
  }

  return (
    <Comp data-slot="button" data-text={buttonText} className={buttonClasses} {...props}>
      <span className="relative z-10 inline-flex items-center">{children}</span>
    </Comp>
  )
}

export { Button, buttonVariants }
