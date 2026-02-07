import mongoose, { Document, Schema } from "mongoose";

export interface ISavedRecipeDocument extends Document {
  tgId: string;
  recipeId: mongoose.Types.ObjectId;
  savedAt: Date;
}

const savedRecipeSchema = new Schema<ISavedRecipeDocument>(
  {
    tgId: { type: String, required: true },
    recipeId: { type: Schema.Types.ObjectId, ref: "Recipe", required: true },
    savedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

savedRecipeSchema.index({ tgId: 1, recipeId: 1 }, { unique: true });

const SavedRecipe = mongoose.model<ISavedRecipeDocument>("SavedRecipe", savedRecipeSchema);

export default SavedRecipe;
