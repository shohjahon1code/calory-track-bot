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
