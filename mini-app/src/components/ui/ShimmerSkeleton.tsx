import React from "react";

type SkeletonVariant = "dashboard" | "stats" | "mealList" | "mealPlan" | "friends";

interface ShimmerSkeletonProps {
  variant?: SkeletonVariant;
}

const Block = ({ className }: { className: string }) => (
  <div className={`skeleton ${className}`} />
);

const DashboardSkeleton = () => (
  <div className="p-4 space-y-5">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Block className="w-10 h-10 rounded-full" />
        <div className="space-y-2">
          <Block className="h-4 w-28" />
          <Block className="h-3 w-20" />
        </div>
      </div>
      <Block className="h-8 w-8 rounded-lg" />
    </div>

    {/* Streak banner */}
    <Block className="h-14 w-full rounded-2xl" />

    {/* Calorie ring */}
    <div className="flex justify-center">
      <Block className="h-56 w-56 rounded-full" />
    </div>

    {/* Macro cards */}
    <div className="grid grid-cols-3 gap-3">
      <Block className="h-20 rounded-2xl" />
      <Block className="h-20 rounded-2xl" />
      <Block className="h-20 rounded-2xl" />
    </div>

    {/* Meals */}
    <Block className="h-4 w-32 mb-2" />
    {[1, 2, 3].map((i) => (
      <Block key={i} className="h-16 w-full rounded-2xl" />
    ))}
  </div>
);

const StatsSkeleton = () => (
  <div className="p-4 space-y-5">
    <div className="flex items-center justify-between">
      <Block className="h-6 w-36" />
      <Block className="h-9 w-28 rounded-xl" />
    </div>
    <Block className="h-52 w-full rounded-2xl" />
    <div className="grid grid-cols-2 gap-3">
      <Block className="h-24 rounded-2xl" />
      <Block className="h-24 rounded-2xl" />
    </div>
    <Block className="h-40 w-full rounded-2xl" />
  </div>
);

const MealListSkeleton = () => (
  <div className="space-y-3 p-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="flex items-center gap-3">
        <Block className="w-14 h-14 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Block className="h-4 w-32" />
          <Block className="h-3 w-20" />
        </div>
        <Block className="h-6 w-16 rounded-full" />
      </div>
    ))}
  </div>
);

const MealPlanSkeleton = () => (
  <div className="p-4 space-y-4">
    <Block className="h-10 w-full rounded-xl" />
    {[1, 2, 3, 4].map((i) => (
      <Block key={i} className="h-24 w-full rounded-2xl" />
    ))}
  </div>
);

const FriendsSkeleton = () => (
  <div className="p-4 space-y-4">
    <Block className="h-10 w-full rounded-xl" />
    {/* Podium */}
    <div className="flex items-end justify-center gap-4 py-4">
      <Block className="h-28 w-20 rounded-2xl" />
      <Block className="h-36 w-24 rounded-2xl" />
      <Block className="h-28 w-20 rounded-2xl" />
    </div>
    {/* List */}
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center gap-3">
        <Block className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Block className="h-4 w-28" />
          <Block className="h-3 w-16" />
        </div>
        <Block className="h-5 w-12 rounded-full" />
      </div>
    ))}
  </div>
);

const VARIANTS: Record<SkeletonVariant, React.FC> = {
  dashboard: DashboardSkeleton,
  stats: StatsSkeleton,
  mealList: MealListSkeleton,
  mealPlan: MealPlanSkeleton,
  friends: FriendsSkeleton,
};

const ShimmerSkeleton: React.FC<ShimmerSkeletonProps> = ({ variant = "dashboard" }) => {
  const Variant = VARIANTS[variant];
  return <Variant />;
};

export default ShimmerSkeleton;
