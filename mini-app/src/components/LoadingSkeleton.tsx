import React from "react";

const LoadingSkeleton: React.FC = () => {
  return (
    <div className="p-4 space-y-6 pb-24 max-w-md mx-auto animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-32 bg-slate-200 rounded"></div>
          <div className="h-4 w-48 bg-slate-100 rounded"></div>
        </div>
        <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
      </div>

      {/* Main Card Skeleton */}
      <div className="glass-card h-64 w-full bg-white/50 rounded-2xl"></div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="h-24 bg-slate-200/50 rounded-xl"></div>
        <div className="h-24 bg-slate-200/50 rounded-xl"></div>
        <div className="h-24 bg-slate-200/50 rounded-xl"></div>
      </div>

      {/* List Skeleton */}
      <div className="space-y-4">
        <div className="h-5 w-24 bg-slate-200 rounded"></div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="glass-card p-4 flex justify-between items-center"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-slate-200 rounded-lg"></div>
              <div className="space-y-1">
                <div className="h-4 w-24 bg-slate-200 rounded"></div>
                <div className="h-3 w-16 bg-slate-100 rounded"></div>
              </div>
            </div>
            <div className="h-6 w-12 bg-slate-100 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingSkeleton;
