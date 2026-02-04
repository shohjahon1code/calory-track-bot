import mongoose, { Document, Schema } from "mongoose";
import { IMeal } from "../types/index.js";

export interface IMealDocument extends IMeal, Document {}

const mealSchema = new Schema<IMealDocument>(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
      index: true,
    },
    tgId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    calories: {
      type: Number,
      required: true,
      min: 0,
    },
    protein: {
      type: Number,
      required: true,
      min: 0,
    },
    carbs: {
      type: Number,
      required: true,
      min: 0,
    },
    fats: {
      type: Number,
      required: true,
      min: 0,
    },
    items: [
      {
        name: String,
        calories: Number,
        protein: Number,
        carbs: Number,
        fats: Number,
        weight: Number,
      },
    ],
    confidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    // "pending" = waiting for user confirmation
    // "confirmed" = added to daily stats
    status: {
      type: String,
      enum: ["pending", "confirmed"],
      default: "pending",
      index: true,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound indexes for efficient queries
mealSchema.index({ tgId: 1, timestamp: -1 });
mealSchema.index({ userId: 1, timestamp: -1 });

mealSchema.methods.toJSON = function (this: IMealDocument) {
  const obj = this.toObject();
  delete (obj as any).__v;
  return obj;
};

const Meal = mongoose.model<IMealDocument>("Meal", mealSchema);

export default Meal;
