import express, { Request, Response } from "express";
import chatService from "../services/chat.service.js";

const router = express.Router();

/**
 * POST /api/chat/:tgId/send
 */
router.post(
  "/:tgId/send",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tgId } = req.params;
      const { message, language } = req.body;

      if (!message || typeof message !== "string") {
        res.status(400).json({ error: "message is required" });
        return;
      }

      const result = await chatService.sendMessage(tgId, message, language || "uz");
      res.json(result);
    } catch (error) {
      console.error("Error in chat send:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * GET /api/chat/:tgId/history
 */
router.get(
  "/:tgId/history",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tgId } = req.params;
      const messages = await chatService.getHistory(tgId);
      res.json(messages);
    } catch (error) {
      console.error("Error getting chat history:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
