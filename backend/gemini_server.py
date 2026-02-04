"""
NutriVision - Gemini Coaching API Server
Generates personalized nutrition coaching tips using Google Gemini API
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from google.api_core.exceptions import ResourceExhausted
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
import os
import sys

# Load .env file from same directory
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

app = Flask(__name__)
CORS(app)  # Enable CORS for mobile app requests

# ----------------------------------------------------------------------------
# RATE LIMITER
# ----------------------------------------------------------------------------
# Default: 200/day, 50/hour per IP
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
)

# ----------------------------------------------------------------------------
# CONFIGURATION
# ----------------------------------------------------------------------------

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-2.0-flash"

# ----------------------------------------------------------------------------
# INITIALIZE GEMINI CLIENT
# ----------------------------------------------------------------------------

if not GEMINI_API_KEY:
    print("\n⚠️  ERROR: GEMINI_API_KEY environment variable not set!", flush=True)
    print("\nSet it with:")
    print("  export GEMINI_API_KEY='your-api-key-here'")
    print("\nOr create a .env file with:")
    print("  GEMINI_API_KEY=your-api-key-here")
    print("\nGet your API key at: https://aistudio.google.com/app/apikey")
    sys.exit(1)

try:
    client = genai.Client(api_key=GEMINI_API_KEY)
    print("✓ Gemini API client initialized")
    print(f"  API Key: {GEMINI_API_KEY[:10]}...")
    print(f"  Model: {GEMINI_MODEL}")
except Exception as e:
    print(f"✗ Error initializing Gemini client: {e}")
    client = None


# ----------------------------------------------------------------------------
# GEMINI CALL WITH RETRIES
# ----------------------------------------------------------------------------

@retry(
    stop=stop_after_attempt(4),  # 1 initial + up to 3 retries
    wait=wait_exponential(multiplier=2, min=2, max=30),
    retry=retry_if_exception_type(ResourceExhausted),
)
def safe_generate_content(model: str, contents: str):
    """
    Wrapper around client.models.generate_content with retry on 429/ResourceExhausted.
    """
    if client is None:
        raise RuntimeError("Gemini client not initialized")
    return client.models.generate_content(model=model, contents=contents)


# ----------------------------------------------------------------------------
# HELPERS
# ----------------------------------------------------------------------------

def build_prompt_for_meal(
    user_tdee: int,
    calories_consumed: int,
    food_label: str,
    food_calories: int,
    calories_remaining: int,
    user_goal: str,
    user_name: str | None = None,
):
    # Short, token‑efficient prompt
    system_instruction = (
        "You are a concise, supportive nutrition coach. "
        "Give 1 short, practical sentence about this meal vs daily target. "
        "No judgment, just encouragement and next step."
    )

    name_part = f"User: {user_name}. " if user_name else ""

    user_context = (
        f"{name_part}"
        f"TDEE: {user_tdee} kcal. "
        f"Already eaten: {calories_consumed} kcal. "
        f"Current meal: {food_label} (~{food_calories} kcal). "
        f"Total now: {calories_consumed + food_calories} kcal. "
        f"Remaining: {calories_remaining} kcal. "
        f"Goal: {user_goal} weight."
    )

    return system_instruction + "\n\n" + user_context


def generate_quick_tip(calories_remaining: int, user_goal: str, food_label: str | None = None):
    # Simple local fallback message
    if calories_remaining < 0:
        return (
            f"You've gone over your daily target by {abs(calories_remaining)} kcal. "
            "Balance it out with lighter choices later and keep hydrated."
        )
    elif calories_remaining < 300:
        return (
            f"You have {calories_remaining} kcal left. "
            "Aim for a light, veggie‑heavy meal to finish the day strong."
        )
    elif calories_remaining < 600:
        return (
            f"You have {calories_remaining} kcal remaining. "
            "A balanced meal with protein, veggies, and some carbs will fit well."
        )
    else:
        return (
            f"Nice work! You still have {calories_remaining} kcal left today. "
            "Enjoy a satisfying but balanced meal."
        )


# ----------------------------------------------------------------------------
# API ENDPOINTS
# ----------------------------------------------------------------------------

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify(
        {
            "status": "ok",
            "service": "nutrivision-gemini-coaching",
            "model": GEMINI_MODEL,
            "api_key_loaded": GEMINI_API_KEY is not None,
        }
    )


@app.route("/coaching", methods=["POST"])
@limiter.limit("10 per minute")  # Protect Gemini from bursts
def get_coaching_tip():
    """
    Generate personalized coaching tip based on user's meal and daily stats.
    """
    try:
        if client is None:
            return (
                jsonify(
                    {
                        "error": "Gemini API not initialized",
                        "status": "error",
                        "coaching_tip": "Keep up the great work on your nutrition journey!",
                    }
                ),
                500,
            )

        data = request.get_json() or {}

        required_fields = [
            "user_tdee",
            "calories_consumed_so_far",
            "detected_food_label",
            "detected_food_calories",
            "user_goal",
        ]

        for field in required_fields:
            if field not in data:
                return (
                    jsonify({"error": f"Missing required field: {field}", "status": "error"}),
                    400,
                )

        try:
            user_tdee = int(data["user_tdee"])
            calories_consumed = int(data["calories_consumed_so_far"])
            food_label = str(data["detected_food_label"]).lower()
            food_calories = int(data["detected_food_calories"])
            user_goal = str(data["user_goal"]).lower()
            user_name = str(data.get("user_name", "Friend"))
        except (ValueError, TypeError) as e:
            return (
                jsonify({"error": f"Invalid data types: {str(e)}", "status": "error"}),
                400,
            )

        current_total = calories_consumed + food_calories
        calories_remaining = user_tdee - current_total
        percentage_consumed = (current_total / user_tdee * 100) if user_tdee > 0 else 0

        # Short prompt
        full_prompt = build_prompt_for_meal(
            user_tdee=user_tdee,
            calories_consumed=calories_consumed,
            food_label=food_label,
            food_calories=food_calories,
            calories_remaining=calories_remaining,
            user_goal=user_goal,
            user_name=user_name,
        )

        try:
            response = safe_generate_content(GEMINI_MODEL, full_prompt)
            coaching_tip = (response.text or "").strip()
            if not coaching_tip:
                coaching_tip = generate_quick_tip(calories_remaining, user_goal, food_label)
            status = "success"
        except ResourceExhausted as e:
            # Quota / 429 hit even after retries
            print(f"Quota exhausted in /coaching: {e}", flush=True)
            coaching_tip = generate_quick_tip(calories_remaining, user_goal, food_label)
            status = "quota_fallback"
        except Exception as e:
            print(f"Error generating coaching tip: {e}", flush=True)
            coaching_tip = generate_quick_tip(calories_remaining, user_goal, food_label)
            status = "fallback"

        return jsonify(
            {
                "coaching_tip": coaching_tip,
                "status": status,
                "metadata": {
                    "calories_remaining": calories_remaining,
                    "percentage_consumed": round(percentage_consumed, 1),
                },
            }
        )

    except Exception as e:
        print(f"Unhandled error in /coaching: {e}", flush=True)
        return (
            jsonify(
                {
                    "error": str(e),
                    "status": "error",
                    "coaching_tip": "You're doing great—focus on balanced meals and hydration.",
                }
            ),
            500,
        )


@app.route("/coaching/batch", methods=["POST"])
@limiter.limit("2 per minute")  # Batch is expensive
def get_coaching_tips_batch():
    """
    Generate multiple coaching tips (for dashboard updates).
    """
    try:
        if client is None:
            return (
                jsonify(
                    {
                        "error": "Gemini API not initialized",
                        "status": "error",
                    }
                ),
                500,
            )

        data = request.get_json() or {}
        meals = data.get("meals", [])

        if not meals:
            return jsonify({"error": "No meals provided"}), 400

        results = []
        for meal in meals:
            tip = generate_coaching_tip_internal(meal)
            results.append(tip)

        return jsonify({"tips": results, "count": len(results), "status": "success"})

    except Exception as e:
        print(f"Error in batch coaching: {str(e)}", flush=True)
        return jsonify({"error": str(e), "status": "error"}), 500


@app.route("/coaching/quick", methods=["POST"])
def get_quick_coaching_tip():
    """
    Get a quick generic coaching tip without Gemini API.
    Useful for fallback when API is unavailable.
    """
    try:
        data = request.get_json() or {}
        calories_remaining = int(data.get("calories_remaining", 500))
        user_goal = str(data.get("user_goal", "maintain")).lower()

        tip = generate_quick_tip(calories_remaining, user_goal, None)

        return jsonify({"coaching_tip": tip, "status": "success", "source": "quick_tip"})

    except Exception as e:
        print(f"Error generating quick tip: {str(e)}", flush=True)
        return jsonify({"error": str(e), "status": "error"}), 500


# ----------------------------------------------------------------------------
# INTERNAL FUNCTIONS
# ----------------------------------------------------------------------------

def generate_coaching_tip_internal(meal_data: dict):
    """Internal function for generating coaching tips for batch endpoint"""
    try:
        if client is None:
            return {
                "food_label": meal_data.get("detected_food_label", "Unknown"),
                "error": "Gemini API not initialized",
                "status": "error",
            }

        user_tdee = int(meal_data["user_tdee"])
        calories_consumed = int(meal_data["calories_consumed_so_far"])
        food_label = str(meal_data["detected_food_label"]).lower()
        food_calories = int(meal_data["detected_food_calories"])
        user_goal = str(meal_data["user_goal"]).lower()

        current_total = calories_consumed + food_calories
        calories_remaining = user_tdee - current_total

        full_prompt = build_prompt_for_meal(
            user_tdee=user_tdee,
            calories_consumed=calories_consumed,
            food_label=food_label,
            food_calories=food_calories,
            calories_remaining=calories_remaining,
            user_goal=user_goal,
            user_name=None,
        )

        try:
            response = safe_generate_content(GEMINI_MODEL, full_prompt)
            coaching_tip = (response.text or "").strip()
            if not coaching_tip:
                coaching_tip = generate_quick_tip(calories_remaining, user_goal, food_label)
            return {"food_label": food_label, "coaching_tip": coaching_tip, "status": "success"}
        except ResourceExhausted as e:
            print(f"Quota exhausted in batch for {food_label}: {e}", flush=True)
            coaching_tip = generate_quick_tip(calories_remaining, user_goal, food_label)
            return {"food_label": food_label, "coaching_tip": coaching_tip, "status": "quota_fallback"}
        except Exception as e:
            print(f"Error generating tip for {meal_data.get('detected_food_label')}: {e}", flush=True)
            coaching_tip = generate_quick_tip(calories_remaining, user_goal, food_label)
            return {"food_label": food_label, "coaching_tip": coaching_tip, "status": "fallback"}

    except Exception as e:
        print(f"Fatal error in generate_coaching_tip_internal: {e}", flush=True)
        return {
            "food_label": meal_data.get("detected_food_label", "Unknown"),
            "error": str(e),
            "status": "error",
        }


# ----------------------------------------------------------------------------
# ERROR HANDLERS
# ----------------------------------------------------------------------------

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500


# ----------------------------------------------------------------------------
# MAIN
# ----------------------------------------------------------------------------

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("NutriVision - Gemini Coaching API Server")
    print("=" * 60)
    print("Starting server on http://0.0.0.0:5001")
    print(f"Gemini Model: {GEMINI_MODEL}")
    print(f"API Key: {GEMINI_API_KEY[:10]}...")
    print("\nEndpoints:")
    print("  GET  /health               - Health check")
    print("  POST /coaching             - Generate coaching tip")
    print("  POST /coaching/batch       - Batch coaching tips")
    print("  POST /coaching/quick       - Quick fallback tip")
    print("=" * 60 + "\n")

    app.run(host="0.0.0.0", port=5001, debug=False)
