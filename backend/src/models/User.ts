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
  },
  {
    timestamps: true,
  },
);

// Indexes for performance
userSchema.index({ tgId: 1 });

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
