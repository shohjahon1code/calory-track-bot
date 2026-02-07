import mongoose, { Document, Schema } from "mongoose";

export interface IFriendshipDocument extends Document {
  userTgId: string;
  friendTgId: string;
  status: "pending" | "accepted" | "blocked";
  createdAt: Date;
}

const friendshipSchema = new Schema<IFriendshipDocument>(
  {
    userTgId: { type: String, required: true },
    friendTgId: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "blocked"],
      default: "pending",
    },
  },
  { timestamps: true },
);

friendshipSchema.index({ userTgId: 1, friendTgId: 1 }, { unique: true });
friendshipSchema.index({ userTgId: 1, status: 1 });
friendshipSchema.index({ friendTgId: 1, status: 1 });

const Friendship = mongoose.model<IFriendshipDocument>("Friendship", friendshipSchema);

export default Friendship;
