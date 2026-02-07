import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Flame, Star, Target, Users, Zap, Crown, BookOpen, Medal, UtensilsCrossed, Diamond } from "lucide-react";
import { useTranslation } from "react-i18next";
import telegramService from "../utils/telegram";
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

interface BadgeUnlockModalProps {
  badge: Badge | null;
  onClose: () => void;
}

const BadgeUnlockModal: React.FC<BadgeUnlockModalProps> = ({ badge, onClose }) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (badge) {
      telegramService.haptic("heavy");
    }
  }, [badge]);

  const Icon = badge ? (ICON_MAP[badge.icon] || Trophy) : Trophy;

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Confetti particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: "50%",
                  y: "50%",
                  scale: 0,
                  opacity: 1,
                }}
                animate={{
                  x: `${Math.random() * 100}%`,
                  y: `${Math.random() * 100}%`,
                  scale: [0, 1, 0.5],
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.05,
                  ease: "easeOut",
                }}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#f43f5e"][i % 5],
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className="card-elevated p-8 mx-6 text-center max-w-[300px]"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", damping: 10, stiffness: 200 }}
              className="w-20 h-20 rounded-3xl gradient-warm mx-auto mb-4 flex items-center justify-center shadow-xl"
            >
              <Icon size={36} className="text-white" />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1"
            >
              {t("gamification.badgeUnlocked")}
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl font-black text-slate-800 mb-1"
            >
              {badge.name}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-slate-500 mb-6"
            >
              {badge.description}
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              onClick={onClose}
              className="btn-brand w-full"
            >
              {t("gamification.awesome")}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BadgeUnlockModal;
