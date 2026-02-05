import User from "../models/User.js";
import openaiService from "./openai.service.js";
import mealService from "./meal.service.js";
import { IUser, AIProgressAnalysis } from "../types/index.js";

const CACHE_TTL_HOURS = 24;

const SYSTEM_PROMPT = `You are a certified nutritionist and fitness expert. Analyze the user's profile and generate a personalized progress plan. Return ONLY a JSON object with this exact structure:
{
  "estimatedWeeks": number,
  "estimatedDate": "YYYY-MM-DD",
  "weeklyRateRecommendation": number (kg/week),
  "dailyCalorieTarget": number,
  "deficitOrSurplus": number (negative=deficit, positive=surplus),
  "milestones": [
    {"percentage": 25, "targetWeight": number, "estimatedDate": "YYYY-MM-DD"},
    {"percentage": 50, "targetWeight": number, "estimatedDate": "YYYY-MM-DD"},
    {"percentage": 75, "targetWeight": number, "estimatedDate": "YYYY-MM-DD"},
    {"percentage": 100, "targetWeight": number, "estimatedDate": "YYYY-MM-DD"}
  ],
  "recommendations": ["tip1", "tip2", "tip3"],
  "weeklyPlan": "brief weekly guidance",
  "motivationalMessage": "personalized encouragement",
  "riskWarnings": ["warning if any, or empty array"]
}

Rules:
1. Safe weight loss rate: 0.5-1 kg/week maximum
2. Safe weight gain rate: 0.25-0.5 kg/week maximum
3. For "maintain" goal, set estimatedWeeks to 0, milestones to empty array, focus on consistency
4. Consider the user's activity level and work type for accurate calculations
5. Recommendations should be specific and actionable (3-5 items)
6. If target weight is not set, estimate a healthy target based on BMI (18.5-24.9 range)
7. Be encouraging but realistic
8. Return ONLY valid JSON`;

class ProgressService {
  /**
   * Initial analysis after wizard (no meal data)
   */
  async getInitialAnalysis(
    profileData: Partial<IUser>,
    language: string,
  ): Promise<AIProgressAnalysis | null> {
    const langLabel = language === "uz" ? "Uzbek" : "English";

    const userPrompt = `User Profile:
- Gender: ${profileData.gender || "unknown"}
- Age: ${profileData.age || "unknown"}
- Height: ${profileData.height || "unknown"} cm
- Current Weight: ${profileData.weight || "unknown"} kg
- Target Weight: ${profileData.targetWeight || "not set"} kg
- Goal: ${profileData.goal || "unknown"}
- Activity Level: ${profileData.activityLevel || "unknown"}
- Work Type: ${profileData.workType || "unknown"}
- Daily Calorie Target: ${profileData.dailyGoal || "not calculated"} kcal

This is a NEW user with no meal history yet.
Today's date: ${new Date().toISOString().split("T")[0]}

Generate the analysis in ${langLabel}.`;

    const result = await openaiService.analyzeProgress(SYSTEM_PROMPT, userPrompt);

    if (!result.success || !result.data) {
      return null;
    }

    return result.data as AIProgressAnalysis;
  }

  /**
   * Ongoing analysis with meal data and caching
   */
  async generateAnalysis(
    tgId: string,
    language: string,
    forceRefresh = false,
  ): Promise<AIProgressAnalysis | null> {
    const user = await User.findOne({ tgId });
    if (!user) return null;

    // Check cache
    if (
      !forceRefresh &&
      user.lastProgressAnalysis &&
      user.lastAnalysisDate
    ) {
      const hoursSince =
        (Date.now() - new Date(user.lastAnalysisDate).getTime()) / (1000 * 60 * 60);
      if (hoursSince < CACHE_TTL_HOURS) {
        return user.lastProgressAnalysis as AIProgressAnalysis;
      }
    }

    // Gather meal data (last 7 days)
    let avgCalories = 0;
    let avgProtein = 0;
    let avgCarbs = 0;
    let avgFats = 0;

    try {
      const stats = await mealService.getLast7DaysStats(tgId);
      const daysWithMeals = stats.filter((s) => s.mealsCount > 0);
      if (daysWithMeals.length > 0) {
        avgCalories = Math.round(
          daysWithMeals.reduce((s, d) => s + d.totalCalories, 0) / daysWithMeals.length,
        );
        avgProtein = Math.round(
          daysWithMeals.reduce((s, d) => s + d.totalProtein, 0) / daysWithMeals.length,
        );
        avgCarbs = Math.round(
          daysWithMeals.reduce((s, d) => s + d.totalCarbs, 0) / daysWithMeals.length,
        );
        avgFats = Math.round(
          daysWithMeals.reduce((s, d) => s + d.totalFats, 0) / daysWithMeals.length,
        );
      }
    } catch {
      // Meal data optional
    }

    const weightHistory = user.weightHistory || [];
    const recentWeights = weightHistory
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-10)
      .map((w) => `${w.weight}kg (${new Date(w.date).toISOString().split("T")[0]})`);

    const langLabel = language === "uz" ? "Uzbek" : "English";

    const userPrompt = `User Profile:
- Gender: ${user.gender || "unknown"}
- Age: ${user.age || "unknown"}
- Height: ${user.height || "unknown"} cm
- Current Weight: ${user.weight || "unknown"} kg
- Target Weight: ${user.targetWeight || "not set"} kg
- Goal: ${user.goal || "unknown"}
- Activity Level: ${user.activityLevel || "unknown"}
- Work Type: ${user.workType || "unknown"}
- Daily Calorie Target: ${user.dailyGoal} kcal

Weight History (recent): ${recentWeights.length > 0 ? recentWeights.join(", ") : "No history yet"}

Recent Meal Data (last 7 days avg):
- Avg daily calories: ${avgCalories || "No data"}
- Avg protein: ${avgProtein}g, Avg carbs: ${avgCarbs}g, Avg fats: ${avgFats}g

Today's date: ${new Date().toISOString().split("T")[0]}

Generate the analysis in ${langLabel}.`;

    const result = await openaiService.analyzeProgress(SYSTEM_PROMPT, userPrompt);

    if (!result.success || !result.data) {
      return null;
    }

    // Cache the result atomically to avoid VersionError
    await User.findOneAndUpdate(
      { tgId },
      {
        lastProgressAnalysis: result.data,
        lastAnalysisDate: new Date(),
      },
    );

    return result.data as AIProgressAnalysis;
  }
}

export default new ProgressService();
