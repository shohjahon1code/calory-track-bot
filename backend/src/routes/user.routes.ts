import express, { Request, Response } from "express";
import userService from "../services/user.service.js";
import mealService from "../services/meal.service.js";

const router = express.Router();

/**
 * GET /api/user/:tgId
 * Get user profile
 */
router.get("/:tgId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { tgId } = req.params;
    const user = await userService.getByTgId(tgId);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/user/:tgId/weight-history
 * Get user weight history
 */
router.get(
  "/:tgId/weight-history",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tgId } = req.params;
      const history = await userService.getWeightHistory(tgId);
      res.json(history);
    } catch (error) {
      console.error("Error getting weight history:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * PUT /api/user/:tgId/goal
 * Update daily calorie goal
 */
router.put(
  "/:tgId/goal",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tgId } = req.params;
      const { goal } = req.body;

      if (typeof goal !== "number") {
        res.status(400).json({ error: "Goal must be a number" });
        return;
      }

      const user = await userService.updateDailyGoal(tgId, goal);

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json(user);
    } catch (error) {
      console.error("Error updating goal:", error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  },
);

/**
 * PUT /api/user/:tgId/profile
 * Update user profile
 */
router.put(
  "/:tgId/profile",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tgId } = req.params;
      const profileData = req.body;

      const user = await userService.updateProfile(tgId, profileData);

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * GET /api/user/:tgId/stats/today
 * Get today's consumption summary
 */
router.get(
  "/:tgId/stats/today",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tgId } = req.params;
      const user = await userService.getByTgId(tgId);

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const stats = await mealService.getTodayStats(tgId, user.dailyGoal);
      res.json(stats);
    } catch (error) {
      console.error("Error getting stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
