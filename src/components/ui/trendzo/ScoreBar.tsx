'use client';

interface ScoreBarProps {
  label: string;
  score: number; // 0-100 or 1-10
  maxScore?: number; // Default 100, set to 10 for rubric scores
  showValue?: boolean;
}

function getColorClass(percentage: number): string {
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 60) return 'bg-yellow-400';
  if (percentage >= 30) return 'bg-amber-500';
  return 'bg-red-500';
}

export function ScoreBar({ label, score, maxScore = 100, showValue = true }: ScoreBarProps) {
  const percentage = (score / maxScore) * 100;
  const colorClass = getColorClass(percentage);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-300">{label}</span>
        {showValue && (
          <span className="text-sm font-medium text-white">
            {score}{maxScore !== 100 ? `/${maxScore}` : '%'}
          </span>
        )}
      </div>
      <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colorClass}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default ScoreBar;
