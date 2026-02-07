import React from "react";
import { motion } from "framer-motion";
import { Trophy, Flame, Star, Target, Users, Zap, Crown, BookOpen, Medal, UtensilsCrossed, Diamond, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "../types";

const ICON_MAP: Record<string, React.ElementType> = {
  utensils: UtensilsCrossed,
  flame: Flame,
  trophy: Trophy,
  crown: Crown,
  star: Star,
  zap: Zap,
  book: BookOpen,
  medal: Medal,
  users: Users,
  target: Target,
  diamond: Diamond,
};

// All possible badge IDs for display
const ALL_BADGE_IDS = [
  { id: "first_meal", icon: "utensils", name: "First Bite" },
  { id: "streak_3", icon: "flame", name: "On Fire" },
  { id: "streak_7", icon: "trophy", name: "Week Warrior" },
  { id: "streak_30", icon: "crown", name: "Monthly Master" },
  { id: "streak_100", icon: "star", name: "Centurion" },
  { id: "meals_10", icon: "zap", name: "Getting Started" },
  { id: "meals_50", icon: "book", name: "Dedicated Logger" },
  { id: "meals_200", icon: "medal", name: "Logging Legend" },
  { id: "first_friend", icon: "users", name: "Social Butterfly" },
  { id: "weight_goal", icon: "target", name: "Goal Crusher" },
  { id: "level_5", icon: "star", name: "Rising Star" },
  { id: "level_10", icon: "diamond", name: "Elite" },
];

interface BadgeGridProps {
  unlockedBadges: Badge[];
}

const BadgeGrid: React.FC<BadgeGridProps> = ({ unlockedBadges }) => {
  const { t } = useTranslation();
  const unlockedIds = new Set(unlockedBadges.map(b => b.id));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="section-title">{t("gamification.badges")}</h3>
        <span className="badge badge-info">
          {t("gamification.badgesProgress", { unlocked: unlockedBadges.length, total: ALL_BADGE_IDS.length })}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {ALL_BADGE_IDS.map((def, i) => {
          const isUnlocked = unlockedIds.has(def.id);
          const unlocked = unlockedBadges.find(b => b.id === def.id);
          const Icon = ICON_MAP[def.icon] || Trophy;

          return (
            <motion.div
              key={def.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl ${
                isUnlocked
                  ? "bg-gradient-to-b from-amber-50 to-orange-50 border border-amber-100"
                  : "bg-slate-50 border border-slate-100"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isUnlocked
                    ? "gradient-warm shadow-sm"
                    : "bg-slate-200"
                }`}
              >
                {isUnlocked ? (
                  <Icon size={20} className="text-white" />
                ) : (
                  <Lock size={14} className="text-slate-400" />
                )}
              </div>
              <span
                className={`text-[9px] font-bold text-center leading-tight ${
                  isUnlocked ? "text-slate-700" : "text-slate-400"
                }`}
              >
                {isUnlocked && unlocked ? unlocked.name : "???"}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default BadgeGrid;
