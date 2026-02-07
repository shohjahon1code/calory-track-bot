import React from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

interface XPProgressBarProps {
  xp: number;
  level: number;
  xpToNextLevel: number;
  xpForCurrentLevel: number;
}

const XPProgressBar: React.FC<XPProgressBarProps> = ({ xp: _xp, level, xpToNextLevel, xpForCurrentLevel }) => {
  const { t } = useTranslation();
  const progress = xpForCurrentLevel > 0
    ? Math.min(100, ((xpForCurrentLevel - xpToNextLevel) / xpForCurrentLevel) * 100)
    : 0;
  const needed = xpForCurrentLevel;
  const current = xpForCurrentLevel - xpToNextLevel;

  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
        <Zap size={18} className="text-indigo-500" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-slate-700">
            {t("gamification.level", { level })}
          </span>
          <span className="text-[10px] font-semibold text-slate-400">
            {t("gamification.xpToNext", { current, needed, next: level + 1 })}
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-500"
          />
        </div>
      </div>
    </div>
  );
};

export default XPProgressBar;
