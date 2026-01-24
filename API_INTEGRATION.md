# NutriVision API Integration Guide

This document describes how to integrate the NutriVision mobile app with your existing Python backend services for food classification, calorie logic, and Gemini coaching.

---

## Overview

The NutriVision app integrates with three main backend services:

1. **Keras Food Classification Model** - Image-to-food-label prediction
2. **Calorie Logic Service** - TDEE calculation and nutrition data lookup
3. **Gemini Coaching Service** - AI-powered personalized nutrition tips

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    NutriVision Mobile App                   │
│                    (React Native/Expo)                      │
└────────────┬────────────────────────────────────────────────┘
             │
    ┌────────┴────────┬────────────────┬──────────────────┐
    │                 │                │                  │
    ▼                 ▼                ▼                  ▼
┌─────────┐    ┌──────────┐    ┌──────────────┐    ┌──────────┐
│ Profile │    │  Scan    │    │  Dashboard   │    │ Coaching │
│ Setup   │    │  Food    │    │  & Tracking  │    │  Tips    │
└─────────┘    └──────────┘    └──────────────┘    └──────────┘
    │                │                │                  │
    │                ▼                │                  │
    │          ┌──────────────┐       │                  │
    │          │ Model API    │       │                  │
    │          │ (Keras .h5)  │       │                  │
    │          └──────────────┘       │                  │
    │                                 │                  │
    └──────────────────────┬──────────┴──────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
┌──────────────────────┐          ┌──────────────────────┐
│  Calorie Logic       │          │  Gemini API          │
│  (calorie_logic.py)  │          │  (gemini_coach.py)   │
└──────────────────────┘          └──────────────────────┘
        │                                     │
        ▼                                     ▼
┌──────────────────────┐          ┌──────────────────────┐
│ food_labels.json     │          │ Google Gemini API    │
│ (Nutrition Data)     │          │ (gemini-2.5-flash)   │
└──────────────────────┘          └──────────────────────┘
```

---

## Backend Service Setup

### 1. Keras Food Classification Model API

**Purpose**: Classify food images and return predicted food labels.

**Setup Instructions**:

1. Create a Flask/FastAPI server that wraps your Keras `.h5` model:

```python
from flask import Flask, request, jsonify
import tensorflow as tf
import json
import base64
from io import BytesIO
from PIL import Image
import numpy as np

app = Flask(__name__)

# Load your trained Keras model
model = tf.keras.models.load_model('your_model.h5')

# Load class labels
with open('food_labels.json', 'r') as f:
    labels = json.load(f)

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict food label from image.
    
    Accepts:
    - multipart/form-data with 'image' file
    - JSON with 'image_base64' (base64 encoded image)
    
    Returns:
    {
        "label": "pizza",
        "confidence": 0.95
    }
    """
    try:
        # Handle file upload
        if 'image' in request.files:
            image_file = request.files['image']
            image = Image.open(image_file.stream)
        # Handle base64
        elif 'image_base64' in request.form:
            image_data = base64.b64decode(request.form['image_base64'])
            image = Image.open(BytesIO(image_data))
        else:
            return jsonify({"error": "No image provided"}), 400
        
        # Preprocess image for your model
        image = image.resize((224, 224))  # Adjust to your model's input size
        image_array = np.array(image) / 255.0
        image_array = np.expand_dims(image_array, axis=0)
        
        # Make prediction
        predictions = model.predict(image_array)
        predicted_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_idx])
        predicted_label = labels[str(predicted_idx)]
        
        return jsonify({
            "label": predicted_label,
            "confidence": confidence
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

**API Endpoint**:
- **URL**: `POST /predict`
- **Request**: Multipart form data with image file or base64 encoded image
- **Response**:
  ```json
  {
    "label": "pizza",
    "confidence": 0.92
  }
  ```

**Environment Variable**:
```bash
EXPO_PUBLIC_MODEL_API_URL=http://your-server:5000
```

---

### 2. Calorie Logic Service

**Purpose**: Provide TDEE calculation and nutrition data lookup.

**Implementation**: The calorie logic is already embedded in the mobile app (`lib/nutrition-logic.ts`). This service is optional if you want to centralize calculations.

**Optional Flask Wrapper**:

```python
from flask import Flask, request, jsonify
from calorie_logic import calculate_bmr, calculate_tdee, get_nutrition_info

app = Flask(__name__)

@app.route('/calculate-tdee', methods=['POST'])
def calculate_tdee_endpoint():
    """
    Calculate TDEE from user profile.
    
    Request:
    {
        "gender": "male",
        "weight_kg": 80,
        "height_cm": 180,
        "age": 25,
        "activity_level": "moderately_active"
    }
    
    Response:
    {
        "bmr": 1700,
        "tdee": 2635
    }
    """
    data = request.json
    bmr = calculate_bmr(data['gender'], data['weight_kg'], data['height_cm'], data['age'])
    tdee = calculate_tdee(bmr, data['activity_level'])
    return jsonify({"bmr": bmr, "tdee": tdee})

@app.route('/nutrition-info/<food_label>', methods=['GET'])
def get_nutrition_endpoint(food_label):
    """
    Get nutrition info for a food label.
    
    Response:
    {
        "calories": 266,
        "unit": "slice"
    }
    """
    info = get_nutrition_info(food_label)
    return jsonify(info)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002)
```

**Note**: The mobile app currently calculates TDEE locally using the embedded logic. The server endpoint is optional for future enhancements.

---

### 3. Gemini Coaching Service

**Purpose**: Generate personalized nutrition coaching tips using Google Gemini API.

**Setup Instructions**:

1. Create a Flask/FastAPI server that wraps the Gemini API:

```python
from flask import Flask, request, jsonify
from google import genai
import os

app = Flask(__name__)

# Configure Gemini API
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

@app.route('/coaching', methods=['POST'])
def get_coaching_tip():
    """
    Generate personalized coaching tip.
    
    Request:
    {
        "user_tdee": 2500,
        "calories_consumed_so_far": 1200,
        "detected_food_label": "hamburger",
        "detected_food_calories": 500,
        "user_goal": "maintain"
    }
    
    Response:
    {
        "coaching_tip": "Great job! You have 800 kcal left for the day..."
    }
    """
    try:
        data = request.json
        
        # Build context
        current_total = data['calories_consumed_so_far'] + data['detected_food_calories']
        calories_remaining = data['user_tdee'] - current_total
        
        system_instruction = (
            "You are NutriVision, a helpful, encouraging, and concise AI Nutritionist. "
            "Your goal is to provide a 1-2 sentence reaction to the user's food choice based on their daily limits. "
            "Do not be judgmental. Be practical. If they have very few calories left, suggest a light dinner. "
            "If they have plenty, encourage them."
        )
        
        user_context = f"""
        User Stats:
        - Daily Calorie Target (TDEE): {data['user_tdee']} kcal
        - Calories Consumed Before This: {data['calories_consumed_so_far']} kcal
        - Just Ate: {data['detected_food_label']} (~{data['detected_food_calories']} kcal)
        - New Total Consumed: {current_total} kcal
        - Calories Remaining: {calories_remaining} kcal
        - Goal: {data['user_goal']} weight
        
        Based on this, give a specific recommendation for the rest of the day.
        """
        
        full_prompt = system_instruction + "\n\n" + user_context
        
        response = client.models.generate_content(
            model='gemini-2.5-flash-lite',
            contents=full_prompt
        )
        
        return jsonify({"coaching_tip": response.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
```

**API Endpoint**:
- **URL**: `POST /coaching`
- **Request**:
  ```json
  {
    "user_tdee": 2500,
    "calories_consumed_so_far": 1200,
    "detected_food_label": "hamburger",
    "detected_food_calories": 500,
    "user_goal": "maintain"
  }
  ```
- **Response**:
  ```json
  {
    "coaching_tip": "Great job! You have 800 kcal left for the day..."
  }
  ```

**Environment Variables**:
```bash
GEMINI_API_KEY=your-gemini-api-key
EXPO_PUBLIC_GEMINI_API_URL=http://your-server:5001
```

---

## Mobile App Configuration

### Environment Variables

Create a `.env.local` file in the project root (or use Manus Settings → Secrets):

```env
EXPO_PUBLIC_MODEL_API_URL=http://your-server:5000
EXPO_PUBLIC_GEMINI_API_URL=http://your-server:5001
```

For development with local services:
```env
EXPO_PUBLIC_MODEL_API_URL=http://localhost:5000
EXPO_PUBLIC_GEMINI_API_URL=http://localhost:5001
```

### API Client Usage

The app uses `lib/api-client.ts` to handle all API calls:

```typescript
import { apiClient } from '@/lib/api-client';

// Predict food from image
const prediction = await apiClient.predictFood(imageUri);
// Returns: { label: "pizza", confidence: 0.92 }

// Get coaching tip
const coaching = await apiClient.getCoachingTip(
  2500,      // user_tdee
  1200,      // calories_consumed_so_far
  "pizza",   // detected_food_label
  500,       // detected_food_calories
  "maintain" // user_goal
);
// Returns: { coaching_tip: "..." }
```

---

## Data Flow

### Profile Setup Flow

1. User enters: weight, height, age, gender, activity level
2. App calculates: BMR (Mifflin-St Jeor) → TDEE (BMR × activity multiplier)
3. App stores: Profile in AsyncStorage
4. Profile used for: Daily calorie target, coaching context

### Food Logging Flow

1. User captures/uploads image
2. App sends image to Model API (`/predict`)
3. Model returns: food label + confidence
4. App looks up nutrition from embedded `food_labels.json` mapping
5. App stores meal in AsyncStorage
6. App calls Gemini API (`/coaching`) with current stats
7. App displays: Predicted food, calories, coaching tip

### Dashboard Flow

1. App retrieves: Today's meals from AsyncStorage
2. App calculates: Total calories, macros, remaining calories
3. App calls Gemini API for updated coaching tip (on refresh)
4. App displays: Progress, macro breakdown, meal list, coaching tip

---

## Error Handling

The app includes fallback behavior for API failures:

- **Model API unavailable**: Shows error alert, allows retry
- **Gemini API unavailable**: Shows generic coaching tip instead of failing
- **Network issues**: Displays connection error with retry option

---

## Testing

### Local Development

1. Start your backend services:
   ```bash
   # Terminal 1: Keras Model API
   python app.py  # port 5000
   
   # Terminal 2: Gemini Coaching API
   python gemini_server.py  # port 5001
   ```

2. Update `.env.local`:
   ```env
   EXPO_PUBLIC_MODEL_API_URL=http://localhost:5000
   EXPO_PUBLIC_GEMINI_API_URL=http://localhost:5001
   ```

3. Run the app:
   ```bash
   pnpm dev
   ```

4. Test the flows:
   - Profile Setup: Enter data, verify TDEE calculation
   - Scan Food: Upload test image, verify model prediction
   - Dashboard: Log meals, verify coaching tips

### Production Deployment

1. Deploy backend services to your server
2. Update environment variables with production URLs
3. Ensure CORS is properly configured on backend
4. Test all API endpoints with production URLs

---

## API Response Examples

### Successful Food Prediction
```json
{
  "label": "pizza",
  "confidence": 0.92
}
```

### Successful Coaching Tip
```json
{
  "coaching_tip": "Great choice! Pizza is delicious. With 500 kcal logged, you still have 1,500 kcal left for the day. Consider a light dinner with plenty of vegetables to balance your macros."
}
```

### Nutrition Info Lookup
```json
{
  "calories": 266,
  "unit": "slice"
}
```

---

## Troubleshooting

### "Failed to predict food" Error
- Check Model API is running on correct port
- Verify image format is supported (JPEG, PNG)
- Check network connectivity to backend

### "Failed to get coaching tip" Error
- Check Gemini API is running
- Verify GEMINI_API_KEY is set
- Check Google Gemini API quota

### CORS Issues
- Ensure backend includes proper CORS headers:
  ```python
  from flask_cors import CORS
  CORS(app)
  ```

### Image Upload Issues
- Ensure image size is reasonable (< 5MB)
- Verify image format is JPEG or PNG
- Check file permissions on backend

---

## Future Enhancements

1. **Cloud Sync**: Store user profiles and meal logs on backend
2. **User Authentication**: Implement user accounts and login
3. **Advanced Analytics**: Weekly/monthly nutrition reports
4. **Macro Targets**: Personalized macro recommendations
5. **Food Database**: Expand nutrition data beyond Food-101
6. **Offline Mode**: Cache predictions and coaching tips locally

---

## Support

For issues or questions about API integration:

1. Check the API response status codes
2. Review server logs for errors
3. Verify environment variables are set correctly
4. Test API endpoints directly using curl or Postman
5. Check network connectivity between app and backend

---

## Security Considerations

1. **API Keys**: Never commit API keys to version control
2. **HTTPS**: Use HTTPS for production APIs
3. **Rate Limiting**: Implement rate limiting on backend
4. **Input Validation**: Validate all user inputs on backend
5. **CORS**: Restrict CORS to trusted origins
6. **Authentication**: Consider adding API key authentication for production

---

## References

- [Keras Model Loading](https://www.tensorflow.org/guide/keras_saving)
- [Google Gemini API](https://ai.google.dev/)
- [Expo Image Picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- [AsyncStorage](https://react-native-async-storage.github.io/)
- [Axios HTTP Client](https://axios-http.com/)
