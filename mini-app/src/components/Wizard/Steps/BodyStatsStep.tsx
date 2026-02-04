import React, { useState } from "react";
import { User } from "../../../types";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

interface BodyStatsStepProps {
  age?: number;
  height?: number;
  weight?: number;
  onNext: (data: Partial<User>) => void;
  onBack: () => void;
}

// Extracted outside to prevent re-mount/focus loss
const InputField = ({ label, value, onChange, placeholder, suffix }: any) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent transition-all">
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
  </div>
);

const BodyStatsStep: React.FC<BodyStatsStepProps> = ({
  age: initialAge,
  height: initialHeight,
  weight: initialWeight,
  onNext,
  onBack,
}) => {
  // Use local state strings to handle typing comfortably
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
        <h2 className="text-2xl font-extrabold text-slate-900">Your Stats</h2>
        <p className="text-sm text-slate-500 font-medium">
          To calculate precise needs
        </p>
      </div>

      <div className="space-y-3 flex-1 pb-8">
        <InputField
          label="Age"
          value={age}
          onChange={(e: any) => setAge(e.target.value)}
          placeholder="25"
          suffix="yrs"
        />
        <InputField
          label="Height"
          value={height}
          onChange={(e: any) => setHeight(e.target.value)}
          placeholder="175"
          suffix="cm"
        />
        <InputField
          label="Weight"
          value={weight}
          onChange={(e: any) => setWeight(e.target.value)}
          placeholder="70"
          suffix="kg"
        />
      </div>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmit}
        disabled={!isValid}
        className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 mt-auto disabled:opacity-50 transition-all mb-8"
      >
        Continue <ChevronRight size={20} />
      </motion.button>
    </div>
  );
};

export default BodyStatsStep;
