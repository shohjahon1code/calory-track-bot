export interface User {
  tgId: string;
  firstName: string;
  lastName: string;
  username: string;
  dailyGoal: number;
  registrationDate: string;
  // Profile fields
  gender?: "male" | "female";
  age?: number;
  height?: number; // cm
  weight?: number; // kg
  activityLevel?: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goal?: "lose_weight" | "maintain" | "gain_muscle";
  targetWeight?: number; // kg
  weightHistory?: { weight: number; date: string }[];
  units?: "metric" | "imperial";
  language?: "uz" | "en";
  workType?: "office" | "physical" | "student" | "homemaker" | "freelance";
}

export interface Meal {
  _id: string;
  userId: string;
  tgId: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  imageUrl?: string;
  timestamp: string;
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

// ── Gamification ──

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "streak" | "logging" | "nutrition" | "social" | "milestone";
  unlockedAt: string;
  seen: boolean;
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
  isPremium?: boolean;
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

// ── Chat Coach ──

export interface ChatMessage {
  _id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

// ── Progress Photos ──

export interface ProgressPhoto {
  _id: string;
  imageUrl: string;
  weight?: number;
  note?: string;
  takenAt: string;
}
