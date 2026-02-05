import axios, { AxiosInstance } from "axios";
import { User, Meal, DailyStats, AIProgressAnalysis } from "../types";

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
}

export default new ApiService();
