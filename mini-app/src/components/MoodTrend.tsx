import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import telegramService from "../utils/telegram";
import apiService from "../services/api";
import i18n from "../i18n";
import { MoodEntry, MoodWeeklyAnalysis } from "../types";

const MOOD_EMOJI_MAP: Record<number, string> = {
  5: "\uD83D\uDE04",
  4: "\uD83D\uDE42",
  3: "\uD83D\uDE10",
  2: "\uD83D\uDE1F",
  1: "\uD83D\uDE29",
};

interface MoodTrendProps {
  isPremium: boolean;
}

export default function MoodTrend({ isPremium }: MoodTrendProps) {
  const { t } = useTranslation();
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [analysis, setAnalysis] = useState<MoodWeeklyAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  useEffect(() => {
    const fetchMoods = async () => {
      const tgId = telegramService.getUserId();
      if (!tgId) return;
      try {
        const recent = await apiService.getRecentMoods(tgId, 7);
        setMoods(recent);
      } catch {
        // Non-blocking
      }
    };
    fetchMoods();
  }, []);

  const fetchAnalysis = async () => {
    if (!isPremium) return;
    setLoadingAnalysis(true);
    try {
      const tgId = telegramService.getUserId();
      if (!tgId) return;
      const result = await apiService.getMoodAnalysis(tgId, i18n.language);
      if (result.success && result.data) {
        setAnalysis(result.data);
        telegramService.haptic("success");
      }
    } catch {
      // Non-blocking
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // Build 7-day grid
  const buildWeekGrid = () => {
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const grid: { date: string; mood: number | null; dayLabel: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayIndex = d.getDay(); // 0=Sun
      const entry = moods.find((m) => m.date === dateStr);
      grid.push({
        date: dateStr,
        mood: entry ? entry.mood : null,
        dayLabel: dayNames[dayIndex === 0 ? 6 : dayIndex - 1],
      });
    }
    return grid;
  };

  if (moods.length === 0) return null;

  const weekGrid = buildWeekGrid();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800">{t("mood.weeklyTrend")}</h3>
        {!analysis && isPremium && moods.length >= 3 && (
          <button
            onClick={fetchAnalysis}
            disabled={loadingAnalysis}
            className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 disabled:opacity-50"
          >
            <Sparkles size={12} />
            {loadingAnalysis ? "..." : t("mood.getInsight")}
          </button>
        )}
      </div>

      {/* 7-day Emoji Row */}
      <div className="flex justify-between gap-1 mb-4">
        {weekGrid.map(({ date, mood, dayLabel }) => (
          <div key={date} className="flex flex-col items-center gap-1.5 flex-1">
            <span className="text-[9px] font-medium text-slate-400">{dayLabel}</span>
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center ${
                mood
                  ? mood >= 4
                    ? "bg-emerald-50"
                    : mood === 3
                      ? "bg-amber-50"
                      : "bg-red-50"
                  : "bg-slate-50"
              }`}
            >
              <span className="text-lg">{mood ? MOOD_EMOJI_MAP[mood] : "\u2022"}</span>
            </div>
          </div>
        ))}
      </div>

      {/* AI Insight Card (premium) */}
      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl p-4 text-white"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-yellow-300" />
            <span className="text-xs font-bold text-white/90">{t("mood.aiInsight")}</span>
          </div>
          <p className="text-xs text-indigo-100 leading-relaxed">{analysis.summary}</p>
          {analysis.advice.length > 0 && (
            <div className="mt-2 pt-2 border-t border-white/20">
              {analysis.advice.map((a, i) => (
                <div key={i} className="flex items-start gap-1.5 mt-1">
                  <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <p className="text-[11px] text-indigo-100">{a}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Premium upsell */}
      {!isPremium && moods.length >= 3 && (
        <button
          onClick={() => telegramService.showAlert(t("mood.upgradePrompt"))}
          className="w-full mt-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-500"
        >
          <Lock size={12} />
          {t("mood.unlockInsight")}
        </button>
      )}
    </motion.div>
  );
}
