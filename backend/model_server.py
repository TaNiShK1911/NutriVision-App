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
# Load your trained Keras model
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, '..', 'model', 'nutrivision_food101_mobilenetv2.h5')
model = tf.keras.models.load_model(MODEL_PATH)

# Load food labels
LABELS_PATH = os.path.join(BASE_DIR, '..', 'model', 'food_labels.json')
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