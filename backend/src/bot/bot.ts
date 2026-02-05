import { Bot, Context, InlineKeyboard } from "grammy";
import userService from "../services/user.service.js";
import mealService from "../services/meal.service.js";
import openaiService from "../services/openai.service.js";
import Subscription from "../models/Subscription.js";
import { SUCCESS_MESSAGES, CALORIE_GOAL_LIMITS } from "../config/constants.js";
import axios from "axios";

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

const BOT_MESSAGES = {
  uz: {
    chooseLanguage: "Tilni tanlang / Choose your language:",
    welcome: (name: string, goal: number) =>
      `Assalomu alaykum, *${name || "do'stim"}*! 👋\n\n` +
      `Men *Oshpaz AI* — sun'iy intellektli ovqat tahlilchisiman.\n\n` +
      `Nima qila olaman:\n` +
      `📸  Rasm yuboring — kaloriya va tarkibini aniqlayman\n` +
      `🎤  Ovozli xabar — nima yegatingizni ayting, bas\n` +
      `✍️  Matn yozing — "osh, salat, non" kabi\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `🎯  Sizning maqsadingiz: *${goal} kkal/kun*\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `Buyruqlar:\n` +
      `/goal \`raqam\` — maqsadni o'zgartirish\n` +
      `/stats — bugungi natijalar\n\n` +
      `Boshlash uchun ovqat rasmini yuboring yoki pastdagi tugmani bosing 👇`,
    openApp: "📊 Ilovani Ochish",
  },
  en: {
    chooseLanguage: "Tilni tanlang / Choose your language:",
    welcome: (name: string, goal: number) =>
      `Hello, *${name || "friend"}*! 👋\n\n` +
      `I'm *Oshpaz AI* — your AI-powered food analyzer.\n\n` +
      `What I can do:\n` +
      `📸  Send a photo — I'll analyze calories and nutrients\n` +
      `🎤  Voice message — just tell me what you ate\n` +
      `✍️  Text — type "rice, salad, bread" etc.\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `🎯  Your goal: *${goal} kcal/day*\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `Commands:\n` +
      `/goal \`number\` — change your goal\n` +
      `/stats — today's results\n\n` +
      `Send a food photo or tap the button below to start 👇`,
    openApp: "📊 Open App",
  },
};

/**
 * Handle /start command
 */
bot.command("start", async (ctx: Context) => {
  try {
    const tgId = ctx.from!.id.toString();
    const existingUser = await userService.getByTgId(tgId);

    if (existingUser && existingUser.language) {
      // Returning user — show welcome in their language
      const lang = existingUser.language as "uz" | "en";
      const msgs = BOT_MESSAGES[lang];
      const keyboard = new InlineKeyboard().webApp(
        msgs.openApp,
        process.env.MINI_APP_URL!,
      );
      await ctx.reply(msgs.welcome(existingUser.firstName, existingUser.dailyGoal), {
        reply_markup: keyboard,
        parse_mode: "Markdown",
      });
      return;
    }

    // New user — show language selection
    const langKeyboard = new InlineKeyboard()
      .text("🇺🇿 O'zbekcha", "lang:uz")
      .text("🇬🇧 English", "lang:en");

    await ctx.reply(BOT_MESSAGES.uz.chooseLanguage, {
      reply_markup: langKeyboard,
    });
  } catch (error) {
    console.error("Error in start command:", error);
    await ctx.reply("⚠️ Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
  }
});

/**
 * Handle /goal command
 */
bot.command("goal", async (ctx: Context) => {
  try {
    const args = ctx.message?.text?.split(" ");

    if (!args || args.length < 2) {
      await ctx.reply(
        `🎯 Kunlik kaloriya maqsadini belgilash:\n\n` +
          `Foydalanish: /goal <raqam>\n` +
          `Misol: /goal 2500\n\n` +
          `Ruxsat etilgan oraliq: ${CALORIE_GOAL_LIMITS.MIN} - ${CALORIE_GOAL_LIMITS.MAX} kkal`,
      );
      return;
    }

    const newGoal = parseInt(args[1]);

    if (isNaN(newGoal)) {
      await ctx.reply("❌ Iltimos, to'g'ri raqam kiriting.");
      return;
    }

    const tgId = ctx.from!.id.toString();
    const user = await userService.updateDailyGoal(tgId, newGoal);

    if (user) {
      await ctx.reply(
        `${SUCCESS_MESSAGES.GOAL_UPDATED}\n\nYangi maqsad: ${newGoal} kkal`,
      );
    } else {
      await ctx.reply("❌ Foydalanuvchi topilmadi. Avval /start bosing.");
    }
  } catch (error) {
    console.error("Error in goal command:", error);
    await ctx.reply(
      error instanceof Error ? error.message : "⚠️ Xatolik yuz berdi.",
    );
  }
});

/**
 * Handle /grant command (Admin specific)
 * Usage: /grant <tgId> <days>
 */
bot.command("grant", async (ctx: Context) => {
  try {
    const adminId = 2062187869; // Replace with your actual Telegram User ID
    console.log(
      ` Grant command attempt. Sender: ${ctx.from?.id}, Admin: ${adminId}`,
    );

    if (ctx.from?.id !== adminId) {
      console.log(`Unauthorized grant attempt`);
      // Silent ignore or "Unknown command" behavior to not expose admin tools
      return;
    }

    const args = ctx.message?.text?.split(" ");
    if (!args || args.length < 3) {
      await ctx.reply("Foydalanish: /grant <tgId> <kunlar>");
      return;
    }

    const targetTgId = args[1];
    const days = parseInt(args[2]);

    if (isNaN(days)) {
      await ctx.reply("Noto'g'ri kunlar soni.");
      return;
    }

    const user = await userService.getByTgId(targetTgId);
    if (!user) {
      await ctx.reply("Foydalanuvchi topilmadi.");
      return;
    }

    // Update Subscription
    const now = new Date();
    let subscription = await Subscription.findOne({ userId: user._id });
    if (!subscription) {
      subscription = new Subscription({ userId: user._id, tgId: user.tgId });
    }

    const startDate =
      subscription.status === "active" &&
      subscription.endDate &&
      subscription.endDate > now
        ? subscription.endDate
        : now;

    const newExpiry = new Date(startDate);
    newExpiry.setDate(newExpiry.getDate() + days);

    subscription.planId = "custom_grant";
    subscription.planType = "monthly"; // Treat as monthly features
    subscription.status = "active";
    subscription.startDate = startDate;
    subscription.endDate = newExpiry;

    await subscription.save();

    await ctx.reply(
      `✅ ${targetTgId} (${user.firstName}) ga ${days} kun berildi!\nTugash muddati: ${newExpiry.toLocaleDateString()}`,
    );

    // Notify User
    try {
      await ctx.api.sendMessage(
        targetTgId,
        `🎉 **Tabriklaymiz!**\n\nSizga ${days} kunlik **Pro Obuna** taqdim etildi!\nCheklovsiz ovqat loglari va kengaytirilgan statistikadan bahramand bo'ling.`,
      );
    } catch (e) {
      await ctx.reply(
        "⚠️ Foydalanuvchiga xabar yuborib bo'lmadi (balki botni bloklagan).",
      );
    }
  } catch (error) {
    console.error("Grant error:", error);
    await ctx.reply("Grant jarayonida xatolik.");
  }
});

/**
 * Handle /stats command
 */
bot.command("stats", async (ctx: Context) => {
  try {
    const tgId = ctx.from!.id.toString();
    const user = await userService.getByTgId(tgId);

    if (!user) {
      await ctx.reply("❌ Foydalanuvchi topilmadi. Avval /start bosing.");
      return;
    }

    const stats = await mealService.getTodayStats(tgId, user.dailyGoal);

    const progressBar = generateProgressBar(stats.progressPercentage);
    const statusEmoji =
      stats.progressPercentage >= 100
        ? "🔴"
        : stats.progressPercentage >= 90
          ? "🟡"
          : "🟢";

    await ctx.reply(
      `📊 **Bugungi Statistika**\n\n` +
        `${statusEmoji} ${progressBar} ${stats.progressPercentage}%\n\n` +
        `🔥 Kaloriya: ${stats.totalCalories} / ${stats.dailyGoal} kkal\n` +
        `📉 Qoldi: ${stats.remainingCalories} kkal\n\n` +
        `**Makrolar:**\n` +
        `🥩 Protein: ${stats.totalProtein}g\n` +
        `🍞 Uglevod: ${stats.totalCarbs}g\n` +
        `🧈 Yog': ${stats.totalFats}g\n\n` +
        `🍽️ Ovqatlar soni: ${stats.mealsCount}`,
      { parse_mode: "Markdown" },
    );
  } catch (error) {
    console.error("Error in stats command:", error);
    await ctx.reply("⚠️ Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
  }
});

/**
 * Handle photo messages
 */
// Callback query handler
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;

  // Language selection callback
  if (data.startsWith("lang:")) {
    const lang = data.split(":")[1] as "uz" | "en";
    try {
      const user = await userService.findOrCreate(ctx.from!, lang);
      await userService.updateLanguage(ctx.from!.id.toString(), lang);

      const msgs = BOT_MESSAGES[lang];
      const keyboard = new InlineKeyboard().webApp(
        msgs.openApp,
        process.env.MINI_APP_URL!,
      );

      await ctx.editMessageText(msgs.welcome(user.firstName, user.dailyGoal), {
        reply_markup: keyboard,
        parse_mode: "Markdown",
      });
      await ctx.answerCallbackQuery();
    } catch (error) {
      console.error("Error in language selection:", error);
      await ctx.answerCallbackQuery("⚠️ Xatolik yuz berdi");
    }
    return;
  }

  if (data.startsWith("confirm_meal:")) {
    const mealId = data.split(":")[1];
    const tgId = ctx.from.id.toString();

    try {
      const meal = await mealService.confirmMeal(mealId, tgId);
      if (!meal) {
        await ctx.answerCallbackQuery("❌ Ovqat topilmadi");
        return;
      }

      const user = await userService.getByTgId(tgId);
      const stats = await mealService.getTodayStats(
        tgId,
        user ? user.dailyGoal : 2000,
      );
      const progressBar = generateProgressBar(stats.progressPercentage);

      await ctx.editMessageText(
        `${SUCCESS_MESSAGES.MEAL_SAVED}\n\n` +
          `🍽️ **${meal.name}**\n\n` +
          `🔥 Kaloriya: ${meal.calories} kkal\n` +
          `🥩 Protein: ${meal.protein}g\n` +
          `🍞 Uglevod: ${meal.carbs}g\n` +
          `🧈 Yog': ${meal.fats}g\n\n` +
          `**Bugungi Natija:**\n` +
          `${progressBar} ${stats.progressPercentage}%\n` +
          `${stats.totalCalories} / ${stats.dailyGoal} kkal`,
        { parse_mode: "Markdown" },
      );
      await ctx.answerCallbackQuery("✅ Ovqat tasdiqlandi!");
    } catch (error) {
      console.error("Error confirming meal:", error);
      await ctx.answerCallbackQuery("❌ Tasdiqlashda xatolik");
    }
  } else if (data.startsWith("edit_meal:")) {
    await ctx.answerCallbackQuery("✏️ Tahrirlash tez orada!");
  }
});

/**
 * Check Daily Limit for Free Users
 */
async function checkDailyLimit(ctx: Context, user: any): Promise<boolean> {
  // Check Subscription Status
  const subscription = await Subscription.findOne({
    userId: user._id,
    status: "active",
  });
  const isPremium =
    subscription &&
    subscription.endDate &&
    new Date(subscription.endDate) > new Date();

  if (!isPremium) {
    const today = new Date();
    const lastScan = user.lastScanDate
      ? new Date(user.lastScanDate)
      : new Date(0);

    // Reset if new day
    if (
      lastScan.getDate() !== today.getDate() ||
      lastScan.getMonth() !== today.getMonth() ||
      lastScan.getFullYear() !== today.getFullYear()
    ) {
      user.photoScanCount = 0;
    }

    if (user.photoScanCount >= 3) {
      await ctx.reply(
        `🚫 **Kunlik Limit Tugadi**\n\n` +
          `Siz bugungi 3 ta bepul logdan foydalandingiz.\n` +
          `Cheklovsiz foydalanish uchun **PRO** ga o'ting! 🚀\n\n` +
          `👇 Quyidagi tugmani bosing:`,
        {
          reply_markup: new InlineKeyboard().webApp(
            "💎 PRO ga o'tish",
            `${process.env.MINI_APP_URL}/premium`,
          ),
          parse_mode: "Markdown",
        },
      );
      return false;
    }
  }
  return true;
}

/**
 * Unified Food Input Processor
 */
async function processFoodInput(
  ctx: Context,
  type: "image" | "text",
  data: string,
  fileUrl?: string,
) {
  const tgId = ctx.from!.id.toString();
  const user = await userService.findOrCreate(ctx.from!);

  if (!(await checkDailyLimit(ctx, user))) return;

  const statusMessage = await ctx.reply(
    type === "image"
      ? "🔍 Rasmingiz tahlil qilinmoqda..."
      : "🧠 Matn tahlil qilinmoqda...",
  );

  try {
    let analysisResult;

    if (type === "image") {
      analysisResult = await openaiService.analyzeFoodImage(data);
    } else {
      analysisResult = await openaiService.analyzeText(data);
    }

    if (!analysisResult.success || !analysisResult.data) {
      await ctx.api.editMessageText(
        ctx.chat!.id,
        statusMessage.message_id,
        analysisResult.error || "Tahlil qilib bo'lmadi",
      );
      return;
    }

    const meal = await mealService.saveMeal(
      tgId,
      analysisResult.data,
      fileUrl, // Only for images
    );

    // Update Usage Count for Free users
    const activeSub = await Subscription.findOne({
      userId: user._id,
      status: "active",
    });
    const isPremium =
      activeSub &&
      activeSub.endDate &&
      new Date(activeSub.endDate) > new Date();

    if (!isPremium) {
      user.photoScanCount = (user.photoScanCount || 0) + 1;
      user.lastScanDate = new Date();
      await user.save();
    }

    // Create Verification Message
    const itemDetails = analysisResult.data.items
      .map((item) => `- ${item.name}: ${item.calories} kkal`)
      .join("\n");

    const messageText =
      `🍱 **Ovqat aniqlandi:**\n\n` +
      `**Tarkibi:**\n${itemDetails}\n\n` +
      `**Jami:**\n` +
      `🔥 ${Math.round(analysisResult.data.totalCalories)} kkal\n` +
      `🥩 P: ${Math.round(analysisResult.data.totalProtein)}g | ` +
      `🍞 U: ${Math.round(analysisResult.data.totalCarbs)}g | ` +
      `🧈 Y: ${Math.round(analysisResult.data.totalFats)}g\n\n` +
      `To'g'rimi?`;

    const keyboard = new InlineKeyboard()
      .text("✅ To'g'ri", `confirm_meal:${meal._id}`)
      .webApp(
        "✏️ Tahrirlash",
        `${process.env.MINI_APP_URL}?start_param=edit_meal_${meal._id}`,
      );

    await ctx.api.editMessageText(
      ctx.chat!.id,
      statusMessage.message_id,
      messageText,
      {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      },
    );
  } catch (error) {
    console.error("Error in processFoodInput:", error);
    await ctx.api.editMessageText(
      ctx.chat!.id,
      statusMessage.message_id,
      "⚠️ Tahlil qilib bo'lmadi. Iltimos, qayta urinib ko'ring.",
    );
  }
}

/**
 * Handle photo messages
 */
bot.on("message:photo", async (ctx: Context) => {
  const photos = ctx.message?.photo;
  if (!photos || photos.length === 0) return;

  const photo = photos[photos.length - 1];
  const file = await ctx.api.getFile(photo.file_id);
  const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

  const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
  const imageBase64 = Buffer.from(response.data).toString("base64");

  await processFoodInput(ctx, "image", imageBase64, fileUrl);
});

/**
 * Handle voice messages
 */
bot.on("message:voice", async (ctx: Context) => {
  const voice = ctx.message?.voice;
  if (!voice) return;

  const statusMessage = await ctx.reply("🎤 Eshitilmoqda...");

  try {
    const file = await ctx.api.getFile(voice.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

    const transcribedText = await openaiService.transcribeAudio(fileUrl);

    // Delete "Listening..." message
    await ctx.api.deleteMessage(ctx.chat!.id, statusMessage.message_id);

    if (!transcribedText) {
      await ctx.reply(
        "⚠️ Ovozli xabarni tushunib bo'lmadi. Qayta urinib ko'ring.",
      );
      return;
    }

    await ctx.reply(`🗣️ Siz aytdingiz: "${transcribedText}"`);
    await processFoodInput(ctx, "text", transcribedText);
  } catch (error) {
    console.error("Error processing voice:", error);
    await ctx.api.editMessageText(
      ctx.chat!.id,
      statusMessage.message_id,
      "⚠️ Ovozli xabarni qayta ishlashda xatolik.",
    );
  }
});

/**
 * Handle text messages
 */
bot.on("message:text", async (ctx: Context) => {
  const text = ctx.message?.text;
  if (!text || text.startsWith("/")) return; // Ignore commands

  await processFoodInput(ctx, "text", text);
});

/**
 * Generate visual progress bar
 */
function generateProgressBar(percentage: number): string {
  const filled = Math.max(0, Math.min(10, Math.round(percentage / 10)));
  const empty = 10 - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}

export default bot;
