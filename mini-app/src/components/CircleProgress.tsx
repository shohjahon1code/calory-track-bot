import React from "react";

interface CircleProgressProps {
  current: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
}

const CircleProgress: React.FC<CircleProgressProps> = ({
  current,
  goal,
  size = 280,
  strokeWidth = 20,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(100, Math.max(0, (current / goal) * 100));
  const offset = circumference - (percentage / 100) * circumference;
  const remaining = Math.max(0, goal - current);

  // Determine color based on progress
  const getColor = () => {
    if (percentage > 100) return "text-red-500";
    if (percentage > 90) return "text-yellow-500";
    return "text-emerald-500";
  };

  return (
    <div className="relative flex items-center justify-center p-4">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200"
          fill="none"
        />
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${getColor()} transition-all duration-1000 ease-out`}
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-sm text-slate-500 font-medium">Remaining</span>
        <span className="text-4xl font-bold text-slate-800">{remaining}</span>
        <span className="text-sm text-slate-400 mt-1">kcal</span>
      </div>
    </div>
  );
};

export default CircleProgress;
