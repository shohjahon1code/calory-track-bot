import React, { useState } from "react";
import apiService from "../services/api";
import telegramService from "../utils/telegram";
import { motion } from "framer-motion";
import { Target, ChevronRight, Minus, Plus, Flame } from "lucide-react";

interface GoalSettingProps {
  currentGoal?: number;
  onGoalSet: (goal: number) => void;
}

const PRESET_GOALS = [1500, 1800, 2000, 2200, 2500, 3000];

const GoalSetting: React.FC<GoalSettingProps> = ({
  currentGoal,
  onGoalSet,
}) => {
  const [goal, setGoal] = useState(currentGoal || 2000);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (goal < 1000 || goal > 5000) {
      telegramService.showAlert("Goal must be between 1000 and 5000 calories");
      return;
    }

    setLoading(true);
    try {
      const tgId = telegramService.getUserId();
      if (tgId) {
        await apiService.updateGoal(tgId, goal);
        onGoalSet(goal);
        telegramService.showAlert("✅ Target locked in!");
      }
    } catch (err) {
      console.error(err);
      telegramService.showAlert("❌ Failed to update goal");
    } finally {
      setLoading(false);
    }
  };

  const adjustGoal = (amount: number) => {
    setGoal((prev) => Math.min(5000, Math.max(1000, prev + amount)));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen pt-6 px-6 pb-20 relative bg-slate-50 overflow-hidden flex flex-col"
    >
      <div className="flex items-center gap-3 mb-6 z-10">
        <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
          <Target size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Set Goal</h1>
          <p className="text-xs text-slate-500 font-medium">
            Daily Calorie Target
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center z-10 space-y-8">
        {/* Main Dial UI */}
        <div className="relative">
          <motion.div
            key={goal}
            initial={{ scale: 0.95, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-56 h-56 rounded-full bg-white shadow-xl shadow-emerald-100 flex flex-col items-center justify-center border border-slate-100 relative z-10"
          >
            <Flame size={28} className="text-emerald-500 mb-1" />
            <span className="text-5xl font-extrabold text-slate-800 tracking-tight">
              {goal}
            </span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">
              kcal/day
            </span>
          </motion.div>
        </div>

        {/* Adjuster Buttons */}
        <div className="flex items-center gap-4 w-full justify-center">
          <button
            onClick={() => adjustGoal(-50)}
            className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center active:scale-95 transition-all"
          >
            <Minus size={20} />
          </button>
          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider px-2">
            Adjust
          </div>
          <button
            onClick={() => adjustGoal(50)}
            className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center active:scale-95 transition-all shadow-md shadow-emerald-200"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Presets */}
        <div className="w-full max-w-xs mx-auto">
          <p className="text-center text-[10px] font-bold text-slate-300 uppercase mb-3 tracking-widest">
            Quick Select
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {PRESET_GOALS.map((preset) => (
              <button
                key={preset}
                onClick={() => setGoal(preset)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                  goal === preset
                    ? "bg-slate-800 text-white shadow-md"
                    : "bg-white text-slate-500 border border-slate-200"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4 z-10">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold text-base shadow-lg shadow-slate-200 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-70"
        >
          {loading ? (
            "Saving..."
          ) : (
            <>
              Save Goal <ChevronRight size={18} />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default GoalSetting;
