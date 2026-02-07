export const DEFAULT_CALORIE_GOAL = 2000;

export const CALORIE_GOAL_LIMITS = {
  MIN: 1000,
  MAX: 5000,
} as const;

export const OPENAI_CONFIG = {
  MODEL: "gpt-4o" as const,
  MAX_TOKENS: 500,
  TEMPERATURE: 0.3, // Lower temperature for more consistent results
} as const;

export const ERROR_MESSAGES = {
  NOT_FOOD:
    "🤔 I couldn't identify any food in this image. Please send a photo of a meal or dish.",
  BLURRY_IMAGE: "📸 The image is too blurry. Please send a clearer photo.",
  ANALYSIS_FAILED:
    "⚠️ Something went wrong while analyzing the image. Please try again.",
  INVALID_GOAL: `❌ Please enter a calorie goal between ${CALORIE_GOAL_LIMITS.MIN} and ${CALORIE_GOAL_LIMITS.MAX}.`,
  DATABASE_ERROR: "💾 Database error occurred. Please try again later.",
  OPENAI_ERROR: "🤖 AI service is temporarily unavailable. Please try again.",
} as const;

export const SUCCESS_MESSAGES = {
  MEAL_SAVED: "✅ Meal saved successfully!",
  GOAL_UPDATED: "🎯 Daily calorie goal updated!",
  WELCOME: "👋 Welcome to Calorie Tracker Bot!",
} as const;

// ── Gamification Constants ──

export const XP_REWARDS = {
  MEAL_LOGGED: 10,
  CALORIE_GOAL_HIT: 25,
  WEIGHT_LOGGED: 15,
  STREAK_BONUS_PER_DAY: 5,
  FIRST_MEAL_OF_DAY: 5,
} as const;

export const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000,
  17000, 23000, 30000, 40000, 55000,
] as const;

export interface BadgeDefinition {
  id: string;
  name: { en: string; uz: string };
  description: { en: string; uz: string };
  icon: string;
  category: "streak" | "logging" | "nutrition" | "social" | "milestone";
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { id: "first_meal", name: { en: "First Bite", uz: "Birinchi Luqma" }, description: { en: "Log your first meal", uz: "Birinchi ovqatingizni kiriting" }, icon: "utensils", category: "logging" },
  { id: "streak_3", name: { en: "On Fire", uz: "Yonmoqda" }, description: { en: "3-day logging streak", uz: "3 kunlik streak" }, icon: "flame", category: "streak" },
  { id: "streak_7", name: { en: "Week Warrior", uz: "Hafta Jangchisi" }, description: { en: "7-day logging streak", uz: "7 kunlik streak" }, icon: "trophy", category: "streak" },
  { id: "streak_30", name: { en: "Monthly Master", uz: "Oylik Usta" }, description: { en: "30-day logging streak", uz: "30 kunlik streak" }, icon: "crown", category: "streak" },
  { id: "streak_100", name: { en: "Centurion", uz: "Yuzkunlik" }, description: { en: "100-day streak!", uz: "100 kunlik streak!" }, icon: "star", category: "streak" },
  { id: "meals_10", name: { en: "Getting Started", uz: "Boshlandi" }, description: { en: "Log 10 meals", uz: "10 ta ovqat kiriting" }, icon: "zap", category: "logging" },
  { id: "meals_50", name: { en: "Dedicated Logger", uz: "Fidoyi Yozuvchi" }, description: { en: "Log 50 meals", uz: "50 ta ovqat kiriting" }, icon: "book", category: "logging" },
  { id: "meals_200", name: { en: "Logging Legend", uz: "Yozuv Afsonasi" }, description: { en: "Log 200 meals", uz: "200 ta ovqat kiriting" }, icon: "medal", category: "logging" },
  { id: "first_friend", name: { en: "Social Butterfly", uz: "Do'stona" }, description: { en: "Add your first friend", uz: "Birinchi do'stingizni qo'shing" }, icon: "users", category: "social" },
  { id: "weight_goal", name: { en: "Goal Crusher", uz: "Maqsad Yenguvchi" }, description: { en: "Reach your target weight", uz: "Maqsad vazningizga erishing" }, icon: "target", category: "milestone" },
  { id: "level_5", name: { en: "Rising Star", uz: "Ko'tarilayotgan Yulduz" }, description: { en: "Reach Level 5", uz: "5-darajaga erishing" }, icon: "star", category: "milestone" },
  { id: "level_10", name: { en: "Elite", uz: "Elita" }, description: { en: "Reach Level 10", uz: "10-darajaga erishing" }, icon: "diamond", category: "milestone" },
];
