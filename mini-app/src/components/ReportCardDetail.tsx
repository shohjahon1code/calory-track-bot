import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, CheckCircle, AlertCircle, Lightbulb, Crown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DailyReportCard } from "../types";

interface Props {
  report: DailyReportCard | null;
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
}

const GRADE_COLORS: Record<string, string> = {
  A: "from-emerald-400 to-green-500",
  B: "from-blue-400 to-indigo-500",
  C: "from-amber-400 to-yellow-500",
  D: "from-orange-400 to-red-400",
  F: "from-red-500 to-rose-600",
};

const ReportCardDetail: React.FC<Props> = ({ report, isOpen, onClose, onUpgrade }) => {
  const { t } = useTranslation();

  if (!report || !isOpen) return null;

  const gradientClass = GRADE_COLORS[report.grade] || GRADE_COLORS.C;

  const getStatusIcon = (status: string) => {
    if (status === "good" || status === "on_target") {
      return <CheckCircle size={16} className="text-emerald-500" />;
    }
    return <AlertCircle size={16} className="text-amber-500" />;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="bg-white rounded-t-3xl w-full max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-slate-200" />
          </div>

          {/* Header */}
          <div className="px-4 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center text-2xl shadow-lg`}>
                {report.gradeEmoji}
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800">
                  {t("reportCard.grade")} {report.grade}
                </h2>
                <p className="text-xs text-slate-400 font-medium">{report.date}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center"
            >
              <X size={18} className="text-slate-500" />
            </button>
          </div>

          <div className="px-4 pb-16 space-y-4">
            {/* Calorie Score */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                {t("reportCard.calorieScore")}
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-black text-slate-800">
                    {report.calorieScore.consumed}
                  </p>
                  <p className="text-xs text-slate-400">
                    {t("reportCard.goal")}: {report.calorieScore.goal} kcal
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {report.calorieScore.status === "over" ? (
                    <TrendingUp className="text-red-500" size={24} />
                  ) : report.calorieScore.status === "under" ? (
                    <TrendingDown className="text-amber-500" size={24} />
                  ) : (
                    <CheckCircle className="text-emerald-500" size={24} />
                  )}
                  <span className={`text-sm font-bold ${
                    report.calorieScore.status === "on_target" ? "text-emerald-600" :
                    report.calorieScore.status === "over" ? "text-red-600" : "text-amber-600"
                  }`}>
                    {report.calorieScore.difference > 0 ? "+" : ""}{report.calorieScore.difference} kcal
                  </span>
                </div>
              </div>
            </div>

            {/* Macro Balance */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                {t("reportCard.macros")}
              </h3>
              <div className="space-y-2.5">
                {(["protein", "carbs", "fats"] as const).map((macro) => (
                  <div key={macro} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(report.macroBalance[macro].status)}
                      <span className="text-sm font-medium text-slate-700">
                        {t(`home.${macro}`)}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-slate-800">
                      {report.macroBalance[macro].consumed}g
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Premium Content */}
            {report.isPremium && report.highlights.length > 0 && (
              <>
                {/* Highlights */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <CheckCircle size={14} />
                    {t("reportCard.highlights")}
                  </h3>
                  <div className="space-y-2">
                    {report.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5 shrink-0">✨</span>
                        <span className="text-sm text-slate-700">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Improvements */}
                {report.improvements.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Lightbulb size={14} />
                      {t("reportCard.improvements")}
                    </h3>
                    <div className="space-y-2">
                      {report.improvements.map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5 shrink-0">💡</span>
                          <span className="text-sm text-slate-700">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tomorrow Tip */}
                {report.tomorrowTip && (
                  <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-4">
                    <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">
                      {t("reportCard.tomorrowTip")}
                    </h3>
                    <p className="text-sm text-slate-700">{report.tomorrowTip}</p>
                  </div>
                )}

                {/* Streak */}
                {report.streakAck && (
                  <div className="text-center py-1">
                    <p className="text-sm font-medium text-slate-500">🔥 {report.streakAck}</p>
                  </div>
                )}
              </>
            )}

            {/* Free User Upsell */}
            {!report.isPremium && (
              <div className="rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-5 text-center">
                <Crown size={28} className="text-white mx-auto mb-2" />
                <h3 className="text-lg font-bold text-white mb-1">
                  {t("reportCard.upgradeTitle")}
                </h3>
                <p className="text-sm text-white/80 mb-4">
                  {t("reportCard.upgradeDesc")}
                </p>
                <button
                  onClick={onUpgrade}
                  className="w-full py-3 bg-white text-orange-600 font-bold rounded-xl shadow-lg active:scale-95 transition-transform"
                >
                  {t("premium.upgrade")}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReportCardDetail;
