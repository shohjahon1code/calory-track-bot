import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UtensilsCrossed, Sparkles, Loader2, Crown, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import telegramService from "../utils/telegram";
import apiService from "../services/api";
import MealPlanCard from "./MealPlanCard";
import SegmentedControl from "./ui/SegmentedControl";
import EmptyState from "./ui/EmptyState";

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

interface MealPlanDay {
  dayOfWeek: number;
  breakfast: MealPlanItem;
  lunch: MealPlanItem;
  dinner: MealPlanItem;
  snack: MealPlanItem;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
}

interface MealPlanData {
  _id: string;
  days: MealPlanDay[];
  dailyCalorieTarget: number;
  status: string;
}

const LOADING_STEPS = [
  "Analyzing your profile...",
  "Selecting recipes...",
  "Balancing macros...",
  "Creating your plan...",
];

interface MealPlanProps {
  onTabChange?: (tab: string) => void;
}

const MealPlan: React.FC<MealPlanProps> = ({ onTabChange }) => {
  const { t } = useTranslation();
  const [plan, setPlan] = useState<MealPlanData | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(0);
  const [swappingSlot, setSwappingSlot] = useState<string | null>(null);

  const dayLabels = [
    t("mealPlan.days.mon"), t("mealPlan.days.tue"), t("mealPlan.days.wed"),
    t("mealPlan.days.thu"), t("mealPlan.days.fri"), t("mealPlan.days.sat"), t("mealPlan.days.sun"),
  ];

  const fetchPlan = useCallback(async () => {
    try {
      const tgId = telegramService.getUserId();
      if (!tgId) return;
      const [planData, subData] = await Promise.all([
        apiService.getActiveMealPlan(tgId).catch(() => null),
        apiService.getSubscription(tgId).catch(() => null),
      ]);
      setPlan(planData);
      setIsPremium(subData?.isPremium || false);
    } catch (error) {
      console.error("Error fetching meal plan:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const handleGenerate = async () => {
    const tgId = telegramService.getUserId();
    if (!tgId) return;

    setGenerating(true);
    setGeneratingStep(0);

    const interval = setInterval(() => {
      setGeneratingStep((prev) => Math.min(prev + 1, LOADING_STEPS.length - 1));
    }, 3000);

    try {
      const data = await apiService.generateMealPlan(tgId);
      setPlan(data);
      telegramService.haptic("success");
    } catch (error) {
      console.error("Error generating meal plan:", error);
      telegramService.haptic("error");
    } finally {
      clearInterval(interval);
      setGenerating(false);
    }
  };

  const handleSwapMeal = async (dayIndex: number, slot: "breakfast" | "lunch" | "dinner" | "snack") => {
    if (!plan) return;
    const tgId = telegramService.getUserId();
    if (!tgId) return;

    setSwappingSlot(`${dayIndex}-${slot}`);
    try {
      const updated = await apiService.regenerateMeal(tgId, plan._id, dayIndex, slot);
      setPlan(updated);
      telegramService.haptic("light");
    } catch (error) {
      console.error("Error swapping meal:", error);
    } finally {
      setSwappingSlot(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen px-4 pt-6 pb-24">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-100 rounded-xl w-48" />
          <div className="h-10 bg-slate-100 rounded-xl" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-slate-100 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen px-4 pt-6 pb-24 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="text-center max-w-[280px]"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-5 shadow-lg">
            <Crown size={36} className="text-white" />
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">
            {t("mealPlan.premiumOnly")}
          </h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            {t("mealPlan.upgradeToPlan")}
          </p>
          <div className="space-y-3 mb-8 text-left">
            {[
              t("mealPlan.breakfast"),
              t("mealPlan.lunch"),
              t("mealPlan.dinner"),
              t("mealPlan.snack"),
            ].map((meal, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-slate-600">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Lock size={12} className="text-emerald-500" />
                </div>
                <span>{meal} — 7 {t("mealPlan.day")}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => onTabChange?.("premium")}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm shadow-lg active:scale-95 transition-transform"
          >
            <Crown size={16} className="inline mr-2 -mt-0.5" />
            {t("premium.upgrade")}
          </button>
        </motion.div>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 pb-24">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-2xl gradient-premium flex items-center justify-center shadow-xl mb-6"
        >
          <Sparkles size={28} className="text-white" />
        </motion.div>
        <h2 className="text-lg font-black text-slate-800 mb-2">
          {t("mealPlan.generating")}
        </h2>
        <div className="space-y-2 w-full max-w-[240px]">
          {LOADING_STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0.3 }}
              animate={{ opacity: i <= generatingStep ? 1 : 0.3 }}
              className="flex items-center gap-2"
            >
              {i <= generatingStep ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </motion.div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                  <Loader2 size={10} className="text-slate-300" />
                </div>
              )}
              <span className={`text-xs font-medium ${i <= generatingStep ? "text-slate-700" : "text-slate-300"}`}>
                {step}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen px-4 pt-6 pb-24">
        <h1 className="text-xl font-black text-slate-800 mb-6">{t("mealPlan.title")}</h1>
        <EmptyState
          icon={UtensilsCrossed}
          title={t("mealPlan.noActivePlan")}
          description={t("mealPlan.subtitle")}
          action={{ label: t("mealPlan.generate"), onClick: handleGenerate }}
        />
      </div>
    );
  }

  const currentDay = plan.days[selectedDay];
  if (!currentDay) return null;

  const slots: ("breakfast" | "lunch" | "dinner" | "snack")[] = ["breakfast", "lunch", "dinner", "snack"];

  return (
    <div className="min-h-screen pb-24 bg-slate-50/50">
      <div className="pt-6 px-4 pb-4 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-black text-slate-800">{t("mealPlan.title")}</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {plan.dailyCalorieTarget} kcal / {t("mealPlan.day")}
            </p>
          </div>
          <button
            onClick={handleGenerate}
            className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5"
          >
            <Sparkles size={14} />
            {t("mealPlan.regenerate")}
          </button>
        </div>

        <SegmentedControl
          options={dayLabels}
          selected={selectedDay}
          onChange={setSelectedDay}
        />
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
          <div className="text-center flex-1">
            <p className="text-lg font-black text-slate-800">{currentDay.totalCalories}</p>
            <p className="text-[10px] text-slate-400 font-medium">kcal</p>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <div className="text-center flex-1">
            <p className="text-sm font-bold text-blue-500">{currentDay.totalProtein}g</p>
            <p className="text-[10px] text-slate-400 font-medium">Protein</p>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <div className="text-center flex-1">
            <p className="text-sm font-bold text-amber-500">{currentDay.totalCarbs}g</p>
            <p className="text-[10px] text-slate-400 font-medium">Carbs</p>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <div className="text-center flex-1">
            <p className="text-sm font-bold text-rose-500">{currentDay.totalFats}g</p>
            <p className="text-[10px] text-slate-400 font-medium">Fats</p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {slots.map((slot) => (
              <MealPlanCard
                key={`${selectedDay}-${slot}`}
                meal={currentDay[slot]}
                slot={slot}
                onSwap={() => handleSwapMeal(selectedDay, slot)}
                swapping={swappingSlot === `${selectedDay}-${slot}`}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MealPlan;
