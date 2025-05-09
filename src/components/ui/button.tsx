import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const getVariantClasses = () => {
      switch (variant) {
        case "default":
          return "bg-blue-500 text-white hover:bg-blue-600";
        case "destructive":
          return "bg-red-500 text-white hover:bg-red-600";
        case "outline":
          return "border border-gray-300 bg-white hover:bg-gray-100 text-gray-700";
        case "secondary":
          return "bg-gray-200 text-gray-800 hover:bg-gray-300";
        case "ghost":
          return "hover:bg-gray-100 text-gray-700";
        case "link":
          return "text-blue-500 underline-offset-4 hover:underline";
        default:
          return "bg-blue-500 text-white hover:bg-blue-600";
      }
    };

    const getSizeClasses = () => {
      switch (size) {
        case "default":
          return "h-9 px-4 py-2";
        case "sm":
          return "h-8 rounded-md px-3 text-xs";
        case "lg":
          return "h-10 rounded-md px-8";
        case "icon":
          return "h-9 w-9";
        default:
          return "h-9 px-4 py-2";
      }
    };

    return (
      <button
        className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${getVariantClasses()} ${getSizeClasses()} ${className || ""}`}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants }; 