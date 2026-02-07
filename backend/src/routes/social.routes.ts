import express, { Request, Response } from "express";
import socialService from "../services/social.service.js";

const router = express.Router();

/**
 * GET /api/social/:tgId/friends
 */
router.get("/:tgId/friends", async (req: Request, res: Response): Promise<void> => {
  try {
    const { tgId } = req.params;
    const friends = await socialService.getFriendsList(tgId);
    res.json(friends);
  } catch (error) {
    console.error("Error getting friends:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/social/:tgId/leaderboard
 */
router.get("/:tgId/leaderboard", async (req: Request, res: Response): Promise<void> => {
  try {
    const { tgId } = req.params;
    const leaderboard = await socialService.getWeeklyLeaderboard(tgId);
    res.json(leaderboard);
  } catch (error) {
    console.error("Error getting leaderboard:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/social/:tgId/requests
 */
router.get("/:tgId/requests", async (req: Request, res: Response): Promise<void> => {
  try {
    const { tgId } = req.params;
    const requests = await socialService.getPendingRequests(tgId);
    res.json(requests);
  } catch (error) {
    console.error("Error getting requests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/social/:tgId/request
 */
router.post("/:tgId/request", async (req: Request, res: Response): Promise<void> => {
  try {
    const { tgId } = req.params;
    const { identifier } = req.body;

    if (!identifier) {
      res.status(400).json({ error: "identifier is required" });
      return;
    }

    const result = await socialService.sendFriendRequest(tgId, identifier);
    res.json(result);
  } catch (error) {
    console.error("Error sending request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/social/:tgId/accept
 */
router.post("/:tgId/accept", async (req: Request, res: Response): Promise<void> => {
  try {
    const { tgId } = req.params;
    const { friendTgId } = req.body;

    if (!friendTgId) {
      res.status(400).json({ error: "friendTgId is required" });
      return;
    }

    const success = await socialService.acceptFriendRequest(tgId, friendTgId);
    res.json({ success });
  } catch (error) {
    console.error("Error accepting request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /api/social/:tgId/friend/:friendTgId
 */
router.delete("/:tgId/friend/:friendTgId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { tgId, friendTgId } = req.params;
    await socialService.removeFriend(tgId, friendTgId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error removing friend:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/social/:tgId/referral
 */
router.get("/:tgId/referral", async (req: Request, res: Response): Promise<void> => {
  try {
    const { tgId } = req.params;
    const info = await socialService.getReferralInfo(tgId);
    res.json(info);
  } catch (error) {
    console.error("Error getting referral:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
