import crypto from "crypto";
import Friendship from "../models/Friendship.js";
import User from "../models/User.js";
import Meal from "../models/Meal.js";
import { FriendInfo, LeaderboardEntry, FriendRequest } from "../types/index.js";

class SocialService {
  private leaderboardCache: Map<string, { data: LeaderboardEntry[]; expires: number }> = new Map();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate referral code for a user if not already present.
   */
  async ensureReferralCode(tgId: string): Promise<string> {
    const user = await User.findOne({ tgId });
    if (!user) throw new Error("User not found");

    if (user.referralCode) return user.referralCode;

    const code = crypto.createHash("sha256").update(tgId + Date.now()).digest("hex").slice(0, 8).toUpperCase();
    user.referralCode = code;
    await user.save();
    return code;
  }

  /**
   * Send friend request by referral code or username.
   */
  async sendFriendRequest(senderTgId: string, identifier: string): Promise<{ success: boolean; message: string }> {
    // Find target user by referral code or username
    const target = await User.findOne({
      $or: [
        { referralCode: identifier.toUpperCase() },
        { username: identifier.toLowerCase() },
      ],
    });

    if (!target) return { success: false, message: "User not found" };
    if (target.tgId === senderTgId) return { success: false, message: "Cannot add yourself" };

    // Check if friendship already exists in either direction
    const existing = await Friendship.findOne({
      $or: [
        { userTgId: senderTgId, friendTgId: target.tgId },
        { userTgId: target.tgId, friendTgId: senderTgId },
      ],
    });

    if (existing) {
      if (existing.status === "accepted") return { success: false, message: "Already friends" };
      if (existing.status === "pending") return { success: false, message: "Request already sent" };
    }

    await Friendship.create({
      userTgId: senderTgId,
      friendTgId: target.tgId,
      status: "pending",
    });

    return { success: true, message: "Request sent" };
  }

  /**
   * Accept a pending friend request.
   */
  async acceptFriendRequest(userTgId: string, friendTgId: string): Promise<boolean> {
    const request = await Friendship.findOne({
      userTgId: friendTgId,
      friendTgId: userTgId,
      status: "pending",
    });

    if (!request) return false;

    request.status = "accepted";
    await request.save();

    // Create reverse friendship
    await Friendship.findOneAndUpdate(
      { userTgId: userTgId, friendTgId: friendTgId },
      { status: "accepted" },
      { upsert: true },
    );

    // Check first_friend badge for both users
    const senderFriendCount = await Friendship.countDocuments({ userTgId: friendTgId, status: "accepted" });
    const receiverFriendCount = await Friendship.countDocuments({ userTgId: userTgId, status: "accepted" });

    if (senderFriendCount === 1) {
      await this.grantFirstFriendBadge(friendTgId);
    }
    if (receiverFriendCount === 1) {
      await this.grantFirstFriendBadge(userTgId);
    }

    return true;
  }

  private async grantFirstFriendBadge(tgId: string): Promise<void> {
    const user = await User.findOne({ tgId });
    if (!user) return;
    if (user.badges?.some(b => b.id === "first_friend")) return;

    const { BADGE_DEFINITIONS } = await import("../config/constants.js");
    const def = BADGE_DEFINITIONS.find(d => d.id === "first_friend");
    if (!def) return;

    user.badges = user.badges || [];
    user.badges.push({
      id: def.id,
      name: def.name.en,
      description: def.description.en,
      icon: def.icon,
      category: def.category,
      unlockedAt: new Date(),
      seen: false,
    });
    await user.save();
  }

  /**
   * Remove a friend (both directions).
   */
  async removeFriend(userTgId: string, friendTgId: string): Promise<void> {
    await Friendship.deleteMany({
      $or: [
        { userTgId, friendTgId },
        { userTgId: friendTgId, friendTgId: userTgId },
      ],
    });
  }

  /**
   * Get friends list with stats.
   */
  async getFriendsList(tgId: string): Promise<FriendInfo[]> {
    const friendships = await Friendship.find({ userTgId: tgId, status: "accepted" });
    const friendTgIds = friendships.map(f => f.friendTgId);

    if (friendTgIds.length === 0) return [];

    const friends = await User.find({ tgId: { $in: friendTgIds } });

    // Get this week's calories for friends
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyCalories = await Meal.aggregate([
      {
        $match: {
          tgId: { $in: friendTgIds },
          status: "confirmed",
          timestamp: { $gte: startOfWeek },
        },
      },
      {
        $group: {
          _id: "$tgId",
          totalCalories: { $sum: "$calories" },
        },
      },
    ]);

    const calorieMap = new Map(weeklyCalories.map(w => [w._id, w.totalCalories]));

    return friends.map(f => ({
      tgId: f.tgId,
      firstName: f.firstName,
      username: f.username,
      currentStreak: f.currentStreak || 0,
      level: f.level || 1,
      weeklyCalories: calorieMap.get(f.tgId) || 0,
      weeklyGoalRate: f.dailyGoal ? Math.round(((calorieMap.get(f.tgId) || 0) / (f.dailyGoal * 7)) * 100) : 0,
    }));
  }

  /**
   * Get weekly leaderboard with caching.
   */
  async getWeeklyLeaderboard(tgId: string): Promise<LeaderboardEntry[]> {
    const cacheKey = `lb_${tgId}`;
    const cached = this.leaderboardCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    const friends = await this.getFriendsList(tgId);

    // Add current user to the leaderboard
    const user = await User.findOne({ tgId });
    if (!user) return [];

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const userWeeklyAgg = await Meal.aggregate([
      {
        $match: {
          tgId,
          status: "confirmed",
          timestamp: { $gte: startOfWeek },
        },
      },
      { $group: { _id: null, totalCalories: { $sum: "$calories" } } },
    ]);

    const userWeeklyCalories = userWeeklyAgg[0]?.totalCalories || 0;

    const allEntries: LeaderboardEntry[] = [
      {
        tgId: user.tgId,
        firstName: user.firstName,
        username: user.username,
        currentStreak: user.currentStreak || 0,
        level: user.level || 1,
        weeklyCalories: userWeeklyCalories,
        weeklyGoalRate: user.dailyGoal ? Math.round((userWeeklyCalories / (user.dailyGoal * 7)) * 100) : 0,
        rank: 0,
        isCurrentUser: true,
      },
      ...friends.map(f => ({
        ...f,
        rank: 0,
        isCurrentUser: false,
      })),
    ];

    // Sort by weekly goal rate
    allEntries.sort((a, b) => b.weeklyGoalRate - a.weeklyGoalRate);
    allEntries.forEach((entry, i) => {
      entry.rank = i + 1;
    });

    this.leaderboardCache.set(cacheKey, { data: allEntries, expires: Date.now() + this.CACHE_TTL });

    return allEntries;
  }

  /**
   * Get pending friend requests for a user.
   */
  async getPendingRequests(tgId: string): Promise<FriendRequest[]> {
    const requests = await Friendship.find({ friendTgId: tgId, status: "pending" });
    if (requests.length === 0) return [];

    const senderTgIds = requests.map(r => r.userTgId);
    const senders = await User.find({ tgId: { $in: senderTgIds } });
    const senderMap = new Map(senders.map(s => [s.tgId, s]));

    return requests.map(r => {
      const sender = senderMap.get(r.userTgId);
      return {
        fromTgId: r.userTgId,
        fromFirstName: sender?.firstName || "User",
        fromUsername: sender?.username || "",
        sentAt: r.createdAt,
      };
    });
  }

  /**
   * Get referral code and link.
   */
  async getReferralInfo(tgId: string): Promise<{ referralCode: string; link: string }> {
    const code = await this.ensureReferralCode(tgId);
    const botUsername = process.env.BOT_USERNAME || "oshpaz_ai_bot";
    return {
      referralCode: code,
      link: `https://t.me/${botUsername}?start=ref_${code}`,
    };
  }
}

export default new SocialService();
