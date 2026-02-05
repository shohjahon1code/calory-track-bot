import React, { useState } from "react";
import { User } from "../../../types";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface BodyStatsStepProps {
  age?: number;
  height?: number;
  weight?: number;
  onNext: (data: Partial<User>) => void;
  onBack: () => void;
}

const InputField = ({ label, value, onChange, placeholder, suffix, index }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 * (index || 0), duration: 0.4 }}
    className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent focus-within:shadow-lg focus-within:shadow-emerald-50 transition-all duration-300"
  >
    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
      {label}
    </label>
    <div className="flex items-center justify-between">
      <input
        type="number"
        pattern="[0-9]*"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full text-xl font-bold text-slate-800 outline-none placeholder:text-slate-200 bg-transparent"
      />
      <span className="text-sm font-bold text-slate-400">{suffix}</span>
    </div>
  </motion.div>
);

const BodyStatsStep: React.FC<BodyStatsStepProps> = ({
  age: initialAge,
  height: initialHeight,
  weight: initialWeight,
  onNext,
  onBack,
}) => {
  const { t } = useTranslation();
  const [age, setAge] = useState<string>(
    initialAge ? initialAge.toString() : "",
  );
  const [height, setHeight] = useState<string>(
    initialHeight ? initialHeight.toString() : "",
  );
  const [weight, setWeight] = useState<string>(
    initialWeight ? initialWeight.toString() : "",
  );

  const handleSubmit = () => {
    if (age && height && weight) {
      onNext({
        age: parseInt(age),
        height: parseInt(height),
        weight: parseInt(weight),
      });
    }
  };

  const isValid = age && height && weight;

  return (
    <div className="flex flex-col h-full px-4">
      <button
        onClick={onBack}
        className="self-start py-4 -ml-2 text-slate-400 hover:text-slate-600"
      >
        <ArrowLeft size={24} />
      </button>

      <div className="mb-6 text-center">
        <h2 className="text-2xl font-extrabold text-slate-900">{t("wizard.bodyStats.title")}</h2>
        <p className="text-sm text-slate-500 font-medium">
          {t("wizard.bodyStats.subtitle")}
        </p>
      </div>

      <div className="space-y-3 flex-1 pb-8">
        <InputField
          label={t("wizard.bodyStats.age")}
          value={age}
          onChange={(e: any) => setAge(e.target.value)}
          placeholder="25"
          suffix={t("wizard.bodyStats.ageSuffix")}
          index={0}
        />
        <InputField
          label={t("wizard.bodyStats.height")}
          value={height}
          onChange={(e: any) => setHeight(e.target.value)}
          placeholder="175"
          suffix={t("wizard.bodyStats.heightSuffix")}
          index={1}
        />
        <InputField
          label={t("wizard.bodyStats.weight")}
          value={weight}
          onChange={(e: any) => setWeight(e.target.value)}
          placeholder="70"
          suffix={t("wizard.bodyStats.weightSuffix")}
          index={2}
        />
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={handleSubmit}
        disabled={!isValid}
        className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 mt-auto disabled:opacity-50 transition-all mb-8"
      >
        {t("wizard.bodyStats.continue")} <ChevronRight size={20} />
      </motion.button>
    </div>
  );
};

export default BodyStatsStep;
