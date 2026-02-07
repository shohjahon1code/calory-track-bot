import mongoose, { Document, Schema } from "mongoose";

export interface IProgressPhoto {
  tgId: string;
  imageUrl: string;
  weight?: number;
  note?: string;
  takenAt: Date;
}

export interface IProgressPhotoDocument extends IProgressPhoto, Document {}

const progressPhotoSchema = new Schema<IProgressPhotoDocument>({
  tgId: { type: String, required: true, index: true },
  imageUrl: { type: String, required: true },
  weight: { type: Number },
  note: { type: String, default: "" },
  takenAt: { type: Date, default: Date.now, index: true },
});

progressPhotoSchema.index({ tgId: 1, takenAt: -1 });

const ProgressPhoto = mongoose.model<IProgressPhotoDocument>("ProgressPhoto", progressPhotoSchema);

export default ProgressPhoto;
