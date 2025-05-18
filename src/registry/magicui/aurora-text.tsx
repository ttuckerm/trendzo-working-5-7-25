"use client";

import React, { memo } from "react";

interface AuroraTextProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  speed?: number;
}

export const AuroraText = memo(
  ({
    children,
    className = "",
    colors = ["#FF0080", "#7928CA", "#0070F3", "#38bdf8"],
    speed = 1,
  }: AuroraTextProps) => {
    // Generate a longer gradient by repeating colors to ensure smooth animation
    const extendedColors = [...colors, ...colors];
    
    const gradientStyle = {
      backgroundImage: `linear-gradient(
        135deg,
        ${extendedColors.join(", ")}
      )`,
      backgroundSize: "400% 400%",
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
      WebkitTextFillColor: "transparent",
      textFillColor: "transparent",
      animationDuration: `${10 / speed}s`,
    };

    return (
      <span className={`relative inline-block ${className}`}>
        <span className="sr-only">{children}</span>
        <span
          className="relative animate-aurora bg-clip-text text-transparent"
          style={gradientStyle}
          aria-hidden="true"
        >
          {children}
        </span>
      </span>
    );
  },
);

AuroraText.displayName = "AuroraText";

// Adding a backup animation directly into the component in case the global one fails
if (typeof document !== "undefined") {
  // Check if the style already exists
  if (!document.getElementById("aurora-backup-keyframes")) {
    const style = document.createElement("style");
    style.id = "aurora-backup-keyframes";
    style.textContent = `
      @keyframes aurora {
        0% {
          background-position: 0% 50%;
          transform: rotate(-5deg) scale(0.9);
        }
        25% {
          background-position: 50% 100%;
          transform: rotate(5deg) scale(1.1);
        }
        50% {
          background-position: 100% 50%;
          transform: rotate(-3deg) scale(0.95);
        }
        75% {
          background-position: 50% 0%;
          transform: rotate(3deg) scale(1.05);
        }
        100% {
          background-position: 0% 50%;
          transform: rotate(-5deg) scale(0.9);
        }
      }
      
      .animate-aurora {
        animation: aurora 8s ease-in-out infinite alternate;
      }
    `;
    document.head.appendChild(style);
  }
} 