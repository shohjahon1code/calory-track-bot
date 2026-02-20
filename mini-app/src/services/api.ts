import axios, { AxiosInstance } from "axios";
import { User, Meal, DailyStats, AIProgressAnalysis, GamificationProfile, ReminderSettings, DailyReportCard, ChatMessage, ProgressPhoto, MoodEntry, MoodLevel, MoodTrigger, MoodWeeklyAnalysis } from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
    });
  }

  // User endpoints
  async getUser(tgId: string): Promise<User> {
    const response = await this.client.get<User>(`/user/${tgId}`);
    return response.data;
  }

  async updateGoal(tgId: string, goal: number): Promise<User> {
    const response = await this.client.put<User>(`/user/${tgId}/goal`, {
      goal,
    });
    return response.data;
  }

  async getTodayStats(tgId: string): Promise<DailyStats> {
    const response = await this.client.get<DailyStats>(
      `/user/${tgId}/stats/today`,
    );
    return response.data;
  }

  // Meal endpoints
  async getTodayMeals(tgId: string): Promise<Meal[]> {
    const response = await this.client.get<Meal[]>(`/meals/${tgId}/today`);
    return response.data;
  }

  async getLast7DaysStats(tgId: string): Promise<DailyStats[]> {
    const response = await this.client.get<DailyStats[]>(
      `/meals/${tgId}/stats/7days`,
    );
    return response.data;
  }

  async getMealsByDate(tgId: string, date: string): Promise<Meal[]> {
    const response = await this.client.get<Meal[]>(
      `/meals/${tgId}/history?date=${date}`,
    );
    return response.data;
  }

  async deleteMeal(mealId: string, tgId: string): Promise<void> {
    await this.client.delete(`/meals/${mealId}?tgId=${tgId}`);
  }
  async updateProfile(tgId: string, profileData: Partial<User>): Promise<User> {
    const response = await this.client.put<User>(
      `/user/${tgId}/profile`,
      profileData,
    );
    return response.data;
  }
  async getMealById(mealId: string): Promise<Meal> {
    const response = await this.client.get<Meal>(`/meals/${mealId}`);
    return response.data;
  }

  async updateMeal(mealId: string, data: Partial<Meal>): Promise<Meal> {
    const response = await this.client.put<Meal>(`/meals/${mealId}`, data);
    return response.data;
  }
  async getWeightHistory(
    tgId: string,
  ): Promise<{ weight: number; date: string }[]> {
    const response = await this.client.get<{ weight: number; date: string }[]>(
      `/user/${tgId}/weight-history`,
    );
    return response.data;
  }

  async getRecentMeals(tgId: string): Promise<Meal[]> {
    const response = await this.client.get<Meal[]>(`/meals/${tgId}/recent`);
    return response.data;
  }

  async getAnalytics(tgId: string): Promise<{
    calorieDistribution: { name: string; value: number }[];
    insight: string;
  }> {
    const response = await this.client.get<{
      calorieDistribution: { name: string; value: number }[];
      insight: string;
    }>(`/meals/${tgId}/analytics`);
    return response.data;
  }
  async createInvoice(
    tgId: string,
    planId: string,
    provider: "payme" | "click",
    amount?: number,
  ): Promise<{
    success: boolean;
    paymentUrl: string;
    orderId: string;
  }> {
    const response = await this.client.post("/payments/create-invoice", {
      tgId,
      planId,
      provider,
      amount,
    });
    return response.data;
  }

  async getSubscription(tgId: string): Promise<{
    isPremium: boolean;
    planType: string;
    premiumUntil?: string;
    balance: number;
    transactions: any[];
  }> {
    const response = await this.client.get<{
      isPremium: boolean;
      planType: string;
      premiumUntil?: string;
      balance: number;
      transactions: any[];
    }>(`/subscription/${tgId}`);
    return response.data;
  }

  async getInitialAnalysis(
    profileData: Partial<User>,
    language: string,
  ): Promise<AIProgressAnalysis> {
    const response = await this.client.post<AIProgressAnalysis>(
      "/user/initial-analysis",
      { profileData, language },
    );
    return response.data;
  }

  async getProgressAnalysis(
    tgId: string,
    language: string,
    refresh = false,
  ): Promise<AIProgressAnalysis> {
    const response = await this.client.post<AIProgressAnalysis>(
      `/user/${tgId}/progress-analysis`,
      { language, refresh },
    );
    return response.data;
  }

  async purchasePlan(
    tgId: string,
    planId: string,
  ): Promise<{
    success: boolean;
    message: string;
    user: User;
  }> {
    const response = await this.client.post("/subscription/purchase", {
      tgId,
      planId,
    });
    return response.data;
  }
  // ── Gamification ──

  async getGamification(tgId: string): Promise<GamificationProfile> {
    const response = await this.client.get<GamificationProfile>(`/user/${tgId}/gamification`);
    return response.data;
  }

  async markBadgesSeen(tgId: string, badgeIds: string[]): Promise<void> {
    await this.client.post(`/user/${tgId}/badges/seen`, { badgeIds });
  }

  // ── Reminders ──

  async getReminders(tgId: string): Promise<ReminderSettings> {
    const response = await this.client.get<ReminderSettings>(`/user/${tgId}/reminders`);
    return response.data;
  }

  async updateReminders(tgId: string, reminders: Partial<ReminderSettings>): Promise<void> {
    await this.client.put(`/user/${tgId}/reminders`, reminders);
  }

  // ── Social ──

  async getFriends(tgId: string): Promise<any[]> {
    const response = await this.client.get(`/social/${tgId}/friends`);
    return response.data;
  }

  async getLeaderboard(tgId: string): Promise<any[]> {
    const response = await this.client.get(`/social/${tgId}/leaderboard`);
    return response.data;
  }

  async getPendingRequests(tgId: string): Promise<any[]> {
    const response = await this.client.get(`/social/${tgId}/requests`);
    return response.data;
  }

  async sendFriendRequest(tgId: string, identifier: string): Promise<any> {
    const response = await this.client.post(`/social/${tgId}/request`, { identifier });
    return response.data;
  }

  async acceptFriendRequest(tgId: string, friendTgId: string): Promise<any> {
    const response = await this.client.post(`/social/${tgId}/accept`, { friendTgId });
    return response.data;
  }

  async removeFriend(tgId: string, friendTgId: string): Promise<void> {
    await this.client.delete(`/social/${tgId}/friend/${friendTgId}`);
  }

  async getReferralCode(tgId: string): Promise<{ referralCode: string; link: string }> {
    const response = await this.client.get(`/social/${tgId}/referral`);
    return response.data;
  }

  // ── Meal Plan ──

  async getActiveMealPlan(tgId: string): Promise<any> {
    const response = await this.client.get(`/meal-plan/${tgId}`);
    return response.data;
  }

  async generateMealPlan(tgId: string): Promise<any> {
    const response = await this.client.post(`/meal-plan/${tgId}/generate`);
    return response.data;
  }

  async regenerateMeal(tgId: string, planId: string, dayIndex: number, mealSlot: string): Promise<any> {
    const response = await this.client.put(`/meal-plan/${tgId}/regenerate`, { planId, dayIndex, mealSlot });
    return response.data;
  }

  // ── Recipes ──

  async getRecipeSuggestions(tgId: string, remaining: { calories: number; protein: number; carbs: number; fats: number }): Promise<any> {
    const params = new URLSearchParams({
      remainingCalories: remaining.calories.toString(),
      remainingProtein: remaining.protein.toString(),
      remainingCarbs: remaining.carbs.toString(),
      remainingFats: remaining.fats.toString(),
    });
    const response = await this.client.get(`/recipes/${tgId}/suggestions?${params}`);
    return response.data;
  }

  async getQuickRecipes(tgId: string): Promise<any[]> {
    const response = await this.client.get(`/recipes/${tgId}/quick`);
    return response.data;
  }

  async getSavedRecipes(tgId: string): Promise<any[]> {
    const response = await this.client.get(`/recipes/${tgId}/saved`);
    return response.data;
  }

  async saveRecipe(tgId: string, recipeId: string): Promise<void> {
    await this.client.post(`/recipes/${tgId}/save`, { recipeId });
  }

  async unsaveRecipe(tgId: string, recipeId: string): Promise<void> {
    await this.client.delete(`/recipes/${tgId}/save/${recipeId}`);
  }

  // ── Prompt Log ──

  async promptLog(tgId: string): Promise<void> {
    await this.client.post(`/user/${tgId}/prompt-log`);
  }

  // Report Card
  async getReportCard(tgId: string): Promise<DailyReportCard | null> {
    try {
      const response = await this.client.get<DailyReportCard>(`/user/${tgId}/report-card`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  }

  async refreshReportCard(tgId: string): Promise<DailyReportCard> {
    const response = await this.client.post<DailyReportCard>(`/user/${tgId}/report-card/refresh`);
    return response.data;
  }

  // ── Chat Coach ──

  async sendChatMessage(tgId: string, message: string, language: string): Promise<{ success: boolean; response?: string; remainingMessages?: number }> {
    const res = await this.client.post(`/chat/${tgId}/send`, { message, language });
    return res.data;
  }

  async getChatHistory(tgId: string): Promise<ChatMessage[]> {
    const response = await this.client.get<ChatMessage[]>(`/chat/${tgId}/history`);
    return response.data;
  }

  // ── Progress Photos ──

  async getProgressPhotos(tgId: string): Promise<ProgressPhoto[]> {
    const response = await this.client.get<ProgressPhoto[]>(`/progress-photos/${tgId}`);
    return response.data;
  }

  async getPhotoComparison(tgId: string): Promise<{ before: ProgressPhoto; after: ProgressPhoto } | null> {
    try {
      const response = await this.client.get<{ before: ProgressPhoto; after: ProgressPhoto }>(`/progress-photos/${tgId}/comparison`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  }

  async deleteProgressPhoto(photoId: string, tgId: string): Promise<void> {
    await this.client.delete(`/progress-photos/${photoId}?tgId=${tgId}`);
  }

  // ── Mood Journal ──

  async logMood(tgId: string, mood: MoodLevel, triggers: MoodTrigger[], note: string): Promise<{ success: boolean; data?: MoodEntry }> {
    const response = await this.client.post(`/mood/${tgId}`, { mood, triggers, note });
    return response.data;
  }

  async getTodayMood(tgId: string): Promise<MoodEntry | null> {
    const response = await this.client.get<MoodEntry | null>(`/mood/${tgId}/today`);
    return response.data;
  }

  async getRecentMoods(tgId: string, days: number = 7): Promise<MoodEntry[]> {
    const response = await this.client.get<MoodEntry[]>(`/mood/${tgId}/recent?days=${days}`);
    return response.data;
  }

  async getMoodAnalysis(tgId: string, language: string): Promise<{ success: boolean; data?: MoodWeeklyAnalysis; isPremium: boolean; error?: string }> {
    const response = await this.client.get(`/mood/${tgId}/analysis?language=${language}`);
    return response.data;
  }
}

export default new ApiService();
