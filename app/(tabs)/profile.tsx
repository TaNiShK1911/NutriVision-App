import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useNutrition, UserProfile } from '@/lib/nutrition-context';
import { calculateBMR, calculateTDEE } from '@/lib/nutrition-logic';

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary (little or no exercise)' },
  { value: 'lightly_active', label: 'Lightly Active (1-3 days/week)' },
  { value: 'moderately_active', label: 'Moderately Active (3-5 days/week)' },
  { value: 'very_active', label: 'Very Active (6-7 days/week)' },
  { value: 'super_active', label: 'Super Active (very hard exercise)' },
];

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export default function ProfileScreen() {
  const { profile, setProfile, isLoading } = useNutrition();

  const [weight, setWeight] = useState(profile?.weight_kg.toString() || '');
  const [height, setHeight] = useState(profile?.height_cm.toString() || '');
  const [age, setAge] = useState(profile?.age.toString() || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(profile?.gender || 'male');
  const [activityLevel, setActivityLevel] = useState(profile?.activity_level || 'moderately_active');
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>(profile?.goal || 'maintain');
  const [tdeeResult, setTdeeResult] = useState<number | null>(profile?.tdee || null);
  const [calculating, setCalculating] = useState(false);

  const validateInputs = (): boolean => {
    if (!weight || !height || !age) {
      Alert.alert('Missing Information', 'Please fill in all fields.');
      return false;
    }

    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age, 10);

    if (w <= 0 || h <= 0 || a <= 0) {
      Alert.alert('Invalid Input', 'Please enter positive numbers.');
      return false;
    }

    if (w > 300 || h > 250 || a > 150) {
      Alert.alert('Invalid Input', 'Please check your entries.');
      return false;
    }

    return true;
  };

  const handleCalculateTDEE = async () => {
    if (!validateInputs()) return;

    setCalculating(true);
    try {
      const w = parseFloat(weight);
      const h = parseFloat(height);
      const a = parseInt(age, 10);

      const bmr = calculateBMR(gender, w, h, a);
      const tdee = calculateTDEE(bmr, activityLevel);

      setTdeeResult(tdee);
    } catch (error) {
      Alert.alert('Error', 'Failed to calculate TDEE. Please try again.');
      console.error('TDEE calculation error:', error);
    } finally {
      setCalculating(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!validateInputs() || tdeeResult === null) {
      Alert.alert('Error', 'Please calculate TDEE first.');
      return;
    }

    try {
      const w = parseFloat(weight);
      const h = parseFloat(height);
      const a = parseInt(age, 10);
      const bmr = calculateBMR(gender, w, h, a);

      const newProfile: UserProfile = {
        weight_kg: w,
        height_cm: h,
        age: a,
        gender,
        activity_level: activityLevel,
        bmr,
        tdee: tdeeResult,
        goal,
      };

      await setProfile(newProfile);
      Alert.alert('Success', `Profile saved! Your daily target: ${tdeeResult} kcal`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
      console.error('Profile save error:', error);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6 pb-8">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Your Profile</Text>
            <Text className="text-sm text-muted">
              Set up your profile to calculate your daily calorie target
            </Text>
          </View>

          {/* Weight Input */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Weight (kg)</Text>
            <TextInput
              className="border border-border rounded-lg px-4 py-3 text-foreground bg-surface"
              placeholder="e.g., 75"
              keyboardType="decimal-pad"
              value={weight}
              onChangeText={setWeight}
            />
          </View>

          {/* Height Input */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Height (cm)</Text>
            <TextInput
              className="border border-border rounded-lg px-4 py-3 text-foreground bg-surface"
              placeholder="e.g., 180"
              keyboardType="decimal-pad"
              value={height}
              onChangeText={setHeight}
            />
          </View>

          {/* Age Input */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Age (years)</Text>
            <TextInput
              className="border border-border rounded-lg px-4 py-3 text-foreground bg-surface"
              placeholder="e.g., 25"
              keyboardType="number-pad"
              value={age}
              onChangeText={setAge}
            />
          </View>

          {/* Gender Selector */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Gender</Text>
            <View className="flex-row gap-2">
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g.value}
                  onPress={() => setGender(g.value as 'male' | 'female' | 'other')}
                  className={`flex-1 rounded-lg py-2 px-3 border ${
                    gender === g.value
                      ? 'bg-primary border-primary'
                      : 'bg-surface border-border'
                  }`}
                >
                  <Text
                    className={`text-center text-sm font-medium ${
                      gender === g.value ? 'text-white' : 'text-foreground'
                    }`}
                  >
                    {g.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Activity Level Selector */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Activity Level</Text>
            <View className="gap-2">
              {ACTIVITY_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  onPress={() => setActivityLevel(level.value)}
                  className={`rounded-lg py-3 px-4 border ${
                    activityLevel === level.value
                      ? 'bg-primary border-primary'
                      : 'bg-surface border-border'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      activityLevel === level.value ? 'text-white' : 'text-foreground'
                    }`}
                  >
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Goal Selector */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Goal</Text>
            <View className="flex-row gap-2">
              {(['lose', 'maintain', 'gain'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => setGoal(g)}
                  className={`flex-1 rounded-lg py-2 px-3 border ${
                    goal === g ? 'bg-primary border-primary' : 'bg-surface border-border'
                  }`}
                >
                  <Text
                    className={`text-center text-sm font-medium capitalize ${
                      goal === g ? 'text-white' : 'text-foreground'
                    }`}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Calculate TDEE Button */}
          <TouchableOpacity
            onPress={handleCalculateTDEE}
            disabled={calculating}
            className="bg-primary rounded-lg py-3 px-4 items-center"
          >
            {calculating ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">Calculate TDEE</Text>
            )}
          </TouchableOpacity>

          {/* TDEE Result */}
          {tdeeResult !== null && (
            <View className="bg-surface rounded-lg p-4 border border-border">
              <Text className="text-sm text-muted mb-1">Your Daily Calorie Target</Text>
              <Text className="text-4xl font-bold text-primary">{tdeeResult}</Text>
              <Text className="text-sm text-muted mt-1">kcal/day</Text>
            </View>
          )}

          {/* Save Profile Button */}
          {tdeeResult !== null && (
            <TouchableOpacity
              onPress={handleSaveProfile}
              className="bg-success rounded-lg py-3 px-4 items-center"
            >
              <Text className="text-white font-semibold text-base">Save Profile</Text>
            </TouchableOpacity>
          )}

          {/* Current Profile Info */}
          {profile && (
            <View className="bg-surface rounded-lg p-4 border border-border">
              <Text className="text-sm font-semibold text-foreground mb-2">Current Profile</Text>
              <Text className="text-xs text-muted">
                {profile.weight_kg}kg • {profile.height_cm}cm • {profile.age} years • {profile.gender}
              </Text>
              <Text className="text-xs text-muted mt-1">
                TDEE: {profile.tdee} kcal/day • {profile.activity_level}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
