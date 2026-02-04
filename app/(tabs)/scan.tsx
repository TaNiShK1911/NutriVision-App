import React, { useState, useRef } from 'react';
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ScreenContainer } from '@/components/screen-container';
import { useNutrition } from '@/lib/nutrition-context';
import { getNutritionInfo, formatFoodLabel } from '@/lib/nutrition-logic';
import { apiClient } from '@/lib/api-client';

type ScanState = 'ready' | 'camera' | 'preview' | 'analyzing' | 'result';

export default function ScanScreen() {
  const { profile, addMeal, getTodaysSummary } = useNutrition();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [scanState, setScanState] = useState<ScanState>('ready');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<{
    label: string;
    confidence: number;
  } | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  if (!profile) {
    return (
      <ScreenContainer className="items-center justify-center">
        <View className="gap-4 items-center">
          <Text className="text-lg font-semibold text-foreground">Profile Required</Text>
          <Text className="text-sm text-muted text-center px-4">
            Please set up your profile first to start logging meals.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const handleStartCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }
    }
    setScanState('camera');
  };

  const capturePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.8,
        });
        if (photo) {
          setSelectedImage(photo.uri);
          setScanState('preview');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to capture photo. Please try again.');
        console.error('Camera capture error:', error);
      }
    }
  };

  const handleGallerySelect = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
        setScanState('preview');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image. Please try again.');
      console.error('Gallery select error:', error);
    }
  };

  const handleAnalyzeFood = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'No image selected.');
      return;
    }

    setIsLoading(true);
    setScanState('analyzing');

    try {
      // Call the Keras model API
      const result = await apiClient.predictFood(selectedImage, false);

      if (result && result.label) {
        setPrediction(result);
        setScanState('result');
      } else {
        Alert.alert('Error', 'Failed to recognize food. Please try another image.');
        setScanState('preview');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze image. Please check your connection.');
      console.error('Analysis error:', error);
      setScanState('preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogMeal = async () => {
    if (!prediction) return;

    try {
      const nutritionInfo = getNutritionInfo(prediction.label);
      const totalCalories = nutritionInfo.calories * quantity;

      const now = new Date();
      const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const time = now.toTimeString().slice(0, 5); // HH:MM

      await addMeal({
        date,
        time,
        food_label: prediction.label,
        calories: totalCalories,
        quantity,
        unit: nutritionInfo.unit,
      });

      Alert.alert(
        'Meal Logged!',
        `${formatFoodLabel(prediction.label)} logged (${totalCalories} kcal)`,
        [
          {
            text: 'OK',
            onPress: () => {
              setSelectedImage(null);
              setPrediction(null);
              setQuantity(1);
              setScanState('ready');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to log meal. Please try again.');
      console.error('Log meal error:', error);
    }
  };

  // Ready State - Camera or Gallery
  if (scanState === 'ready') {
    return (
      <ScreenContainer className="p-4">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View className="gap-6 pb-8">
            {/* Header */}
            <View className="gap-2">
              <Text className="text-3xl font-bold text-foreground">Scan Food</Text>
              <Text className="text-sm text-muted">
                Take a photo or upload an image to identify food and log calories
              </Text>
            </View>

            {/* Camera Button */}
            <TouchableOpacity
              onPress={handleStartCamera}
              className="bg-primary rounded-lg py-6 px-4 items-center"
            >
              <Text className="text-white font-semibold text-lg">📷 Take Photo</Text>
            </TouchableOpacity>

            {/* Gallery Button */}
            <TouchableOpacity
              onPress={handleGallerySelect}
              className="bg-surface border border-border rounded-lg py-6 px-4 items-center"
            >
              <Text className="text-foreground font-semibold text-lg">📁 Choose from Gallery</Text>
            </TouchableOpacity>

            {/* Info Box */}
            <View className="bg-surface rounded-lg p-4 border border-border">
              <Text className="text-sm font-semibold text-foreground mb-2">Tips for Best Results</Text>
              <Text className="text-xs text-muted leading-relaxed">
                • Take a clear, well-lit photo{'\n'}
                • Include the entire food item{'\n'}
                • Avoid shadows and reflections{'\n'}
                • One food item per photo
              </Text>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // Camera State
  if (scanState === 'camera') {
    return (
      <View style={{ flex: 1, backgroundColor: 'black' }}>
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing="back"
        >
          <View className="flex-1 flex-col justify-end p-8 pb-12 gap-6">
            <TouchableOpacity
              onPress={capturePhoto}
              className="self-center w-20 h-20 bg-white rounded-full border-4 border-gray-300 items-center justify-center"
            >
              <View className="w-16 h-16 bg-white rounded-full border-2 border-black" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setScanState('ready')}
              className="self-center"
            >
              <Text className="text-white text-lg font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  // Preview State - Show Image
  if (scanState === 'preview') {
    return (
      <ScreenContainer className="p-4">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View className="gap-4 pb-8">
            {/* Header */}
            <Text className="text-2xl font-bold text-foreground">Review Photo</Text>

            {/* Image Preview */}
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                className="w-full h-64 rounded-lg bg-surface"
                resizeMode="cover"
              />
            )}

            {/* Analyze Button */}
            <TouchableOpacity
              onPress={handleAnalyzeFood}
              disabled={isLoading}
              className="bg-primary rounded-lg py-3 px-4 items-center"
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">Analyze Food</Text>
              )}
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={() => {
                setSelectedImage(null);
                setScanState('ready');
              }}
              className="bg-surface border border-border rounded-lg py-3 px-4 items-center"
            >
              <Text className="text-foreground font-semibold text-base">Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // Analyzing State - Loading
  if (scanState === 'analyzing') {
    return (
      <ScreenContainer className="items-center justify-center">
        <View className="gap-4 items-center">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="text-lg font-semibold text-foreground">Analyzing Food...</Text>
          <Text className="text-sm text-muted">This may take a few seconds</Text>
        </View>
      </ScreenContainer>
    );
  }

  // Result State - Show Prediction
  if (scanState === 'result' && prediction) {
    const nutritionInfo = getNutritionInfo(prediction.label);
    const totalCalories = nutritionInfo.calories * quantity;

    return (
      <ScreenContainer className="p-4">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View className="gap-4 pb-8">
            {/* Header */}
            <Text className="text-2xl font-bold text-foreground">Food Identified</Text>

            {/* Image */}
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                className="w-full h-48 rounded-lg bg-surface"
                resizeMode="cover"
              />
            )}

            {/* Prediction Result */}
            <View className="bg-surface rounded-lg p-4 border border-border">
              <Text className="text-sm text-muted mb-1">Detected Food</Text>
              <Text className="text-2xl font-bold text-primary mb-2">
                {formatFoodLabel(prediction.label)}
              </Text>
              <Text className="text-xs text-muted">
                Confidence: {(prediction.confidence * 100).toFixed(1)}%
              </Text>
            </View>

            {/* Nutrition Info */}
            <View className="bg-surface rounded-lg p-4 border border-border">
              <Text className="text-sm font-semibold text-foreground mb-2">Nutrition Info</Text>
              <Text className="text-xs text-muted mb-1">Per {nutritionInfo.unit}</Text>
              <Text className="text-xl font-bold text-primary">{nutritionInfo.calories} kcal</Text>
            </View>

            {/* Quantity Selector */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Quantity</Text>
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  className="bg-surface border border-border rounded-lg px-4 py-2"
                >
                  <Text className="text-foreground font-semibold">−</Text>
                </TouchableOpacity>
                <View className="flex-1 bg-surface border border-border rounded-lg py-2 items-center">
                  <Text className="text-foreground font-semibold">{quantity}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setQuantity(quantity + 1)}
                  className="bg-surface border border-border rounded-lg px-4 py-2"
                >
                  <Text className="text-foreground font-semibold">+</Text>
                </TouchableOpacity>
              </View>
              <Text className="text-xs text-muted text-center">
                Total: {totalCalories} kcal
              </Text>
            </View>

            {/* Log Meal Button */}
            <TouchableOpacity
              onPress={handleLogMeal}
              className="bg-success rounded-lg py-3 px-4 items-center"
            >
              <Text className="text-white font-semibold text-base">Log This Meal</Text>
            </TouchableOpacity>

            {/* Back Button */}
            <TouchableOpacity
              onPress={() => {
                setSelectedImage(null);
                setPrediction(null);
                setQuantity(1);
                setScanState('ready');
              }}
              className="bg-surface border border-border rounded-lg py-3 px-4 items-center"
            >
              <Text className="text-foreground font-semibold text-base">Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return null;
}
