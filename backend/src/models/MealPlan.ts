import mongoose, { Document, Schema } from "mongoose";
import { IMealPlanDay } from "../types/index.js";

export interface IMealPlanDocument extends Document {
  userId: string;
  tgId: string;
  weekStartDate: Date;
  days: IMealPlanDay[];
  dailyCalorieTarget: number;
  dailyProteinTarget: number;
  dailyCarbsTarget: number;
  dailyFatsTarget: number;
  userGoal: string;
  status: "active" | "archived";
  generatedAt: Date;
}

const mealPlanItemSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fats: { type: Number, required: true },
    prepTime: { type: Number, default: 15 },
    ingredients: [{ type: String }],
    isUzbek: { type: Boolean, default: false },
  },
  { _id: false },
);

const mealPlanDaySchema = new Schema(
  {
    dayOfWeek: { type: Number, required: true },
    breakfast: { type: mealPlanItemSchema, required: true },
    lunch: { type: mealPlanItemSchema, required: true },
    dinner: { type: mealPlanItemSchema, required: true },
    snack: { type: mealPlanItemSchema, required: true },
    totalCalories: { type: Number, default: 0 },
    totalProtein: { type: Number, default: 0 },
    totalCarbs: { type: Number, default: 0 },
    totalFats: { type: Number, default: 0 },
  },
  { _id: false },
);

const mealPlanSchema = new Schema<IMealPlanDocument>(
  {
    userId: { type: String },
    tgId: { type: String, required: true },
    weekStartDate: { type: Date, required: true },
    days: [mealPlanDaySchema],
    dailyCalorieTarget: { type: Number, required: true },
    dailyProteinTarget: { type: Number, default: 0 },
    dailyCarbsTarget: { type: Number, default: 0 },
    dailyFatsTarget: { type: Number, default: 0 },
    userGoal: { type: String, default: "maintain" },
    status: { type: String, enum: ["active", "archived"], default: "active" },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

mealPlanSchema.index({ tgId: 1, status: 1 });
mealPlanSchema.index({ tgId: 1, weekStartDate: -1 });

const MealPlan = mongoose.model<IMealPlanDocument>("MealPlan", mealPlanSchema);

export default MealPlan;
