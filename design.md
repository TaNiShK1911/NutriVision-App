# NutriVision Mobile App - Design Document

## Overview

NutriVision is a cross-platform mobile app that combines AI-powered food image recognition with personalized nutrition coaching. Users set up their profile, scan food images to log meals, and receive real-time coaching tips based on their daily calorie targets and macro goals.

---

## Screen List

### 1. **Profile Setup Screen**
   - **Purpose**: Collect user biometric data to calculate TDEE (Total Daily Energy Expenditure)
   - **Content**:
     - Weight input (kg)
     - Height input (cm)
     - Age input (years)
     - Gender selector (Male/Female/Other)
     - Activity level selector (Sedentary, Lightly Active, Moderately Active, Very Active, Super Active)
     - "Calculate TDEE" button
   - **Functionality**: 
     - Validates all inputs
     - Calculates BMR using Mifflin-St Jeor equation
     - Calculates TDEE based on activity level
     - Saves profile to local storage
     - Shows calculated TDEE result

### 2. **Dashboard Screen**
   - **Purpose**: Display daily calorie progress, macro breakdown, and coaching tips
   - **Content**:
     - Today's date
     - Circular progress indicator (calories consumed vs. TDEE)
     - Calories remaining badge
     - Macro breakdown (Protein, Carbs, Fats) as horizontal bars
     - List of logged meals for today with timestamps
     - AI coaching tip from Gemini (updated after each meal)
     - Weekly trends chart (optional: simple bar chart of daily calorie totals)
   - **Functionality**:
     - Displays real-time calorie and macro tracking
     - Fetches coaching tips from Gemini API
     - Allows deletion of logged meals
     - Resets daily data at midnight

### 3. **Scan Food Screen**
   - **Purpose**: Capture or upload food images for classification
   - **Content**:
     - Camera preview or upload button
     - Capture button (camera) or "Choose from Gallery" button
     - Image preview after capture/selection
     - "Analyze Food" button
     - Loading indicator during model inference
     - Predicted food label with confidence
     - Calorie and unit information
     - "Log This Meal" button
   - **Functionality**:
     - Uses device camera or photo library
     - Sends image to Keras model API for classification
     - Displays predicted food label and calories
     - Allows user to confirm and log the meal
     - Updates dashboard with new meal data

---

## Primary Content and Functionality

### Profile Setup Flow
- User enters biometric data (weight, height, age, gender, activity level)
- App calculates BMR using Mifflin-St Jeor equation
- App calculates TDEE by multiplying BMR by activity level multiplier
- TDEE is saved to local storage and used for all future calculations
- User can edit profile anytime

### Dashboard Flow
- Displays today's calorie consumption vs. TDEE target
- Shows macro breakdown (protein, carbs, fats) as percentage of daily target
- Lists all meals logged today with timestamps
- Fetches personalized coaching tip from Gemini based on:
  - User's TDEE
  - Total calories consumed so far
  - Most recently logged meal
  - User's goal (maintain, lose, gain)
- Coaching tip updates after each new meal is logged

### Scan Food Flow
- User opens camera or selects image from gallery
- Image is sent to Keras model API endpoint
- Model returns predicted food label (e.g., "pizza", "hamburger")
- App looks up calorie information from food_labels.json mapping
- User confirms and logs the meal
- Dashboard updates with new meal data
- Gemini coaching tip is regenerated

---

## Key User Flows

### Flow 1: Initial Setup
1. User opens app for the first time
2. Redirected to Profile Setup screen
3. Enters weight, height, age, gender, activity level
4. Taps "Calculate TDEE"
5. App shows calculated TDEE (e.g., "Your daily target: 2,500 kcal")
6. User taps "Save Profile"
7. Redirected to Dashboard (empty state for first day)

### Flow 2: Log a Meal
1. User taps "Scan Food" tab
2. Taps camera icon to capture food image
3. Image preview shown
4. Taps "Analyze Food"
5. Loading indicator appears
6. Model returns prediction (e.g., "pizza - 266 kcal per slice")
7. User confirms quantity/portion (default: 1 serving)
8. Taps "Log This Meal"
9. Redirected to Dashboard
10. New meal appears in meal list
11. Calorie progress updates
12. Gemini coaching tip regenerates

### Flow 3: View Daily Progress
1. User opens Dashboard tab
2. Sees circular progress (e.g., "1,200 / 2,500 kcal")
3. Sees macro breakdown (Protein: 45g, Carbs: 120g, Fats: 35g)
4. Sees list of logged meals
5. Reads personalized coaching tip (e.g., "Great job! You have 1,300 kcal left. Consider a light dinner with lean protein.")
6. Can delete meals by swiping or tapping delete icon

### Flow 4: Edit Profile
1. User taps Profile tab
2. Taps "Edit Profile" button
3. Updates any biometric data
4. Taps "Recalculate TDEE"
5. New TDEE is saved
6. Dashboard updates with new target

---

## Color Choices

### Brand Colors
- **Primary**: `#4F46E5` (Indigo) - Used for buttons, progress indicators, and key CTAs
- **Secondary**: `#10B981` (Emerald) - Used for success states and positive feedback
- **Accent**: `#F59E0B` (Amber) - Used for warnings and calorie alerts
- **Background**: `#FFFFFF` (Light mode) / `#0F172A` (Dark mode)
- **Surface**: `#F8FAFC` (Light mode) / `#1E293B` (Dark mode)
- **Text**: `#1E293B` (Light mode) / `#F1F5F9` (Dark mode)

### Semantic Colors
- **Success**: `#10B981` (Green) - Meal logged, TDEE calculated
- **Warning**: `#F59E0B` (Amber) - Approaching calorie limit
- **Error**: `#EF4444` (Red) - Over calorie limit, invalid input
- **Info**: `#3B82F6` (Blue) - Loading, tips, information

---

## Navigation Structure

- **Bottom Tab Bar** (3 tabs):
  1. **Dashboard** - Home icon, shows daily progress
  2. **Scan** - Camera icon, food image capture/upload
  3. **Profile** - User icon, profile setup/editing

---

## Data Models

### User Profile
```
{
  weight_kg: number,
  height_cm: number,
  age: number,
  gender: "male" | "female" | "other",
  activity_level: "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "super_active",
  bmr: number,
  tdee: number,
  goal: "lose" | "maintain" | "gain"
}
```

### Meal Log Entry
```
{
  id: string,
  date: string (YYYY-MM-DD),
  time: string (HH:MM),
  food_label: string,
  calories: number,
  quantity: number,
  unit: string
}
```

### Daily Summary
```
{
  date: string (YYYY-MM-DD),
  total_calories: number,
  total_protein: number,
  total_carbs: number,
  total_fats: number,
  meals: MealLogEntry[]
}
```

---

## API Integration Points

### 1. Keras Model API
- **Endpoint**: `POST /api/predict` (user's deployed model server)
- **Input**: Image file (multipart/form-data)
- **Output**: `{ label: string, confidence: number }`

### 2. Calorie Logic
- **Function**: `calculate_tdee(bmr, activity_level)` → number
- **Function**: `get_nutrition_info(food_label)` → { calories: number, unit: string }

### 3. Gemini Coaching API
- **Endpoint**: `POST /api/coaching` (or direct Gemini API call)
- **Input**: `{ user_tdee, calories_consumed, food_label, food_calories, user_goal }`
- **Output**: `{ coaching_tip: string }`

---

## UI/UX Principles

- **Mobile-first**: All layouts optimized for portrait orientation (9:16)
- **One-handed usage**: Key buttons positioned within thumb reach
- **Minimal friction**: Reduce taps to log a meal (camera → preview → log)
- **Real-time feedback**: Show loading states, success confirmations, and error messages
- **Accessibility**: High contrast, readable font sizes, clear labels
- **Consistency**: Use the same color palette and component styles across all screens

---

## Technical Considerations

- **Local Storage**: Profile and meal logs stored in AsyncStorage (no cloud sync required)
- **Camera Integration**: Use Expo Camera for cross-platform support
- **Image Upload**: Support both camera capture and gallery selection
- **API Calls**: Use axios or fetch for HTTP requests to backend services
- **State Management**: React Context + useState for profile and meal data
- **Styling**: NativeWind (Tailwind CSS) for consistent, responsive design
