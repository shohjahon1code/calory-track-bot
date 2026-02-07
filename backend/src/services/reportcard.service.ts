import User from "../models/User.js";
import mealService from "./meal.service.js";
import openaiService from "./openai.service.js";
import gamificationService from "./gamification.service.js";
import { DailyReportCard } from "../types/index.js";

const GRADE_EMOJI: Record<string, string> = {
  A: "\uD83C\uDD70\uFE0F",
  B: "\uD83C\uDD71\uFE0F",
  C: "\uD83C\uDD72\uFE0F",
  D: "\uD83C\uDD73\uFE0F",
  F: "\uD83D\uDCC9",
};

class ReportCardService {
  /**
   * Generate or return cached daily report card.
   */
  async generateReportCard(
    tgId: string,
    language: string = "uz",
    forceRefresh = false,
  ): Promise<DailyReportCard | null> {
    const user = await User.findOne({ tgId });
    if (!user) return null;

    const today = new Date().toISOString().split("T")[0];

    // Check cache
    if (
      !forceRefresh &&
      user.lastReportCard &&
      user.lastReportCardDate
    ) {
      const cachedDate = new Date(user.lastReportCardDate).toISOString().split("T")[0];
      if (cachedDate === today) {
        return user.lastReportCard as DailyReportCard;
      }
    }

    // Gather data
    const stats = await mealService.getTodayStats(tgId, user.dailyGoal || 2000);
    const meals = await mealService.getTodayMeals(tgId);
    const gamification = await gamificationService.getGamificationProfile(tgId).catch(() => null);

    // No meals = no report
    if (stats.mealsCount === 0) return null;

    const systemPrompt = this.getSystemPrompt(language);
    const userPrompt = this.buildUserPrompt(user, stats, meals, gamification, language);

    const result = await openaiService.analyzeProgress(systemPrompt, userPrompt);
    if (!result.success || !result.data) return null;

    const d = result.data;

    const reportCard: DailyReportCard = {
      date: today,
      grade: d.grade || "C",
      gradeEmoji: GRADE_EMOJI[d.grade] || "\uD83D\uDCCA",
      calorieScore: d.calorieScore || {
        consumed: stats.totalCalories,
        goal: stats.dailyGoal,
        status: "on_target",
        difference: stats.totalCalories - stats.dailyGoal,
      },
      macroBalance: d.macroBalance || {
        protein: { consumed: stats.totalProtein, status: "good" },
        carbs: { consumed: stats.totalCarbs, status: "good" },
        fats: { consumed: stats.totalFats, status: "good" },
      },
      highlights: d.highlights || [],
      improvements: d.improvements || [],
      tomorrowTip: d.tomorrowTip || "",
      streakAck: d.streakAck || "",
      detailedAnalysis: d.detailedAnalysis || "",
    };

    // Cache
    await User.findOneAndUpdate(
      { tgId },
      { lastReportCard: reportCard, lastReportCardDate: new Date() },
    );

    return reportCard;
  }

  /**
   * Get today's report (cached or generate).
   */
  async getTodayReportCard(tgId: string, language: string = "uz"): Promise<DailyReportCard | null> {
    return this.generateReportCard(tgId, language, false);
  }

  private getSystemPrompt(language: string): string {
    const lang = language === "uz" ? "Uzbek" : "English";

    return `You are a supportive nutrition coach. Analyze the user's daily eating and generate a report card.
Return ONLY a JSON object:
{
  "grade": "A" | "B" | "C" | "D" | "F",
  "calorieScore": {
    "consumed": number,
    "goal": number,
    "status": "over" | "under" | "on_target",
    "difference": number
  },
  "macroBalance": {
    "protein": { "consumed": number, "status": "good" | "low" | "high" },
    "carbs": { "consumed": number, "status": "good" | "low" | "high" },
    "fats": { "consumed": number, "status": "good" | "low" | "high" }
  },
  "highlights": ["string", "string"],
  "improvements": ["string"],
  "tomorrowTip": "string",
  "streakAck": "string",
  "detailedAnalysis": "string"
}

Grading:
- A: 90-110% calorie goal + balanced macros + 3+ meals
- B: 80-120% + decent macros + 2+ meals
- C: 70-130% or only 1-2 meals
- D: 50-70% or 130-150%
- F: <50% or >150%

Macro status: protein >0.8g/kg = good, carbs 40-60% = good, fats 20-35% = good.

Rules:
1. Be encouraging, not judgmental
2. highlights: 2-3 positive things (e.g., "Hit protein target", "Logged 3 meals")
3. improvements: 1-2 actionable tips (e.g., "Add tvorog at breakfast for +12g protein")
4. tomorrowTip: specific Uzbek dish with rough macros
5. streakAck: acknowledge current streak
6. detailedAnalysis: 2-3 sentence summary
7. Respond in ${lang}
8. Return ONLY valid JSON`;
  }

  private buildUserPrompt(
    user: any,
    stats: any,
    meals: any[],
    gamification: any,
    language: string,
  ): string {
    const mealList = meals
      .map((m: any) => `- ${m.name}: ${m.calories} kcal (P:${m.protein}g C:${m.carbs}g F:${m.fats}g)`)
      .join("\n");

    return `User: Goal=${user.goal || "maintain"}, DailyGoal=${user.dailyGoal || 2000} kcal, Weight=${user.weight || "?"}kg

Today's Stats:
- Calories: ${stats.totalCalories}/${stats.dailyGoal} kcal (${stats.progressPercentage}%)
- Protein: ${stats.totalProtein}g, Carbs: ${stats.totalCarbs}g, Fats: ${stats.totalFats}g
- Meals: ${stats.mealsCount}

Meals:
${mealList || "None"}

Streak: ${gamification?.currentStreak || 0} days, Level: ${gamification?.level || 1}

Language: ${language === "uz" ? "Uzbek" : "English"}`;
  }
}

export default new ReportCardService();
