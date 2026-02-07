import express, { Request, Response } from "express";
import progressPhotoService from "../services/progressphoto.service.js";

const router = express.Router();

/**
 * GET /api/progress-photos/:tgId
 */
router.get(
  "/:tgId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tgId } = req.params;
      const photos = await progressPhotoService.getPhotos(tgId);
      res.json(photos);
    } catch (error) {
      console.error("Error getting progress photos:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * GET /api/progress-photos/:tgId/comparison
 */
router.get(
  "/:tgId/comparison",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tgId } = req.params;
      const comparison = await progressPhotoService.getComparison(tgId);
      if (!comparison) {
        res.status(404).json({ error: "Not enough photos for comparison" });
        return;
      }
      res.json(comparison);
    } catch (error) {
      console.error("Error getting comparison:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * DELETE /api/progress-photos/:photoId
 */
router.delete(
  "/:photoId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { photoId } = req.params;
      const tgId = req.query.tgId as string;
      if (!tgId) {
        res.status(400).json({ error: "tgId query param required" });
        return;
      }
      const deleted = await progressPhotoService.deletePhoto(photoId, tgId);
      res.json({ success: deleted });
    } catch (error) {
      console.error("Error deleting progress photo:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
