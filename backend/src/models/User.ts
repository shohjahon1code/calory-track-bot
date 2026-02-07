import mongoose, { Document, Schema } from "mongoose";
import { IUser } from "../types/index.js";
import {
  DEFAULT_CALORIE_GOAL,
  CALORIE_GOAL_LIMITS,
} from "../config/constants.js";

export interface IUserDocument extends IUser, Document {
  updateGoal(newGoal: number): Promise<IUserDocument>;
}

const userSchema = new Schema<IUserDocument>(
  {
    tgId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    firstName: {
      type: String,
      default: "",
    },
    lastName: {
      type: String,
      default: "",
    },
    username: {
      type: String,
      default: "",
    },
    dailyGoal: {
      type: Number,
      default: DEFAULT_CALORIE_GOAL,
      min: CALORIE_GOAL_LIMITS.MIN,
      max: CALORIE_GOAL_LIMITS.MAX,
    },
    // Profile Fields
    gender: {
      type: String,
      enum: ["male", "female"],
    },
    age: {
      type: Number,
    },
    height: {
      type: Number,
    },
    weight: {
      type: Number,
    },
    weightHistory: [
      {
        weight: Number,
        date: { type: Date, default: Date.now },
      },
    ],
    units: {
      type: String,
      enum: ["metric", "imperial"],
      default: "metric",
    },
    activityLevel: {
      type: String,
      enum: ["sedentary", "light", "moderate", "active", "very_active"],
    },
    goal: {
      type: String,
      enum: ["lose_weight", "maintain", "gain_muscle"],
    },
    targetWeight: {
      type: Number,
    },
    language: {
      type: String,
      enum: ["uz", "en"],
      default: "uz",
    },
    workType: {
      type: String,
      enum: ["office", "physical", "student", "homemaker", "freelance"],
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    // Daily Limits
    photoScanCount: {
      type: Number,
      default: 0,
    },
    lastScanDate: {
      type: Date,
    },
    lastProgressAnalysis: {
      type: Schema.Types.Mixed,
    },
    lastAnalysisDate: {
      type: Date,
    },
    // ── Gamification ──
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastLogDate: { type: Date },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    badges: [{
      id: { type: String, required: true },
      name: { type: String, required: true },
      description: { type: String, default: "" },
      icon: { type: String, default: "" },
      category: { type: String, enum: ["streak", "logging", "nutrition", "social", "milestone"] },
      unlockedAt: { type: Date, default: Date.now },
      seen: { type: Boolean, default: false },
    }],
    // ── Social ──
    referralCode: { type: String, unique: true, sparse: true },
    privacySettings: {
      showStreak: { type: Boolean, default: true },
      showCalories: { type: Boolean, default: true },
      showWeight: { type: Boolean, default: false },
    },
    // ── Reminders ──
    reminders: {
      breakfast: { enabled: { type: Boolean, default: false }, time: { type: String, default: "08:00" } },
      lunch: { enabled: { type: Boolean, default: false }, time: { type: String, default: "13:00" } },
      dinner: { enabled: { type: Boolean, default: false }, time: { type: String, default: "19:00" } },
      weighIn: { enabled: { type: Boolean, default: false }, dayOfWeek: { type: Number, default: 1 }, time: { type: String, default: "09:00" } },
      streakReminder: { enabled: { type: Boolean, default: true }, time: { type: String, default: "20:00" } },
      dailyReport: { enabled: { type: Boolean, default: true }, time: { type: String, default: "21:00" } },
    },
    timezone: { type: String, default: "Asia/Tashkent" },
    // ── Report Card ──
    lastReportCard: { type: Schema.Types.Mixed },
    lastReportCardDate: { type: Date },
    // ── Recipes ──
    recipeSuggestionsToday: { type: Number, default: 0 },
    lastRecipeSuggestionDate: { type: Date },
    // ── Chat Coach ──
    chatMessageCount: { type: Number, default: 0 },
    lastChatDate: { type: Date },
  },
  {
    timestamps: true,
  },
);

// Indexes for performance
userSchema.index({ tgId: 1 });
userSchema.index({ currentStreak: -1 });
userSchema.index({ xp: -1 });
userSchema.index({ referralCode: 1 });

// Methods
userSchema.methods.updateGoal = async function (
  this: IUserDocument,
  newGoal: number,
): Promise<IUserDocument> {
  this.dailyGoal = newGoal;
  return await this.save();
};

userSchema.methods.toJSON = function (this: IUserDocument) {
  const obj = this.toObject();
  delete (obj as any).__v;
  return obj;
};

const User = mongoose.model<IUserDocument>("User", userSchema);

export default User;
