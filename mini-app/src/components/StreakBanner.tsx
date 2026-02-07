import React from "react";
import { motion } from "framer-motion";
import { Flame, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

interface StreakBannerProps {
  currentStreak: number;
  xp?: number;
  level?: number;
}

const StreakBanner: React.FC<StreakBannerProps> = ({ currentStreak, xp, level }) => {
  const { t } = useTranslation();

  if (currentStreak === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-3 flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
          <Flame size={20} className="text-slate-300" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-400">{t("gamification.startStreak")}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl p-3 gradient-streak shadow-glow-amber"
    >
      <div className="flex items-center gap-3 relative z-10">
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
        >
          <Flame size={22} className="text-white" />
        </motion.div>

        <div className="flex-1">
          <p className="text-sm font-black text-white">
            {t("gamification.dayStreak", { count: currentStreak })}
          </p>
          {level && (
            <p className="text-[10px] font-semibold text-white/70">
              {t("gamification.level", { level })}
            </p>
          )}
        </div>

        {xp !== undefined && (
          <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1">
            <Zap size={12} className="text-white" />
            <span className="text-[11px] font-bold text-white">{xp} XP</span>
          </div>
        )}
      </div>

      {/* Decorative circles */}
      <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
      <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-white/5 rounded-full" />
    </motion.div>
  );
};

export default StreakBanner;
