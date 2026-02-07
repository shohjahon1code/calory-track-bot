import mongoose, { Document, Schema } from "mongoose";

export interface IRecipeDocument extends Document {
  userId?: string;
  tgId?: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  prepTime: number;
  ingredients: string[];
  instructions: string[];
  isUzbek: boolean;
  tags: string[];
  source: "ai" | "curated";
}

const recipeSchema = new Schema<IRecipeDocument>(
  {
    userId: { type: String },
    tgId: { type: String },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fats: { type: Number, required: true },
    prepTime: { type: Number, default: 15 },
    ingredients: [{ type: String }],
    instructions: [{ type: String }],
    isUzbek: { type: Boolean, default: false },
    tags: [{ type: String }],
    source: { type: String, enum: ["ai", "curated"], default: "ai" },
  },
  { timestamps: true },
);

recipeSchema.index({ calories: 1, protein: 1 });
recipeSchema.index({ tags: 1 });

const Recipe = mongoose.model<IRecipeDocument>("Recipe", recipeSchema);

export default Recipe;
