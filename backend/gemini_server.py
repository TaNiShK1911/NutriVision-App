"""
NutriVision - Gemini Coaching API Server
Generates personalized nutrition coaching tips using Google Gemini API
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
import os
import sys
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
    print("\nSet it with:")
    print("  export GEMINI_API_KEY='your-api-key-here'")
    print("\nOr create a .env file with:")
    print("  GEMINI_API_KEY=your-api-key-here")
    print("\nGet your API key at: https://aistudio.google.com/app/apikey")
    sys.exit(1)

try:
    client = genai.Client(api_key=GEMINI_API_KEY)
    print(f"✓ Gemini API client initialized")
    print(f"  API Key: {GEMINI_API_KEY[:10]}...")
    print(f"  Model: {GEMINI_MODEL}")
except Exception as e:
    print(f"✗ Error initializing Gemini client: {e}")
    client = None

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
    """
    Generate personalized coaching tip based on user's meal and daily stats.
    
    Request JSON:
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
        "coaching_tip": "Great choice! You still have 800 kcal left...",
        "status": "success"
    }
    """
    try:
        if client is None:
            return jsonify({
                "error": "Gemini API not initialized",
                "status": "error",
                "coaching_tip": "Keep up the great work on your nutrition journey!"
            }), 500
        
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
                return jsonify({
                    "error": f"Missing required field: {field}",
                    "status": "error"
                }), 400
        
        # Extract and validate data
        try:
            user_tdee = int(data['user_tdee'])
            calories_consumed = int(data['calories_consumed_so_far'])
            food_label = str(data['detected_food_label']).lower()
            food_calories = int(data['detected_food_calories'])
            user_goal = str(data['user_goal']).lower()
            user_name = str(data.get('user_name', 'Friend'))
        except (ValueError, TypeError) as e:
            return jsonify({
                "error": f"Invalid data types: {str(e)}",
                "status": "error"
            }), 400
        
        # Calculate state
        current_total = calories_consumed + food_calories
        calories_remaining = user_tdee - current_total
        percentage_consumed = (current_total / user_tdee * 100) if user_tdee > 0 else 0
        
        # Determine calorie status
        if calories_remaining < 0:
            calorie_status = "over budget"
        elif calories_remaining < 300:
            calorie_status = "running low"
        elif calories_remaining < 600:
            calorie_status = "moderate"
        else:
            calorie_status = "plenty left"
        
        # Build system instruction
        system_instruction = (
            "You are NutriVision, a helpful, encouraging, and concise AI Nutritionist. "
            "Your goal is to provide a 1-2 sentence reaction to the user's food choice based on their daily limits. "
            "Do not be judgmental. Be practical and supportive. "
            "If they have very few calories left (< 300), suggest a light dinner with vegetables. "
            "If they have plenty (> 800), encourage them and suggest balanced options. "
            "Be specific and reference their actual calorie numbers. "
            "Keep responses short and actionable."
        )
        
        # Build user context with specific details
        user_context = f"""
        User: {user_name}
        Daily Calorie Target (TDEE): {user_tdee} kcal
        Calories Consumed Before This Meal: {calories_consumed} kcal
        Just Ate: {food_label} (~{food_calories} kcal)
        New Total Consumed: {current_total} kcal ({percentage_consumed:.1f}% of daily target)
        Calories Remaining: {calories_remaining} kcal (Calorie Status: {calorie_status})
        Goal: {user_goal} weight
        
        Based on this information, give a specific, encouraging recommendation for the rest of the day.
        Keep it to 1-2 sentences. Be supportive, not judgmental.
        Reference specific calorie numbers and suggest practical next steps.
        """
        
        full_prompt = system_instruction + "\n\n" + user_context
        
        # Call Gemini API
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=full_prompt
        )
        
        coaching_tip = response.text.strip()
        
        return jsonify({
            "coaching_tip": coaching_tip,
            "status": "success",
            "metadata": {
                "calories_remaining": calories_remaining,
                "percentage_consumed": round(percentage_consumed, 1),
                "calorie_status": calorie_status
            }
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
    
    Request JSON:
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
    
    Response:
    {
        "tips": [
            {
                "food_label": "hamburger",
                "coaching_tip": "Great choice!...",
                "status": "success"
            },
            ...
        ],
        "count": 2
    }
    """
    try:
        if client is None:
            return jsonify({
                "error": "Gemini API not initialized",
                "status": "error"
            }), 500
        
        data = request.get_json()
        meals = data.get('meals', [])
        
        if not meals:
            return jsonify({"error": "No meals provided"}), 400
        
        results = []
        for meal in meals:
            tip = generate_coaching_tip_internal(meal)
            results.append(tip)
        
        return jsonify({
            "tips": results,
            "count": len(results),
            "status": "success"
        })
    
    except Exception as e:
        print(f"Error in batch coaching: {str(e)}")
        return jsonify({
            "error": str(e),
            "status": "error"
        }), 500

@app.route('/coaching/quick', methods=['POST'])
def get_quick_coaching_tip():
    """
    Get a quick generic coaching tip without Gemini API.
    Useful for fallback when API is unavailable.
    
    Request JSON:
    {
        "calories_remaining": 800,
        "user_goal": "maintain"
    }
    
    Response:
    {
        "coaching_tip": "You have 800 kcal left for the day...",
        "status": "success"
    }
    """
    try:
        data = request.get_json()
        calories_remaining = int(data.get('calories_remaining', 500))
        user_goal = str(data.get('user_goal', 'maintain')).lower()
        
        # Generate quick tip based on calories remaining
        if calories_remaining < 0:
            tip = f"You've exceeded your daily budget by {abs(calories_remaining)} kcal. Focus on light meals tomorrow!"
        elif calories_remaining < 300:
            tip = f"You have {calories_remaining} kcal left. Consider a light dinner with vegetables."
        elif calories_remaining < 600:
            tip = f"You have {calories_remaining} kcal remaining. A balanced dinner would fit perfectly!"
        else:
            tip = f"Great! You have {calories_remaining} kcal left. Enjoy a satisfying meal!"
        
        return jsonify({
            "coaching_tip": tip,
            "status": "success",
            "source": "quick_tip"
        })
    
    except Exception as e:
        print(f"Error generating quick tip: {str(e)}")
        return jsonify({
            "error": str(e),
            "status": "error"
        }), 500

# ============================================================================
# INTERNAL FUNCTIONS
# ============================================================================

def generate_coaching_tip_internal(meal_data):
    """Internal function for generating coaching tips"""
    try:
        if client is None:
            return {
                "food_label": meal_data.get('detected_food_label', 'Unknown'),
                "error": "Gemini API not initialized",
                "status": "error"
            }
        
        user_tdee = int(meal_data['user_tdee'])
        calories_consumed = int(meal_data['calories_consumed_so_far'])
        food_label = str(meal_data['detected_food_label']).lower()
        food_calories = int(meal_data['detected_food_calories'])
        user_goal = str(meal_data['user_goal']).lower()
        
        current_total = calories_consumed + food_calories
        calories_remaining = user_tdee - current_total
        
        system_instruction = (
            "You are NutriVision, a helpful, encouraging, and concise AI Nutritionist. "
            "Provide a 1-2 sentence reaction to the user's food choice based on their daily limits. "
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
            model=GEMINI_MODEL,
            contents=full_prompt
        )
        
        return {
            "food_label": food_label,
            "coaching_tip": response.text.strip(),
            "status": "success"
        }
    
    except Exception as e:
        print(f"Error generating tip for {meal_data.get('detected_food_label')}: {str(e)}")
        return {
            "food_label": meal_data.get('detected_food_label', 'Unknown'),
            "error": str(e),
            "status": "error"
        }

# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    print("\n" + "="*60)
    print("NutriVision - Gemini Coaching API Server")
    print("="*60)
    print(f"Starting server on http://0.0.0.0:5001")
    print(f"Gemini Model: {GEMINI_MODEL}")
    print(f"API Key: {GEMINI_API_KEY[:10]}...")
    print("\nEndpoints:")
    print("  GET  /health              - Health check")
    print("  POST /coaching            - Generate coaching tip")
    print("  POST /coaching/batch      - Batch coaching tips")
    print("  POST /coaching/quick      - Quick fallback tip")
    print("="*60 + "\n")
    
    app.run(host='0.0.0.0', port=5001, debug=False)
