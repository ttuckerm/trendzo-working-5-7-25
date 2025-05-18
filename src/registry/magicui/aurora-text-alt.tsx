"use client";

import React from "react";
import { cn } from "@/lib/utils";
import "./aurora-text-global.css";

type GradientType = "blue" | "purple" | "pink";

interface AuroraTextAltProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: GradientType;
}

export function AuroraTextAlt({ 
  className, 
  children, 
  variant = "blue", 
  ...props 
}: AuroraTextAltProps) {
  return (
    <span
      className={cn(
        "aurora-text",
        `aurora-text-${variant}`,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
} 