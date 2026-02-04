
import requests
import json
import sys

def test_endpoint(name, url, method='GET', data=None):
    print(f"Testing {name} ({method} {url})...", end=' ')
    try:
        if method == 'GET':
            response = requests.get(url, timeout=5)
        else:
            response = requests.post(url, json=data, timeout=5)
        
        if response.status_code == 200:
            print(f"✅ OK")
            return True
        else:
            print(f"❌ Failed (Status: {response.status_code})")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def main():
    print("="*50)
    print("NutriVision Backend Health Check")
    print("="*50)
    
    # Check Model Server
    model_host = "http://localhost:5000"
    test_endpoint("Model Server Health", f"{model_host}/health")
    
    # Check Gemini Server
    gemini_host = "http://localhost:5001"
    test_endpoint("Gemini Server Health", f"{gemini_host}/health")
    
    # Test Coaching Endpoint
    print("\nTesting Coaching Endpoint...")
    sample_data = {
        "user_tdee": 2500,
        "calories_consumed_so_far": 1200,
        "detected_food_label": "apple",
        "detected_food_calories": 95,
        "user_goal": "maintain"
    }
    test_endpoint("Gemini Coaching", f"{gemini_host}/coaching", method='POST', data=sample_data)

if __name__ == "__main__":
    main()
