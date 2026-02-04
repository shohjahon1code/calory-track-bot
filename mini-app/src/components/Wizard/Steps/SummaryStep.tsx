import React from "react";
import { User } from "../../../types";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface SummaryStepProps {
  data: Partial<User>;
  loading: boolean;
  onConfirm: () => void;
  onBack: () => void;
}

const SummaryStep: React.FC<SummaryStepProps> = ({
  data,
  loading,
  onConfirm,
  onBack,
}) => {
  const calculateEstimate = () => {
    if (
      !data.weight ||
      !data.height ||
      !data.age ||
      !data.gender ||
      !data.activityLevel
    )
      return 2000;

    let bmr = 10 * data.weight + 6.25 * data.height - 5 * data.age;
    bmr += data.gender === "male" ? 5 : -161;

    const multipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };

    const tdee = bmr * (multipliers[data.activityLevel] || 1.2);
    let target = tdee;
    if (data.goal === "lose_weight") target -= 500;
    if (data.goal === "gain_muscle") target += 500;

    return Math.round(target);
  };

  const targetCalories = calculateEstimate();

  const SummaryRow = ({ label, value }: any) => (
    <div className="flex justify-between items-center py-2.5 border-b border-slate-50 last:border-0">
      <span className="text-slate-400 font-medium text-xs">{label}</span>
      <span className="text-slate-800 font-bold capitalize text-xs">
        {value}
      </span>
    </div>
  );

  return (
    <div className="flex flex-col h-full px-4">
      <button
        onClick={onBack}
        className="self-start py-4 -ml-2 text-slate-400 mb-2 hover:text-slate-600"
      >
        <ArrowLeft size={24} />
      </button>

      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-slate-900">Final Plan</h2>
      </div>

      {/* Hero Result */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 text-white p-6 rounded-2xl text-center shadow-xl shadow-slate-300 mb-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none -ml-10 -mb-10" />

        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-1">
          Target
        </p>
        <div className="text-5xl font-black text-white">{targetCalories}</div>
        <p className="text-emerald-400 font-bold text-xs mt-1">kcal / day</p>
      </motion.div>

      {/* Breakdown */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 mb-6">
        <SummaryRow label="Gender" value={data.gender} />
        <SummaryRow
          label="Stats"
          value={`${data.height}cm • ${data.weight}kg • ${data.age}yo`}
        />
        <SummaryRow
          label="Activity"
          value={data.activityLevel?.replace("_", " ")}
        />
        <SummaryRow label="Goal" value={data.goal?.replace("_", " ")} />
      </div>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onConfirm}
        disabled={loading}
        className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 mt-auto disabled:opacity-70 transition-all mb-8"
      >
        {loading ? (
          "Saving..."
        ) : (
          <>
            Start Tracking <CheckCircle2 size={18} />
          </>
        )}
      </motion.button>
    </div>
  );
};

export default SummaryStep;
