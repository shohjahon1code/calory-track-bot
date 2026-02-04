import React from "react";

interface NutritionBreakdownProps {
  protein: number;
  carbs: number;
  fats: number;
}

const NutritionBreakdown: React.FC<NutritionBreakdownProps> = ({
  protein,
  carbs,
  fats,
}) => {
  return (
    <div className="glass-card p-5">
      <h3 className="text-lg font-bold text-slate-800 mb-4">Macros</h3>
      <div className="space-y-4">
        {/* Protein - Blue */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-blue-600">Protein</span>
            <span className="font-bold text-slate-700">{protein}g</span>
          </div>
          <div className="h-2 w-full bg-blue-100 rounded-full">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${Math.min(100, (protein / 150) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Carbs - Yellow */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-yellow-600">Carbs</span>
            <span className="font-bold text-slate-700">{carbs}g</span>
          </div>
          <div className="h-2 w-full bg-yellow-100 rounded-full">
            <div
              className="h-full bg-yellow-500 rounded-full"
              style={{ width: `${Math.min(100, (carbs / 250) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Fats - Red */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-red-600">Fats</span>
            <span className="font-bold text-slate-700">{fats}g</span>
          </div>
          <div className="h-2 w-full bg-red-100 rounded-full">
            <div
              className="h-full bg-red-500 rounded-full"
              style={{ width: `${Math.min(100, (fats / 70) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NutritionBreakdown;
