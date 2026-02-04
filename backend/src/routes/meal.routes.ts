import express, { Request, Response } from "express";
import mealService from "../services/meal.service.js";

const router = express.Router();

/**
 * GET /api/meals/:tgId/today
 * Get today's meals
 */
router.get("/:tgId/today", async (req: Request, res: Response) => {
  try {
    const { tgId } = req.params;
    const meals = await mealService.getTodayMeals(tgId);
    res.json(meals);
  } catch (error) {
    console.error("Error getting today meals:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/meals/:tgId/history
 * Get meals by date
 */
router.get(
  "/:tgId/history",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tgId } = req.params;
      const { date } = req.query;

      if (!date || typeof date !== "string") {
        res
          .status(400)
          .json({ error: "Date parameter is required (YYYY-MM-DD)" });
        return;
      }

      const queryDate = new Date(date);

      if (isNaN(queryDate.getTime())) {
        res.status(400).json({ error: "Invalid date format" });
        return;
      }

      const meals = await mealService.getMealsByDate(tgId, queryDate);
      res.json(meals);
    } catch (error) {
      console.error("Error getting meal history:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * DELETE /api/meals/:mealId
 * Delete a meal
 */
router.delete(
  "/:mealId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { mealId } = req.params;
      const { tgId } = req.query;

      if (!tgId || typeof tgId !== "string") {
        res.status(400).json({ error: "tgId query parameter is required" });
        return;
      }

      const deleted = await mealService.deleteMeal(mealId, tgId);

      if (!deleted) {
        res.status(404).json({ error: "Meal not found" });
        return;
      }

      res.json({ success: true, message: "Meal deleted" });
    } catch (error) {
      console.error("Error deleting meal:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * GET /api/meals/:mealId
 * Get single meal
 */
router.get("/:mealId", async (req: Request, res: Response) => {
  try {
    const { mealId } = req.params;
    // We assume access checks handling in service or here if needed
    // Ideally check userId but for now direct fetch
    const meal = await mealService.getMealById(mealId);
    if (!meal) {
      res.status(404).json({ error: "Meal not found" });
      return;
    }
    res.json(meal);
  } catch (error) {
    res.status(500).json({ error: "Internal error" });
  }
});

/**
 * PUT /api/meals/:mealId
 * Update a meal
 */
router.put("/:mealId", async (req: Request, res: Response) => {
  try {
    const { mealId } = req.params;
    const updates = req.body;
    const meal = await mealService.updateMeal(mealId, updates);
    if (!meal) {
      res.status(404).json({ error: "Meal not found" });
      return;
    }
    res.json(meal);
  } catch (error) {
    res.status(500).json({ error: "Internal error" });
  }
});

/**
 * GET /api/meals/:tgId/stats/7days
 * Get stats for last 7 days
 */
router.get("/:tgId/stats/7days", async (req: Request, res: Response) => {
  try {
    const { tgId } = req.params;
    const stats = await mealService.getLast7DaysStats(tgId);
    res.json(stats);
  } catch (error) {
    console.error("Error getting 7 days stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/meals/:tgId/recent
 * Get recent 10 meals
 */
router.get("/:tgId/recent", async (req: Request, res: Response) => {
  try {
    const { tgId } = req.params;
    const meals = await mealService.getRecentMeals(tgId);
    res.json(meals);
  } catch (error) {
    console.error("Error getting recent meals:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/meals/:tgId/analytics
 * Get analytics data
 */
router.get("/:tgId/analytics", async (req: Request, res: Response) => {
  try {
    const { tgId } = req.params;
    const data = await mealService.getAnalytics(tgId);
    res.json(data);
  } catch (error) {
    console.error("Error getting analytics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
