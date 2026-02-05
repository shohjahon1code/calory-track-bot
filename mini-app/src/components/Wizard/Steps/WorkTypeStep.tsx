import React from "react";
import { User } from "../../../types";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import telegramService from "../../../utils/telegram";

interface WorkTypeStepProps {
  workType?: User["workType"];
  onSelect: (workType: User["workType"]) => void;
  onBack: () => void;
}

const workTypes: { key: NonNullable<User["workType"]>; icon: string }[] = [
  { key: "office", icon: "💻" },
  { key: "physical", icon: "🔨" },
  { key: "student", icon: "📚" },
  { key: "homemaker", icon: "🏠" },
  { key: "freelance", icon: "☕" },
];

const WorkTypeStep: React.FC<WorkTypeStepProps> = ({
  workType,
  onSelect,
  onBack,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full px-4">
      <button
        onClick={onBack}
        className="self-start py-4 -ml-2 text-slate-400 hover:text-slate-600"
      >
        <ArrowLeft size={24} />
      </button>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-black text-slate-900 mb-2">
          {t("wizard.workType.title")}
        </h2>
        <p className="text-sm text-slate-500 font-medium">
          {t("wizard.workType.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {workTypes.map(({ key, icon }, index) => (
          <motion.button
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index, duration: 0.3 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              telegramService.haptic("medium");
              onSelect(key);
            }}
            className={`relative p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
              workType === key
                ? "border-emerald-500 bg-emerald-50/50 shadow-lg shadow-emerald-100/50"
                : "border-white bg-white shadow-sm hover:border-emerald-200"
            }`}
          >
            <div className="text-2xl bg-slate-50 p-2 rounded-xl">{icon}</div>
            <div className="text-left flex-1">
              <div
                className={`text-sm font-bold ${workType === key ? "text-emerald-900" : "text-slate-800"}`}
              >
                {t(`wizard.workType.${key}`)}
              </div>
              <p className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">
                {t(`wizard.workType.${key}Desc`)}
              </p>
            </div>
            {workType === key && (
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] shrink-0">
                ✓
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default WorkTypeStep;
