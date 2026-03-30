import * as React from "react";
import { cn } from "@/lib/design-utils";
import { feedbackIndicatorVariants } from "@/lib/design-utils";
import { cva, type VariantProps } from "class-variance-authority";

// Feedback indicator variant styles
const feedbackStyles = cva(
  "flex items-center text-sm rounded-md transition-all duration-200",
  {
    variants: {
      variant: {
        success: feedbackIndicatorVariants.success,
        warning: feedbackIndicatorVariants.warning,
        error: feedbackIndicatorVariants.error,
        info: feedbackIndicatorVariants.info,
      },
      size: {
        sm: "text-xs py-1 px-2",
        md: "text-sm py-1.5 px-3",
        lg: "text-base py-2 px-4",
      },
      visual: {
        // Different visual styles for feedback
        toast: "shadow-md border",
        inline: "bg-opacity-10 border border-opacity-20",
        minimal: "bg-opacity-5 border-0",
        tag: "bg-opacity-10 border-0",
      },
      position: {
        // Positioning options for feedback display
        inline: "static", // In the document flow
        toast: "fixed z-50", // Floating toast notification
        tl: "fixed top-4 left-4 z-50", // Top-left
        tr: "fixed top-4 right-4 z-50", // Top-right
        bl: "fixed bottom-4 left-4 z-50", // Bottom-left
        br: "fixed bottom-4 right-4 z-50", // Bottom-right
        tc: "fixed top-4 left-1/2 -translate-x-1/2 z-50", // Top-center
        bc: "fixed bottom-4 left-1/2 -translate-x-1/2 z-50", // Bottom-center
      },
      withIcon: {
        true: "",
        false: "",
      },
      dismissible: {
        true: "",
        false: "",
      },
      animate: {
        true: "animate-fadeIn",
        false: "",
      }
    },
    compoundVariants: [
      {
        withIcon: true,
        size: "sm",
        className: "pl-7", // Extra padding for icon
      },
      {
        withIcon: true,
        size: "md",
        className: "pl-8", // Extra padding for icon
      },
      {
        withIcon: true,
        size: "lg",
        className: "pl-9", // Extra padding for icon
      },
      {
        dismissible: true,
        size: "sm",
        className: "pr-7", // Extra padding for dismiss button
      },
      {
        dismissible: true,
        size: "md",
        className: "pr-8", // Extra padding for dismiss button
      },
      {
        dismissible: true,
        size: "lg",
        className: "pr-9", // Extra padding for dismiss button
      },
    ],
    defaultVariants: {
      variant: "info",
      size: "md",
      visual: "inline",
      position: "inline",
      withIcon: false,
      dismissible: false,
      animate: true,
    },
  }
);

// Feedback indicator props
export interface FeedbackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof feedbackStyles> {
  message: string;
  icon?: React.ReactNode;
  duration?: number; // Auto-dismiss after duration (ms), 0 means never
  onDismiss?: () => void;
}

// Feedback indicator component
const Feedback = React.forwardRef<HTMLDivElement, FeedbackProps>(
  (
    {
      className,
      variant,
      size,
      visual,
      position,
      withIcon,
      dismissible,
      animate,
      message,
      icon,
      duration = 0,
      onDismiss,
      ...props
    },
    ref
  ) => {
    // State to track if the feedback is visible
    const [isVisible, setIsVisible] = React.useState(true);

    // Handle auto-dismiss if duration is set
    React.useEffect(() => {
      if (duration > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          onDismiss?.();
        }, duration);
        return () => clearTimeout(timer);
      }
    }, [duration, onDismiss]);

    // Handle dismiss
    const handleDismiss = () => {
      setIsVisible(false);
      onDismiss?.();
    };

    // Early return if not visible
    if (!isVisible) return null;

    // Use CSS animations instead of framer-motion
    return (
      <div
        ref={ref}
        className={cn(
          feedbackStyles({
            variant,
            size,
            visual,
            position,
            withIcon: !!icon,
            dismissible,
            animate,
          }),
          className
        )}
        role="alert"
        {...props}
      >
        {icon && (
          <span className="absolute left-2 top-1/2 -translate-y-1/2">
            {icon}
          </span>
        )}
        
        <span>{message}</span>
        
        {dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-current opacity-60 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-full"
            aria-label="Dismiss"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

Feedback.displayName = "Feedback";

// Success feedback icon
const SuccessIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
);

// Warning feedback icon
const WarningIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
      clipRule="evenodd"
    />
  </svg>
);

// Error feedback icon
const ErrorIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
      clipRule="evenodd"
    />
  </svg>
);

// Info feedback icon
const InfoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
      clipRule="evenodd"
    />
  </svg>
);

// Simple toast manager hook (without context)
export function useToast() {
  const [toasts, setToasts] = React.useState<Array<{ id: string; props: FeedbackProps }>>([]);
  
  // Show a toast
  const showToast = React.useCallback((props: Omit<FeedbackProps, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast = {
      id,
      props: {
        ...props,
        position: props.position || "tr",
        visual: props.visual || "toast",
        onDismiss: () => {
          props.onDismiss?.();
          hideToast(id);
        },
        duration: props.duration || 5000, // Default 5 seconds
      },
    };
    
    setToasts((prev) => [...prev, toast]);
    return id;
  }, []);
  
  // Hide a toast by id
  const hideToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);
  
  // Hide all toasts
  const hideAllToasts = React.useCallback(() => {
    setToasts([]);
  }, []);
  
  // Toast container component 
  const ToastContainer = React.useCallback(() => {
    return (
      <>
        {toasts.map(({ id, props }) => (
          <Feedback key={id} {...props} />
        ))}
      </>
    );
  }, [toasts]);
  
  return {
    showToast,
    hideToast,
    hideAllToasts,
    ToastContainer,
  };
}

export {
  Feedback,
  feedbackStyles,
  SuccessIcon,
  WarningIcon,
  ErrorIcon,
  InfoIcon,
}; 