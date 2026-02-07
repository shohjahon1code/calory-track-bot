import { Bot } from "grammy";
import User from "../models/User.js";
import Meal from "../models/Meal.js";
import Subscription from "../models/Subscription.js";
import reportCardService from "./reportcard.service.js";
import { DailyReportCard } from "../types/index.js";

interface ReminderMessages {
  [lang: string]: {
    breakfast: string;
    lunch: string;
    dinner: string;
    streakAtRisk: (streak: number) => string;
    weighIn: string;
    dailyReportFree: (grade: string, emoji: string, cals: number, goal: number) => string;
    dailyReportPremium: (r: DailyReportCard) => string;
  };
}

const MESSAGES: ReminderMessages = {
  uz: {
    breakfast: "Nonushta vaqti keldi! Ovqat rasmini yuboring va kunni to'g'ri boshlang.",
    lunch: "Tushlik vaqti! Ovqatingizni suratga oling.",
    dinner: "Kechki ovqat haqida unutmang! Kaloriyalaringizni kuzatib boring.",
    streakAtRisk: (streak: number) =>
      `Sizning ${streak} kunlik streakinigiz xavf ostida! Bugun biror ovqat kiriting.`,
    weighIn: "Haftalik vazn o'lchash vaqti! Natijangizni kiriting.",
    dailyReportFree: (grade: string, emoji: string, cals: number, goal: number) =>
      `📊 *Bugungi bahongiz: ${emoji} ${grade}*\n\n🔥 Kaloriya: ${cals}/${goal} kkal\n\n💎 To'liq tahlil uchun PRO ga o'ting!`,
    dailyReportPremium: (r: DailyReportCard) =>
      `📊 *Bugungi Baholash: ${r.gradeEmoji} ${r.grade}*\n\n` +
      `*Kaloriya:* ${r.calorieScore.consumed}/${r.calorieScore.goal} kkal ` +
      `${r.calorieScore.status === "on_target" ? "✅" : "⚠️"}\n\n` +
      `*Makrolar:*\n` +
      `🥩 Protein: ${r.macroBalance.protein.consumed}g ${r.macroBalance.protein.status === "good" ? "✅" : "⚠️"}\n` +
      `🍞 Uglevod: ${r.macroBalance.carbs.consumed}g ${r.macroBalance.carbs.status === "good" ? "✅" : "⚠️"}\n` +
      `🧈 Yog': ${r.macroBalance.fats.consumed}g ${r.macroBalance.fats.status === "good" ? "✅" : "⚠️"}\n\n` +
      `*Yaxshi:*\n${r.highlights.map((h: string) => `✨ ${h}`).join("\n")}\n\n` +
      `*Ertaga uchun:*\n${r.improvements.map((i: string) => `💡 ${i}`).join("\n")}\n\n` +
      `🍽 ${r.tomorrowTip}\n\n🔥 ${r.streakAck}`,
  },
  en: {
    breakfast: "Time for breakfast! Send a food photo to start your day right.",
    lunch: "Lunch time! Snap a photo of your meal.",
    dinner: "Don't forget about dinner! Keep tracking your calories.",
    streakAtRisk: (streak: number) =>
      `Your ${streak}-day streak is at risk! Log a meal today to keep it going.`,
    weighIn: "Time for your weekly weigh-in! Log your weight to track progress.",
    dailyReportFree: (grade: string, emoji: string, cals: number, goal: number) =>
      `📊 *Today's Grade: ${emoji} ${grade}*\n\n🔥 Calories: ${cals}/${goal} kcal\n\n💎 Upgrade to PRO for full analysis!`,
    dailyReportPremium: (r: DailyReportCard) =>
      `📊 *Daily Report: ${r.gradeEmoji} ${r.grade}*\n\n` +
      `*Calories:* ${r.calorieScore.consumed}/${r.calorieScore.goal} kcal ` +
      `${r.calorieScore.status === "on_target" ? "✅" : "⚠️"}\n\n` +
      `*Macros:*\n` +
      `🥩 Protein: ${r.macroBalance.protein.consumed}g ${r.macroBalance.protein.status === "good" ? "✅" : "⚠️"}\n` +
      `🍞 Carbs: ${r.macroBalance.carbs.consumed}g ${r.macroBalance.carbs.status === "good" ? "✅" : "⚠️"}\n` +
      `🧈 Fats: ${r.macroBalance.fats.consumed}g ${r.macroBalance.fats.status === "good" ? "✅" : "⚠️"}\n\n` +
      `*Highlights:*\n${r.highlights.map((h: string) => `✨ ${h}`).join("\n")}\n\n` +
      `*For tomorrow:*\n${r.improvements.map((i: string) => `💡 ${i}`).join("\n")}\n\n` +
      `🍽 ${r.tomorrowTip}\n\n🔥 ${r.streakAck}`,
  },
};

class ReminderService {
  private bot: Bot | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private miniAppUrl: string;
  private lastCheckedMinute: string = "";

  constructor() {
    this.miniAppUrl = process.env.MINI_APP_URL || "";
  }

  /**
   * Initialize with bot instance.
   */
  init(bot: Bot) {
    this.bot = bot;
  }

  /**
   * Start the reminder check loop (every 30 seconds to avoid missing minutes).
   */
  start() {
    if (this.intervalId) return;

    console.log("Reminder service started");
    this.intervalId = setInterval(() => {
      this.checkAndSendReminders().catch((err) =>
        console.error("Reminder check error:", err),
      );
    }, 30 * 1000);
  }

  /**
   * Stop the reminder loop.
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("Reminder service stopped");
    }
  }

  /**
   * Check all users for due reminders and send them.
   */
  /**
   * Get current time string in a given timezone.
   */
  private getTimeInTz(tz: string): { time: string; dayOfWeek: number } {
    try {
      const now = new Date();
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).formatToParts(now);
      const hour = parts.find(p => p.type === "hour")?.value || "00";
      const minute = parts.find(p => p.type === "minute")?.value || "00";
      // Get day of week in timezone
      const dayStr = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(now);
      const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return { time: `${hour}:${minute}`, dayOfWeek: dayMap[dayStr] ?? now.getDay() };
    } catch {
      const now = new Date();
      return {
        time: `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
        dayOfWeek: now.getDay(),
      };
    }
  }

  private async checkAndSendReminders() {
    if (!this.bot) return;

    // Default timezone for most users
    const defaultTz = "Asia/Tashkent";
    const { time: currentTime, dayOfWeek: currentDayOfWeek } = this.getTimeInTz(defaultTz);

    // Dedup: don't process the same minute twice
    if (this.lastCheckedMinute === currentTime) return;
    this.lastCheckedMinute = currentTime;

    // Meal reminders: breakfast, lunch, dinner
    const mealSlots = ["breakfast", "lunch", "dinner"] as const;
    const mealWindows = {
      breakfast: { start: 5, end: 11 },
      lunch: { start: 11, end: 16 },
      dinner: { start: 17, end: 22 },
    };

    for (const slot of mealSlots) {
      const users = await User.find({
        [`reminders.${slot}.enabled`]: true,
        [`reminders.${slot}.time`]: currentTime,
      }).limit(100);

      for (const user of users) {
        const hasMealInWindow = await this.hasMealInTimeWindow(
          user.tgId,
          mealWindows[slot].start,
          mealWindows[slot].end,
        );

        if (!hasMealInWindow) {
          const lang = user.language || "uz";
          await this.sendReminder(user.tgId, MESSAGES[lang]?.[slot] || MESSAGES.en[slot]);
        }
      }
    }

    // Streak reminder
    const streakUsers = await User.find({
      "reminders.streakReminder.enabled": true,
      "reminders.streakReminder.time": currentTime,
      currentStreak: { $gt: 0 },
    }).limit(100);

    for (const user of streakUsers) {
      const hasMealToday = await this.hasMealToday(user.tgId);
      if (!hasMealToday) {
        const lang = user.language || "uz";
        const msg = MESSAGES[lang]?.streakAtRisk(user.currentStreak || 0) ||
          MESSAGES.en.streakAtRisk(user.currentStreak || 0);
        await this.sendReminder(user.tgId, msg);
      }
    }

    // Weekly weigh-in
    const weighInUsers = await User.find({
      "reminders.weighIn.enabled": true,
      "reminders.weighIn.time": currentTime,
      "reminders.weighIn.dayOfWeek": currentDayOfWeek,
    }).limit(100);

    for (const user of weighInUsers) {
      const lang = user.language || "uz";
      await this.sendReminder(user.tgId, MESSAGES[lang]?.weighIn || MESSAGES.en.weighIn);
    }

    // Daily Report Card
    const reportUsers = await User.find({
      "reminders.dailyReport.enabled": true,
      "reminders.dailyReport.time": currentTime,
    }).limit(100);

    for (const user of reportUsers) {
      const lang = (user.language || "uz") as string;
      const tgId = user.tgId;

      try {
        const report = await reportCardService.getTodayReportCard(tgId, lang);
        if (!report) continue;

        const sub = await Subscription.findOne({ tgId, status: "active" });
        const isPremium = !!(sub?.endDate && new Date(sub.endDate) > new Date());

        const msgs = MESSAGES[lang] || MESSAGES.en;
        const message = isPremium
          ? msgs.dailyReportPremium(report)
          : msgs.dailyReportFree(report.grade, report.gradeEmoji, report.calorieScore.consumed, report.calorieScore.goal);

        await this.sendReminder(tgId, message);
      } catch (err) {
        console.error(`Failed daily report for ${tgId}:`, (err as Error).message);
      }
    }
  }

  /**
   * Get a Date object adjusted to the user's timezone "today".
   */
  private getTodayInTz(tz: string): Date {
    const nowStr = new Date().toLocaleDateString("en-CA", { timeZone: tz }); // "YYYY-MM-DD"
    return new Date(nowStr + "T00:00:00");
  }

  private async hasMealInTimeWindow(tgId: string, startHour: number, endHour: number): Promise<boolean> {
    const today = this.getTodayInTz("Asia/Tashkent");
    const start = new Date(today.getTime() + startHour * 3600_000);
    const end = new Date(today.getTime() + endHour * 3600_000);

    const count = await Meal.countDocuments({
      tgId,
      status: "confirmed",
      timestamp: { $gte: start, $lt: end },
    });

    return count > 0;
  }

  private async hasMealToday(tgId: string): Promise<boolean> {
    const today = this.getTodayInTz("Asia/Tashkent");

    const count = await Meal.countDocuments({
      tgId,
      status: "confirmed",
      timestamp: { $gte: today },
    });

    return count > 0;
  }

  private async sendReminder(tgId: string, message: string) {
    if (!this.bot) return;

    try {
      const keyboard = this.miniAppUrl
        ? { inline_keyboard: [[{ text: "Open App", web_app: { url: this.miniAppUrl } }]] }
        : undefined;

      await this.bot.api.sendMessage(Number(tgId), message, {
        reply_markup: keyboard,
      });
    } catch (error) {
      // User may have blocked bot - ignore
      console.error(`Failed to send reminder to ${tgId}:`, (error as Error).message);
    }
  }
}

export default new ReminderService();
