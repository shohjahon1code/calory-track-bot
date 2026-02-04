import express, { Request, Response } from "express";
import paymentService from "../services/payment.service.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Wallet from "../models/Wallet.js";

const router = express.Router();

// Plan Configurations (in UZS)
const PLANS = {
  "1_month": { name: "1 Month PRO", price: 29000, durationDays: 30 },
  "6_months": { name: "6 Months PRO", price: 129000, durationDays: 180 },
  "1_year": { name: "1 Year PRO", price: 199000, durationDays: 365 },
};

/**
 * POST /api/payments/create-invoice
 * Generate payment links for a specific plan
 */
router.post("/create-invoice", async (req: Request, res: Response) => {
  try {
    const { tgId, planId, provider, amount: customAmount } = req.body;

    if (!tgId || !planId || !provider) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    let amount = 0;
    let planName = "";

    if (planId === "balance") {
      if (!customAmount || customAmount < 1000) {
        res.status(400).json({ error: "Invalid top-up amount" });
        return;
      }
      amount = customAmount;
      planName = "Balance Top-up";
    } else {
      const plan = PLANS[planId as keyof typeof PLANS];
      if (!plan) {
        res.status(400).json({ error: "Invalid plan" });
        return;
      }
      amount = plan.price;
      planName = plan.name;
    }

    // Amount needs to be in Tiyin for Payme (x100), UZS for Click
    // Construct orderId: tgId_type_amount_timestamp
    // type = 'topup' if planId='balance', else 'plan' (but we prefer topup flow now)
    // Actually let's stick to 'topup' logic for everything if we want user to have balance?
    // But existing frontend sends planId.
    // Let's distinguish: if planId is 'balance', type='topup'. If planId is standard, type='plan'.

    // HOWEVER, the new requirement is "Top Up Balance -> Purchase Plan".
    // So frontend should strictly use planId='balance' and amount.
    // But for backward compatibility or direct plan buying, we keep existing.

    // Updated orderId format to match webhook parser: tgId_type_amount_timestamp
    const type = planId === "balance" ? "topup" : "plan"; // webhook logic expects 'topup' for crediting balance?
    // Webhook logic (mock) credits balance regardless of type if we change it to just credit.
    // Let's make webhook explicitly credit balance.

    const orderId = `${tgId}_${type}_${amount}_${Date.now()}`;

    let paymentUrl = "";
    if (provider === "payme") {
      paymentUrl = paymentService.generatePaymeLink(amount * 100, orderId); // Payme expects Tiyin
    } else if (provider === "click") {
      paymentUrl = paymentService.generateClickLink(amount, orderId);
    } else {
      res.status(400).json({ error: "Invalid provider" });
      return;
    }

    res.json({
      success: true,
      paymentUrl,
      orderId,
      amount: amount,
      planName: planName,
    });
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Mock Webhook for testing
// In production, this would be the actual Payme/Click endpoint
router.post("/webhook/mock", async (req: Request, res: Response) => {
  try {
    const { orderId, status } = req.body;

    if (status !== "success") {
      res.json({ message: "ignored" });
      return;
    }

    // Parse orderId: tgId_type_amount_timestamp
    // Example: 12345_topup_50000_1712345678
    const parts = orderId.split("_");
    if (parts.length < 4) {
      res.status(400).json({ error: "Invalid orderId format" });
      return;
    }

    const tgId = parts[0];
    const amount = parseInt(parts[2]);

    // Validation

    const user = await User.findOne({ tgId });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Update Wallet
    let wallet = await Wallet.findOne({ userId: user._id });
    if (!wallet) {
      wallet = await Wallet.create({ userId: user._id, tgId: user.tgId });
    }

    wallet.balance = (wallet.balance || 0) + amount;
    await wallet.save();

    // Create Transaction
    await Transaction.create({
      userId: user._id,
      tgId: user.tgId,
      amount: amount,
      type: "deposit",
      status: "completed",
      provider: "mock_webhook", // or 'payme'/'click' based on logic
      orderId: orderId,
      createdAt: new Date(),
    });

    console.log(`✅ Balance top-up for ${tgId}: +${amount}`);

    res.json({
      success: true,
      message: "Balance updated",
      newBalance: wallet.balance,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
