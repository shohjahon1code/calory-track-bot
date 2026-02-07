import React, { useState, useEffect } from "react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingDown,
  TrendingUp,
  Trash2,
  Zap,
  Clock,
  Target,
  CalendarDays,
  Sparkles,
  Scale,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import telegramService from "../utils/telegram";
import apiService from "../services/api";
import WeightModal from "./WeightModal";
import LoadingSkeleton from "./LoadingSkeleton";
import { Meal, AIProgressAnalysis, ProgressPhoto } from "../types";
import ProgressPhotos from "./ProgressPhotos";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"];

const Stats: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [currentWeight, setCurrentWeight] = useState(0);
  const [targetWeight, setTargetWeight] = useState(65);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [trendDirection, setTrendDirection] = useState<"up" | "down" | "flat">(
    "flat",
  );
  const [weeklyChange, setWeeklyChange] = useState(0);

  // New Analytics State
  const [recentMeals, setRecentMeals] = useState<Meal[]>([]);
  const [analytics, setAnalytics] = useState<{
    calorieDistribution: { name: string; value: number }[];
    insight: string;
  } | null>(null);
  const [predictionDays, setPredictionDays] = useState<number | null>(null);
  const [dailyAvgCalories, setDailyAvgCalories] = useState(0);
  const [progressAnalysis, setProgressAnalysis] = useState<AIProgressAnalysis | null>(null);
  const [refreshingAnalysis, setRefreshingAnalysis] = useState(false);
  const [userGoal, setUserGoal] = useState<string>("");
  const [startWeight, setStartWeight] = useState(0);
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>([]);
  const [photoComparison, setPhotoComparison] = useState<{ before: ProgressPhoto; after: ProgressPhoto } | null>(null);

  const fetchStats = async () => {
    try {
      const tgId = telegramService.getUserId();
      if (!tgId) return;

      const [user, history, meals, analyticsData, stats7Days] =
        await Promise.all([
          apiService.getUser(tgId),
          apiService.getWeightHistory(tgId),
          apiService.getRecentMeals(tgId),
          apiService.getAnalytics(tgId),
          apiService.getLast7DaysStats(tgId),
        ]);

      setTargetWeight(user.targetWeight || 65);
      setCurrentWeight(user.weight || 0);
      setUserGoal(user.goal || "");
      setStartWeight(
        history.length > 0 ? history[0].weight : user.weight || 0,
      );

      // Process Weight Data
      const data = processWeightData(history);
      setChartData(data);
      calculateTrend(data);

      // Process Prediction
      if (data.length >= 7 && user.weight) {
        const currentMA = data[data.length - 1].ma7;
        const pastMA = data[data.length - 8]?.ma7 || currentMA;
        const diff = currentMA - pastMA;

        if (diff < -0.1 && user.weight > targetWeight) {
          const ratePerWeek = Math.abs(diff);
          const remaining = user.weight - targetWeight;
          const weeks = remaining / ratePerWeek;
          setPredictionDays(Math.round(weeks * 7));
        } else {
          setPredictionDays(null);
        }
      }

      setRecentMeals(meals);
      setAnalytics(analyticsData);

      // Calc Daily Avg Calories
      const validDays = stats7Days.filter((d) => d.totalCalories > 0);
      const avg = validDays.length
        ? Math.round(
            validDays.reduce((acc, curr) => acc + curr.totalCalories, 0) /
              validDays.length,
          )
        : 0;
      setDailyAvgCalories(avg);

      // Fetch progress photos (non-blocking)
      try {
        const [photos, comp] = await Promise.all([
          apiService.getProgressPhotos(tgId),
          apiService.getPhotoComparison(tgId),
        ]);
        setProgressPhotos(photos);
        setPhotoComparison(comp);
      } catch {
        // Photos are optional
      }

      // Fetch AI progress analysis (non-blocking)
      try {
        const analysis = await apiService.getProgressAnalysis(tgId, i18n.language);
        setProgressAnalysis(analysis);
      } catch {
        // Analysis is optional
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshAnalysis = async () => {
    setRefreshingAnalysis(true);
    try {
      const tgId = telegramService.getUserId();
      if (!tgId) return;
      const analysis = await apiService.getProgressAnalysis(tgId, i18n.language, true);
      setProgressAnalysis(analysis);
    } catch {
      // Ignore
    } finally {
      setRefreshingAnalysis(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const processWeightData = (history: { weight: number; date: string }[]) => {
    if (!history.length) return [];
    const sorted = [...history].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    return sorted.map((entry, index, array) => {
      const windowStart = Math.max(0, index - 6);
      const windowSlice = array.slice(windowStart, index + 1);
      const sum = windowSlice.reduce((acc, curr) => acc + curr.weight, 0);
      const avg = sum / windowSlice.length;
      return {
        date: new Date(entry.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        weight: entry.weight,
        ma7: parseFloat(avg.toFixed(1)),
      };
    });
  };

  const calculateTrend = (data: any[]) => {
    if (data.length < 8) {
      setTrendDirection("flat");
      return;
    }
    const currentMA = data[data.length - 1].ma7;
    const pastMA = data[data.length - 8].ma7;
    const diff = currentMA - pastMA;
    setWeeklyChange(parseFloat(Math.abs(diff).toFixed(1)));
    if (diff < -0.1) setTrendDirection("down");
    else if (diff > 0.1) setTrendDirection("up");
    else setTrendDirection("flat");
  };

  const handleDeleteMeal = async (mealId: string) => {
    const confirmed = await telegramService.showConfirm(
      "Delete this meal log?",
    );
    if (confirmed) {
      try {
        const tgId = telegramService.getUserId();
        if (tgId) {
          await apiService.deleteMeal(mealId, tgId);
          setRecentMeals((prev) => prev.filter((m) => m._id !== mealId));
          telegramService.showAlert("Meal deleted");
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-slate-50/50 pb-24 relative overflow-hidden"
    >
      {/* Background Elements */}
      <div className="fixed top-20 left-[-20%] w-[50%] h-[50%] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md pt-6 pb-4 px-4 sticky top-0 z-10 border-b border-slate-100 shadow-sm flex items-center justify-between">
        <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <CalendarDays size={20} className="text-emerald-500" />
          {t("stats.title")}
        </h1>
        <button
          onClick={() => setShowWeightModal(true)}
          className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-md active:scale-95 transition-all flex items-center gap-1"
        >
          <Scale size={14} /> {t("stats.logWeight")}
        </button>
      </div>

      <div className="px-4 space-y-4 py-4">
        {/* Main Trend Chart */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t("stats.currentWeight")}
              </span>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-3xl font-black text-slate-800 tracking-tight">
                  {currentWeight}
                </span>
                <span className="text-sm font-bold text-slate-400 mb-1.5">
                  kg
                </span>
              </div>
            </div>

            <div
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 ${
                trendDirection === "down"
                  ? "bg-emerald-50 text-emerald-600"
                  : trendDirection === "up"
                    ? "bg-red-50 text-red-500"
                    : "bg-slate-50 text-slate-500"
              }`}
            >
              {trendDirection === "down" && <TrendingDown size={14} />}
              {trendDirection === "up" && <TrendingUp size={14} />}
              {trendDirection === "flat"
                ? t("stats.stable")
                : `${weeklyChange} kg/week`}
            </div>
          </div>

          <div className="h-56 w-full -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#F1F5F9"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={30}
                  dy={10}
                />
                <YAxis
                  domain={["dataMin - 1", "dataMax + 1"]}
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.1)",
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    padding: "12px",
                  }}
                  itemStyle={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#1E293B",
                  }}
                  labelStyle={{
                    fontSize: "10px",
                    fontWeight: 600,
                    color: "#94A3B8",
                    marginBottom: "4px",
                  }}
                />
                <ReferenceLine
                  y={targetWeight}
                  stroke="#10B981"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="none"
                  fill="url(#colorWeight)"
                />
                <Line
                  type="monotone"
                  dataKey="ma7"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={false}
                  isAnimationActive={true}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Progress Photos */}
        <motion.div variants={itemVariants}>
          <ProgressPhotos
            photos={progressPhotos}
            comparison={photoComparison}
            onRefresh={fetchStats}
          />
        </motion.div>

        {/* Smart Analytics Cards Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Prediction Card */}
          <motion.div
            variants={itemVariants}
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden"
          >
            <div className="absolute -right-2 -top-2 text-indigo-50 opacity-50">
              <Target size={60} />
            </div>

            <div className="relative z-10">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                {t("stats.forecast")}
              </span>
              <div className="mt-2 h-16 flex flex-col justify-end">
                {progressAnalysis && progressAnalysis.estimatedWeeks > 0 ? (
                  <>
                    <div className="text-3xl font-black text-indigo-600 leading-none">
                      ~{progressAnalysis.estimatedWeeks}
                    </div>
                    <div className="text-xs font-medium text-slate-500">
                      {t("aiAnalysis.weeks")} 🎯
                    </div>
                  </>
                ) : predictionDays ? (
                  <>
                    <div className="text-3xl font-black text-indigo-600 leading-none">
                      {predictionDays}
                    </div>
                    <div className="text-xs font-medium text-slate-500">
                      {t("stats.daysToGo")} 🎯
                    </div>
                  </>
                ) : (
                  <span className="text-xs font-medium text-slate-400">
                    {t("stats.keepLogging")}
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Daily Avg Card */}
          <motion.div
            variants={itemVariants}
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden"
          >
            <div className="absolute -right-2 -top-2 text-orange-50 opacity-50">
              <Zap size={60} />
            </div>
            <div className="relative z-10">
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                {t("stats.avgIntake")}
              </span>
              <div className="mt-2 h-16 flex flex-col justify-end">
                <div className="text-3xl font-black text-orange-500 leading-none">
                  {dailyAvgCalories}
                </div>
                <div className="text-xs font-medium text-slate-500">
                  kcal / day
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* AI Progress Milestones */}
        {progressAnalysis && progressAnalysis.milestones && progressAnalysis.milestones.length > 0 && userGoal !== "maintain" && (
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">
                {t("aiAnalysis.progressToGoal")}
              </h3>
              <button
                onClick={handleRefreshAnalysis}
                disabled={refreshingAnalysis}
                className="text-[10px] font-bold text-emerald-500 disabled:opacity-50"
              >
                {refreshingAnalysis ? "..." : t("aiAnalysis.refreshAnalysis")}
              </button>
            </div>

            {/* Progress bar */}
            {(() => {
              const totalChange = Math.abs(startWeight - targetWeight);
              const currentChange = Math.abs(startWeight - currentWeight);
              const progressPercent = totalChange > 0 ? Math.min(100, (currentChange / totalChange) * 100) : 0;
              return (
                <div className="mb-4">
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium mb-1">
                    <span>{startWeight} kg</span>
                    <span>{targetWeight} kg</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-emerald-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                  <div className="text-center mt-1">
                    <span className="text-xs font-bold text-emerald-600">
                      {Math.round(progressPercent)}%
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Milestones */}
            <div className="space-y-2">
              {progressAnalysis.milestones.map((m, i) => {
                const reached = userGoal === "lose_weight"
                  ? currentWeight <= m.targetWeight
                  : currentWeight >= m.targetWeight;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      reached
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}>
                      {reached ? "✓" : `${m.percentage}%`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-slate-600">{m.targetWeight} kg</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{m.estimatedDate}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* AI Recommendations */}
        {progressAnalysis && progressAnalysis.recommendations && progressAnalysis.recommendations.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="relative p-5 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-yellow-300" />
                <h3 className="text-sm font-bold text-white/90">
                  {t("aiAnalysis.recommendations")}
                </h3>
              </div>
              <div className="space-y-2">
                {progressAnalysis.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <p className="text-xs leading-relaxed text-indigo-100 font-medium">
                      {rec}
                    </p>
                  </div>
                ))}
              </div>
              {progressAnalysis.weeklyPlan && (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1">
                    {t("aiAnalysis.weeklyPlan")}
                  </p>
                  <p className="text-xs text-indigo-100 leading-relaxed">
                    {progressAnalysis.weeklyPlan}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Insights & Calorie Source */}
        <div className="grid grid-cols-1 gap-4">
          {/* Calorie Source Pie */}
          {analytics && analytics.calorieDistribution.length > 0 && (
            <motion.div
              variants={itemVariants}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
            >
              <div className="w-1/2">
                <h3 className="font-bold text-slate-800 mb-3 text-sm">
                  {t("stats.topSources")}
                </h3>
                <div className="space-y-2">
                  {analytics.calorieDistribution.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <span className="text-xs text-slate-600 font-medium truncate">
                        {entry.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-32 h-32 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.calorieDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {analytics.calorieDistribution.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text if needed */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-xs font-bold text-slate-300">CAL</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* AI Insight */}
          {analytics?.insight && (
            <motion.div
              variants={itemVariants}
              className="relative p-5 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />

              <div className="flex items-start gap-3 relative z-10">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm shrink-0">
                  <Sparkles size={20} className="text-yellow-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white/90 mb-1">
                    {t("stats.aiAnalysis")}
                  </h3>
                  <p className="text-xs leading-relaxed text-indigo-100 font-medium opacity-90">
                    {analytics.insight}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Recent Meals List */}
        <motion.div variants={itemVariants} className="space-y-4 pt-4">
          <h2 className="text-lg font-black text-slate-800 px-1">
            {t("stats.logHistory")}
          </h2>

          <div className="space-y-3">
            <AnimatePresence>
              {recentMeals.map((meal) => (
                <motion.div
                  key={meal._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 shrink-0 overflow-hidden relative shadow-inner">
                      {meal.imageUrl ? (
                        <img
                          src={meal.imageUrl}
                          alt={meal.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">
                          🍽️
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-800 text-sm truncate">
                        {meal.name}
                      </h4>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium mt-1">
                        <span className="flex items-center gap-1">
                          <Clock size={10} />{" "}
                          {new Date(meal.timestamp).toLocaleDateString()}
                        </span>
                        <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                          {meal.calories} kcal
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteMeal(meal._id)}
                    className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {recentMeals.length === 0 && (
              <div className="text-center p-10 bg-white rounded-3xl border border-dashed border-slate-200">
                <div className="text-4xl mb-3 opacity-50">📝</div>
                <p className="text-slate-400 text-sm font-medium">
                  {t("home.noMeals")}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {showWeightModal && (
          <WeightModal
            currentWeight={currentWeight}
            onSave={async (w) => {
              const tgId = telegramService.getUserId();
              if (tgId) {
                await apiService.updateProfile(tgId, { weight: w });
              }
              setShowWeightModal(false);
              fetchStats();
            }}
            onClose={() => setShowWeightModal(false)}
          />
        )}
      </div>
    </motion.div>
  );
};

export default Stats;
