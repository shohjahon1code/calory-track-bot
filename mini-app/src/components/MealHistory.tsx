import React, { useState } from "react";
import { Meal } from "../types";
import apiService from "../services/api";
import telegramService from "../utils/telegram";
import { Trash2, Clock } from "lucide-react";

interface MealHistoryProps {
  meals: Meal[];
  onMealDeleted: () => void;
}

const MealHistory: React.FC<MealHistoryProps> = ({ meals, onMealDeleted }) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (mealId: string) => {
    const confirmed = await telegramService.showConfirm(
      "Are you sure you want to delete this meal?",
    );

    if (confirmed) {
      setDeletingId(mealId);
      try {
        const tgId = telegramService.getUserId();
        if (tgId) {
          await apiService.deleteMeal(mealId, tgId);
          onMealDeleted();
        } else {
          telegramService.showAlert("❌ Cannot identify user");
        }
      } catch (error) {
        console.error("Error deleting meal:", error);
        telegramService.showAlert("❌ Failed to delete meal");
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (meals.length === 0) {
    return (
      <div className="glass-card p-6 text-center text-slate-500">
        <p>No meals tracked yet today.</p>
        <p className="text-sm mt-2">Send a photo to get started! 📸</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {meals.map((meal) => (
        <div
          key={meal._id}
          className="glass-card p-4 flex items-center justify-between group"
        >
          <div className="flex-1">
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-bold text-slate-800 line-clamp-1">
                {meal.name}
              </h4>
              <span className="font-bold text-emerald-600 text-sm">
                {meal.calories} kcal
              </span>
            </div>

            <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
              <Clock size={12} />
              {new Date(meal.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>

            <div className="flex gap-3 text-xs text-slate-600">
              <span>
                <span className="font-medium text-blue-500">P:</span>{" "}
                {meal.protein}g
              </span>
              <span>
                <span className="font-medium text-yellow-500">C:</span>{" "}
                {meal.carbs}g
              </span>
              <span>
                <span className="font-medium text-red-500">F:</span> {meal.fats}
                g
              </span>
            </div>
          </div>

          <button
            onClick={() => handleDelete(meal._id)}
            disabled={deletingId === meal._id}
            className="ml-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
            aria-label="Delete meal"
          >
            {deletingId === meal._id ? (
              <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 size={20} />
            )}
          </button>
        </div>
      ))}
    </div>
  );
};

export default MealHistory;
