import express, { Request, Response } from "express";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

const router = express.Router();

// Plan Configurations (in UZS) - mirrored from payment.routes, ideally shared config
const PLANS = {
  "1_month": {
    name: "1 Month PRO",
    price: 29000,
    durationDays: 30,
    type: "monthly",
  },
  "6_months": {
    name: "6 Months PRO",
    price: 129000,
    durationDays: 180,
    type: "monthly",
  }, // treating as monthly tier but longer duration
  "1_year": {
    name: "1 Year PRO",
    price: 199000,
    durationDays: 365,
    type: "yearly",
  },
};

/**
 * GET /api/subscription/:tgId
 * Get subscription status, balance, and history
 */
import Wallet from "../models/Wallet.js";
import Subscription from "../models/Subscription.js";

/**
 * GET /api/subscription/:tgId
 * Get subscription status, balance, and history
 */
router.get("/:tgId", async (req: Request, res: Response) => {
  try {
    const { tgId } = req.params;
    const user = await User.findOne({ tgId });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Get Wallet
    let wallet = await Wallet.findOne({ userId: user._id });
    if (!wallet) {
      wallet = await Wallet.create({ userId: user._id, tgId: user.tgId });
    }

    // Get Subscription
    let subscription = await Subscription.findOne({
      userId: user._id,
      status: "active",
    });

    // Check expiry logic
    if (
      subscription &&
      subscription.endDate &&
      new Date(subscription.endDate) < new Date()
    ) {
      subscription.status = "expired";
      await subscription.save();
      subscription = null;
    }

    // Get Transactions
    const transactions = await Transaction.find({ tgId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      isPremium: !!subscription,
      planType: subscription ? subscription.planType : "free",
      premiumUntil: subscription ? subscription.endDate : null,
      balance: wallet.balance || 0,
      transactions,
    });
  } catch (error) {
    console.error("Error getting subscription:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/subscription/purchase
 * Purchase a plan using balance
 */
router.post("/purchase", async (req: Request, res: Response) => {
  try {
    const { tgId, planId } = req.body;

    if (!tgId || !planId) {
      res.status(400).json({ error: "Missing fields" });
      return;
    }

    const plan = PLANS[planId as keyof typeof PLANS];
    if (!plan) {
      res.status(400).json({ error: "Invalid plan" });
      return;
    }

    const user = await User.findOne({ tgId });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Wallet Check
    const wallet = await Wallet.findOne({ userId: user._id });
    if (!wallet || wallet.balance < plan.price) {
      res.status(400).json({
        error: "Insufficient balance",
        required: plan.price,
        current: wallet?.balance || 0,
      });
      return;
    }

    // Deduct Balance
    wallet.balance -= plan.price;
    await wallet.save();

    // Update Subscription
    const now = new Date();
    let subscription = await Subscription.findOne({ userId: user._id });

    if (!subscription) {
      subscription = new Subscription({ userId: user._id, tgId: user.tgId });
    }

    const startDate =
      subscription.status === "active" && subscription.endDate > now
        ? subscription.endDate
        : now;
    const newExpiry = new Date(startDate);
    newExpiry.setDate(newExpiry.getDate() + plan.durationDays);

    subscription.planId = planId;
    subscription.planType = plan.type as "monthly" | "yearly";
    subscription.status = "active";
    subscription.startDate = startDate;
    subscription.endDate = newExpiry;

    await subscription.save();

    // Create Transaction
    await Transaction.create({
      userId: user._id,
      tgId: user.tgId,
      amount: -plan.price, // Negative for expense
      type: "subscription_purchase",
      status: "completed",
      provider: "balance",
      planId: planId,
      createdAt: new Date(),
    });

    res.json({
      success: true,
      message: "Plan purchased successfully",
      newBalance: wallet.balance,
    });
  } catch (error) {
    console.error("Error purchasing plan:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
