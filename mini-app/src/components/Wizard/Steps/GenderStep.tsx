import React from "react";
import { User } from "../../../types";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import telegramService from "../../../utils/telegram";

interface GenderStepProps {
  gender?: User["gender"];
  onSelect: (gender: "male" | "female") => void;
}

const GenderStep: React.FC<GenderStepProps> = ({ gender, onSelect }) => {
  const { t } = useTranslation();

  const handleSelect = (g: "male" | "female") => {
    telegramService.haptic("medium");
    onSelect(g);
  };

  return (
    <div className="flex flex-col h-full justify-center px-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black text-slate-900 mb-2">
          {t("wizard.gender.title")}
        </h2>
        <p className="text-sm text-slate-500 font-medium">
          {t("wizard.gender.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => handleSelect("male")}
          className={`relative p-6 rounded-2xl border-2 flex items-center justify-between transition-all group ${
            gender === "male"
              ? "border-emerald-500 bg-emerald-50/50 shadow-lg shadow-emerald-100/50"
              : "border-white bg-white shadow-sm hover:border-emerald-200"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="text-3xl bg-white p-2 rounded-full shadow-sm">
              👨
            </div>
            <div className="text-left">
              <div
                className={`text-base font-bold ${gender === "male" ? "text-emerald-900" : "text-slate-800"}`}
              >
                {t("wizard.gender.male")}
              </div>
            </div>
          </div>
          {gender === "male" && (
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px]">
              ✓
            </div>
          )}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => handleSelect("female")}
          className={`relative p-6 rounded-2xl border-2 flex items-center justify-between transition-all group ${
            gender === "female"
              ? "border-emerald-500 bg-emerald-50/50 shadow-lg shadow-emerald-100/50"
              : "border-white bg-white shadow-sm hover:border-emerald-200"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="text-3xl bg-white p-2 rounded-full shadow-sm">
              👩
            </div>
            <div className="text-left">
              <div
                className={`text-base font-bold ${gender === "female" ? "text-emerald-900" : "text-slate-800"}`}
              >
                {t("wizard.gender.female")}
              </div>
            </div>
          </div>
          {gender === "female" && (
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px]">
              ✓
            </div>
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default GenderStep;
