import "dotenv/config";
import express from "express";
import cors from "cors";
import database from "./config/database.js";
import bot from "./bot/bot.js";
import userRoutes from "./routes/user.routes.js";
import mealRoutes from "./routes/meal.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import mealPlanRoutes from "./routes/mealplan.routes.js";
import socialRoutes from "./routes/social.routes.js";
import reminderService from "./services/reminder.service.js";
import recipeRoutes from "./routes/recipe.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import progressPhotoRoutes from "./routes/progressphoto.routes.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware

app.use(
  cors({
    origin: "*", // Allow all origins explicitly
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "ngrok-skip-browser-warning",
    ],
  }),
);
app.options("*", cors()); // Enable pre-flight for all routes explicitly
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/user", userRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/meal-plan", mealPlanRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/progress-photos", progressPhotoRoutes);

// Error handling middleware
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  },
);

// Initialize server
async function startServer() {
  try {
    // Connect to MongoDB
    await database.connect();

    // Start Express server
    app.listen(Number(PORT), () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Mini App URL: ${process.env.MINI_APP_URL}`);
      console.log(`✅ Backend is ready!`);
    });

    // Start Telegram bot (non-blocking)
    console.log("🤖 Starting Telegram bot...");
    bot.start({
      onStart: (botInfo) => {
        console.log(`✅ Telegram bot started as @${botInfo.username}`);
      },
    });

    // Start reminder service
    reminderService.init(bot);
    reminderService.start();
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  reminderService.stop();
  await bot.stop();
  await database.disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  reminderService.stop();
  await bot.stop();
  await database.disconnect();
  process.exit(0);
});

// Start the server
startServer();
