# NutriVision App

NutriVision is a cross-platform mobile application built with React Native and Expo that leverages AI for food image recognition and provides personalized nutrition tracking and coaching. Users can log meals by scanning food images, track calories against a personalized TDEE (Total Daily Energy Expenditure) goal, and receive AI-generated coaching tips.

---

## 🚀 Features

- **Dashboard**
  - Real-time calorie tracking with progress indicators
  - Macro breakdown (protein, carbs, fats)
  - List of logged meals and AI coaching tips
- **Scan Food**
  - Capture or upload images
  - AI classification via a Keras model
  - Calorie lookup and portion adjustment
  - One-tap meal logging
- **Profile Setup**
  - Biometrics, activity level, and goals
  - Automatic BMR & TDEE calculation
  - Persistent profile data

---

## 🧱 Tech Stack

- **Frontend:** React Native (Expo), TypeScript, NativeWind
- **State:** React Context + AsyncStorage
- **Backend APIs:**
  - Keras model served via Flask/FastAPI
  - Google Gemini for coaching tips
- **Utilities:** Axios, Expo Camera, Expo Image Picker

---

## 🛠 Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Expo CLI
- iOS Simulator or Android Emulator (or physical device with Expo Go)

### Installation

```bash
git clone https://github.com/TaNiShK1911/NutriVision-App.git
cd NutriVision-App
pnpm install
```

Create a `.env.local` with:

```env
EXPO_PUBLIC_MODEL_API_URL=http://localhost:5000
EXPO_PUBLIC_GEMINI_API_URL=http://localhost:5001
```

Start the development server:

```bash
pnpm dev
```

Open on device:

- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan the QR code with Expo Go for a physical device

---

## 📂 Project Structure

```text
app/                # Expo Router screens
components/         # UI components
lib/                # Business logic & helpers
constants/           # Shared constants
hooks/              # Custom React hooks
backend/            # Python servers & tests
server/             # Node API routes & utilities
shared/             # Shared types & utilities
assets/             # Images and static assets
```

Refer to `README_NUTRIVISION.md` for a more detailed overview of each folder and data models.

---

## 📄 Additional Documentation

- [API Integration](API_INTEGRATION.md)
- [Design notes](design.md)
- [Deployment instructions](DEPLOYMENT.md)
- [Backend quick start](backend_examples/QUICK_START.md)

---

## 📝 License

This repository is licensed under the terms defined in the project. (Add license details if applicable.)
