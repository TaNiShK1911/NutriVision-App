# NutriVision - ML Model & Gemini API Integration Guide

This guide walks you through integrating your Keras `.h5` food classification model and Google Gemini API key with the NutriVision mobile app.

---

## Part 1: Setting Up Your Keras Model API Server

### Step 1: Create a Python Backend Server

Create a file called `model_server.py` in your backend directory:

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import json
import base64
from io import BytesIO
from PIL import Image
import numpy as np
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for mobile app

# Load your trained Keras model
MODEL_PATH = 'path/to/your/model.h5'  # Update this path
model = tf.keras.models.load_model(MODEL_PATH)

# Load food labels
LABELS_PATH = 'path/to/food_labels.json'  # Update this path
with open(LABELS_PATH, 'r') as f:
    labels = json.load(f)

# Model configuration (adjust based on your model)
MODEL_INPUT_SIZE = 224  # Change if your model uses different size (e.g., 299 for InceptionV3)
MODEL_INPUT_SHAPE = (MODEL_INPUT_SIZE, MODEL_INPUT_SIZE, 3)  # RGB image

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "model": "loaded"})

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
        "confidence": 0.95,
        "label_id": 76
    }
    """
    try:
        image = None
        
        # Handle file upload (multipart/form-data)
        if 'image' in request.files:
            image_file = request.files['image']
            image = Image.open(image_file.stream).convert('RGB')
        
        # Handle base64 encoded image (JSON)
        elif 'image_base64' in request.form:
            image_data = base64.b64decode(request.form['image_base64'])
            image = Image.open(BytesIO(image_data)).convert('RGB')
        
        # Handle base64 in JSON body
        elif request.is_json:
            data = request.get_json()
            if 'image_base64' in data:
                image_data = base64.b64decode(data['image_base64'])
                image = Image.open(BytesIO(image_data)).convert('RGB')
        
        if image is None:
            return jsonify({"error": "No image provided. Send 'image' file or 'image_base64' string"}), 400
        
        # Preprocess image for your model
        image_resized = image.resize(MODEL_INPUT_SHAPE[:2])
        image_array = np.array(image_resized) / 255.0  # Normalize to 0-1
        image_array = np.expand_dims(image_array, axis=0)  # Add batch dimension
        
        # Make prediction
        predictions = model.predict(image_array, verbose=0)
        predicted_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_idx])
        predicted_label = labels[str(predicted_idx)]
        
        return jsonify({
            "label": predicted_label,
            "confidence": confidence,
            "label_id": int(predicted_idx)
        })
    
    except Exception as e:
        print(f"Error during prediction: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/labels', methods=['GET'])
def get_labels():
    """Get all available food labels"""
    return jsonify({"labels": labels, "count": len(labels)})

@app.route('/info', methods=['GET'])
def get_model_info():
    """Get model information"""
    return jsonify({
        "model_path": MODEL_PATH,
        "input_size": MODEL_INPUT_SIZE,
        "input_shape": MODEL_INPUT_SHAPE,
        "num_classes": len(labels),
        "labels": labels
    })

if __name__ == '__main__':
    print(f"Loading model from: {MODEL_PATH}")
    print(f"Model input size: {MODEL_INPUT_SIZE}x{MODEL_INPUT_SIZE}")
    print(f"Number of classes: {len(labels)}")
    print("Starting Flask server on http://0.0.0.0:5000")
    app.run(host='0.0.0.0', port=5000, debug=False)
```

### Step 2: Install Required Dependencies

```bash
pip install flask flask-cors tensorflow pillow numpy
```

### Step 3: Update Model Path

In `model_server.py`, update these lines with your actual paths:

```python
MODEL_PATH = '/path/to/your/trained/model.h5'  # e.g., '/home/user/models/food_classifier.h5'
LABELS_PATH = '/path/to/food_labels.json'      # e.g., '/home/user/data/food_labels.json'
```

### Step 4: Test the Model Server

```bash
# Start the server
python model_server.py

# In another terminal, test the health endpoint
curl http://localhost:5000/health

# Test prediction with an image file
curl -X POST -F "image=@/path/to/test/image.jpg" http://localhost:5000/predict

# Get model info
curl http://localhost:5000/info
```

### Step 5: Adjust for Your Model

If your model uses different preprocessing, update the `predict()` function:

```python
# Example: If your model expects images in 0-255 range instead of 0-1
image_array = np.array(image_resized)  # Don't divide by 255

# Example: If your model expects different normalization (e.g., ImageNet)
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
image_array = preprocess_input(np.array(image_resized))

# Example: If your model expects grayscale instead of RGB
image = image.convert('L')  # Convert to grayscale
```

---

## Part 2: Setting Up Gemini API Key

### Step 1: Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **"Create API Key"**
3. Select or create a Google Cloud project
4. Copy your API key (keep it secret!)

### Step 2: Create Gemini Coaching Server

Create a file called `gemini_server.py`:

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
import os

app = Flask(__name__)
CORS(app)

# Configure Gemini API
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set!")

client = genai.Client(api_key=GEMINI_API_KEY)

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "service": "gemini-coaching"})

@app.route('/coaching', methods=['POST'])
def get_coaching_tip():
    """
    Generate personalized coaching tip based on user's meal and daily stats.
    
    Request:
    {
        "user_tdee": 2500,
        "calories_consumed_so_far": 1200,
        "detected_food_label": "hamburger",
        "detected_food_calories": 500,
        "user_goal": "maintain",
        "user_name": "John" (optional)
    }
    
    Response:
    {
        "coaching_tip": "Great choice! Pizza is delicious...",
        "status": "success"
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = [
            'user_tdee',
            'calories_consumed_so_far',
            'detected_food_label',
            'detected_food_calories',
            'user_goal'
        ]
        
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Extract data
        user_tdee = data['user_tdee']
        calories_consumed = data['calories_consumed_so_far']
        food_label = data['detected_food_label']
        food_calories = data['detected_food_calories']
        user_goal = data['user_goal']
        user_name = data.get('user_name', 'Friend')
        
        # Calculate state
        current_total = calories_consumed + food_calories
        calories_remaining = user_tdee - current_total
        percentage_consumed = (current_total / user_tdee) * 100
        
        # Build system instruction
        system_instruction = (
            "You are NutriVision, a helpful, encouraging, and concise AI Nutritionist. "
            "Your goal is to provide a 1-2 sentence reaction to the user's food choice based on their daily limits. "
            "Do not be judgmental. Be practical and supportive. "
            "If they have very few calories left (< 300), suggest a light dinner with vegetables. "
            "If they have plenty (> 800), encourage them and suggest balanced options. "
            "Be specific and reference their actual calorie numbers."
        )
        
        # Build user context
        user_context = f"""
        User: {user_name}
        Daily Calorie Target (TDEE): {user_tdee} kcal
        Calories Consumed Before This Meal: {calories_consumed} kcal
        Just Ate: {food_label} (~{food_calories} kcal)
        New Total Consumed: {current_total} kcal ({percentage_consumed:.1f}% of daily target)
        Calories Remaining: {calories_remaining} kcal
        Goal: {user_goal} weight
        
        Based on this, give a specific, encouraging recommendation for the rest of the day.
        Keep it to 1-2 sentences. Be supportive, not judgmental.
        """
        
        full_prompt = system_instruction + "\n\n" + user_context
        
        # Call Gemini API
        response = client.models.generate_content(
            model='gemini-2.5-flash-lite',
            contents=full_prompt
        )
        
        coaching_tip = response.text.strip()
        
        return jsonify({
            "coaching_tip": coaching_tip,
            "status": "success"
        })
    
    except Exception as e:
        print(f"Error generating coaching tip: {str(e)}")
        return jsonify({
            "error": str(e),
            "status": "error",
            "coaching_tip": "Keep up the great work on your nutrition journey!"
        }), 500

@app.route('/coaching/batch', methods=['POST'])
def get_coaching_tips_batch():
    """
    Generate multiple coaching tips (for dashboard updates).
    
    Request:
    {
        "meals": [
            {
                "user_tdee": 2500,
                "calories_consumed_so_far": 1200,
                "detected_food_label": "hamburger",
                "detected_food_calories": 500,
                "user_goal": "maintain"
            },
            ...
        ]
    }
    """
    try:
        data = request.get_json()
        meals = data.get('meals', [])
        
        if not meals:
            return jsonify({"error": "No meals provided"}), 400
        
        results = []
        for meal in meals:
            # Reuse single coaching logic
            coaching_response = get_coaching_tip_internal(meal)
            results.append(coaching_response)
        
        return jsonify({"tips": results, "count": len(results)})
    
    except Exception as e:
        print(f"Error in batch coaching: {str(e)}")
        return jsonify({"error": str(e)}), 500

def get_coaching_tip_internal(data):
    """Internal function for generating coaching tips"""
    try:
        user_tdee = data['user_tdee']
        calories_consumed = data['calories_consumed_so_far']
        food_label = data['detected_food_label']
        food_calories = data['detected_food_calories']
        user_goal = data['user_goal']
        
        current_total = calories_consumed + food_calories
        calories_remaining = user_tdee - current_total
        
        system_instruction = (
            "You are NutriVision, a helpful, encouraging, and concise AI Nutritionist. "
            "Your goal is to provide a 1-2 sentence reaction to the user's food choice based on their daily limits. "
            "Do not be judgmental. Be practical and supportive."
        )
        
        user_context = f"""
        Daily Calorie Target (TDEE): {user_tdee} kcal
        Calories Consumed Before This: {calories_consumed} kcal
        Just Ate: {food_label} (~{food_calories} kcal)
        New Total: {current_total} kcal
        Remaining: {calories_remaining} kcal
        Goal: {user_goal} weight
        
        Give a specific recommendation for the rest of the day in 1-2 sentences.
        """
        
        full_prompt = system_instruction + "\n\n" + user_context
        
        response = client.models.generate_content(
            model='gemini-2.5-flash-lite',
            contents=full_prompt
        )
        
        return {
            "food_label": food_label,
            "coaching_tip": response.text.strip()
        }
    
    except Exception as e:
        return {
            "food_label": data.get('detected_food_label', 'Unknown'),
            "error": str(e)
        }

if __name__ == '__main__':
    if not GEMINI_API_KEY:
        print("ERROR: GEMINI_API_KEY environment variable not set!")
        print("Set it with: export GEMINI_API_KEY='your-api-key-here'")
        exit(1)
    
    print("Starting Gemini Coaching Server on http://0.0.0.0:5001")
    print(f"API Key loaded: {GEMINI_API_KEY[:10]}...")
    app.run(host='0.0.0.0', port=5001, debug=False)
```

### Step 3: Install Gemini SDK

```bash
pip install google-genai
```

### Step 4: Set Gemini API Key

**Option A: Environment Variable (Recommended)**

```bash
# Linux/Mac
export GEMINI_API_KEY='your-actual-api-key-here'

# Windows (Command Prompt)
set GEMINI_API_KEY=your-actual-api-key-here

# Windows (PowerShell)
$env:GEMINI_API_KEY='your-actual-api-key-here'

# Then start the server
python gemini_server.py
```

**Option B: .env File**

Create a `.env` file in your backend directory:

```env
GEMINI_API_KEY=your-actual-api-key-here
```

Then update `gemini_server.py` to load from `.env`:

```python
from dotenv import load_dotenv
import os

load_dotenv()  # Load from .env file
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
```

Install `python-dotenv`:
```bash
pip install python-dotenv
```

### Step 5: Test Gemini Server

```bash
# Start the server
python gemini_server.py

# Test health endpoint
curl http://localhost:5001/health

# Test coaching endpoint
curl -X POST http://localhost:5001/coaching \
  -H "Content-Type: application/json" \
  -d '{
    "user_tdee": 2500,
    "calories_consumed_so_far": 1200,
    "detected_food_label": "hamburger",
    "detected_food_calories": 500,
    "user_goal": "maintain"
  }'
```

---

## Part 3: Connecting to NutriVision Mobile App

### Step 1: Configure Environment Variables

In your NutriVision project, create `.env.local`:

```env
# Model API endpoint
EXPO_PUBLIC_MODEL_API_URL=http://localhost:5000

# Gemini Coaching API endpoint
EXPO_PUBLIC_GEMINI_API_URL=http://localhost:5001
```

For production, update with your server URLs:

```env
EXPO_PUBLIC_MODEL_API_URL=https://your-server.com:5000
EXPO_PUBLIC_GEMINI_API_URL=https://your-server.com:5001
```

### Step 2: Verify API Client Configuration

The app's `lib/api-client.ts` automatically uses these environment variables. Verify it's reading them correctly by checking the app logs.

### Step 3: Test End-to-End

1. **Start Model Server**:
   ```bash
   python model_server.py
   ```

2. **Start Gemini Server** (in another terminal):
   ```bash
   export GEMINI_API_KEY='your-api-key'
   python gemini_server.py
   ```

3. **Start NutriVision App**:
   ```bash
   cd /home/ubuntu/nutrivision-app
   pnpm dev
   ```

4. **Test the Flow**:
   - Open the app in browser or device
   - Go to Profile tab → Enter your biometric data → Calculate TDEE
   - Go to Scan tab → Upload a test food image
   - Verify prediction appears
   - Click "Log This Meal"
   - Go to Dashboard → See coaching tip from Gemini

---

## Part 4: Troubleshooting

### Model Server Issues

**Error: "No module named 'tensorflow'"**
```bash
pip install tensorflow
```

**Error: "Model file not found"**
- Check the `MODEL_PATH` in `model_server.py`
- Ensure the path is absolute (e.g., `/home/user/models/food.h5`)
- Verify file permissions: `ls -la /path/to/model.h5`

**Error: "Input shape mismatch"**
- Check your model's expected input size
- Update `MODEL_INPUT_SIZE` in `model_server.py`
- Print model info: `model.summary()`

**Prediction returns wrong label**
- Verify `food_labels.json` matches your model's class order
- Check label indices: `labels[str(0)]` should be first class
- Test with known images

### Gemini Server Issues

**Error: "GEMINI_API_KEY not set"**
```bash
export GEMINI_API_KEY='your-key'
python gemini_server.py
```

**Error: "Invalid API key"**
- Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
- Create a new API key
- Ensure no extra spaces in the key

**Error: "Quota exceeded"**
- Check your Google Cloud project quota
- Gemini API has free tier limits
- Upgrade your plan if needed

**Empty coaching tips**
- Check Gemini API response in server logs
- Verify API key has access to gemini-2.5-flash-lite model
- Test with simpler prompt first

### Mobile App Issues

**Error: "Failed to predict food"**
- Verify Model API is running: `curl http://localhost:5000/health`
- Check network connectivity
- Verify image format (JPEG/PNG)
- Check app logs for detailed error

**Error: "Failed to get coaching tip"**
- Verify Gemini API is running: `curl http://localhost:5001/health`
- Check GEMINI_API_KEY is set correctly
- Verify network connectivity
- Check Gemini API quota

**CORS errors**
- Ensure `CORS(app)` is in both servers
- Check browser console for exact error
- Verify API URLs in `.env.local`

---

## Part 5: Production Deployment

### Deploying Model Server

**Option 1: Cloud Run (Google Cloud)**

```bash
# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY model_server.py .
COPY model.h5 .
COPY food_labels.json .
CMD ["python", "model_server.py"]
EOF

# Create requirements.txt
pip freeze > requirements.txt

# Deploy to Cloud Run
gcloud run deploy nutrivision-model \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**Option 2: AWS Lambda + API Gateway**

```python
# Create lambda_handler.py for AWS Lambda
from model_server import app
from awsgi import response

def lambda_handler(event, context):
    return response(app, event, context)
```

### Deploying Gemini Server

Similar process as Model Server. Ensure:
- GEMINI_API_KEY is set as environment variable
- API is accessible from mobile app
- CORS is enabled

### Updating Mobile App for Production

Update `.env.local`:

```env
EXPO_PUBLIC_MODEL_API_URL=https://your-model-api.com
EXPO_PUBLIC_GEMINI_API_URL=https://your-gemini-api.com
```

---

## Part 6: Security Best Practices

1. **Never commit API keys** to version control
2. **Use HTTPS** for production APIs
3. **Validate all inputs** on backend
4. **Implement rate limiting** to prevent abuse
5. **Use API keys** for backend authentication (optional)
6. **Monitor API usage** for unusual patterns
7. **Keep models updated** with latest security patches

---

## Quick Reference

### Start All Services

```bash
# Terminal 1: Model Server
python model_server.py

# Terminal 2: Gemini Server
export GEMINI_API_KEY='your-key'
python gemini_server.py

# Terminal 3: Mobile App
cd /home/ubuntu/nutrivision-app
pnpm dev
```

### Test Endpoints

```bash
# Model API
curl http://localhost:5000/health
curl http://localhost:5000/info
curl -X POST -F "image=@test.jpg" http://localhost:5000/predict

# Gemini API
curl http://localhost:5001/health
curl -X POST http://localhost:5001/coaching \
  -H "Content-Type: application/json" \
  -d '{"user_tdee":2500,"calories_consumed_so_far":1200,"detected_food_label":"pizza","detected_food_calories":266,"user_goal":"maintain"}'
```

### Environment Variables

```bash
# Model API
EXPO_PUBLIC_MODEL_API_URL=http://localhost:5000

# Gemini API
EXPO_PUBLIC_GEMINI_API_URL=http://localhost:5001
GEMINI_API_KEY=your-actual-api-key
```

---

## Support

For issues:
1. Check server logs for errors
2. Test endpoints with curl
3. Verify environment variables
4. Check network connectivity
5. Review API documentation

---

**Last Updated**: January 2026
