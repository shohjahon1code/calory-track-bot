import express, { Request, Response } from "express";
import moodService from "../services/mood.service.js";

const router = express.Router();

/**
 * POST /api/mood/:tgId
 * Log or update today's mood
 */
router.post(
  "/:tgId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tgId } = req.params;
      const { mood, triggers, note } = req.body;

      if (!mood || mood < 1 || mood > 5) {
        res.status(400).json({ error: "mood must be 1-5" });
        return;
      }

      const result = await moodService.logMood(
        tgId,
        mood,
        triggers || [],
        note || "",
      );
      res.json(result);
    } catch (error) {
      console.error("Error logging mood:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * GET /api/mood/:tgId/today
 */
router.get(
  "/:tgId/today",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tgId } = req.params;
      const entry = await moodService.getTodayMood(tgId);
      res.json(entry);
    } catch (error) {
      console.error("Error getting today mood:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * GET /api/mood/:tgId/recent?days=7
 */
router.get(
  "/:tgId/recent",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tgId } = req.params;
      const days = parseInt(req.query.days as string) || 7;
      const entries = await moodService.getRecentMoods(tgId, days);
      res.json(entries);
    } catch (error) {
      console.error("Error getting recent moods:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * GET /api/mood/:tgId/analysis?language=uz
 */
router.get(
  "/:tgId/analysis",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tgId } = req.params;
      const language = (req.query.language as string) || "uz";
      const result = await moodService.getWeeklyAnalysis(tgId, language);
      res.json(result);
    } catch (error) {
      console.error("Error getting mood analysis:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
