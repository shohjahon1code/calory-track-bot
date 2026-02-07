import express, { Request, Response } from "express";
import mealPlanService from "../services/mealplan.service.js";

const router = express.Router();

/**
 * GET /api/meal-plan/:tgId
 * Get active meal plan
 */
router.get("/:tgId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { tgId } = req.params;
    const plan = await mealPlanService.getActivePlan(tgId);

    if (!plan) {
      res.json(null);
      return;
    }

    res.json(plan);
  } catch (error) {
    console.error("Error getting meal plan:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/meal-plan/:tgId/generate
 * Generate a new weekly meal plan
 */
router.post(
  "/:tgId/generate",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tgId } = req.params;
      const plan = await mealPlanService.generateWeeklyPlan(tgId);

      if (!plan) {
        res.status(500).json({ error: "Failed to generate meal plan" });
        return;
      }

      res.json(plan);
    } catch (error) {
      console.error("Error generating meal plan:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * PUT /api/meal-plan/:tgId/regenerate
 * Regenerate a single meal in an existing plan
 */
router.put(
  "/:tgId/regenerate",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tgId } = req.params;
      const { planId, dayIndex, mealSlot } = req.body;

      if (!planId || dayIndex === undefined || !mealSlot) {
        res.status(400).json({ error: "planId, dayIndex, and mealSlot are required" });
        return;
      }

      const validSlots = ["breakfast", "lunch", "dinner", "snack"];
      if (!validSlots.includes(mealSlot)) {
        res.status(400).json({ error: "Invalid meal slot" });
        return;
      }

      const plan = await mealPlanService.regenerateMeal(tgId, planId, dayIndex, mealSlot);

      if (!plan) {
        res.status(404).json({ error: "Plan not found or regeneration failed" });
        return;
      }

      res.json(plan);
    } catch (error) {
      console.error("Error regenerating meal:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
