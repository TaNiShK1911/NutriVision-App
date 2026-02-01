import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useNutrition } from '@/lib/nutrition-context';
import { formatFoodLabel } from '@/lib/nutrition-logic';
import { apiClient } from '@/lib/api-client';

export default function DashboardScreen() {
  const { profile, getTodaysSummary, getTodaysMeals, removeMeal } = useNutrition();
  const [coachingTip, setCoachingTip] = useState<string | null>(null);
  const [loadingCoaching, setLoadingCoaching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const todaysSummary = getTodaysSummary();
  const todaysMeals = getTodaysMeals();

  // Fetch coaching tip when component mounts or meals change


  const fetchCoachingTip = async () => {
    if (!profile || todaysMeals.length === 0) {
      setCoachingTip(null);
      return;
    }

    setLoadingCoaching(true);
    try {
      const lastMeal = todaysMeals[todaysMeals.length - 1];
      const caloriesBeforeLast = todaysSummary.total_calories - lastMeal.calories;

      const response = await apiClient.getCoachingTip(
        profile.tdee,
        caloriesBeforeLast,
        lastMeal.food_label,
        lastMeal.calories,
        profile.goal
      );

      setCoachingTip(response.coaching_tip);
    } catch (error) {
      console.error('Error fetching coaching tip:', error);
      setCoachingTip('Keep tracking your meals!');
    } finally {
      setLoadingCoaching(false);
    }
  };

  const handleDeleteMeal = (mealId: string) => {
    Alert.alert('Delete Meal', 'Are you sure you want to delete this meal?', [
      { text: 'Cancel', onPress: () => { } },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await removeMeal(mealId);
          } catch (error) {
            Alert.alert('Error', 'Failed to delete meal.');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCoachingTip();
    setRefreshing(false);
  };

  if (!profile) {
    return (
      <ScreenContainer className="items-center justify-center">
        <View className="gap-4 items-center px-4">
          <Text className="text-lg font-semibold text-foreground">Welcome to NutriVision</Text>
          <Text className="text-sm text-muted text-center">
            Set up your profile to start tracking your daily calories and get personalized coaching tips.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const caloriesRemaining = Math.max(0, profile.tdee - todaysSummary.total_calories);
  const caloriePercentage = Math.min(100, (todaysSummary.total_calories / profile.tdee) * 100);
  const isOverCalories = todaysSummary.total_calories > profile.tdee;

  return (
    <ScreenContainer className="p-4">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="gap-6 pb-8">
          {/* Header */}
          <View className="gap-1">
            <Text className="text-3xl font-bold text-foreground">Dashboard</Text>
            <Text className="text-sm text-muted">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>

          {/* Calorie Progress Circle */}
          <View className="bg-surface rounded-lg p-6 border border-border items-center">
            <View className="items-center gap-2">
              <Text className="text-sm text-muted">Today's Calories</Text>
              <View className="flex-row items-baseline gap-2">
                <Text className="text-4xl font-bold text-primary">
                  {todaysSummary.total_calories}
                </Text>
                <Text className="text-lg text-muted">/ {profile.tdee}</Text>
              </View>
              <Text className={`text-sm font-semibold ${isOverCalories ? 'text-error' : 'text-success'}`}>
                {isOverCalories ? '−' : '+'} {caloriesRemaining} kcal remaining
              </Text>
            </View>

            {/* Progress Bar */}
            <View className="w-full mt-4 h-2 bg-border rounded-full overflow-hidden">
              <View
                className={`h-full ${isOverCalories ? 'bg-error' : 'bg-primary'}`}
                style={{ width: `${Math.min(100, caloriePercentage)}%` }}
              />
            </View>

            {/* Percentage */}
            <Text className="text-xs text-muted mt-2">
              {Math.round(caloriePercentage)}% of daily target
            </Text>
          </View>

          {/* Macro Breakdown */}
          <View className="bg-surface rounded-lg p-4 border border-border gap-3">
            <Text className="text-sm font-semibold text-foreground">Macro Breakdown</Text>

            {/* Protein */}
            <View className="gap-1">
              <View className="flex-row justify-between items-center">
                <Text className="text-xs text-muted">Protein</Text>
                <Text className="text-xs font-semibold text-foreground">
                  {todaysSummary.total_protein}g
                </Text>
              </View>
              <View className="h-2 bg-border rounded-full overflow-hidden">
                <View
                  className="h-full bg-primary"
                  style={{ width: `${Math.min(100, (todaysSummary.total_protein / 150) * 100)}%` }}
                />
              </View>
            </View>

            {/* Carbs */}
            <View className="gap-1">
              <View className="flex-row justify-between items-center">
                <Text className="text-xs text-muted">Carbs</Text>
                <Text className="text-xs font-semibold text-foreground">
                  {todaysSummary.total_carbs}g
                </Text>
              </View>
              <View className="h-2 bg-border rounded-full overflow-hidden">
                <View
                  className="h-full bg-warning"
                  style={{ width: `${Math.min(100, (todaysSummary.total_carbs / 300) * 100)}%` }}
                />
              </View>
            </View>

            {/* Fats */}
            <View className="gap-1">
              <View className="flex-row justify-between items-center">
                <Text className="text-xs text-muted">Fats</Text>
                <Text className="text-xs font-semibold text-foreground">
                  {todaysSummary.total_fats}g
                </Text>
              </View>
              <View className="h-2 bg-border rounded-full overflow-hidden">
                <View
                  className="h-full bg-success"
                  style={{ width: `${Math.min(100, (todaysSummary.total_fats / 80) * 100)}%` }}
                />
              </View>
            </View>
          </View>

          {/* Coaching Tip Section */}
          <View className="bg-surface rounded-lg p-4 border border-border gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-foreground">NutriCoach AI</Text>
              {coachingTip && (
                <TouchableOpacity onPress={fetchCoachingTip} disabled={loadingCoaching}>
                  <Text className="text-xs text-primary">Refresh</Text>
                </TouchableOpacity>
              )}
            </View>

            {loadingCoaching ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#4F46E5" />
                <Text className="text-xs text-muted mt-2">Consulting the coach...</Text>
              </View>
            ) : coachingTip ? (
              <View className="bg-primary/10 rounded-lg p-3">
                <Text className="text-xs font-semibold text-primary mb-1">💡 Suggestion</Text>
                <Text className="text-sm text-foreground leading-relaxed">{coachingTip}</Text>
              </View>
            ) : (
              <View className="items-center py-2">
                <Text className="text-xs text-muted text-center mb-3">
                  {todaysMeals.length > 0
                    ? "Get a personalized analysis of your day so far."
                    : "Log your first meal to unlock AI coaching!"}
                </Text>

                <TouchableOpacity
                  onPress={fetchCoachingTip}
                  disabled={todaysMeals.length === 0}
                  className={`px-4 py-2 rounded-lg ${todaysMeals.length > 0 ? 'bg-primary' : 'bg-muted'}`}
                >
                  <Text className="text-white text-xs font-semibold">
                    Ask NutriCoach
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Meals List */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Today's Meals</Text>

            {todaysMeals.length === 0 ? (
              <View className="bg-surface rounded-lg p-4 border border-border items-center">
                <Text className="text-sm text-muted">No meals logged yet</Text>
              </View>
            ) : (
              <FlatList
                data={todaysMeals}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View className="bg-surface rounded-lg p-4 border border-border flex-row justify-between items-center mb-2">
                    <View className="flex-1">
                      <Text className="font-semibold text-foreground">
                        {formatFoodLabel(item.food_label)}
                      </Text>
                      <Text className="text-xs text-muted mt-1">
                        {item.time} • {item.quantity} {item.unit}
                      </Text>
                    </View>
                    <View className="items-end gap-1">
                      <Text className="font-bold text-primary">{item.calories} kcal</Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteMeal(item.id)}
                        className="px-2 py-1"
                      >
                        <Text className="text-xs text-error">Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}
          </View>

          {/* Weekly Summary (Optional) */}
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-sm font-semibold text-foreground mb-2">Weekly Overview</Text>
            <Text className="text-xs text-muted">
              This week's average: {Math.round(todaysSummary.total_calories)} kcal/day
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
