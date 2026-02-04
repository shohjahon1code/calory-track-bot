import React, { useState } from "react";
import { User } from "../../../types";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

interface ActivityGoalStepProps {
  activityLevel?: User["activityLevel"];
  goal?: User["goal"];
  targetWeight?: number;
  onNext: (data: Partial<User>) => void;
  onBack: () => void;
}

const ActivityGoalStep: React.FC<ActivityGoalStepProps> = ({
  activityLevel: initialActivity,
  goal: initialGoal,
  targetWeight: initialTargetWeight,
  onNext,
  onBack,
}) => {
  const [activityLevel, setActivityLevel] = useState<
    User["activityLevel"] | undefined
  >(initialActivity);
  const [goal, setGoal] = useState<User["goal"] | undefined>(initialGoal);
  const [targetWeight, setTargetWeight] = useState<string>(
    initialTargetWeight?.toString() || "",
  );

  const isValid = activityLevel && goal;

  const handleSubmit = () => {
    if (isValid) {
      onNext({
        activityLevel,
        goal,
        targetWeight: targetWeight ? parseInt(targetWeight) : undefined,
      });
    }
  };

  const Option = ({ selected, onClick, title, desc, icon }: any) => (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`p-3 rounded-xl border transition-all cursor-pointer ${
        selected
          ? "border-emerald-500 bg-emerald-50/50 shadow-md shadow-emerald-100/50"
          : "border-slate-100 bg-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="text-xl shrink-0">{icon}</div>
        <div>
          <h4
            className={`font-bold text-xs ${selected ? "text-emerald-900" : "text-slate-800"}`}
          >
            {title}
          </h4>
          {desc && (
            <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
              {desc}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 px-4">
      <div className="flex items-center mb-4">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-slate-400 hover:text-slate-600"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-20 scrollbar-hide">
        <div className="mb-4">
          <h2 className="text-xl font-extrabold text-slate-800">
            Activity Level
          </h2>
          <p className="text-xs text-slate-500">How much do you move?</p>
        </div>

        <div className="grid grid-cols-1 gap-2 mb-6">
          <Option
            selected={activityLevel === "sedentary"}
            onClick={() => setActivityLevel("sedentary")}
            title="Sedentary"
            desc="Office job, little exercise"
            icon="🛋️"
          />
          <Option
            selected={activityLevel === "light"}
            onClick={() => setActivityLevel("light")}
            title="Lightly Active"
            desc="Walking, light workouts 1-3x/week"
            icon="🚶"
          />
          <Option
            selected={activityLevel === "moderate"}
            onClick={() => setActivityLevel("moderate")}
            title="Moderately Active"
            desc="Exercise 3-5x/week"
            icon="🏃"
          />
          <Option
            selected={activityLevel === "active"}
            onClick={() => setActivityLevel("active")}
            title="Very Active"
            desc="Daily intense exercise"
            icon="🔥"
          />
        </div>

        <div className="mb-4">
          <h2 className="text-xl font-extrabold text-slate-800">Your Goal</h2>
          <p className="text-xs text-slate-500">Target outcome</p>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          <Option
            selected={goal === "lose_weight"}
            onClick={() => setGoal("lose_weight")}
            title="Lose Weight"
            icon="📉"
          />
          <Option
            selected={goal === "maintain"}
            onClick={() => setGoal("maintain")}
            title="Maintain"
            icon="⚖️"
          />
          <Option
            selected={goal === "gain_muscle"}
            onClick={() => setGoal("gain_muscle")}
            title="Gain Muscle"
            icon="💪"
          />
        </div>

        {goal !== "maintain" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
          >
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                Target Weight (Optional)
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  value={targetWeight}
                  onChange={(e: any) => setTargetWeight(e.target.value)}
                  placeholder="65"
                  className="w-full text-lg font-bold text-slate-800 outline-none"
                />
                <span className="text-xs font-bold text-slate-400">kg</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 w-full px-4 pb-8 pt-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={!isValid}
          className="w-full py-3.5 bg-emerald-500 text-white rounded-xl font-bold text-base shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
        >
          Review Plan <ChevronRight size={18} />
        </motion.button>
      </div>
    </div>
  );
};

export default ActivityGoalStep;
