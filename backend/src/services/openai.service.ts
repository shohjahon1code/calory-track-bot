import OpenAI from "openai";
import { OPENAI_CONFIG, ERROR_MESSAGES } from "../config/constants.js";
import { NutritionData, OpenAIAnalysisResult } from "../types/index.js";

class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  private getSystemPrompt(language: string = "en"): string {
    const langInstruction = language === "uz"
      ? "Write ALL food names in Uzbek. Example: 'Osh (Plov)', 'Non', 'Somsa', 'Sabzavotli salat'. International dishes should also be in Uzbek or transliterated."
      : "Write ALL food names in English. For Uzbek dishes, include the original name (e.g., 'Plov (Uzbek Rice Dish)').";

    return `You are a nutrition expert. Analyze the input (image or text) and return ONLY a JSON object with this exact structure:
{
  "items": [
    {
      "name": "descriptive name",
      "calories": number,
      "protein": number (grams),
      "carbs": number (grams),
      "fats": number (grams),
      "weight": number (estimated grams)
    }
  ],
  "totalCalories": number,
  "totalProtein": number,
  "totalCarbs": number,
  "totalFats": number,
  "confidence": number (0-1)
}

Rules:
1. Detect ALL food items.
2. Estimate weight/portion for each item. Default to average portion if not specified.
3. Calculate totals accurately.
4. If not food, return "items": []
5. If blurry/unclear, return "items": []
6. Handle input in English, Russian, or Uzbek.
7. ${langInstruction}
8. Return ONLY JSON.`;
  }

  /**
   * Analyze food image using GPT-4o Vision
   * Returns structured nutrition data or error
   */
  async analyzeFoodImage(imageBase64: string, language: string = "en"): Promise<OpenAIAnalysisResult> {
    try {
      const response = await this.client.chat.completions.create({
        model: OPENAI_CONFIG.MODEL,
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt(language),
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this food image and return the nutritional information in JSON format.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: OPENAI_CONFIG.MAX_TOKENS,
        temperature: OPENAI_CONFIG.TEMPERATURE,
        response_format: { type: "json_object" },
      });

      return this.processResponse(response);
    } catch (error) {
      console.error("OpenAI Vision API Error:", error);
      return {
        success: false,
        error: ERROR_MESSAGES.OPENAI_ERROR,
      };
    }
  }

  /**
   * Analyze food text using GPT-4o
   */
  async analyzeText(text: string, language: string = "en"): Promise<OpenAIAnalysisResult> {
    try {
      const response = await this.client.chat.completions.create({
        model: OPENAI_CONFIG.MODEL,
        messages: [
          { role: "system", content: this.getSystemPrompt(language) },
          { role: "user", content: `Analyze this food text: "${text}"` },
        ],
        max_tokens: OPENAI_CONFIG.MAX_TOKENS,
        temperature: OPENAI_CONFIG.TEMPERATURE,
        response_format: { type: "json_object" },
      });

      return this.processResponse(response);
    } catch (error) {
      console.error("OpenAI Text API Error:", error);
      return { success: false, error: ERROR_MESSAGES.OPENAI_ERROR };
    }
  }

  async transcribeAudio(fileUrl: string): Promise<string | null> {
    try {
      // Download file using axios for better compatibility
      const response = await import("axios").then((m) =>
        m.default.get(fileUrl, { responseType: "arraybuffer" }),
      );
      const buffer = Buffer.from(response.data);

      // Create a File-like object for OpenAI
      const file = new File([buffer], "voice.ogg", { type: "audio/ogg" });

      const transcription = await this.client.audio.transcriptions.create({
        file: file,
        model: "whisper-1",
        // Hint for better Uzbek/English detection
        prompt:
          "Food log entry in Uzbek or English. Oziq-ovqat, kaloriya, ovqat.",
      });

      return transcription.text;
    } catch (error) {
      console.error("Whisper API Error:", error);
      return null;
    }
  }

  /**
   * Analyze user progress for AI-powered predictions
   */
  async analyzeProgress(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.client.chat.completions.create({
        model: OPENAI_CONFIG.MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1000,
        temperature: 0.4,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return { success: false, error: "No response from AI" };
      }

      const data = JSON.parse(content);
      return { success: true, data };
    } catch (error) {
      console.error("OpenAI Progress Analysis Error:", error);
      return { success: false, error: ERROR_MESSAGES.OPENAI_ERROR };
    }
  }

  /**
   * Chat completion — returns natural text (no JSON format)
   */
  async chatCompletion(
    systemPrompt: string,
    messages: { role: "user" | "assistant"; content: string }[],
  ): Promise<{ success: boolean; response?: string; error?: string }> {
    try {
      const openaiMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      const response = await this.client.chat.completions.create({
        model: OPENAI_CONFIG.MODEL,
        messages: openaiMessages,
        max_tokens: 800,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return { success: false, error: "No response from AI" };
      }
      return { success: true, response: content };
    } catch (error) {
      console.error("OpenAI Chat Error:", error);
      return { success: false, error: ERROR_MESSAGES.OPENAI_ERROR };
    }
  }

  private processResponse(response: any): OpenAIAnalysisResult {
    const content = response.choices[0]?.message?.content;

    if (!content) {
      return {
        success: false,
        error: ERROR_MESSAGES.ANALYSIS_FAILED,
      };
    }

    try {
      const nutritionData: NutritionData = JSON.parse(content);

      // Validate the response
      if (!nutritionData.items || !Array.isArray(nutritionData.items)) {
        if (content.includes("NOT_FOOD"))
          return { success: false, error: ERROR_MESSAGES.NOT_FOOD };
        return { success: false, error: ERROR_MESSAGES.ANALYSIS_FAILED };
      }

      if (nutritionData.items.length === 0) {
        return {
          success: false,
          error: ERROR_MESSAGES.NOT_FOOD,
        };
      }

      return {
        success: true,
        data: nutritionData,
      };
    } catch (e) {
      return { success: false, error: "Failed to parse JSON response" };
    }
  }
}

export default new OpenAIService();
