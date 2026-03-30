import * as React from "react";
import { VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/design-utils";
import { buttonVariants, buttonSizes } from "@/lib/design-utils";
import { Slot } from "@radix-ui/react-slot";

// Define the button variants using class-variance-authority
const buttonVariantStyles = cva(
  // Base styles for all buttons
  "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none",
  {
    variants: {
      // Visual variants
      variant: {
        primary: buttonVariants.primary.base,
        secondary: buttonVariants.secondary.base,
        ghost: buttonVariants.ghost.base,
        outline: buttonVariants.outline.base,
        link: buttonVariants.link.base,
      },
      // Size variants
      size: {
        sm: buttonSizes.sm,
        md: buttonSizes.md,
        lg: buttonSizes.lg,
        iconSm: buttonSizes.icon.sm,
        iconMd: buttonSizes.icon.md,
        iconLg: buttonSizes.icon.lg,
      },
      // Loading state
      isLoading: {
        true: "opacity-70 cursor-wait relative",
        false: "",
      },
    },
    // Default variant combinations
    defaultVariants: {
      variant: "primary",
      size: "md",
      isLoading: false,
    },
  }
);

// Props interface for the Button component
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariantStyles> {
  asChild?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  isLoading?: boolean;
  loadingText?: string;
  tooltip?: string;
}

// The Button component
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      icon,
      iconPosition = "left",
      isLoading = false,
      loadingText,
      tooltip,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // If asChild is true, render the button as a Slot
    const Comp = asChild ? Slot : "button";
    
    // If both isLoading and disabled are true, prefer disabled
    const effectiveDisabled = disabled || isLoading;

    // Determine if we should show the loading spinner
    const showSpinner = isLoading;
    
    // Determine if the button has only an icon and no text
    const isIconOnly = !children && icon;
    
    // Determine the correct size based on whether it's an icon button
    const effectiveSize = isIconOnly 
      ? (size === 'sm' ? 'iconSm' : size === 'lg' ? 'iconLg' : 'iconMd')
      : size;
      
    // Get the content to display
    const buttonContent = showSpinner ? (
      <>
        <span className="absolute inset-0 flex items-center justify-center">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </span>
        <span className="invisible">
          {loadingText || children}
        </span>
      </>
    ) : (
      <>
        {icon && iconPosition === "left" && (
          <span className={cn("mr-2", { "mr-0": isIconOnly })}>{icon}</span>
        )}
        {children}
        {icon && iconPosition === "right" && (
          <span className="ml-2">{icon}</span>
        )}
      </>
    );

    return (
      <Comp
        className={cn(
          buttonVariantStyles({
            variant,
            size: effectiveSize,
            isLoading,
            className,
          }),
          {
            [buttonVariants.primary.disabled]: effectiveDisabled && variant === "primary",
            [buttonVariants.secondary.disabled]: effectiveDisabled && variant === "secondary",
            [buttonVariants.ghost.disabled]: effectiveDisabled && variant === "ghost",
            [buttonVariants.outline.disabled]: effectiveDisabled && variant === "outline",
            [buttonVariants.link.disabled]: effectiveDisabled && variant === "link",
          }
        )}
        ref={ref}
        disabled={effectiveDisabled}
        title={tooltip}
        aria-disabled={effectiveDisabled}
        {...props}
      >
        {buttonContent}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariantStyles }; 