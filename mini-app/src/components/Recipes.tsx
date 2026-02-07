import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, Heart, Clock, Sparkles, Loader2, Crown, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import telegramService from "../utils/telegram";
import apiService from "../services/api";
import SegmentedControl from "./ui/SegmentedControl";
import BottomSheet from "./ui/BottomSheet";
import EmptyState from "./ui/EmptyState";

interface Recipe {
  _id: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  prepTime: number;
  ingredients: string[];
  instructions: string[];
  isUzbek: boolean;
  tags: string[];
}

interface RecipesProps {
  onTabChange?: (tab: string) => void;
}

const Recipes: React.FC<RecipesProps> = ({ onTabChange }) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState(0);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const tgId = telegramService.getUserId();
      if (!tgId) return;

      const [quickRecipes, saved, subData] = await Promise.all([
        apiService.getQuickRecipes(tgId).catch(() => []),
        apiService.getSavedRecipes(tgId).catch(() => []),
        apiService.getSubscription(tgId).catch(() => null),
      ]);

      setRecipes(quickRecipes);
      setSavedRecipes(saved);
      setSavedIds(new Set(saved.map((r: Recipe) => r._id)));
      setIsPremium(subData?.isPremium || false);
    } catch (error) {
      console.error("Error fetching recipes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGetSuggestions = async () => {
    const tgId = telegramService.getUserId();
    if (!tgId) return;

    setGenerating(true);
    try {
      const stats = await apiService.getTodayStats(tgId);
      const remaining = {
        calories: Math.max(0, stats.remainingCalories),
        protein: Math.max(0, 150 - stats.totalProtein),
        carbs: Math.max(0, 200 - stats.totalCarbs),
        fats: Math.max(0, 70 - stats.totalFats),
      };

      const newRecipes = await apiService.getRecipeSuggestions(tgId, remaining);
      setRecipes(newRecipes);
      telegramService.haptic("success");
    } catch (error) {
      console.error("Error generating recipes:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleSave = async (recipe: Recipe) => {
    const tgId = telegramService.getUserId();
    if (!tgId) return;

    const isSaved = savedIds.has(recipe._id);
    try {
      if (isSaved) {
        await apiService.unsaveRecipe(tgId, recipe._id);
        setSavedIds(prev => { const n = new Set(prev); n.delete(recipe._id); return n; });
        setSavedRecipes(prev => prev.filter(r => r._id !== recipe._id));
      } else {
        await apiService.saveRecipe(tgId, recipe._id);
        setSavedIds(prev => new Set(prev).add(recipe._id));
        setSavedRecipes(prev => [...prev, recipe]);
      }
      telegramService.haptic("light");
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen px-4 pt-6 pb-24">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-100 rounded-xl w-32" />
          <div className="h-10 bg-slate-100 rounded-xl" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-2xl" />
          ))}
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
            {t("recipes.premiumOnly")}
          </h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            {t("recipes.upgradeToPlan")}
          </p>
          <div className="space-y-3 mb-8 text-left">
            {[
              t("recipes.forYou"),
              t("recipes.quickSuggestions"),
              t("recipes.save"),
              t("recipes.instructions"),
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-slate-600">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Lock size={12} className="text-emerald-500" />
                </div>
                <span>{feature}</span>
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

  const displayRecipes = tab === 0 ? recipes : savedRecipes;

  return (
    <div className="min-h-screen pb-24 bg-slate-50/50">
      {/* Header */}
      <div className="pt-6 px-4 pb-4 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-black text-slate-800">{t("recipes.title")}</h1>
          <button
            onClick={handleGetSuggestions}
            disabled={generating}
            className="flex items-center gap-1.5 btn-secondary text-xs px-3 py-2"
          >
            {generating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            {generating ? t("recipes.generating") : t("recipes.quickSuggestions")}
          </button>
        </div>

        <SegmentedControl
          options={[t("recipes.forYou"), t("recipes.saved")]}
          selected={tab}
          onChange={setTab}
        />
      </div>

      {/* Recipe grid */}
      <div className="px-4 py-3">
        {displayRecipes.length === 0 ? (
          <EmptyState
            icon={ChefHat}
            title={tab === 0 ? t("recipes.quickSuggestions") : t("recipes.noSaved")}
            description={tab === 0 ? t("recipes.generating") : t("recipes.noSavedDesc")}
            action={tab === 0 ? { label: t("recipes.quickSuggestions"), onClick: handleGetSuggestions } : undefined}
          />
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {displayRecipes.map((recipe, i) => (
                <motion.div
                  key={recipe._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedRecipe(recipe)}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden cursor-pointer"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {recipe.isUzbek && <span className="text-xs">🇺🇿</span>}
                          <h3 className="text-sm font-bold text-slate-800 truncate">{recipe.name}</h3>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2">{recipe.description}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleSave(recipe); }}
                        className={`p-2 rounded-xl ${savedIds.has(recipe._id) ? "bg-rose-50 text-rose-500" : "bg-slate-50 text-slate-300"}`}
                      >
                        <Heart size={16} fill={savedIds.has(recipe._id) ? "currentColor" : "none"} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600">
                        {recipe.calories} kcal
                      </span>
                      <span className="text-[10px] text-slate-400">
                        P:{recipe.protein}g · C:{recipe.carbs}g · F:{recipe.fats}g
                      </span>
                      <div className="flex items-center gap-0.5 ml-auto text-slate-400">
                        <Clock size={10} />
                        <span className="text-[10px]">{recipe.prepTime}m</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Recipe Detail Bottom Sheet */}
      <BottomSheet
        isOpen={!!selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        title={selectedRecipe?.name}
      >
        {selectedRecipe && (
          <div className="space-y-4">
            {/* Macros */}
            <div className="flex gap-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600">
                {selectedRecipe.calories} kcal
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600">
                P: {selectedRecipe.protein}g
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600">
                C: {selectedRecipe.carbs}g
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600">
                F: {selectedRecipe.fats}g
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock size={14} />
              <span>{t("recipes.prepTime", { minutes: selectedRecipe.prepTime })}</span>
              {selectedRecipe.isUzbek && <span className="ml-1">🇺🇿 {t("recipes.uzbekDish")}</span>}
            </div>

            {/* Ingredients */}
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-2">{t("recipes.ingredients")}</h4>
              <div className="space-y-1.5">
                {selectedRecipe.ingredients.map((ing, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    {ing}
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            {selectedRecipe.instructions.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-2">{t("recipes.instructions")}</h4>
                <div className="space-y-2">
                  {selectedRecipe.instructions.map((step, i) => (
                    <div key={i} className="flex gap-3 text-sm text-slate-600">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xs font-bold shrink-0">
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleToggleSave(selectedRecipe)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold ${
                  savedIds.has(selectedRecipe._id)
                    ? "bg-rose-50 text-rose-500 border border-rose-100"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                <Heart size={14} className="inline mr-1.5" fill={savedIds.has(selectedRecipe._id) ? "currentColor" : "none"} />
                {savedIds.has(selectedRecipe._id) ? t("recipes.unsave") : t("recipes.save")}
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};

export default Recipes;
