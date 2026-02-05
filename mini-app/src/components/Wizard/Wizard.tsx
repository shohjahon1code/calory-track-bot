import React, { useState } from "react";
import { User } from "../../types";
import apiService from "../../services/api";
import telegramService from "../../utils/telegram";
import GenderStep from "./Steps/GenderStep";
import BodyStatsStep from "./Steps/BodyStatsStep";
import WorkTypeStep from "./Steps/WorkTypeStep";
import ActivityGoalStep from "./Steps/ActivityGoalStep";
import SummaryStep from "./Steps/SummaryStep";
import AIAnalysisStep from "./Steps/AIAnalysisStep";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

interface WizardProps {
  user: User;
  onComplete: () => void;
}

const Wizard: React.FC<WizardProps> = ({ user, onComplete }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const totalSteps = 6;

  const [formData, setFormData] = useState<Partial<User>>({
    gender: user.gender,
    age: user.age,
    height: user.height,
    weight: user.weight,
    workType: user.workType,
    activityLevel: user.activityLevel,
    goal: user.goal,
    targetWeight: user.targetWeight,
  });
  const [loading, setLoading] = useState(false);

  const updateFormData = (data: Partial<User>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    setDirection(1);
    setStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => {
    setDirection(-1);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (!user.tgId) throw new Error("No user ID");
      const savedUser = await apiService.updateProfile(user.tgId, formData);
      // Pass dailyGoal from saved user to formData for AI analysis
      setFormData((prev) => ({ ...prev, dailyGoal: savedUser.dailyGoal }));
      setDirection(1);
      setStep(6);
    } catch (error) {
      console.error("Failed to update profile", error);
      telegramService.showAlert(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const variants = {
    enter: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? 40 : -40,
    }),
    center: {
      opacity: 1,
      x: 0,
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? -40 : 40,
    }),
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-slate-200 z-50">
        <motion.div
          className="h-full bg-emerald-500 rounded-r-full"
          initial={{ width: `${(1 / totalSteps) * 100}%` }}
          animate={{ width: `${(step / totalSteps) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      {/* Step dots */}
      <div className="fixed top-4 left-0 w-full flex justify-center gap-2 z-50">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <motion.div
            key={i}
            className={`h-1.5 rounded-full transition-colors ${
              i + 1 <= step ? "bg-emerald-500" : "bg-slate-200"
            }`}
            animate={{
              width: i + 1 === step ? 24 : 8,
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col p-6 pt-12 z-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
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
              <WorkTypeStep
                workType={formData.workType}
                onSelect={(workType) => {
                  updateFormData({ workType });
                  nextStep();
                }}
                onBack={prevStep}
              />
            )}

            {step === 4 && (
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

            {step === 5 && (
              <SummaryStep
                data={formData}
                loading={loading}
                onConfirm={handleSubmit}
                onBack={prevStep}
              />
            )}

            {step === 6 && (
              <AIAnalysisStep
                profileData={formData}
                onComplete={onComplete}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Wizard;
