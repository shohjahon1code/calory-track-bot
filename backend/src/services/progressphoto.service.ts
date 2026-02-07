import ProgressPhoto from "../models/ProgressPhoto.js";
import User from "../models/User.js";

class ProgressPhotoService {
  /**
   * Save a new progress photo.
   */
  async savePhoto(tgId: string, imageUrl: string, note?: string) {
    const user = await User.findOne({ tgId });
    const weight = user?.weight;

    const photo = await ProgressPhoto.create({
      tgId,
      imageUrl,
      weight,
      note: note || "",
    });

    return photo;
  }

  /**
   * Get all progress photos for a user (oldest first for timeline).
   */
  async getPhotos(tgId: string) {
    return ProgressPhoto.find({ tgId }).sort({ takenAt: 1 }).lean();
  }

  /**
   * Get before/after comparison (first photo vs latest photo).
   */
  async getComparison(tgId: string) {
    const photos = await ProgressPhoto.find({ tgId }).sort({ takenAt: 1 }).lean();
    if (photos.length < 2) return null;

    return {
      before: photos[0],
      after: photos[photos.length - 1],
    };
  }

  /**
   * Delete a progress photo.
   */
  async deletePhoto(photoId: string, tgId: string) {
    const result = await ProgressPhoto.deleteOne({ _id: photoId, tgId });
    return result.deletedCount > 0;
  }
}

export default new ProgressPhotoService();
