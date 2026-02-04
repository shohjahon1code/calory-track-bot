import mongoose, { Document, Schema } from "mongoose";

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  tgId: string;
  amount: number;
  type: "deposit" | "subscription_purchase" | "bonus";
  status: "pending" | "completed" | "failed";
  provider: "payme" | "click" | "balance";
  planId?: string; // If subscription purchase
  orderId?: string; // External order ID
  createdAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tgId: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["deposit", "subscription_purchase", "bonus"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    provider: {
      type: String,
      enum: ["payme", "click", "balance", "mock_webhook"],
      required: true,
    },
    planId: String,
    orderId: String,
  },
  {
    timestamps: true,
  },
);

// Index for getting user history sorted by date
transactionSchema.index({ tgId: 1, createdAt: -1 });

const Transaction = mongoose.model<ITransaction>(
  "Transaction",
  transactionSchema,
);

export default Transaction;
