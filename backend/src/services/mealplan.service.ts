import OpenAI from "openai";
import MealPlan, { IMealPlanDocument } from "../models/MealPlan.js";
import User from "../models/User.js";
import { IMealPlanDay } from "../types/index.js";

class MealPlanService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  /**
   * Generate a weekly meal plan using GPT-4o.
   */
  async generateWeeklyPlan(tgId: string): Promise<IMealPlanDocument | null> {
    const user = await User.findOne({ tgId });
    if (!user) return null;

    const calorieTarget = user.dailyGoal || 2000;
    const goal = user.goal || "maintain";
    const language = user.language || "uz";

    // Calculate macro targets based on goal
    let proteinRatio = 0.25;
    let carbsRatio = 0.45;
    let fatsRatio = 0.30;

    if (goal === "gain_muscle") {
      proteinRatio = 0.35;
      carbsRatio = 0.40;
      fatsRatio = 0.25;
    } else if (goal === "lose_weight") {
      proteinRatio = 0.30;
      carbsRatio = 0.35;
      fatsRatio = 0.35;
    }

    const proteinTarget = Math.round((calorieTarget * proteinRatio) / 4);
    const carbsTarget = Math.round((calorieTarget * carbsRatio) / 4);
    const fatsTarget = Math.round((calorieTarget * fatsRatio) / 9);

    const prompt = this.buildPrompt(calorieTarget, proteinTarget, carbsTarget, fatsTarget, goal, language);

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a professional nutritionist and meal planner. Return ONLY valid JSON, no markdown." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return null;

      const cleaned = content.replace(/```json\n?|```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned) as { days: IMealPlanDay[] };

      if (!parsed.days || parsed.days.length !== 7) return null;

      // Calculate totals for each day
      for (const day of parsed.days) {
        const meals = [day.breakfast, day.lunch, day.dinner, day.snack];
        day.totalCalories = meals.reduce((s, m) => s + (m.calories || 0), 0);
        day.totalProtein = meals.reduce((s, m) => s + (m.protein || 0), 0);
        day.totalCarbs = meals.reduce((s, m) => s + (m.carbs || 0), 0);
        day.totalFats = meals.reduce((s, m) => s + (m.fats || 0), 0);
      }

      // Archive existing active plan
      await MealPlan.updateMany(
        { tgId, status: "active" },
        { $set: { status: "archived" } },
      );

      // Get Monday of current week
      const now = new Date();
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
      monday.setHours(0, 0, 0, 0);

      const plan = new MealPlan({
        tgId,
        weekStartDate: monday,
        days: parsed.days,
        dailyCalorieTarget: calorieTarget,
        dailyProteinTarget: proteinTarget,
        dailyCarbsTarget: carbsTarget,
        dailyFatsTarget: fatsTarget,
        userGoal: goal,
        status: "active",
        generatedAt: new Date(),
      });

      await plan.save();
      return plan;
    } catch (error) {
      console.error("Error generating meal plan:", error);
      return null;
    }
  }

  /**
   * Regenerate a single meal slot within a plan.
   */
  async regenerateMeal(
    tgId: string,
    planId: string,
    dayIndex: number,
    mealSlot: "breakfast" | "lunch" | "dinner" | "snack",
  ): Promise<IMealPlanDocument | null> {
    const plan = await MealPlan.findOne({ _id: planId, tgId, status: "active" });
    if (!plan || !plan.days[dayIndex]) return null;

    const user = await User.findOne({ tgId });
    const language = user?.language || "uz";
    const calorieTarget = plan.dailyCalorieTarget;

    const slotCalories: Record<string, number> = {
      breakfast: Math.round(calorieTarget * 0.25),
      lunch: Math.round(calorieTarget * 0.35),
      dinner: Math.round(calorieTarget * 0.30),
      snack: Math.round(calorieTarget * 0.10),
    };

    const target = slotCalories[mealSlot] || 400;
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const dayName = dayNames[dayIndex] || "Monday";

    const prompt = `Generate ONE ${mealSlot} meal for ${dayName}.
Target: ~${target} calories.
Include Uzbek cuisine where possible.
Language for names/descriptions: ${language === "uz" ? "Uzbek" : "English"}.

Return ONLY JSON:
{
  "name": "meal name",
  "description": "short description",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fats": number,
  "prepTime": number (minutes),
  "ingredients": ["item1", "item2"],
  "isUzbek": boolean
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a professional nutritionist. Return ONLY valid JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return null;

      const cleaned = content.replace(/```json\n?|```\n?/g, "").trim();
      const newMeal = JSON.parse(cleaned);

      plan.days[dayIndex][mealSlot] = newMeal;

      // Recalculate day totals
      const day = plan.days[dayIndex];
      const meals = [day.breakfast, day.lunch, day.dinner, day.snack];
      day.totalCalories = meals.reduce((s, m) => s + (m.calories || 0), 0);
      day.totalProtein = meals.reduce((s, m) => s + (m.protein || 0), 0);
      day.totalCarbs = meals.reduce((s, m) => s + (m.carbs || 0), 0);
      day.totalFats = meals.reduce((s, m) => s + (m.fats || 0), 0);

      plan.markModified("days");
      await plan.save();
      return plan;
    } catch (error) {
      console.error("Error regenerating meal:", error);
      return null;
    }
  }

  /**
   * Get active meal plan.
   */
  async getActivePlan(tgId: string): Promise<IMealPlanDocument | null> {
    return MealPlan.findOne({ tgId, status: "active" }).sort({ generatedAt: -1 });
  }

  private buildPrompt(
    calories: number,
    protein: number,
    carbs: number,
    fats: number,
    goal: string,
    language: string,
  ): string {
    const goalDescriptions: Record<string, string> = {
      lose_weight: "weight loss with calorie deficit",
      maintain: "weight maintenance",
      gain_muscle: "muscle gain with calorie surplus",
    };

    const goalDesc = goalDescriptions[goal] || "weight maintenance";
    const lang = language === "uz" ? "Uzbek" : "English";

    return `Create a 7-day meal plan for ${goalDesc}.

Daily targets:
- Calories: ${calories} kcal
- Protein: ${protein}g
- Carbs: ${carbs}g
- Fats: ${fats}g

Requirements:
1. Include traditional Uzbek dishes (plov, manti, shurpa, somsa, lagman, etc.) mixed with international meals
2. Each day has 4 meals: breakfast, lunch, dinner, snack
3. Keep meals practical with accessible ingredients
4. Vary meals across 7 days (no repetition)
5. Meal names and descriptions in ${lang}
6. Include prep time estimates
7. List 4-8 ingredients per meal

Return ONLY valid JSON with this structure:
{
  "days": [
    {
      "dayOfWeek": 0,
      "breakfast": { "name": "string", "description": "string", "calories": number, "protein": number, "carbs": number, "fats": number, "prepTime": number, "ingredients": ["string"], "isUzbek": boolean },
      "lunch": { ... same structure ... },
      "dinner": { ... same structure ... },
      "snack": { ... same structure ... }
    }
  ]
}

dayOfWeek: 0=Monday, 1=Tuesday, ..., 6=Sunday`;
  }
}

export default new MealPlanService();
