# NutriVision App - Development TODO

## Core Features

### Profile Setup Screen
- [x] Create ProfileSetupScreen component
- [x] Implement weight, height, age input fields
- [x] Implement gender selector (Male/Female/Other)
- [x] Implement activity level selector (5 levels)
- [x] Integrate TDEE calculation logic (BMR + activity multiplier)
- [x] Add form validation
- [x] Persist profile to AsyncStorage
- [x] Display calculated TDEE result

### Dashboard Screen
- [x] Create DashboardScreen component
- [x] Display circular progress indicator (calories vs. TDEE)
- [x] Display calories remaining badge
- [x] Display macro breakdown (Protein, Carbs, Fats)
- [x] Display list of logged meals for today
- [x] Implement meal deletion functionality
- [x] Integrate Gemini coaching API
- [x] Display personalized coaching tip
- [ ] Add weekly trends visualization (optional)
- [ ] Implement daily reset at midnight

### Scan Food Screen
- [x] Create ScanFoodScreen component
- [x] Integrate camera functionality (Expo Camera)
- [x] Add photo gallery selection option
- [x] Display image preview after capture/selection
- [x] Integrate Keras model API for food classification
- [x] Display predicted food label and confidence
- [x] Display calorie information from food_labels.json
- [x] Add "Log This Meal" button
- [x] Handle loading states during model inference
- [x] Handle API errors gracefully

### Navigation
- [x] Create bottom tab bar with 3 tabs (Dashboard, Scan, Profile)
- [x] Configure tab icons (home, camera, user)
- [x] Implement tab navigation logic
- [x] Ensure proper screen transitions

### Data & Storage
- [x] Create AsyncStorage helper functions for profile persistence
- [x] Create meal log data structure
- [x] Implement daily meal log retrieval
- [x] Implement meal deletion from log
- [x] Create daily summary calculation (total calories, macros)

### API Integration
- [x] Create axios/fetch wrapper for API calls
- [x] Implement Keras model API integration
- [x] Implement Gemini coaching API integration
- [x] Handle API errors and timeouts
- [x] Add loading indicators for all API calls

### Styling & UI
- [x] Apply NativeWind (Tailwind) styling to all screens
- [x] Ensure responsive design for different screen sizes
- [x] Implement dark mode support
- [x] Add proper spacing and typography
- [x] Ensure accessibility (contrast, font sizes, labels)

### Testing & Polish
- [ ] Test end-to-end user flows
- [ ] Test on iOS and Android
- [ ] Test on web (if applicable)
- [ ] Handle edge cases (no profile, no meals, API failures)
- [ ] Add error boundaries and fallback UI
- [ ] Performance optimization (memoization, lazy loading)

## Branding
- [x] Generate custom app logo
- [x] Update app.config.ts with app name and logo URL
- [x] Create splash screen assets
- [x] Create app icon assets (iOS, Android)

## Documentation
- [x] Create API integration documentation
- [x] Create comprehensive README
- [x] Document environment variables and configuration
- [ ] Create user guide (optional)

## Deployment
- [ ] Create checkpoint before delivery
- [ ] Test app on real devices
- [ ] Prepare for publishing to app stores
