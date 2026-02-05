import User, { IUserDocument } from "../models/User.js";
import { TelegramUserInfo } from "../types/index.js";
import {
  CALORIE_GOAL_LIMITS,
  ERROR_MESSAGES,
  DEFAULT_CALORIE_GOAL,
} from "../config/constants.js";

class UserService {
  /**
   * Find or create user from Telegram user info
   */
  async findOrCreate(telegramUser: TelegramUserInfo, language?: "uz" | "en"): Promise<IUserDocument> {
    try {
      const tgId = telegramUser.id.toString();

      let user = await User.findOne({ tgId });

      if (!user) {
        user = await User.create({
          tgId,
          firstName: telegramUser.first_name || "",
          lastName: telegramUser.last_name || "",
          username: telegramUser.username || "",
          language: language || "uz",
        });
        console.log(`✅ New user created: ${tgId}`);
      }

      return user;
    } catch (error) {
      console.error("Error in findOrCreate:", error);
      throw new Error(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }

  /**
   * Get user by Telegram ID
   */
  async updateLanguage(tgId: string, language: "uz" | "en"): Promise<IUserDocument | null> {
    try {
      const user = await User.findOne({ tgId });
      if (!user) return null;
      user.language = language;
      return await user.save();
    } catch (error) {
      console.error("Error in updateLanguage:", error);
      throw new Error(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }

  async getByTgId(tgId: string): Promise<IUserDocument | null> {
    try {
      return await User.findOne({ tgId });
    } catch (error) {
      console.error("Error in getByTgId:", error);
      throw new Error(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }

  /**
   * Get user's weight history
   */
  async getWeightHistory(
    tgId: string,
  ): Promise<{ weight: number; date: Date }[]> {
    try {
      const user = await User.findOne({ tgId }).select("weightHistory");
      if (!user || !user.weightHistory) {
        return [];
      }
      return user.weightHistory.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
    } catch (error) {
      console.error("Error in getWeightHistory:", error);
      throw new Error(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }

  /**
   * Update user's daily calorie goal
   */
  async updateDailyGoal(
    tgId: string,
    newGoal: number,
  ): Promise<IUserDocument | null> {
    try {
      if (
        newGoal < CALORIE_GOAL_LIMITS.MIN ||
        newGoal > CALORIE_GOAL_LIMITS.MAX
      ) {
        throw new Error(ERROR_MESSAGES.INVALID_GOAL);
      }

      const user = await User.findOne({ tgId });

      if (!user) {
        return null;
      }

      return await user.updateGoal(newGoal);
    } catch (error) {
      console.error("Error in updateDailyGoal:", error);
      if (
        error instanceof Error &&
        error.message === ERROR_MESSAGES.INVALID_GOAL
      ) {
        throw error;
      }
      throw new Error(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }
  /**
   * Update user profile and recalculate daily goal
   */
  async updateProfile(
    tgId: string,
    profileData: Partial<IUserDocument>,
  ): Promise<IUserDocument | null> {
    try {
      const user = await User.findOne({ tgId });

      if (!user) {
        return null;
      }

      // Track weight history if changed
      if (profileData.weight && profileData.weight !== user.weight) {
        if (!user.weightHistory) user.weightHistory = [];
        user.weightHistory.push({
          weight: profileData.weight,
          date: new Date(),
        });
      }

      // Update fields
      if (profileData.gender) user.gender = profileData.gender;
      if (profileData.age) user.age = profileData.age;
      if (profileData.height) user.height = profileData.height;
      if (profileData.weight) user.weight = profileData.weight;
      if (profileData.activityLevel)
        user.activityLevel = profileData.activityLevel;
      if (profileData.goal) user.goal = profileData.goal;
      if (profileData.targetWeight)
        user.targetWeight = profileData.targetWeight;
      if (profileData.units) user.units = profileData.units;
      if (profileData.language) user.language = profileData.language;
      if (profileData.workType) user.workType = profileData.workType;

      // Recalculate daily goal if all required fields are present
      if (
        user.gender &&
        user.age &&
        user.height &&
        user.weight &&
        user.activityLevel &&
        user.goal
      ) {
        user.dailyGoal = this.calculateDailyCalories(user);
      }

      return await user.save();
    } catch (error) {
      console.error("Error in updateProfile:", error);
      throw new Error(ERROR_MESSAGES.DATABASE_ERROR);
    }
  }

  /**
   * Calculate daily calories using Mifflin-St Jeor Equation
   */
  private calculateDailyCalories(user: IUserDocument): number {
    if (
      !user.weight ||
      !user.height ||
      !user.age ||
      !user.gender ||
      !user.activityLevel ||
      !user.goal
    ) {
      return DEFAULT_CALORIE_GOAL;
    }

    // Mifflin-St Jeor Equation
    // Men: 10W + 6.25H - 5A + 5
    // Women: 10W + 6.25H - 5A - 161
    let bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age;
    bmr += user.gender === "male" ? 5 : -161;

    // Activity Multipliers
    const multipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };

    const tdee = bmr * (multipliers[user.activityLevel] || 1.2);

    // Goal Adjustment
    let targetCalories = tdee;
    if (user.goal === "lose_weight") {
      targetCalories -= 500;
    } else if (user.goal === "gain_muscle") {
      targetCalories += 500;
    }

    // Enforce Limits
    return Math.max(
      CALORIE_GOAL_LIMITS.MIN,
      Math.min(CALORIE_GOAL_LIMITS.MAX, Math.round(targetCalories)),
    );
  }
}

export default new UserService();
