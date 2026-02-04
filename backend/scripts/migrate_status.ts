import mongoose from "mongoose";
import dotenv from "dotenv";
import Meal from "../src/models/Meal";

dotenv.config();

const {
  MONGODB_USER,
  MONGODB_PASSWORD,
  MONGODB_HOST,
  MONGODB_PORT,
  MONGODB_DATABASE, // This might be 'calorie_tracker' based on .env
  MONGODB_URI, // Fallback if exists
} = process.env;

const dbName = MONGODB_DATABASE || "calorie_tracker";
const uri =
  MONGODB_URI ||
  `mongodb://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_HOST}:${MONGODB_PORT}/${dbName}?authSource=admin`;

async function migrate() {
  try {
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");

    // Update all meals that do not have a status or status is not 'pending'
    // Actually, we want to ensure all legacy meals are 'confirmed'.
    // New meals from now on will be 'pending'.

    // Safety check: only update meals created before today/now?
    // Or just update all meals that don't have a status?
    // Since we just deployed the code, all existing meals in DB should be confirmed.

    const result = await Meal.updateMany(
      { status: { $exists: false } },
      { $set: { status: "confirmed" } },
    );

    console.log(
      `✅ Migrated ${result.modifiedCount} meals to 'confirmed' status.`,
    );

    // Also check for meals that might have been created as "pending" during my testing?
    // User probably hasn't created new meals yet since they just reported the issue.
    // But let's look at what we have.
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected");
  }
}

migrate();
