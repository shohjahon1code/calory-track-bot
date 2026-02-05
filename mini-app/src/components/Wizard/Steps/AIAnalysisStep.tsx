import React, { useState, useEffect } from "react";
import { User, AIProgressAnalysis } from "../../../types";
import { CheckCircle2, Target, TrendingDown, TrendingUp, Sparkles, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import apiService from "../../../services/api";
import i18n from "../../../i18n";

interface AIAnalysisStepProps {
  profileData: Partial<User>;
  onComplete: () => void;
}

const loadingSteps = ["step1", "step2", "step3"];

const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const lang = i18n.language === "uz" ? "uz-UZ" : "en-US";
    return date.toLocaleDateString(lang, { day: "numeric", month: "short" });
  } catch {
    return dateStr;
  }
};

const AIAnalysisStep: React.FC<AIAnalysisStepProps> = ({
  profileData,
  onComplete,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<AIProgressAnalysis | null>(null);
  const [error, setError] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 2000);

    generateAnalysis();

    return () => clearInterval(interval);
  }, []);

  const generateAnalysis = async () => {
    try {
      const result = await apiService.getInitialAnalysis(profileData, i18n.language);
      setAnalysis(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center px-6">
        {/* Animated rings */}
        <div className="relative w-28 h-28 mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-emerald-500 border-r-emerald-200"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-3 rounded-full border-[3px] border-transparent border-t-blue-500 border-l-blue-200"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-6 rounded-full border-[3px] border-transparent border-b-violet-500 border-r-violet-200"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles size={24} className="text-emerald-500" />
            </motion.div>
          </div>
        </div>

        {/* Loading step text */}
        <AnimatePresence mode="wait">
          <motion.p
            key={loadingStep}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="text-lg font-bold text-slate-800 text-center"
          >
            {t(`aiAnalysis.${loadingSteps[loadingStep]}`)}
          </motion.p>
        </AnimatePresence>

        <p className="text-sm text-slate-400 mt-3 text-center">
          {t("aiAnalysis.loading")}
        </p>

        {/* Progress dots */}
        <div className="flex gap-1.5 mt-6">
          {loadingSteps.map((_, i) => (
            <motion.div
              key={i}
              className={`h-1.5 rounded-full ${i <= loadingStep ? "bg-emerald-500" : "bg-slate-200"}`}
              animate={{ width: i === loadingStep ? 24 : 8 }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="flex flex-col h-full items-center justify-center px-4">
        <div className="text-5xl mb-4">😔</div>
        <p className="text-slate-600 text-center mb-6">{t("aiAnalysis.error")}</p>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onComplete}
          className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold text-lg"
        >
          {t("aiAnalysis.skip")}
        </motion.button>
      </div>
    );
  }

  const isLoseWeight = profileData.goal === "lose_weight";
  const isMaintain = profileData.goal === "maintain";

  return (
    <div className="flex flex-col h-full px-4">
      <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-2 mb-6"
        >
          <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold mb-3">
            <Sparkles size={12} /> AI
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            {t("aiAnalysis.title")}
          </h2>
        </motion.div>

        {/* Hero Card — Estimated Time */}
        {!isMaintain && analysis.estimatedWeeks > 0 && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900 text-white p-6 rounded-2xl text-center shadow-xl shadow-slate-300 mb-4 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-1">
              {t("aiAnalysis.estimatedTime")}
            </p>
            <div className="text-5xl font-black text-white">
              ~{analysis.estimatedWeeks}
            </div>
            <p className="text-emerald-400 font-bold text-xs mt-1">
              {t("aiAnalysis.weeks")} {t("aiAnalysis.toReach")} {profileData.targetWeight || analysis.milestones?.[3]?.targetWeight} kg
            </p>
          </motion.div>
        )}

        {isMaintain && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900 text-white p-6 rounded-2xl text-center shadow-xl shadow-slate-300 mb-4"
          >
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-1">
              {t("aiAnalysis.dailyTarget")}
            </p>
            <div className="text-5xl font-black text-white">
              {analysis.dailyCalorieTarget}
            </div>
            <p className="text-emerald-400 font-bold text-xs mt-1">
              {t("aiAnalysis.caloriesPerDay")}
            </p>
          </motion.div>
        )}

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-2 mb-4"
        >
          <div className="bg-white p-3 rounded-xl border border-slate-100 text-center">
            <Target size={16} className="mx-auto text-emerald-500 mb-1" />
            <div className="text-lg font-black text-slate-900">
              {analysis.dailyCalorieTarget}
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              {t("aiAnalysis.caloriesPerDay")}
            </p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-100 text-center">
            {isLoseWeight ? (
              <TrendingDown size={16} className="mx-auto text-blue-500 mb-1" />
            ) : (
              <TrendingUp size={16} className="mx-auto text-orange-500 mb-1" />
            )}
            <div className="text-lg font-black text-slate-900">
              {Math.abs(analysis.deficitOrSurplus)}
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              {isLoseWeight ? t("aiAnalysis.deficit") : isMaintain ? t("aiAnalysis.balance") : t("aiAnalysis.surplus")}
            </p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-100 text-center">
            <div className="text-sm mb-1">⚖️</div>
            <div className="text-lg font-black text-slate-900">
              {analysis.weeklyRateRecommendation}
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              {t("aiAnalysis.perWeek")}
            </p>
          </div>
        </motion.div>

        {/* Milestones */}
        {analysis.milestones && analysis.milestones.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-4 border border-slate-100 mb-4"
          >
            <h3 className="text-sm font-bold text-slate-800 mb-3">
              {t("aiAnalysis.milestones")}
            </h3>
            <div className="space-y-3">
              {analysis.milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i === analysis.milestones.length - 1
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    {m.percentage}%
                  </div>
                  <div className="flex-1">
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full"
                        style={{ width: `${m.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-slate-700">{m.targetWeight} kg</div>
                    <div className="text-[10px] text-slate-400">{formatDate(m.estimatedDate)}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recommendations */}
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-4 border border-slate-100 mb-4"
          >
            <h3 className="text-sm font-bold text-slate-800 mb-3">
              {t("aiAnalysis.recommendations")}
            </h3>
            <div className="space-y-2">
              {analysis.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-slate-600 leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Weekly Plan */}
        {analysis.weeklyPlan && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 mb-4"
          >
            <h3 className="text-sm font-bold text-emerald-800 mb-1">
              {t("aiAnalysis.weeklyPlan")}
            </h3>
            <p className="text-xs text-emerald-700 leading-relaxed">
              {analysis.weeklyPlan}
            </p>
          </motion.div>
        )}

        {/* Risk Warnings */}
        {analysis.riskWarnings && analysis.riskWarnings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="bg-amber-50 rounded-xl p-4 border border-amber-100 mb-4"
          >
            {analysis.riskWarnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">{w}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Motivational Message */}
        {analysis.motivationalMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center py-2"
          >
            <p className="text-sm text-slate-500 italic">
              "{analysis.motivationalMessage}"
            </p>
          </motion.div>
        )}
      </div>

      {/* Start Button */}
      <div className="absolute bottom-0 left-0 w-full px-4 pb-8 pt-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent">
        <motion.button
          whileTap={{ scale: 0.96 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={onComplete}
          className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-200 flex items-center justify-center gap-2"
        >
          {t("aiAnalysis.startTracking")} <CheckCircle2 size={18} />
        </motion.button>
      </div>
    </div>
  );
};

export default AIAnalysisStep;
