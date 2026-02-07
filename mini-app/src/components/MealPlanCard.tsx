import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChevronDown, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

interface MealPlanItem {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  prepTime: number;
  ingredients: string[];
  isUzbek: boolean;
}

interface MealPlanCardProps {
  meal: MealPlanItem;
  slot: "breakfast" | "lunch" | "dinner" | "snack";
  onSwap?: () => void;
  swapping?: boolean;
}

const SLOT_COLORS: Record<string, { bar: string; bg: string; text: string }> = {
  breakfast: { bar: "bg-amber-400", bg: "bg-amber-50", text: "text-amber-600" },
  lunch: { bar: "bg-emerald-400", bg: "bg-emerald-50", text: "text-emerald-600" },
  dinner: { bar: "bg-indigo-400", bg: "bg-indigo-50", text: "text-indigo-600" },
  snack: { bar: "bg-rose-400", bg: "bg-rose-50", text: "text-rose-600" },
};

const MealPlanCard: React.FC<MealPlanCardProps> = ({ meal, slot, onSwap, swapping }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const colors = SLOT_COLORS[slot] || SLOT_COLORS.breakfast;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
    >
      <div className="flex">
        {/* Color bar */}
        <div className={`w-1 ${colors.bar} shrink-0`} />

        <div className="flex-1 p-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${colors.text}`}>
                  {t(`mealPlan.${slot}`)}
                </span>
                {meal.isUzbek && (
                  <span className="text-[10px]">🇺🇿</span>
                )}
              </div>
              <h4 className="text-sm font-bold text-slate-800 leading-tight truncate">
                {meal.name}
              </h4>
              {meal.description && (
                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                  {meal.description}
                </p>
              )}
            </div>

            {/* Swap button */}
            {onSwap && (
              <button
                onClick={(e) => { e.stopPropagation(); onSwap(); }}
                disabled={swapping}
                className={`p-1.5 rounded-lg ${colors.bg} ${swapping ? "animate-spin" : ""}`}
              >
                <RefreshCw size={14} className={colors.text} />
              </button>
            )}
          </div>

          {/* Macros row */}
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
              {meal.calories} kcal
            </span>
            <span className="text-[10px] text-slate-400">
              P:{meal.protein}g · C:{meal.carbs}g · F:{meal.fats}g
            </span>
            <div className="flex items-center gap-0.5 ml-auto text-slate-400">
              <Clock size={10} />
              <span className="text-[10px]">{meal.prepTime}m</span>
            </div>
          </div>

          {/* Expandable ingredients */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mt-2 text-[10px] font-medium text-slate-400"
          >
            <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
              <ChevronDown size={12} />
            </motion.div>
            {t("mealPlan.ingredients")} ({meal.ingredients.length})
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-2 flex flex-wrap gap-1">
                  {meal.ingredients.map((ing, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full border border-slate-100"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default MealPlanCard;
