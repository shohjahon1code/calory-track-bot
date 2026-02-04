import React, { useState } from "react";
import { User } from "../../types";
import apiService from "../../services/api";
import telegramService from "../../utils/telegram";
import GenderStep from "./Steps/GenderStep";
import BodyStatsStep from "./Steps/BodyStatsStep";
import ActivityGoalStep from "./Steps/ActivityGoalStep";
import SummaryStep from "./Steps/SummaryStep";
import { motion, AnimatePresence } from "framer-motion";

interface WizardProps {
  user: User;
  onComplete: () => void;
}

const Wizard: React.FC<WizardProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState<Partial<User>>({
    gender: user.gender,
    age: user.age,
    height: user.height,
    weight: user.weight,
    activityLevel: user.activityLevel,
    goal: user.goal,
    targetWeight: user.targetWeight,
  });
  const [loading, setLoading] = useState(false);

  const updateFormData = (data: Partial<User>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, totalSteps));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (!user.tgId) throw new Error("No user ID");
      await apiService.updateProfile(user.tgId, formData);
      onComplete();
    } catch (error) {
      console.error("Failed to update profile", error);
      telegramService.showAlert("❌ Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed top-0 left-0 w-full h-2 bg-slate-200 z-50">
        <motion.div
          className="h-full bg-emerald-500"
          initial={{ width: "25%" }}
          animate={{ width: `${(step / totalSteps) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      <div className="flex-1 flex flex-col p-6 pt-10 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            {step === 1 && (
              <GenderStep
                gender={formData.gender}
                onSelect={(gender) => {
                  updateFormData({ gender });
                  nextStep();
                }}
              />
            )}

            {step === 2 && (
              <BodyStatsStep
                age={formData.age}
                height={formData.height}
                weight={formData.weight}
                onNext={(stats) => {
                  updateFormData(stats);
                  nextStep();
                }}
                onBack={prevStep}
              />
            )}

            {step === 3 && (
              <ActivityGoalStep
                activityLevel={formData.activityLevel}
                goal={formData.goal}
                targetWeight={formData.targetWeight}
                onNext={(data) => {
                  updateFormData(data);
                  nextStep();
                }}
                onBack={prevStep}
              />
            )}

            {step === 4 && (
              <SummaryStep
                data={formData}
                loading={loading}
                onConfirm={handleSubmit}
                onBack={prevStep}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Wizard;
