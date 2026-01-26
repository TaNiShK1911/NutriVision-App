"""
NutriVision - Gemini Coaching API Server
Generates personalized nutrition coaching tips using Google Gemini API
(Uses standard google-generativeai stable SDK)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
import sys
import traceback
from dotenv import load_dotenv

load_dotenv()  # Load .env file

app = Flask(__name__)
CORS(app)  # Enable CORS for mobile app requests

# ============================================================================
# CONFIGURATION
# ============================================================================

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-1.5-flash"

# ============================================================================
# INITIALIZE GEMINI CLIENT
# ============================================================================

if not GEMINI_API_KEY:
    print("\n⚠️  ERROR: GEMINI_API_KEY environment variable not set!")
    sys.exit(1)

try:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(GEMINI_MODEL)
    print(f"✓ Gemini API initialized")
    print(f"  Model: {GEMINI_MODEL}")
except Exception as e:
    print(f"✗ Error initializing Gemini client: {e}")
    model = None

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "service": "nutrivision-gemini-coaching",
        "model": GEMINI_MODEL,
        "api_key_loaded": GEMINI_API_KEY is not None
    })

@app.route('/coaching', methods=['POST'])
def get_coaching_tip():
    """Generate personalized coaching tip."""
    try:
        if model is None:
            return jsonify({
                "error": "Gemini API not initialized",
                "status": "error",
                "coaching_tip": "Keep up the great work!"
            }), 500
        
        data = request.get_json()
        
        # Safe extraction with defaults
        user_tdee = int(data.get('user_tdee', 2000))
        calories_consumed = int(data.get('calories_consumed_so_far', 0))
        food_label = str(data.get('detected_food_label', 'food')).lower()
        food_calories = int(data.get('detected_food_calories', 0))
        user_goal = str(data.get('user_goal', 'maintain')).lower()
        user_name = str(data.get('user_name', 'User'))
        
        # Calculate context
        current_total = calories_consumed + food_calories
        calories_remaining = user_tdee - current_total
        
        prompt = (
            f"You are a supportive nutritionist. The user {user_name} (Goal: {user_goal}) "
            f"has a daily target of {user_tdee} kcal. "
            f"They just ate {food_label} ({food_calories} kcal). "
            f"Total consumed: {current_total} kcal. Remaining: {calories_remaining} kcal. "
            f"Give a 1-2 sentence specific, encouraging coaching tip for the rest of the day."
        )
        
        # Call Gemini
        response = model.generate_content(prompt)
        
        # Handle response safely
        if response.text:
            tip = response.text.strip()
        else:
            tip = "Great job tracking! Keep it up."

        return jsonify({
            "coaching_tip": tip,
            "status": "success"
        })
    
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "error": str(e),
            "traceback": traceback.format_exc(),
            "status": "error",
            "coaching_tip": "You're doing great! Keep tracking."
        }), 500

@app.route('/coaching/batch', methods=['POST'])
def get_coaching_tips_batch():
    """Batch generation (simplified for stability)."""
    return jsonify({"error": "Batch not implemented in stable fallback", "status": "error"}), 501

@app.route('/coaching/quick', methods=['POST'])
def get_quick_coaching_tip():
    """Quick fallback tip."""
    try:
        data = request.get_json()
        calories_remaining = int(data.get('calories_remaining', 500))
        
        if calories_remaining < 0:
            tip = f"You're slightly over budget ({abs(calories_remaining)} kcal). Try a light meal next!"
        elif calories_remaining < 300:
            tip = f"Only {calories_remaining} kcal left. How about some veggies for dinner?"
        else:
            tip = f"You have {calories_remaining} kcal remaining. Enjoy your next meal!"
            
        return jsonify({
            "coaching_tip": tip,
            "status": "success",
            "source": "quick_tip"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print(f"Starting server on port 5001")
    app.run(host='0.0.0.0', port=5001, debug=False)
