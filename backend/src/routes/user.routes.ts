import express, { Request, Response } from "express";
import userService from "../services/user.service.js";
import mealService from "../services/meal.service.js";
import progressService from "../services/progress.service.js";
import gamificationService from "../services/gamification.service.js";
import reportCardService from "../services/reportcard.service.js";
import Subscription from "../models/Subscription.js";
import bot from "../bot/bot.js";

const router = express.Router();

/**
 * POST /api/user/initial-analysis
 * AI analysis after wizard (no meal data)
 */
router.post(
  "/initial-analysis",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { profileData, language } = req.body;

      if (!profileData) {
        res.status(400).json({ error: "profileData is required" });
        return;
      }

      const analysis = await progressService.getInitialAnalysis(
        profileData,
        language || "uz",
      );

      if (!analysis) {
        res.status(500).json({ error: "Failed to generate analysis" });
        return;
      }

      res.json(analysis);
    } catch (error) {
      console.error("Error in initial-analysis:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

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

/**
 * POST /api/user/:tgId/progress-analysis
 * AI progress analysis (cached 24h)
 */
router.post(
  "/:tgId/progress-analysis",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tgId } = req.params;
      const { refresh, language } = req.body;

      const analysis = await progressService.generateAnalysis(
        tgId,
        language || "uz",
        refresh === true,
      );

      if (!analysis) {
        res.status(404).json({ error: "User not found or analysis failed" });
        return;
      }

      res.json(analysis);
    } catch (error) {
      console.error("Error in progress-analysis:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * GET /api/user/:tgId/gamification
 * Get gamification profile (streaks, XP, badges, level)
 */
router.get(
  "/:tgId/gamification",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tgId } = req.params;
      const profile = await gamificationService.getGamificationProfile(tgId);

      if (!profile) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json(profile);
    } catch (error) {
      console.error("Error getting gamification:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * POST /api/user/:tgId/badges/seen
 * Mark badges as seen
 */
router.post(
  "/:tgId/badges/seen",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tgId } = req.params;
      const { badgeIds } = req.body;

      if (!Array.isArray(badgeIds)) {
        res.status(400).json({ error: "badgeIds must be an array" });
        return;
      }

      await gamificationService.markBadgesSeen(tgId, badgeIds);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking badges seen:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * GET /api/user/:tgId/reminders
 * Get reminder settings
 */
router.get(
  "/:tgId/reminders",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tgId } = req.params;
      const user = await userService.getByTgId(tgId);

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json(user.reminders || {});
    } catch (error) {
      console.error("Error getting reminders:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * PUT /api/user/:tgId/reminders
 * Update reminder settings
 */
router.put(
  "/:tgId/reminders",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tgId } = req.params;
      const reminders = req.body;

      const user = await userService.getByTgId(tgId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const existing = user.reminders
        ? (user.reminders as any).toObject?.() ?? user.reminders
        : {};
      // Merge only the keys that were actually sent
      for (const key of Object.keys(reminders)) {
        (existing as any)[key] = reminders[key];
      }
      user.reminders = existing as any;
      await user.save();

      res.json({ success: true, reminders: user.reminders });
    } catch (error) {
      console.error("Error updating reminders:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * POST /api/user/:tgId/prompt-log
 * Send a bot message prompting the user to log a meal
 */
router.post(
  "/:tgId/prompt-log",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tgId } = req.params;
      const user = await userService.getByTgId(tgId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const lang = user.language || "uz";
      const message = lang === "uz"
        ? "📸 Ovqat kiriting!\n\n🖼 Rasm yuboring\n🎤 Ovozli xabar yuboring\n✍️ Matn yozing\n\nNimani yegansiz?"
        : "📸 Log your meal!\n\n🖼 Send a photo\n🎤 Send a voice message\n✍️ Type what you ate\n\nWhat did you eat?";

      await bot.api.sendMessage(tgId, message);
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending prompt:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * GET /api/user/:tgId/report-card
 */
router.get(
  "/:tgId/report-card",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tgId } = req.params;
      const user = await userService.getByTgId(tgId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const lang = user.language || "uz";
      const report = await reportCardService.getTodayReportCard(tgId, lang);
      if (!report) {
        res.status(404).json({ error: "No report available" });
        return;
      }

      const sub = await Subscription.findOne({ tgId, status: "active" });
      const isPremium = !!(sub?.endDate && new Date(sub.endDate) > new Date());

      if (!isPremium) {
        const { detailedAnalysis, highlights, improvements, tomorrowTip, streakAck, ...freeReport } = report;
        res.json({ ...freeReport, highlights: [], improvements: [], tomorrowTip: "", streakAck: "", isPremium: false });
        return;
      }

      res.json({ ...report, isPremium: true });
    } catch (error) {
      console.error("Error getting report card:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * POST /api/user/:tgId/report-card/refresh
 */
router.post(
  "/:tgId/report-card/refresh",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tgId } = req.params;
      const user = await userService.getByTgId(tgId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const lang = user.language || "uz";
      const report = await reportCardService.generateReportCard(tgId, lang, true);
      if (!report) {
        res.status(404).json({ error: "No meals logged today" });
        return;
      }

      res.json(report);
    } catch (error) {
      console.error("Error refreshing report card:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
