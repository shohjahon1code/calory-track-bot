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
  language?: "uz" | "en";
  workType?: "office" | "physical" | "student" | "homemaker" | "freelance";
  registrationDate: Date;
  photoScanCount: number;
  lastScanDate?: Date;
  lastProgressAnalysis?: AIProgressAnalysis;
  lastAnalysisDate?: Date;
  // Gamification
  currentStreak?: number;
  longestStreak?: number;
  lastLogDate?: Date;
  xp?: number;
  level?: number;
  badges?: Badge[];
  // Social
  referralCode?: string;
  privacySettings?: {
    showStreak: boolean;
    showCalories: boolean;
    showWeight: boolean;
  };
  // Reminders
  reminders?: ReminderSettings;
  timezone?: string;
  // Report Card
  lastReportCard?: DailyReportCard;
  lastReportCardDate?: Date;
  // Recipes
  recipeSuggestionsToday?: number;
  lastRecipeSuggestionDate?: Date;
  // Chat Coach
  chatMessageCount?: number;
  lastChatDate?: Date;
}

export interface AIProgressAnalysis {
  estimatedWeeks: number;
  estimatedDate: string;
  weeklyRateRecommendation: number;
  dailyCalorieTarget: number;
  deficitOrSurplus: number;
  milestones: {
    percentage: number;
    targetWeight: number;
    estimatedDate: string;
  }[];
  recommendations: string[];
  weeklyPlan: string;
  motivationalMessage: string;
  riskWarnings: string[];
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

// ── Gamification ──

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "streak" | "logging" | "nutrition" | "social" | "milestone";
  unlockedAt: Date;
  seen: boolean;
}

export interface GamificationResult {
  xpGained: number;
  newBadges: Badge[];
  streakUpdated: boolean;
  newStreak: number;
  levelUp: boolean;
  newLevel: number;
}

export interface GamificationProfile {
  xp: number;
  level: number;
  xpToNextLevel: number;
  xpForCurrentLevel: number;
  currentStreak: number;
  longestStreak: number;
  badges: Badge[];
  unseenBadges: Badge[];
}

// ── Daily Report Card ──

export interface DailyReportCard {
  date: string;
  grade: "A" | "B" | "C" | "D" | "F";
  gradeEmoji: string;
  calorieScore: {
    consumed: number;
    goal: number;
    status: "over" | "under" | "on_target";
    difference: number;
  };
  macroBalance: {
    protein: { consumed: number; status: "good" | "low" | "high" };
    carbs: { consumed: number; status: "good" | "low" | "high" };
    fats: { consumed: number; status: "good" | "low" | "high" };
  };
  highlights: string[];
  improvements: string[];
  tomorrowTip: string;
  streakAck: string;
  detailedAnalysis?: string;
}

// ── Reminders ──

export interface ReminderSettings {
  breakfast: { enabled: boolean; time: string };
  lunch: { enabled: boolean; time: string };
  dinner: { enabled: boolean; time: string };
  weighIn: { enabled: boolean; dayOfWeek: number; time: string };
  streakReminder: { enabled: boolean; time: string };
  dailyReport: { enabled: boolean; time: string };
}

// ── Social ──

export interface FriendInfo {
  tgId: string;
  firstName: string;
  username: string;
  currentStreak: number;
  level: number;
  weeklyCalories: number;
  weeklyGoalRate: number;
}

export interface LeaderboardEntry extends FriendInfo {
  rank: number;
  isCurrentUser: boolean;
}

export interface FriendRequest {
  fromTgId: string;
  fromFirstName: string;
  fromUsername: string;
  sentAt: Date;
}

// ── Meal Plan ──

export interface IMealPlanItem {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  prepTime: number;
  ingredients: string[];
  isUzbek: boolean;
}

export interface IMealPlanDay {
  dayOfWeek: number;
  breakfast: IMealPlanItem;
  lunch: IMealPlanItem;
  dinner: IMealPlanItem;
  snack: IMealPlanItem;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
}

// ── Recipe ──

export interface IRecipe {
  _id?: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  prepTime: number;
  ingredients: string[];
  instructions: string[];
  isUzbek: boolean;
  tags: string[];
  source: "ai" | "curated";
}
