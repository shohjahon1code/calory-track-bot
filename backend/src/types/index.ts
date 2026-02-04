// Type definitions for the application

export interface IUser {
  tgId: string;
  firstName: string;
  lastName: string;
  username: string;
  dailyGoal: number;
  // Profile fields
  gender?: "male" | "female";
  age?: number;
  height?: number; // cm
  weight?: number; // kg
  weightHistory?: { weight: number; date: Date }[];
  units?: "metric" | "imperial";
  activityLevel?: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goal?: "lose_weight" | "maintain" | "gain_muscle";
  targetWeight?: number; // kg
  registrationDate: Date;
  photoScanCount: number;
  lastScanDate?: Date;
}

export interface IWallet {
  userId: string;
  tgId: string;
  balance: number;
  currency: string;
}

export interface ISubscription {
  userId: string;
  tgId: string;
  planId: string;
  planType: "free" | "monthly" | "yearly";
  status: "active" | "expired" | "canceled";
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
}

export interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  weight?: number; // Estimated weight in grams
}

export interface IMeal {
  userId: string;
  tgId: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  items: FoodItem[]; // Detailed items (e.g., [Burger, Fries])
  confidence?: number; // AI Confidence Score
  status: "pending" | "confirmed"; // Verification status
  imageUrl?: string;
  timestamp: Date;
}

export interface NutritionData {
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  confidence?: number;
}

export interface DailyStats {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  mealsCount: number;
  dailyGoal: number;
  remainingCalories: number;
  progressPercentage: number;
}

export interface OpenAIAnalysisResult {
  success: boolean;
  data?: NutritionData;
  error?: string;
}

export interface TelegramUserInfo {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}
