import express, { Request, Response } from "express";
import recipeService from "../services/recipe.service.js";

const router = express.Router();

/**
 * GET /api/recipes/:tgId/suggestions
 */
router.get("/:tgId/suggestions", async (req: Request, res: Response): Promise<void> => {
  try {
    const { tgId } = req.params;
    const { remainingCalories, remainingProtein, remainingCarbs, remainingFats } = req.query;

    const recipes = await recipeService.getSuggestions(
      tgId,
      Number(remainingCalories) || 500,
      Number(remainingProtein) || 30,
      Number(remainingCarbs) || 50,
      Number(remainingFats) || 20,
    );

    res.json(recipes);
  } catch (error) {
    console.error("Error getting suggestions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/recipes/:tgId/quick
 */
router.get("/:tgId/quick", async (req: Request, res: Response): Promise<void> => {
  try {
    const { tgId } = req.params;
    const recipes = await recipeService.getQuickSuggestions(tgId);
    res.json(recipes);
  } catch (error) {
    console.error("Error getting quick recipes:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/recipes/:tgId/saved
 */
router.get("/:tgId/saved", async (req: Request, res: Response): Promise<void> => {
  try {
    const { tgId } = req.params;
    const recipes = await recipeService.getSavedRecipes(tgId);
    res.json(recipes);
  } catch (error) {
    console.error("Error getting saved recipes:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/recipes/:tgId/save
 */
router.post("/:tgId/save", async (req: Request, res: Response): Promise<void> => {
  try {
    const { tgId } = req.params;
    const { recipeId } = req.body;

    if (!recipeId) {
      res.status(400).json({ error: "recipeId is required" });
      return;
    }

    const success = await recipeService.saveRecipe(tgId, recipeId);
    res.json({ success });
  } catch (error) {
    console.error("Error saving recipe:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /api/recipes/:tgId/save/:recipeId
 */
router.delete("/:tgId/save/:recipeId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { tgId, recipeId } = req.params;
    await recipeService.unsaveRecipe(tgId, recipeId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error unsaving recipe:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
