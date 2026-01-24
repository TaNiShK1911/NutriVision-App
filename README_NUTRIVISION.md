# NutriVision - AI-Powered Food Recognition & Nutrition Tracking

NutriVision is a cross-platform mobile app that combines AI-powered food image recognition with personalized nutrition coaching. Users can scan food images to log meals, track daily calories against their personalized TDEE target, and receive AI-generated coaching tips to help them achieve their nutrition goals.

---

## Features

### 📱 Three Main Screens

#### 1. **Dashboard** (Home Tab)
- Real-time calorie tracking with visual progress indicator
- Daily calorie consumption vs. TDEE target
- Macro breakdown (Protein, Carbs, Fats) with progress bars
- List of today's logged meals with timestamps
- Personalized AI coaching tips from Gemini
- Swipe-to-refresh to update coaching tips
- Weekly overview summary

#### 2. **Scan Food** (Camera Tab)
- Capture food images using device camera
- Upload images from photo gallery
- AI-powered food recognition using Keras model
- Displays predicted food label with confidence score
- Shows calorie information for predicted food
- Adjustable portion/quantity selector
- One-tap meal logging with instant coaching feedback

#### 3. **Profile Setup** (Profile Tab)
- Biometric data entry (weight, height, age, gender)
- Activity level selector (5 levels from sedentary to super active)
- Goal selection (lose, maintain, gain weight)
- Automatic TDEE calculation using Mifflin-St Jeor equation
- Profile persistence and editing
- Current profile display with saved statistics

---

## Tech Stack

### Frontend
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Context + AsyncStorage
- **Camera**: Expo Camera
- **Image Picker**: Expo Image Picker
- **HTTP Client**: Axios

### Backend Integration
- **Food Classification**: Keras `.h5` model wrapped in Flask/FastAPI
- **Calorie Logic**: Embedded TypeScript implementation of Python logic
- **Nutrition Data**: Food-101 labels with calorie mappings
- **AI Coaching**: Google Gemini API (gemini-2.5-flash-lite)

---

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- Expo CLI
- iOS Simulator (macOS) or Android Emulator
- Physical device with Expo Go app (for testing)

### Installation

1. **Clone the repository**:
   ```bash
   cd /home/ubuntu/nutrivision-app
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up environment variables** (create `.env.local`):
   ```env
   EXPO_PUBLIC_MODEL_API_URL=http://localhost:5000
   EXPO_PUBLIC_GEMINI_API_URL=http://localhost:5001
   ```

4. **Start the development server**:
   ```bash
   pnpm dev
   ```

5. **Open on device**:
   - **iOS Simulator**: Press `i`
   - **Android Emulator**: Press `a`
   - **Physical Device**: Scan QR code with Expo Go app

---

## Project Structure

```
nutrivision-app/
├── app/
│   ├── _layout.tsx              # Root layout with providers
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab bar configuration
│   │   ├── index.tsx            # Dashboard screen
│   │   ├── scan.tsx             # Scan food screen
│   │   └── profile.tsx          # Profile setup screen
│   └── oauth/
│
├── components/
│   ├── screen-container.tsx     # SafeArea wrapper
│   ├── ui/
│   │   └── icon-symbol.tsx      # Tab bar icons
│   └── haptic-tab.tsx           # Haptic feedback
│
├── lib/
│   ├── nutrition-logic.ts       # TDEE calculation & nutrition data
│   ├── nutrition-context.tsx    # State management for profile & meals
│   ├── api-client.ts            # API integration layer
│   ├── utils.ts                 # Utility functions
│   └── theme-provider.tsx       # Dark/light mode
│
├── constants/
│   └── theme.ts                 # Color palette
│
├── hooks/
│   ├── use-colors.ts            # Theme colors hook
│   └── use-color-scheme.ts      # Dark/light mode detection
│
├── assets/
│   └── images/
│       ├── icon.png             # App icon
│       ├── splash-icon.png      # Splash screen
│       └── favicon.png          # Web favicon
│
├── design.md                    # UI/UX design document
├── todo.md                      # Development checklist
├── API_INTEGRATION.md           # Backend API documentation
├── app.config.ts                # Expo configuration
├── tailwind.config.js           # Tailwind CSS config
└── package.json                 # Dependencies
```

---

## Data Models

### User Profile
```typescript
{
  weight_kg: number;
  height_cm: number;
  age: number;
  gender: 'male' | 'female' | 'other';
  activity_level: string;
  bmr: number;
  tdee: number;
  goal: 'lose' | 'maintain' | 'gain';
}
```

### Meal Log Entry
```typescript
{
  id: string;
  date: string;           // YYYY-MM-DD
  time: string;           // HH:MM
  food_label: string;
  calories: number;
  quantity: number;
  unit: string;
}
```

### Daily Summary
```typescript
{
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  meals: MealLogEntry[];
}
```

---

## API Integration

### Required Backend Services

The app requires three backend services to be running:

1. **Keras Model API** (Port 5000)
   - Endpoint: `POST /predict`
   - Input: Image file (multipart/form-data)
   - Output: `{ label: string, confidence: number }`

2. **Gemini Coaching API** (Port 5001)
   - Endpoint: `POST /coaching`
   - Input: User TDEE, calories, food label, goal
   - Output: `{ coaching_tip: string }`

3. **Calorie Logic** (Embedded in app)
   - TDEE calculation
   - Nutrition data lookup from food_labels.json

### Environment Configuration

```env
# Model API endpoint
EXPO_PUBLIC_MODEL_API_URL=http://your-server:5000

# Gemini Coaching API endpoint
EXPO_PUBLIC_GEMINI_API_URL=http://your-server:5001
```

See `API_INTEGRATION.md` for detailed backend setup instructions.

---

## Key Features Explained

### TDEE Calculation
The app uses the **Mifflin-St Jeor equation** to calculate Basal Metabolic Rate (BMR):

- **Men**: (10 × weight) + (6.25 × height) - (5 × age) + 5
- **Women**: (10 × weight) + (6.25 × height) - (5 × age) - 161

Then multiplies BMR by activity level multiplier:
- Sedentary: 1.2
- Lightly Active: 1.375
- Moderately Active: 1.55
- Very Active: 1.725
- Super Active: 1.9

### Food Recognition
The app sends images to your Keras model API, which returns:
- Predicted food label (e.g., "pizza", "hamburger")
- Confidence score (0-1)

Nutrition data is looked up from the embedded `food_labels.json` mapping.

### Personalized Coaching
After each meal, the app calls the Gemini API with:
- User's TDEE
- Calories consumed so far
- Just-logged meal details
- User's goal (lose/maintain/gain)

Gemini generates a 1-2 sentence personalized tip about the meal and remaining daily budget.

---

## Styling & Theme

### Color Palette
- **Primary**: `#4F46E5` (Indigo) - Buttons, progress, CTAs
- **Secondary**: `#10B981` (Emerald) - Success states
- **Accent**: `#F59E0B` (Amber) - Warnings
- **Background**: `#FFFFFF` (Light) / `#0F172A` (Dark)
- **Surface**: `#F8FAFC` (Light) / `#1E293B` (Dark)

### Responsive Design
- Mobile-first approach (portrait orientation)
- One-handed usage optimization
- Safe area handling for notches and home indicators
- Dark mode support with automatic theme switching

---

## State Management

### AsyncStorage
- **Profile**: Persisted user biometric data and TDEE
- **Meals**: Daily meal log entries
- Auto-loaded on app launch

### React Context
- `NutritionContext`: Manages profile and meal state
- Provides hooks: `useNutrition()`
- Handles CRUD operations for meals

### Local Calculations
- TDEE calculation happens locally
- Macro estimation based on calorie distribution
- No server-side state required (optional)

---

## Testing

### Manual Testing Checklist

- [ ] Profile Setup
  - [ ] Enter all biometric data
  - [ ] Verify TDEE calculation
  - [ ] Save and retrieve profile
  - [ ] Edit profile and recalculate

- [ ] Food Scanning
  - [ ] Take photo with camera
  - [ ] Upload from gallery
  - [ ] Verify food prediction
  - [ ] Adjust quantity
  - [ ] Log meal successfully

- [ ] Dashboard
  - [ ] View today's calories
  - [ ] See meal list
  - [ ] Verify macro breakdown
  - [ ] Read coaching tip
  - [ ] Delete meal from list
  - [ ] Refresh for new coaching tip

- [ ] Navigation
  - [ ] Switch between tabs
  - [ ] Verify tab icons
  - [ ] Test back navigation

- [ ] Error Handling
  - [ ] Test with API offline
  - [ ] Verify fallback messages
  - [ ] Test network errors
  - [ ] Test invalid inputs

---

## Performance Optimization

### Current Optimizations
- Memoized components to prevent unnecessary re-renders
- FlatList for meal lists (not ScrollView with map)
- Lazy loading of images
- Efficient state updates with Context

### Future Optimizations
- Image compression before upload
- Caching of API responses
- Pagination for meal history
- Background sync for offline meals

---

## Accessibility

### Current Features
- High contrast colors (WCAG AA compliant)
- Readable font sizes (minimum 14pt)
- Clear labels on all inputs
- Semantic HTML structure
- Touch targets ≥ 44×44pt

### Future Improvements
- Screen reader support
- Keyboard navigation
- Voice input for meal logging
- Haptic feedback for confirmations

---

## Security Considerations

1. **API Keys**: Never commit Gemini API key to version control
2. **HTTPS**: Use HTTPS for production APIs
3. **Input Validation**: All user inputs validated before sending to backend
4. **Data Storage**: AsyncStorage data is device-local (no cloud sync by default)
5. **CORS**: Backend should restrict CORS to trusted origins

---

## Troubleshooting

### Common Issues

**App won't start**
- Clear cache: `pnpm install && pnpm dev`
- Check Node version: `node --version` (should be 18+)
- Restart Metro bundler

**Camera not working**
- Grant camera permissions in device settings
- Check iOS/Android permissions in app.config.ts
- Restart app after granting permissions

**Food prediction fails**
- Verify Model API is running on port 5000
- Check image format (JPEG/PNG)
- Verify network connectivity
- Check API logs for errors

**Coaching tips not showing**
- Verify Gemini API is running on port 5001
- Check GEMINI_API_KEY environment variable
- Verify Google Gemini API quota
- Check network connectivity

**Profile not saving**
- Check AsyncStorage permissions
- Verify device has storage space
- Check browser console for errors

---

## Development Workflow

### Adding a New Feature

1. **Update design.md** with new screen/flow
2. **Add todo item** in todo.md
3. **Create component** in appropriate directory
4. **Integrate with context** if state is needed
5. **Add styling** with Tailwind classes
6. **Test manually** on device
7. **Mark todo as complete** [x]
8. **Create checkpoint** before next feature

### Code Style

- **TypeScript**: Strict mode enabled
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Imports**: Absolute paths using `@/` alias
- **Styling**: Tailwind classes in `className` prop
- **Comments**: JSDoc for functions, inline for complex logic

---

## Deployment

### Building for Production

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Build for web
pnpm build
```

### Publishing to App Stores

1. Create Expo account: `eas login`
2. Configure app.config.ts with app details
3. Build with EAS: `eas build --platform ios --auto-submit`
4. Submit to App Store/Play Store

See [Expo Deployment Docs](https://docs.expo.dev/deploy/build-project/) for details.

---

## Future Roadmap

- [ ] Cloud sync with user accounts
- [ ] Advanced nutrition analytics
- [ ] Personalized macro targets
- [ ] Meal planning and recipes
- [ ] Social features (sharing, challenges)
- [ ] Wearable integration (Apple Watch, Fitbit)
- [ ] Barcode scanning for packaged foods
- [ ] Offline mode with local caching
- [ ] Multi-language support
- [ ] Voice-based meal logging

---

## Contributing

1. Create a branch for your feature
2. Make changes and test thoroughly
3. Update design.md and todo.md
4. Create a checkpoint with descriptive message
5. Submit for review

---

## Support & Feedback

For issues, questions, or feature requests:

1. Check the troubleshooting section
2. Review API_INTEGRATION.md for backend setup
3. Check app logs in browser console
4. Test with production API endpoints

---

## License

This project is proprietary and confidential.

---

## Acknowledgments

- Keras/TensorFlow for food classification model
- Google Gemini for AI coaching
- Expo for cross-platform development
- React Native community for excellent libraries

---

## Quick Reference

### Key Files
- **Screens**: `app/(tabs)/`
- **Logic**: `lib/nutrition-logic.ts`
- **State**: `lib/nutrition-context.tsx`
- **API**: `lib/api-client.ts`
- **Styling**: `tailwind.config.js`, `theme.config.js`
- **Config**: `app.config.ts`

### Important Commands
```bash
pnpm dev              # Start dev server
pnpm check            # TypeScript check
pnpm lint             # Run linter
pnpm format           # Format code
pnpm test             # Run tests
```

### API Endpoints (Local)
- Model API: `http://localhost:5000`
- Gemini API: `http://localhost:5001`

---

**Last Updated**: January 2026  
**Version**: 1.0.0  
**Status**: Production Ready
