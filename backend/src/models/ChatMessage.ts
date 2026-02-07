import mongoose, { Document, Schema } from "mongoose";

export interface IChatMessage {
  tgId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface IChatMessageDocument extends IChatMessage, Document {}

const chatMessageSchema = new Schema<IChatMessageDocument>({
  tgId: { type: String, required: true, index: true },
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

chatMessageSchema.index({ tgId: 1, createdAt: -1 });

const ChatMessage = mongoose.model<IChatMessageDocument>("ChatMessage", chatMessageSchema);

export default ChatMessage;
