import mongoose, { Document, Schema } from "mongoose";

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export type MoodTrigger =
  | "stress"
  | "tired"
  | "happy"
  | "energetic"
  | "hungry"
  | "anxious"
  | "relaxed"
  | "sick"
  | "exercise"
  | "sleep_well"
  | "sleep_bad";

export interface IMoodEntry {
  tgId: string;
  mood: MoodLevel;
  triggers: MoodTrigger[];
  note: string;
  date: string; // "YYYY-MM-DD"
}

export interface IMoodEntryDocument extends IMoodEntry, Document {
  createdAt: Date;
  updatedAt: Date;
}

const moodEntrySchema = new Schema<IMoodEntryDocument>(
  {
    tgId: { type: String, required: true, index: true },
    mood: { type: Number, required: true, min: 1, max: 5 },
    triggers: [{ type: String }],
    note: { type: String, default: "" },
    date: { type: String, required: true },
  },
  { timestamps: true },
);

// One mood entry per user per day
moodEntrySchema.index({ tgId: 1, date: 1 }, { unique: true });

const MoodEntry = mongoose.model<IMoodEntryDocument>(
  "MoodEntry",
  moodEntrySchema,
);

export default MoodEntry;
