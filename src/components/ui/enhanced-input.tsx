import * as React from "react";
import { cn } from "@/lib/design-utils";
import { inputVariants } from "@/lib/design-utils";
import { cva, type VariantProps } from "class-variance-authority";

// Input variant styles
const inputVariantStyles = cva(
  "flex w-full bg-white text-neutral-900 placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: inputVariants.default,
        minimal: inputVariants.minimal,
        invisible: inputVariants.invisible,
      },
      size: {
        sm: "h-8 text-xs",
        md: "h-10 text-sm",
        lg: "h-12 text-base",
      },
      state: {
        default: "",
        error: "border-error-DEFAULT focus:border-error-DEFAULT focus:ring-error-DEFAULT",
        success: "border-success-DEFAULT focus:border-success-DEFAULT focus:ring-success-DEFAULT",
      },
      fullWidth: {
        true: "w-full",
        false: "w-auto",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      state: "default",
      fullWidth: true,
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "prefix" | "suffix">,
    VariantProps<typeof inputVariantStyles> {
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  hideLabel?: boolean;
  label?: string;
  helperText?: string;
  errorText?: string;
  successText?: string;
  animate?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      state,
      fullWidth,
      type = "text",
      prefix,
      suffix,
      hideLabel = false,
      label,
      helperText,
      errorText,
      successText,
      animate = true,
      id,
      ...props
    },
    ref
  ) => {
    // Generate a unique ID for accessibility
    const uniqueId = React.useId();
    const inputId = id || `input-${uniqueId}`;
    const helperId = `helper-${uniqueId}`;
    
    // Determine feedback text based on state
    const feedbackText = state === "error" 
      ? errorText 
      : state === "success" 
        ? successText 
        : helperText;
    
    // Determine if we should show feedback
    const showFeedback = !!feedbackText;
    
    // Determine if input has value or is focused
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(!!props.defaultValue || !!props.value);

    // Handle focus and blur events
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    // Handle value changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      props.onChange?.(e);
    };

    // Check if we need to wrap the input
    const needsWrapper = prefix || suffix;

    const inputElement = (
      <input
        type={type}
        className={cn(
          inputVariantStyles({
            variant, 
            size, 
            state,
            fullWidth,
          }),
          needsWrapper && "!rounded-none !border-0 !shadow-none !ring-0 !outline-none",
          animate && "transition-all duration-200",
          className
        )}
        ref={ref}
        id={inputId}
        aria-describedby={showFeedback ? helperId : undefined}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        {...props}
      />
    );

    return (
      <div className={cn("space-y-1.5", fullWidth && "w-full")}>
        {label && !hideLabel && (
          <label
            htmlFor={inputId}
            className={cn(
              "text-sm font-medium",
              state === "error" && "text-error-DEFAULT",
              animate && "transition-colors duration-200",
              isFocused && "text-primary-600"
            )}
          >
            {label}
          </label>
        )}

        {needsWrapper ? (
          <div
            className={cn(
              "flex items-center overflow-hidden",
              inputVariantStyles({
                variant,
                state,
              }),
              "!p-0 divide-x divide-neutral-200"
            )}
          >
            {prefix && (
              <div className="flex items-center px-3 text-neutral-500">
                {prefix}
              </div>
            )}
            {inputElement}
            {suffix && (
              <div className="flex items-center px-3 text-neutral-500">
                {suffix}
              </div>
            )}
          </div>
        ) : (
          inputElement
        )}

        {showFeedback && (
          <p
            id={helperId}
            className={cn(
              "text-xs",
              state === "error" && "text-error-DEFAULT",
              state === "success" && "text-success-DEFAULT",
              !state || state === "default" ? "text-neutral-500" : "",
              animate && "transition-colors duration-200"
            )}
          >
            {feedbackText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input, inputVariantStyles }; 