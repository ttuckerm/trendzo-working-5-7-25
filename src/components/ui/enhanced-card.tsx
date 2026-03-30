import * as React from "react";
import { cn } from "@/lib/design-utils";
import { cardVariants } from "@/lib/design-utils";
import { cva, type VariantProps } from "class-variance-authority";

// Card variant styles
const cardVariantStyles = cva("", {
  variants: {
    variant: {
      default: cardVariants.default,
      flat: cardVariants.flat,
      elevated: cardVariants.elevated,
      invisible: cardVariants.invisible,
    },
    padding: {
      none: "p-0",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
      xl: "p-8",
    },
    alignment: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
    },
    width: {
      auto: "w-auto",
      full: "w-full",
      half: "w-1/2",
    },
    interactive: {
      true: "transition-all duration-200 hover:shadow-md cursor-pointer",
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    padding: "md",
    alignment: "start",
    width: "full",
    interactive: false,
  },
});

// Card container
export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariantStyles> {
  animateEntrance?: boolean;
  forwardedRef?: React.Ref<HTMLDivElement>;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant,
      padding,
      alignment,
      width,
      interactive,
      animateEntrance = false,
      children,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className={cn(
        cardVariantStyles({
          variant,
          padding,
          alignment,
          width,
          interactive,
        }),
        animateEntrance && "animate-fadeIn",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
Card.displayName = "Card";

// Card Header
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  compact?: boolean;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, compact = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col space-y-1.5",
        compact ? "pb-2" : "pb-4",
        className
      )}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

// Card Title
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = "h3", ...props }, ref) => (
    <Component
      ref={ref}
      className={cn("font-semibold leading-tight tracking-tight", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

// Card Description
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-neutral-500", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

// Card Content
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
CardContent.displayName = "CardContent";

// Card Footer
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  compact?: boolean;
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, compact = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center",
        compact ? "pt-2" : "pt-4",
        className
      )}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

// Optional card separator for minimal visual division
const CardSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("h-px bg-neutral-100 my-4", className)}
    {...props}
  />
));
CardSeparator.displayName = "CardSeparator";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardSeparator,
  cardVariantStyles,
}; 