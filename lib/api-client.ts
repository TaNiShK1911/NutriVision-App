/**
 * API Client for NutriVision Backend Services
 * Handles food model inference and Gemini coaching
 */

import axios, { AxiosInstance } from 'axios';

export interface FoodPredictionResponse {
  label: string;
  confidence: number;
}

export interface CoachingTipResponse {
  coaching_tip: string;
}

class APIClient {
  private modelApi: AxiosInstance;
  private geminiApi: AxiosInstance;

  constructor(
    modelBaseUrl: string = 'http://localhost:5000',
    geminiBaseUrl: string = 'http://localhost:5001'
  ) {
    this.modelApi = axios.create({
      baseURL: modelBaseUrl,
      timeout: 30000,
    });

    this.geminiApi = axios.create({
      baseURL: geminiBaseUrl,
      timeout: 15000,
    });
  }

  /**
   * Send image to Keras model for food classification
   * 
   * @param imageUri - Local file URI or base64 encoded image
   * @param isBase64 - Whether the image is base64 encoded
   * @returns Prediction with food label and confidence
   */
  async predictFood(
    imageUri: string,
    isBase64: boolean = false
  ): Promise<FoodPredictionResponse> {
    try {
      const formData = new FormData();

      if (isBase64) {
        // If base64, send as JSON
        formData.append('image_base64', imageUri);
      } else {
        // If file URI, create blob and append
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append('image', blob, 'food.jpg');
      }

      const result = await this.modelApi.post<FoodPredictionResponse>(
        '/predict',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return result.data;
    } catch (error) {
      console.error('Food prediction error:', error);
      throw new Error('Failed to predict food. Please try again.');
    }
  }

  /**
   * Get personalized coaching tip from Gemini
   * 
   * @param userTdee - User's daily calorie target
   * @param caloriesConsumed - Total calories consumed so far
   * @param detectedFoodLabel - The food that was just logged
   * @param detectedFoodCalories - Calories of the food that was just logged
   * @param userGoal - User's goal (lose, maintain, gain)
   * @returns Personalized coaching tip
   */
  async getCoachingTip(
    userTdee: number,
    caloriesConsumed: number,
    detectedFoodLabel: string,
    detectedFoodCalories: number,
    userGoal: 'lose' | 'maintain' | 'gain' = 'maintain'
  ): Promise<CoachingTipResponse> {
    try {
      const result = await this.geminiApi.post<CoachingTipResponse>(
        '/coaching',
        {
          user_tdee: userTdee,
          calories_consumed_so_far: caloriesConsumed,
          detected_food_label: detectedFoodLabel,
          detected_food_calories: detectedFoodCalories,
          user_goal: userGoal,
        }
      );

      return result.data;
    } catch (error) {
      console.error('Coaching tip error:', error);
      // Return a fallback tip instead of throwing
      return {
        coaching_tip: `You've logged ${detectedFoodLabel}. Keep tracking your meals!`,
      };
    }
  }

  /**
   * Health check for model API
   */
  async checkModelHealth(): Promise<boolean> {
    try {
      await this.modelApi.get('/health');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Health check for Gemini API
   */
  async checkGeminiHealth(): Promise<boolean> {
    try {
      await this.geminiApi.get('/health');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Update API base URLs (useful for configuration)
   */
  setModelBaseUrl(url: string) {
    this.modelApi.defaults.baseURL = url;
  }

  setGeminiBaseUrl(url: string) {
    this.geminiApi.defaults.baseURL = url;
  }
}

// Export singleton instance
export const apiClient = new APIClient(
  process.env.EXPO_PUBLIC_MODEL_API_URL || 'http://localhost:5000',
  process.env.EXPO_PUBLIC_GEMINI_API_URL || 'http://localhost:5001'
);

export default apiClient;
