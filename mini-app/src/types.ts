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
