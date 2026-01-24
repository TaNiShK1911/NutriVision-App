# NutriVision Backend - Quick Start Guide

This guide helps you get the Keras model and Gemini API servers running in 5 minutes.

---

## Prerequisites

- Python 3.8+
- Your trained Keras `.h5` model file
- Your `food_labels.json` file
- Google Gemini API key

---

## Step 1: Install Dependencies

```bash
cd backend_examples
pip install -r requirements.txt
```

---

## Step 2: Set Up Model Server

### 2a. Update Model Path

Edit `model_server.py` and update these lines:

```python
MODEL_PATH = '/path/to/your/model.h5'        # Change this
LABELS_PATH = '/path/to/food_labels.json'    # Change this
```

Or use environment variables:

```bash
export MODEL_PATH='/path/to/your/model.h5'
export LABELS_PATH='/path/to/food_labels.json'
python model_server.py
```

### 2b. Test Model Server

```bash
# Start the server
python model_server.py

# In another terminal, test it
curl http://localhost:5000/health
```

Expected output:
```json
{"status": "ok", "service": "nutrivision-model-api", "model_loaded": true, "labels_loaded": true}
```

---

## Step 3: Set Up Gemini Server

### 3a. Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **"Create API Key"**
3. Copy the key

### 3b. Set API Key

```bash
# Linux/Mac
export GEMINI_API_KEY='your-api-key-here'

# Windows (Command Prompt)
set GEMINI_API_KEY=your-api-key-here

# Windows (PowerShell)
$env:GEMINI_API_KEY='your-api-key-here'
```

### 3c. Start Gemini Server

```bash
python gemini_server.py
```

Expected output:
```
============================================================
NutriVision - Gemini Coaching API Server
============================================================
Starting server on http://0.0.0.0:5001
Gemini Model: gemini-2.5-flash-lite
API Key: your-api...
```

### 3d. Test Gemini Server

```bash
# In another terminal
curl http://localhost:5001/health
```

Expected output:
```json
{"status": "ok", "service": "nutrivision-gemini-coaching", "model": "gemini-2.5-flash-lite", "api_key_loaded": true}
```

---

## Step 4: Configure Mobile App

In your NutriVision mobile app, create `.env.local`:

```env
EXPO_PUBLIC_MODEL_API_URL=http://localhost:5000
EXPO_PUBLIC_GEMINI_API_URL=http://localhost:5001
```

---

## Step 5: Test End-to-End

### Terminal 1: Model Server
```bash
cd backend_examples
export MODEL_PATH='/path/to/your/model.h5'
export LABELS_PATH='/path/to/food_labels.json'
python model_server.py
```

### Terminal 2: Gemini Server
```bash
cd backend_examples
export GEMINI_API_KEY='your-api-key'
python gemini_server.py
```

### Terminal 3: Mobile App
```bash
cd /home/ubuntu/nutrivision-app
pnpm dev
```

### Terminal 4: Test Endpoints

```bash
# Test Model API
curl -X POST -F "image=@/path/to/test/image.jpg" http://localhost:5000/predict

# Test Gemini API
curl -X POST http://localhost:5001/coaching \
  -H "Content-Type: application/json" \
  -d '{
    "user_tdee": 2500,
    "calories_consumed_so_far": 1200,
    "detected_food_label": "pizza",
    "detected_food_calories": 266,
    "user_goal": "maintain"
  }'
```

---

## Troubleshooting

### Model Server Won't Start

**Error: "No module named 'tensorflow'"**
```bash
pip install tensorflow
```

**Error: "Model file not found"**
```bash
# Check the path
ls -la /path/to/your/model.h5

# Update MODEL_PATH in model_server.py
```

**Error: "Input shape mismatch"**
- Your model might expect different input size
- Check your model: `python -c "import tensorflow as tf; m = tf.keras.models.load_model('model.h5'); print(m.input_shape)"`
- Update `MODEL_INPUT_SIZE` in `model_server.py`

### Gemini Server Won't Start

**Error: "GEMINI_API_KEY not set"**
```bash
export GEMINI_API_KEY='your-key'
python gemini_server.py
```

**Error: "Invalid API key"**
- Go to [Google AI Studio](https://aistudio.google.com/app/apikey) and create a new key
- Ensure no extra spaces in the key

### Mobile App Can't Connect

**Error: "Failed to predict food"**
- Check Model API is running: `curl http://localhost:5000/health`
- Check firewall allows port 5000
- Check `.env.local` has correct URL

**Error: "Failed to get coaching tip"**
- Check Gemini API is running: `curl http://localhost:5001/health`
- Check firewall allows port 5001
- Check `.env.local` has correct URL

---

## Next Steps

1. **Test with real images** - Upload food images to test predictions
2. **Verify TDEE calculation** - Enter profile data and check calculations
3. **Check coaching tips** - Log meals and verify Gemini tips appear
4. **Deploy to production** - See INTEGRATION_GUIDE.md for deployment steps

---

## Common Commands

```bash
# Start all services
# Terminal 1
export MODEL_PATH='/path/to/model.h5'
export LABELS_PATH='/path/to/food_labels.json'
python model_server.py

# Terminal 2
export GEMINI_API_KEY='your-key'
python gemini_server.py

# Terminal 3
cd /home/ubuntu/nutrivision-app
pnpm dev

# Test endpoints
curl http://localhost:5000/health
curl http://localhost:5001/health
```

---

## API Quick Reference

### Model API

```bash
# Health check
curl http://localhost:5000/health

# Get model info
curl http://localhost:5000/info

# Get all labels
curl http://localhost:5000/labels

# Predict from image file
curl -X POST -F "image=@image.jpg" http://localhost:5000/predict

# Predict from base64 image
curl -X POST http://localhost:5000/predict \
  -F "image_base64=<base64-encoded-image>"

# Get top 3 predictions
curl -X POST -F "image=@image.jpg" \
  "http://localhost:5000/predict-top-k?k=3"
```

### Gemini API

```bash
# Health check
curl http://localhost:5001/health

# Get coaching tip
curl -X POST http://localhost:5001/coaching \
  -H "Content-Type: application/json" \
  -d '{
    "user_tdee": 2500,
    "calories_consumed_so_far": 1200,
    "detected_food_label": "pizza",
    "detected_food_calories": 266,
    "user_goal": "maintain"
  }'

# Get quick tip (no Gemini API call)
curl -X POST http://localhost:5001/coaching/quick \
  -H "Content-Type: application/json" \
  -d '{
    "calories_remaining": 800,
    "user_goal": "maintain"
  }'
```

---

## Support

For issues:
1. Check server logs for errors
2. Test endpoints with curl
3. Verify environment variables
4. Check network connectivity
5. Review INTEGRATION_GUIDE.md for detailed setup

---

**Last Updated**: January 2026
