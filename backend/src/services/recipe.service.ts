import OpenAI from "openai";
import Recipe, { IRecipeDocument } from "../models/Recipe.js";
import SavedRecipe from "../models/SavedRecipe.js";
import User from "../models/User.js";

class RecipeService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  /**
   * Get recipe suggestions based on remaining macros.
   * Checks cache first, generates via AI if needed.
   */
  async getSuggestions(
    tgId: string,
    remainingCalories: number,
    remainingProtein: number,
    remainingCarbs: number,
    remainingFats: number,
  ): Promise<IRecipeDocument[]> {
    // Check rate limit for free users
    const user = await User.findOne({ tgId });
    if (!user) return [];

    // Try cache first — recipes within 15% of target macros
    const tolerance = 0.15;
    const cached = await Recipe.find({
      calories: {
        $gte: remainingCalories * (1 - tolerance),
        $lte: remainingCalories * (1 + tolerance),
      },
      protein: {
        $gte: remainingProtein * (1 - tolerance),
        $lte: remainingProtein * (1 + tolerance),
      },
    }).limit(3);

    if (cached.length >= 2) return cached;

    // Generate via AI
    const language = user.language || "uz";
    const recipes = await this.generateRecipes(
      remainingCalories,
      remainingProtein,
      remainingCarbs,
      remainingFats,
      language,
    );

    // Save to cache
    const saved: IRecipeDocument[] = [];
    for (const recipe of recipes) {
      const doc = new Recipe({
        ...recipe,
        tgId,
        source: "ai",
      });
      await doc.save();
      saved.push(doc);
    }

    // Update daily suggestion count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!user.lastRecipeSuggestionDate || user.lastRecipeSuggestionDate < today) {
      user.recipeSuggestionsToday = 1;
      user.lastRecipeSuggestionDate = new Date();
    } else {
      user.recipeSuggestionsToday = (user.recipeSuggestionsToday || 0) + 1;
    }
    await user.save();

    return saved;
  }

  /**
   * Get quick suggestions from cache for dashboard.
   */
  async getQuickSuggestions(_tgId: string): Promise<IRecipeDocument[]> {
    return Recipe.find({}).sort({ createdAt: -1 }).limit(3);
  }

  /**
   * Save a recipe for the user.
   */
  async saveRecipe(tgId: string, recipeId: string): Promise<boolean> {
    try {
      await SavedRecipe.create({ tgId, recipeId });
      return true;
    } catch {
      return false; // Already saved
    }
  }

  /**
   * Unsave a recipe.
   */
  async unsaveRecipe(tgId: string, recipeId: string): Promise<void> {
    await SavedRecipe.deleteOne({ tgId, recipeId });
  }

  /**
   * Get user's saved recipes.
   */
  async getSavedRecipes(tgId: string): Promise<IRecipeDocument[]> {
    const savedRefs = await SavedRecipe.find({ tgId }).sort({ savedAt: -1 });
    const recipeIds = savedRefs.map(s => s.recipeId);

    if (recipeIds.length === 0) return [];
    return Recipe.find({ _id: { $in: recipeIds } });
  }

  private async generateRecipes(
    calories: number,
    protein: number,
    carbs: number,
    fats: number,
    language: string,
  ): Promise<Partial<IRecipeDocument>[]> {
    const lang = language === "uz" ? "Uzbek" : "English";

    const prompt = `Generate 3 meal/recipe suggestions that fit these remaining macros:
- Calories: ~${calories} kcal
- Protein: ~${protein}g
- Carbs: ~${carbs}g
- Fats: ~${fats}g

Requirements:
1. Include at least 1 Uzbek dish
2. Prep time under 30 minutes
3. Use accessible ingredients
4. Names and descriptions in ${lang}

Return ONLY valid JSON array:
[
  {
    "name": "string",
    "description": "short description",
    "calories": number,
    "protein": number,
    "carbs": number,
    "fats": number,
    "prepTime": number (minutes),
    "ingredients": ["item1", "item2", ...],
    "instructions": ["step 1", "step 2", ...],
    "isUzbek": boolean,
    "tags": ["quick", "protein", ...]
  }
]`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a professional nutritionist. Return ONLY valid JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return [];

      const cleaned = content.replace(/```json\n?|```\n?/g, "").trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Error generating recipes:", error);
      return [];
    }
  }
}

export default new RecipeService();
