/**
 * Nutrition Context - Manages user profile and meal data
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  weight_kg: number;
  height_cm: number;
  age: number;
  gender: 'male' | 'female' | 'other';
  activity_level: string;
  bmr: number;
  tdee: number;
  goal: 'lose' | 'maintain' | 'gain';
}

export interface MealLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  food_label: string;
  calories: number;
  quantity: number;
  unit: string;
}

export interface DailySummary {
  date: string; // YYYY-MM-DD
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  meals: MealLogEntry[];
}

interface NutritionContextType {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => Promise<void>;
  meals: MealLogEntry[];
  addMeal: (meal: Omit<MealLogEntry, 'id'>) => Promise<void>;
  removeMeal: (mealId: string) => Promise<void>;
  getTodaysMeals: () => MealLogEntry[];
  getTodaysSummary: () => DailySummary;
  isLoading: boolean;
}

const NutritionContext = createContext<NutritionContextType | undefined>(undefined);

const PROFILE_STORAGE_KEY = '@nutrivision_profile';
const MEALS_STORAGE_KEY = '@nutrivision_meals';

export function NutritionProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [meals, setMealsState] = useState<MealLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load profile and meals from AsyncStorage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileData, mealsData] = await Promise.all([
          AsyncStorage.getItem(PROFILE_STORAGE_KEY),
          AsyncStorage.getItem(MEALS_STORAGE_KEY),
        ]);

        if (profileData) {
          setProfileState(JSON.parse(profileData));
        }

        if (mealsData) {
          setMealsState(JSON.parse(mealsData));
        }
      } catch (error) {
        console.error('Error loading nutrition data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const setProfile = async (newProfile: UserProfile) => {
    try {
      setProfileState(newProfile);
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newProfile));
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  };

  const addMeal = async (meal: Omit<MealLogEntry, 'id'>) => {
    try {
      const newMeal: MealLogEntry = {
        ...meal,
        id: Date.now().toString(),
      };

      const updatedMeals = [...meals, newMeal];
      setMealsState(updatedMeals);
      await AsyncStorage.setItem(MEALS_STORAGE_KEY, JSON.stringify(updatedMeals));
    } catch (error) {
      console.error('Error adding meal:', error);
      throw error;
    }
  };

  const removeMeal = async (mealId: string) => {
    try {
      const updatedMeals = meals.filter((meal) => meal.id !== mealId);
      setMealsState(updatedMeals);
      await AsyncStorage.setItem(MEALS_STORAGE_KEY, JSON.stringify(updatedMeals));
    } catch (error) {
      console.error('Error removing meal:', error);
      throw error;
    }
  };

  const getTodaysMeals = (): MealLogEntry[] => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return meals.filter((meal) => meal.date === today);
  };

  const getTodaysSummary = (): DailySummary => {
    const today = new Date().toISOString().split('T')[0];
    const todaysMeals = getTodaysMeals();

    const totalCalories = todaysMeals.reduce((sum, meal) => sum + meal.calories, 0);

    // Simple macro estimation (these are placeholders - in production, you'd have macro data per food)
    // For now, we'll estimate based on calorie distribution
    const totalProtein = Math.round(totalCalories * 0.3 / 4); // 30% protein, 4 cal/g
    const totalCarbs = Math.round(totalCalories * 0.45 / 4); // 45% carbs, 4 cal/g
    const totalFats = Math.round(totalCalories * 0.25 / 9); // 25% fat, 9 cal/g

    return {
      date: today,
      total_calories: totalCalories,
      total_protein: totalProtein,
      total_carbs: totalCarbs,
      total_fats: totalFats,
      meals: todaysMeals,
    };
  };

  return (
    <NutritionContext.Provider
      value={{
        profile,
        setProfile,
        meals,
        addMeal,
        removeMeal,
        getTodaysMeals,
        getTodaysSummary,
        isLoading,
      }}
    >
      {children}
    </NutritionContext.Provider>
  );
}

export function useNutrition() {
  const context = useContext(NutritionContext);
  if (!context) {
    throw new Error('useNutrition must be used within NutritionProvider');
  }
  return context;
}
