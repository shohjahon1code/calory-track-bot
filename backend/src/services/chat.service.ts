import User from "../models/User.js";
import ChatMessage from "../models/ChatMessage.js";
import Subscription from "../models/Subscription.js";
import mealService from "./meal.service.js";
import openaiService from "./openai.service.js";

const FREE_DAILY_LIMIT = 3;

class ChatService {
  /**
   * Send a message to AI coach and get response.
   */
  async sendMessage(
    tgId: string,
    message: string,
    language: string,
  ): Promise<{
    success: boolean;
    response?: string;
    remainingMessages?: number;
    error?: string;
  }> {
    const user = await User.findOne({ tgId });
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check premium status
    const sub = await Subscription.findOne({ tgId, status: "active" });
    const isPremium = !!(sub?.endDate && new Date(sub.endDate) > new Date());

    // Check daily limit for free users
    if (!isPremium) {
      const today = new Date().toDateString();
      const lastChat = user.lastChatDate ? new Date(user.lastChatDate).toDateString() : "";
      const count = today === lastChat ? (user.chatMessageCount || 0) : 0;

      if (count >= FREE_DAILY_LIMIT) {
        return {
          success: false,
          remainingMessages: 0,
          error: "LIMIT_REACHED",
        };
      }
    }

    // Get today's stats for context
    const stats = await mealService.getTodayStats(tgId, user.dailyGoal);
    const meals = await mealService.getTodayMeals(tgId);

    // Build system prompt with full user context
    const systemPrompt = this.buildSystemPrompt(user, stats, meals, language);

    // Get conversation history (last 20 messages)
    const history = await ChatMessage.find({ tgId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const conversationMessages = history.reverse().map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Add new user message
    conversationMessages.push({ role: "user", content: message });

    // Call OpenAI
    const result = await openaiService.chatCompletion(systemPrompt, conversationMessages);

    if (!result.success || !result.response) {
      return { success: false, error: result.error || "AI error" };
    }

    // Save messages
    await ChatMessage.insertMany([
      { tgId, role: "user", content: message },
      { tgId, role: "assistant", content: result.response },
    ]);

    // Update daily counter for free users
    if (!isPremium) {
      const today = new Date().toDateString();
      const lastChat = user.lastChatDate ? new Date(user.lastChatDate).toDateString() : "";
      const currentCount = today === lastChat ? (user.chatMessageCount || 0) : 0;
      user.chatMessageCount = currentCount + 1;
      user.lastChatDate = new Date();
      await user.save();

      return {
        success: true,
        response: result.response,
        remainingMessages: FREE_DAILY_LIMIT - (currentCount + 1),
      };
    }

    return {
      success: true,
      response: result.response,
      remainingMessages: -1, // unlimited
    };
  }

  /**
   * Get chat history (last 20 messages, oldest first).
   */
  async getHistory(tgId: string) {
    const messages = await ChatMessage.find({ tgId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    return messages.reverse();
  }

  /**
   * Build context-rich system prompt.
   */
  private buildSystemPrompt(
    user: any,
    stats: any,
    meals: any[],
    language: string,
  ): string {
    const lang = language === "uz" ? "o'zbek tilida" : "in English";
    const mealNames = meals.map((m) => `${m.name} (${m.calories} kcal)`).join(", ");
    const progressPercent = stats.dailyGoal > 0
      ? Math.round((stats.totalCalories / stats.dailyGoal) * 100)
      : 0;

    const goalText = user.goal === "lose_weight" ? "ozish" :
      user.goal === "gain_muscle" ? "massa olish" : "vaznni saqlash";

    return `Sen "Oshpaz AI Coach" — do'stona, bilimdon ovqatlanish maslahatchisisan. O'zbek taomlari va ovqatlanish bo'yicha mutaxassissan.

Foydalanuvchi profili:
- Ism: ${user.firstName || "Foydalanuvchi"}
- Jins: ${user.gender || "noma'lum"}, Yosh: ${user.age || "?"}, Bo'y: ${user.height || "?"}sm, Vazn: ${user.weight || "?"}kg
- Maqsad: ${goalText}${user.targetWeight ? ` (maqsadli vazn: ${user.targetWeight}kg)` : ""}
- Kunlik kaloriya maqsadi: ${user.dailyGoal} kkal
- Faollik: ${user.activityLevel || "noma'lum"}, Ish turi: ${user.workType || "noma'lum"}

Bugungi progress:
- Iste'mol: ${stats.totalCalories}/${user.dailyGoal} kkal (${progressPercent}%)
- Makrolar: Protein ${stats.totalProtein}g, Uglevod ${stats.totalCarbs}g, Yog' ${stats.totalFats}g
- Bugungi ovqatlar: ${mealNames || "hali ovqat kiritilmagan"}

Qoidalar:
1. Javobni ${lang} yoz
2. Qisqa va aniq javob ber (2-3 paragraf, eng ko'pi 150 so'z)
3. Foydalanuvchining haqiqiy ma'lumotlariga asoslan
4. O'zbek taomlari va mahalliy ovqatlarni tavsiya qil
5. Rag'batlantiruvchi bo'l, lekin halol maslahat ber
6. Markdown ishlatma — oddiy matn yoz, emoji ishlat
7. Ovqatlanish bilan bog'liq bo'lmagan savollarga muloyimlik bilan ovqat/sog'liq mavzusiga yo'naltir`;
  }
}

export default new ChatService();
