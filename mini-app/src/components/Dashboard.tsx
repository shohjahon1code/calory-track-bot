import React, { useState, useEffect, useCallback } from "react";
import telegramService from "../utils/telegram";
import apiService from "../services/api";
import { User, DailyStats, Meal, GamificationProfile, Badge, DailyReportCard } from "../types";
import GoalSetting from "./GoalSetting";
import Wizard from "./Wizard/Wizard";
import LoadingSkeleton from "./LoadingSkeleton";
import StreakBanner from "./StreakBanner";
import XPProgressBar from "./XPProgressBar";
import BadgeUnlockModal from "./BadgeUnlockModal";
import ReportCardDetail from "./ReportCardDetail";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Droplets,
  Wheat,
  Utensils,
  Clock,
  ChevronRight,
  Award,
  CalendarDays,
  ChefHat,
  Crown,
  MessageCircle,
  TrendingUp,
  TrendingDown,
  CheckCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";

// Helper components for "Ultra" look
const MacroCard = ({
  label,
  value,
  total,
  unit,
  color,
  icon: Icon,
  delay,
}: {
  label: string;
  value: number;
  total: number;
  unit: string;
  color: string;
  icon: any;
  delay: number;
}) => {
  const percent = Math.min(100, Math.max(0, (value / total) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card p-3 flex flex-col items-center justify-center relative overflow-hidden group"
    >
      <div className={`absolute top-0 right-0 p-2 opacity-10 ${color}`}>
        <Icon size={40} />
      </div>
      <div
        className={`mb-2 p-2 rounded-full bg-slate-50 ${color.replace("text-", "text-opacity-80 text-")}`}
      >
        <Icon size={18} />
      </div>
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-lg font-bold text-slate-800 mt-1">
        {value}
        <span className="text-[10px] text-slate-400 ml-0.5">{unit}</span>
      </span>

      {/* Mini Progress Bar */}
      <div className="w-full h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, delay: delay + 0.2 }}
          className={`h-full rounded-full ${color.replace("text-", "bg-")}`}
        />
      </div>
    </motion.div>
  );
};

interface DashboardProps {
  onTabChange?: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onTabChange }) => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [gamification, setGamification] = useState<GamificationProfile | null>(null);
  const [unseenBadge, setUnseenBadge] = useState<Badge | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [reportCard, setReportCard] = useState<DailyReportCard | null>(null);
  const [showReportDetail, setShowReportDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showGoalSetting, setShowGoalSetting] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const tgId = telegramService.getUserId();
      if (!tgId) return;

      const [userData, statsData, mealsData, gamificationData, subData, reportData] = await Promise.all([
        apiService.getUser(tgId),
        apiService.getTodayStats(tgId),
        apiService.getTodayMeals(tgId),
        apiService.getGamification(tgId).catch(() => null),
        apiService.getSubscription(tgId).catch(() => null),
        apiService.getReportCard(tgId).catch(() => null),
      ]);

      setUser(userData);
      setStats(statsData);
      setMeals(mealsData);
      setIsPremium(subData?.isPremium || false);
      setReportCard(reportData);

      if (gamificationData) {
        setGamification(gamificationData);
        // Show first unseen badge
        if (gamificationData.unseenBadges.length > 0) {
          setUnseenBadge(gamificationData.unseenBadges[0]);
        }
      }

      if (!userData.gender || !userData.goal) {
        setShowWizard(true);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBadgeDismiss = async () => {
    if (!unseenBadge) return;
    const tgId = telegramService.getUserId();
    if (tgId) {
      await apiService.markBadgesSeen(tgId, [unseenBadge.id]).catch(() => {});
    }
    // Show next unseen badge if any
    if (gamification && gamification.unseenBadges.length > 1) {
      const remaining = gamification.unseenBadges.filter(b => b.id !== unseenBadge.id);
      setUnseenBadge(remaining.length > 0 ? remaining[0] : null);
    } else {
      setUnseenBadge(null);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleGoalSet = (newGoal: number) => {
    if (user) setUser({ ...user, dailyGoal: newGoal });
    setShowGoalSetting(false);
    fetchData();
  };

  const handleDeleteMeal = async (mealId: string) => {
    const confirmed = await telegramService.showConfirm("Delete this meal?");
    if (confirmed) {
      const tgId = telegramService.getUserId();
      if (tgId) {
        await apiService.deleteMeal(mealId, tgId);
        fetchData();
      }
    }
  };

  if (loading) return <LoadingSkeleton />;

  if (showWizard && user) {
    return (
      <Wizard
        user={user}
        onComplete={() => {
          setShowWizard(false);
          fetchData();
        }}
      />
    );
  }

  if (showGoalSetting) {
    return (
      <div className="p-4">
        <GoalSetting currentGoal={user?.dailyGoal} onGoalSet={handleGoalSet} />
      </div>
    );
  }

  if (!stats || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <button
          onClick={fetchData}
          className="px-6 py-2 bg-emerald-500 text-white rounded-xl"
        >
          {t("common.loading")}
        </button>
      </div>
    );
  }

  const progressPercent = Math.min(
    100,
    (stats.totalCalories / stats.dailyGoal) * 100,
  );
  const remaining = Math.max(0, stats.dailyGoal - stats.totalCalories);

  // Custom Ring Gradient logic
  const ringSize = 280;
  const strokeWidth = 20;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="min-h-screen pb-24 space-y-6 relative overflow-hidden bg-slate-50/50">
      {/* Decorative Background Blurs */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="pt-6 px-6 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm bg-white/30 pb-4 border-b border-white/20">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-slate-500 font-bold text-lg overflow-hidden">
                {user.firstName?.charAt(0) || "U"}
              </div>
              {isPremium && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm border-2 border-white">
                  <Crown size={10} className="text-white" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-800">
                  {t("home.hello")}, {user.firstName} 👋
                </h1>
                {isPremium && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium tracking-wide">
                {t("home.letsCrushIt")}
              </p>
            </div>
          </motion.div>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowGoalSetting(true)}
          className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-400"
        >
          <Award size={20} />
        </motion.button>
      </div>

      {/* Streak & XP Section */}
      {gamification && (
        <div className="px-4 space-y-3">
          <StreakBanner
            currentStreak={gamification.currentStreak}
            xp={gamification.xp}
            level={gamification.level}
          />
          <XPProgressBar
            xp={gamification.xp}
            level={gamification.level}
            xpToNextLevel={gamification.xpToNextLevel}
            xpForCurrentLevel={gamification.xpForCurrentLevel}
          />
        </div>
      )}

      {/* Hero Section - Calorie Ring */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="flex flex-col items-center justify-center relative py-4"
      >
        <div className="relative w-[280px] h-[280px]">
          {/* SVG Ring */}
          <svg
            width={ringSize}
            height={ringSize}
            className="transform -rotate-90 drop-shadow-xl"
          >
            <defs>
              <linearGradient
                id="ringGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              stroke="#E2E8F0"
              strokeWidth={strokeWidth}
              fill="none"
              className="opacity-30"
            />
            <motion.circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              stroke="url(#ringGradient)"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>

          {/* Inner Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest block mb-1">
                {t("home.remaining")}
              </span>
              <span className="text-5xl font-black text-slate-800 tracking-tighter block drop-shadow-sm">
                {remaining}
              </span>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full mt-2 inline-block">
                {t("home.goal")}: {stats.dailyGoal} kcal
              </span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Macro Cards Grid */}
      <div className="px-4 grid grid-cols-3 gap-3">
        <MacroCard
          label={t("home.protein")}
          value={stats.totalProtein}
          total={150} // Rough target or calc logic needed
          unit="g"
          color="text-blue-500"
          icon={Droplets}
          delay={0.2}
        />
        <MacroCard
          label={t("home.carbs")}
          value={stats.totalCarbs}
          total={200}
          unit="g"
          color="text-yellow-500"
          icon={Wheat}
          delay={0.3}
        />
        <MacroCard
          label={t("home.fats")}
          value={stats.totalFats}
          total={700}
          unit="g"
          color="text-red-500"
          icon={Flame}
          delay={0.4}
        />
      </div>

      {/* Quick Actions */}
      <div className="px-4 grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={() => onTabChange?.("meal_plan")}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 cursor-pointer active:scale-[0.97] transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-3 shadow-sm">
            <CalendarDays size={20} className="text-white" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">{t("mealPlan.title")}</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">{t("mealPlan.subtitle")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          onClick={() => onTabChange?.("recipes")}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 cursor-pointer active:scale-[0.97] transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-3 shadow-sm">
            <ChefHat size={20} className="text-white" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">{t("recipes.title")}</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">{t("recipes.quickSuggestions")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          onClick={() => onTabChange?.("chat_coach")}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 cursor-pointer active:scale-[0.97] transition-transform col-span-2"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-sm">
              <MessageCircle size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">{t("chatCoach.title")}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">{t("chatCoach.subtitle")}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Today's Meals */}
      <div className="px-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            {t("home.recentMeals")}{" "}
            <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {meals.length}
            </span>
          </h2>
          {/* Maybe a 'View All' link? */}
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {meals.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 text-center text-slate-400 bg-white/50 rounded-2xl border border-dashed border-slate-200"
              >
                <Utensils className="mx-auto mb-2 opacity-50" size={32} />
                <p className="text-sm font-medium">{t("home.noMeals")}</p>
              </motion.div>
            ) : (
              meals.map((meal, index) => (
                <motion.div
                  key={meal._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  layout
                  className="glass-card p-3 flex items-center gap-4 group active:scale-[0.98] transition-transform"
                  onClick={() => handleDeleteMeal(meal._id)} // Simple delete trigger
                >
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 shrink-0 overflow-hidden relative shadow-sm">
                    {meal.imageUrl ? (
                      <img
                        src={meal.imageUrl}
                        className="w-full h-full object-cover"
                        alt={meal.name}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        🍽️
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 truncate">
                      {meal.name}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock size={10} />{" "}
                        {new Date(meal.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="font-bold text-emerald-600 bg-emerald-50 px-1.5 rounded">
                        {meal.calories} kcal
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-300" />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Daily Report Card Preview */}
      {reportCard && (
        <div className="px-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            onClick={() => setShowReportDetail(true)}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                  reportCard.grade === "A" ? "from-emerald-400 to-green-500" :
                  reportCard.grade === "B" ? "from-blue-400 to-indigo-500" :
                  reportCard.grade === "C" ? "from-amber-400 to-yellow-500" :
                  reportCard.grade === "D" ? "from-orange-400 to-red-400" :
                  "from-red-500 to-rose-600"
                } flex items-center justify-center text-xl shadow-sm`}>
                  {reportCard.gradeEmoji}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {t("reportCard.title")}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-lg font-black text-slate-800">
                      {reportCard.grade}
                    </span>
                    <span className="text-xs text-slate-400">
                      {reportCard.calorieScore.consumed}/{reportCard.calorieScore.goal} kcal
                    </span>
                    {reportCard.calorieScore.status === "on_target" ? (
                      <CheckCircle size={14} className="text-emerald-500" />
                    ) : reportCard.calorieScore.status === "over" ? (
                      <TrendingUp size={14} className="text-red-500" />
                    ) : (
                      <TrendingDown size={14} className="text-amber-500" />
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!reportCard.isPremium && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-400 to-orange-500 text-white">
                    PRO
                  </span>
                )}
                <ChevronRight size={18} className="text-slate-300" />
              </div>
            </div>

            {reportCard.isPremium && reportCard.highlights.length > 0 && (
              <p className="text-xs text-slate-500 mt-2 truncate">
                ✨ {reportCard.highlights[0]}
              </p>
            )}

            {!reportCard.isPremium && (
              <p className="text-[11px] text-amber-600 mt-2 font-medium">
                {t("reportCard.tapForMore")}
              </p>
            )}
          </motion.div>
        </div>
      )}

      {/* Report Card Detail Modal */}
      <ReportCardDetail
        report={reportCard}
        isOpen={showReportDetail}
        onClose={() => setShowReportDetail(false)}
        onUpgrade={() => {
          setShowReportDetail(false);
          onTabChange?.("premium");
        }}
      />

      {/* Badge Unlock Modal */}
      <BadgeUnlockModal badge={unseenBadge} onClose={handleBadgeDismiss} />
    </div>
  );
};

export default Dashboard;
