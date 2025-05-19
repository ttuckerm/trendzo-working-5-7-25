import React from 'react';
import { Spinner } from './spinner'; // Assuming spinner.tsx is in the same directory
import { cn } from '@/lib/utils';

interface GlobalSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  text?: string;
}

const GlobalSpinner: React.FC<GlobalSpinnerProps> = ({
  className,
  size = "lg", // Default to large for a global spinner
  showText = true,
  text = "Loading..."
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center h-full w-full", className)}>
      <Spinner size={size} />
      {showText && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{text}</p>}
    </div>
  );
};

export default GlobalSpinner; 