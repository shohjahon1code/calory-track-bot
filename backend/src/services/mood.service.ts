import MoodEntry, {
  IMoodEntry,
  IMoodEntryDocument,
  MoodLevel,
  MoodTrigger,
} from "../models/MoodEntry.js";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";
import mealService from "./meal.service.js";
import openaiService from "./openai.service.js";

interface MoodWeeklyAnalysis {
  moodTrend: string;
  averageMood: number;
  moodCalorieCorrelation: string;
  topTriggers: string[];
  patterns: string[];
  advice: string[];
  summary: string;
}

class MoodService {
  async logMood(
    tgId: string,
    mood: MoodLevel,
    triggers: MoodTrigger[],
    note: string,
  ): Promise<{ success: boolean; data?: IMoodEntryDocument; error?: string }> {
    try {
      const today = new Date().toISOString().split("T")[0];

      const entry = await MoodEntry.findOneAndUpdate(
        { tgId, date: today },
        { mood, triggers, note },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      return { success: true, data: entry };
    } catch (error) {
      console.error("Error in logMood:", error);
      return { success: false, error: "Failed to save mood" };
    }
  }

  async getTodayMood(tgId: string): Promise<IMoodEntry | null> {
    const today = new Date().toISOString().split("T")[0];
    return MoodEntry.findOne({ tgId, date: today }).lean();
  }

  async getRecentMoods(
    tgId: string,
    days: number = 7,
  ): Promise<IMoodEntry[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffDate = cutoff.toISOString().split("T")[0];

    return MoodEntry.find({
      tgId,
      date: { $gte: cutoffDate },
    })
      .sort({ date: 1 })
      .lean();
  }

  async getWeeklyAnalysis(
    tgId: string,
    language: string = "uz",
  ): Promise<{
    success: boolean;
    data?: MoodWeeklyAnalysis;
    isPremium: boolean;
    error?: string;
  }> {
    const sub = await Subscription.findOne({ tgId, status: "active" });
    const isPremium = !!(
      sub?.endDate && new Date(sub.endDate) > new Date()
    );

    if (!isPremium) {
      return { success: false, isPremium: false, error: "PREMIUM_REQUIRED" };
    }

    const moods = await this.getRecentMoods(tgId, 7);
    if (moods.length < 3) {
      return {
        success: false,
        isPremium: true,
        error: "NOT_ENOUGH_DATA",
      };
    }

    const stats7Days = await mealService.getLast7DaysStats(tgId);
    const user = await User.findOne({ tgId });

    const systemPrompt = this.buildSystemPrompt(language);
    const userPrompt = this.buildUserPrompt(moods, stats7Days, user, language);

    const result = await openaiService.analyzeProgress(
      systemPrompt,
      userPrompt,
    );
    if (!result.success || !result.data) {
      return { success: false, isPremium: true, error: "AI analysis failed" };
    }

    return {
      success: true,
      data: result.data as MoodWeeklyAnalysis,
      isPremium: true,
    };
  }

  private buildSystemPrompt(language: string): string {
    const lang = language === "uz" ? "Uzbek" : "English";
    return `You are a nutrition and wellness coach. Analyze the correlation between mood and eating patterns.
Return ONLY a JSON object:
{
  "moodTrend": "improving" | "declining" | "stable",
  "averageMood": number (1-5),
  "moodCalorieCorrelation": "string describing the pattern",
  "topTriggers": ["trigger1", "trigger2"],
  "patterns": ["pattern1", "pattern2"],
  "advice": ["advice1", "advice2"],
  "summary": "2-3 sentence summary"
}

Rules:
1. Respond in ${lang}
2. Correlate high/low calorie days with mood levels
3. Identify if certain triggers appear on high/low calorie days
4. Provide actionable, specific advice related to local diet
5. Be encouraging and supportive
6. Return ONLY valid JSON`;
  }

  private buildUserPrompt(
    moods: IMoodEntry[],
    stats: any[],
    user: any,
    language: string,
  ): string {
    const moodData = moods
      .map(
        (m) =>
          `${m.date}: mood=${m.mood}/5, triggers=[${m.triggers.join(",")}], note="${m.note}"`,
      )
      .join("\n");

    const calorieData = stats
      .map((s, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return `${d.toISOString().split("T")[0]}: ${s.totalCalories} kcal, P:${s.totalProtein}g C:${s.totalCarbs}g F:${s.totalFats}g`;
      })
      .join("\n");

    return `User: Goal=${user?.goal || "maintain"}, DailyGoal=${user?.dailyGoal || 2000} kcal

Mood Entries (last 7 days):
${moodData}

Calorie Data (last 7 days):
${calorieData}

Language: ${language === "uz" ? "Uzbek" : "English"}`;
  }
}

export default new MoodService();
