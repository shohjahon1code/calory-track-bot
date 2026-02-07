import User, { IUserDocument } from "../models/User.js";
import Meal from "../models/Meal.js";
import { Badge, GamificationResult, GamificationProfile } from "../types/index.js";
import {
  XP_REWARDS,
  LEVEL_THRESHOLDS,
  BADGE_DEFINITIONS,
} from "../config/constants.js";

class GamificationService {
  /**
   * Called after a meal is confirmed. Updates streak, grants XP, checks badges.
   */
  async onMealConfirmed(tgId: string): Promise<GamificationResult> {
    const user = await User.findOne({ tgId });
    if (!user) {
      return { xpGained: 0, newBadges: [], streakUpdated: false, newStreak: 0, levelUp: false, newLevel: 1 };
    }

    let totalXP = XP_REWARDS.MEAL_LOGGED;
    const newBadges: Badge[] = [];

    // Update streak
    const streakResult = this.updateStreak(user);

    // Streak bonus XP
    const streak = user.currentStreak || 0;
    if (streakResult.streakChanged && streak > 1) {
      totalXP += Math.min(streak * XP_REWARDS.STREAK_BONUS_PER_DAY, 50);
    }

    // Grant XP and check level
    const prevLevel = user.level || 1;
    user.xp = (user.xp || 0) + totalXP;
    user.level = this.calculateLevel(user.xp);
    const levelUp = user.level > prevLevel;

    // Check badges
    const totalMeals = await Meal.countDocuments({ tgId, status: "confirmed" });
    const unlocked = this.checkBadges(user, totalMeals);
    newBadges.push(...unlocked);

    await user.save();

    return {
      xpGained: totalXP,
      newBadges,
      streakUpdated: streakResult.streakChanged,
      newStreak: user.currentStreak || 0,
      levelUp,
      newLevel: user.level,
    };
  }

  /**
   * Called when user logs weight
   */
  async onWeightLogged(tgId: string): Promise<GamificationResult> {
    const user = await User.findOne({ tgId });
    if (!user) {
      return { xpGained: 0, newBadges: [], streakUpdated: false, newStreak: 0, levelUp: false, newLevel: 1 };
    }

    const totalXP = XP_REWARDS.WEIGHT_LOGGED;
    const prevLevel = user.level || 1;
    user.xp = (user.xp || 0) + totalXP;
    user.level = this.calculateLevel(user.xp);

    // Check weight goal badge
    const newBadges: Badge[] = [];
    if (user.targetWeight && user.weight) {
      const atGoal = Math.abs(user.weight - user.targetWeight) <= 0.5;
      if (atGoal && !user.badges?.some(b => b.id === "weight_goal")) {
        const def = BADGE_DEFINITIONS.find(d => d.id === "weight_goal")!;
        const badge: Badge = {
          id: def.id,
          name: def.name.en,
          description: def.description.en,
          icon: def.icon,
          category: def.category,
          unlockedAt: new Date(),
          seen: false,
        };
        user.badges = user.badges || [];
        user.badges.push(badge);
        newBadges.push(badge);
      }
    }

    await user.save();

    return {
      xpGained: totalXP,
      newBadges,
      streakUpdated: false,
      newStreak: user.currentStreak || 0,
      levelUp: user.level > prevLevel,
      newLevel: user.level || 1,
    };
  }

  /**
   * Update streak based on lastLogDate comparison.
   */
  private updateStreak(user: IUserDocument): { streakChanged: boolean; newStreak: number } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (!user.lastLogDate) {
      user.currentStreak = 1;
      user.longestStreak = 1;
      user.lastLogDate = new Date();
      return { streakChanged: true, newStreak: 1 };
    }

    const lastLog = new Date(user.lastLogDate);
    lastLog.setHours(0, 0, 0, 0);

    if (lastLog.getTime() === today.getTime()) {
      return { streakChanged: false, newStreak: user.currentStreak || 0 };
    }

    if (lastLog.getTime() === yesterday.getTime()) {
      user.currentStreak = (user.currentStreak || 0) + 1;
    } else {
      user.currentStreak = 1;
    }

    if ((user.currentStreak || 0) > (user.longestStreak || 0)) {
      user.longestStreak = user.currentStreak;
    }

    user.lastLogDate = new Date();
    return { streakChanged: true, newStreak: user.currentStreak || 0 };
  }

  /**
   * Check all badge conditions and unlock new ones.
   */
  private checkBadges(user: IUserDocument, totalMeals: number): Badge[] {
    const newBadges: Badge[] = [];
    const existingIds = new Set((user.badges || []).map(b => b.id));
    user.badges = user.badges || [];

    const conditions: Record<string, boolean> = {
      first_meal: totalMeals >= 1,
      streak_3: (user.currentStreak || 0) >= 3,
      streak_7: (user.currentStreak || 0) >= 7,
      streak_30: (user.currentStreak || 0) >= 30,
      streak_100: (user.currentStreak || 0) >= 100,
      meals_10: totalMeals >= 10,
      meals_50: totalMeals >= 50,
      meals_200: totalMeals >= 200,
      level_5: (user.level || 1) >= 5,
      level_10: (user.level || 1) >= 10,
    };

    for (const def of BADGE_DEFINITIONS) {
      if (existingIds.has(def.id)) continue;
      if (conditions[def.id]) {
        const badge: Badge = {
          id: def.id,
          name: def.name.en,
          description: def.description.en,
          icon: def.icon,
          category: def.category,
          unlockedAt: new Date(),
          seen: false,
        };
        user.badges.push(badge);
        newBadges.push(badge);
      }
    }

    return newBadges;
  }

  /**
   * Calculate level from XP.
   */
  private calculateLevel(xp: number): number {
    let level = 1;
    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
      if (xp >= LEVEL_THRESHOLDS[i]) {
        level = i + 1;
      } else {
        break;
      }
    }
    return level;
  }

  /**
   * Get full gamification profile for a user.
   */
  async getGamificationProfile(tgId: string): Promise<GamificationProfile | null> {
    const user = await User.findOne({ tgId });
    if (!user) return null;

    const xp = user.xp || 0;
    const level = user.level || 1;
    const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
    const nextThreshold = LEVEL_THRESHOLDS[level] || currentThreshold + 1000;
    const badges = user.badges || [];

    return {
      xp,
      level,
      xpToNextLevel: nextThreshold - xp,
      xpForCurrentLevel: nextThreshold - currentThreshold,
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      badges,
      unseenBadges: badges.filter(b => !b.seen),
    };
  }

  /**
   * Mark badges as seen.
   */
  async markBadgesSeen(tgId: string, badgeIds: string[]): Promise<void> {
    await User.updateOne(
      { tgId },
      { $set: { "badges.$[elem].seen": true } },
      { arrayFilters: [{ "elem.id": { $in: badgeIds } }] },
    );
  }
}

export default new GamificationService();
