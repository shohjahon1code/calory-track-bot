import Meal, { IMealDocument } from "../models/Meal.js";
import { NutritionData, DailyStats } from "../types/index.js";
import { ERROR_MESSAGES } from "../config/constants.js";

class MealService {
  /**
   * Save a new meal entry
   */
  async saveMeal(
    tgId: string,
    nutritionData: NutritionData,
    imageUrl?: string,
  ): Promise<IMealDocument> {
    try {
      // Create meal with pending status
      const meal = await Meal.create({
        userId: tgId,
        tgId,
        name: nutritionData.items.map((i) => i.name).join(", "), // Composite name
        calories: Math.round(nutritionData.totalCalories),
        protein: Math.round(nutritionData.totalProtein),
        carbs: Math.round(nutritionData.totalCarbs),
        fats: Math.round(nutritionData.totalFats),
        items: nutritionData.items,
        confidence: nutritionData.confidence,
        status: "pending", // Default to pending
        imageUrl: imageUrl || "",
      });

      console.log(
        `✅ Meal saved (pending): ${meal.name} - ${meal.calories} kcal`,
      );
      return meal;
    } catch (error) {
      console.error("Error in saveMeal:", error);
      throw new Error(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }

  /**
   * Confirm a pending meal
   */
  async confirmMeal(
    mealId: string,
    tgId: string,
  ): Promise<IMealDocument | null> {
    try {
      const meal = await Meal.findOneAndUpdate(
        { _id: mealId, tgId },
        { status: "confirmed" },
        { new: true },
      );
      return meal;
    } catch (error) {
      console.error("Error in confirmMeal:", error);
      throw new Error(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }

  /**
   * Get today's meals for a user
   */
  async getTodayMeals(tgId: string): Promise<IMealDocument[]> {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      return await Meal.find({
        tgId,
        status: "confirmed", // Only confirmed meals
        timestamp: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      }).sort({ timestamp: -1 });
    } catch (error) {
      console.error("Error in getTodayMeals:", error);
      throw new Error(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }

  /**
   * Get meals by date
   */
  async getMealsByDate(tgId: string, date: Date): Promise<IMealDocument[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      return await Meal.find({
        tgId,
        timestamp: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      }).sort({ timestamp: -1 });
    } catch (error) {
      console.error("Error in getMealsByDate:", error);
      throw new Error(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }

  /**
   * Calculate today's nutrition stats
   */
  async getTodayStats(tgId: string, dailyGoal: number): Promise<DailyStats> {
    try {
      const todayMeals = await this.getTodayMeals(tgId);

      const stats = todayMeals.reduce(
        (acc, meal) => ({
          totalCalories: acc.totalCalories + meal.calories,
          totalProtein: acc.totalProtein + meal.protein,
          totalCarbs: acc.totalCarbs + meal.carbs,
          totalFats: acc.totalFats + meal.fats,
          mealsCount: acc.mealsCount + 1,
        }),
        {
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFats: 0,
          mealsCount: 0,
        },
      );

      const remainingCalories = dailyGoal - stats.totalCalories;
      const progressPercentage = Math.round(
        (stats.totalCalories / dailyGoal) * 100,
      );

      return {
        ...stats,
        dailyGoal,
        remainingCalories,
        progressPercentage,
      };
    } catch (error) {
      console.error("Error in getTodayStats:", error);
      throw new Error(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }

  /**
   * Delete a meal by ID
   */
  async deleteMeal(mealId: string, tgId: string): Promise<boolean> {
    try {
      const result = await Meal.deleteOne({ _id: mealId, tgId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error("Error in deleteMeal:", error);
      throw new Error(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }

  /**
   * Get a single meal by ID
   */
  async getMealById(mealId: string): Promise<IMealDocument | null> {
    try {
      return await Meal.findById(mealId);
    } catch (error) {
      console.error("Error in getMealById:", error);
      throw new Error(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }

  /**
   * Update a meal
   */
  async updateMeal(
    mealId: string,
    updates: Partial<NutritionData>,
  ): Promise<IMealDocument | null> {
    try {
      // Calculate new totals if items are updated?
      // For now, assuming direct updates to fields or simple edit.
      // If we support full re-calc, we'd need logic here.
      // Let's assume user edits name/calories/macros directly.
      const meal = await Meal.findByIdAndUpdate(mealId, updates, { new: true });
      return meal;
    } catch (error) {
      console.error("Error in updateMeal:", error);
      throw new Error(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }

  /**
   * Get stats for the last 7 days
   */
  async getLast7DaysStats(tgId: string): Promise<DailyStats[]> {
    try {
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      // Single query for all meals in the range
      const meals = await Meal.find({
        tgId,
        status: "confirmed",
        timestamp: { $gte: sevenDaysAgo, $lte: today },
      });

      // Initialize map for last 7 days
      const statsMap = new Map<string, DailyStats>();
      const result: DailyStats[] = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(new Date().getDate() - i);
        const dateKey = d.toISOString().split("T")[0];

        statsMap.set(dateKey, {
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFats: 0,
          mealsCount: 0,
          dailyGoal: 0,
          remainingCalories: 0,
          progressPercentage: 0,
        });
      }

      // Aggregate in memory
      meals.forEach((meal) => {
        const dateKey = new Date(meal.timestamp).toISOString().split("T")[0];
        if (statsMap.has(dateKey)) {
          const stat = statsMap.get(dateKey)!;
          stat.totalCalories += meal.calories;
          stat.totalProtein += meal.protein;
          stat.totalCarbs += meal.carbs;
          stat.totalFats += meal.fats;
          stat.mealsCount += 1;
        }
      });

      // Convert back to array in correct order
      Array.from(statsMap.values()).forEach((stat) => result.push(stat));

      return result;
    } catch (error) {
      console.error("Error in getLast7DaysStats:", error);
      throw new Error(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }

  /**
   * Get recent meals (limit 10)
   */
  async getRecentMeals(tgId: string): Promise<IMealDocument[]> {
    try {
      return await Meal.find({ tgId, status: "confirmed" })
        .sort({ timestamp: -1 })
        .limit(10);
    } catch (error) {
      console.error("Error in getRecentMeals:", error);
      throw new Error(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }

  /**
   * Get analytics data (Pie chart + Insights)
   */
  async getAnalytics(tgId: string): Promise<{
    calorieDistribution: { name: string; value: number }[];
    insight: string;
  }> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const meals = await Meal.find({
        tgId,
        status: "confirmed",
        timestamp: { $gte: thirtyDaysAgo },
      });

      // 1. Calorie Distribution by Time of Day
      const distribution = {
        Breakfast: 0,
        Lunch: 0,
        Dinner: 0,
        Snack: 0,
      };

      meals.forEach((meal) => {
        const hour = new Date(meal.timestamp).getHours();
        if (hour >= 5 && hour < 11) distribution.Breakfast += meal.calories;
        else if (hour >= 11 && hour < 16) distribution.Lunch += meal.calories;
        else if (hour >= 17 && hour < 22) distribution.Dinner += meal.calories;
        else distribution.Snack += meal.calories;
      });

      const pieData = Object.entries(distribution).map(([name, value]) => ({
        name,
        value,
      }));

      // 2. Insight: Most frequent high-calorie food (simple heuristic)
      const foodFrequency: Record<string, number> = {};
      const foodCalories: Record<string, number> = {};

      meals.forEach((meal) => {
        // Use composite name or primary item
        const name = meal.items?.[0]?.name || meal.name.split(",")[0];
        if (name) {
          foodFrequency[name] = (foodFrequency[name] || 0) + 1;
          foodCalories[name] = (foodCalories[name] || 0) + meal.calories;
        }
      });

      // Find frequent item with high avg calorie
      let topFood = "";
      let maxScore = 0;

      Object.entries(foodFrequency).forEach(([food, count]) => {
        if (count >= 2) {
          const avgCal = foodCalories[food] / count;
          // Simple score: frequency * avgCalories (prioritize impactful habits)
          const score = count * avgCal;
          if (score > maxScore) {
            maxScore = score;
            topFood = food;
          }
        }
      });

      const insight = topFood
        ? `Your most frequent high-calorie food is ${topFood}. Reducing its portion could speed up your progress by 15%.`
        : "Try tracking more meals to get personalized diet insights!";

      return {
        calorieDistribution: pieData.filter((d) => d.value > 0),
        insight,
      };
    } catch (error) {
      console.error("Error in getAnalytics:", error);
      throw new Error(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }
}

export default new MealService();
