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

  private SYSTEM_PROMPT = `You are a nutrition expert. Analyze the input (image or text) and return ONLY a JSON object with this exact structure:
{
  "items": [
    {
      "name": "descriptive name (in English)",
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
6. Handle input in English, Russian, or Uzbek. Translate food names to English for consistency but keep local names in parenthesis if specific (e.g., "Plov (Uzbek Rice Dish)").
7. Return ONLY JSON.`;

  /**
   * Analyze food image using GPT-4o Vision
   * Returns structured nutrition data or error
   */
  async analyzeFoodImage(imageBase64: string): Promise<OpenAIAnalysisResult> {
    try {
      const response = await this.client.chat.completions.create({
        model: OPENAI_CONFIG.MODEL,
        messages: [
          {
            role: "system",
            content: this.SYSTEM_PROMPT,
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
  async analyzeText(text: string): Promise<OpenAIAnalysisResult> {
    try {
      const response = await this.client.chat.completions.create({
        model: OPENAI_CONFIG.MODEL,
        messages: [
          { role: "system", content: this.SYSTEM_PROMPT },
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
