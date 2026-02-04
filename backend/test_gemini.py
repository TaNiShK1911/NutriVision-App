
import requests
import json
import sys

def test_endpoint(name, url, method='GET', data=None):
    results = {}
    try:
        if method == 'GET':
            response = requests.get(url, timeout=10)
        else:
            response = requests.post(url, json=data, timeout=10)
        
        results['status_code'] = response.status_code
        try:
            results['json'] = response.json()
        except:
            results['text'] = response.text
            
        return results
    except Exception as e:
        return {"error": str(e)}

def main():
    final_report = {}
    gemini_host = "http://localhost:5001"
    
    # 1. Health
    final_report['health'] = test_endpoint("Health", f"{gemini_host}/health")
    
    # 2. Coaching
    sample_data = {
        "user_tdee": 2500,
        "calories_consumed_so_far": 1200,
        "detected_food_label": "apple",
        "detected_food_calories": 95,
        "user_goal": "maintain",
        "user_name": "Test User"
    }
    final_report['coaching'] = test_endpoint("Coaching", f"{gemini_host}/coaching", method='POST', data=sample_data)

    # 3. Quick Tip
    quick_data = {
        "calories_remaining": 500,
        "user_goal": "lose"
    }
    final_report['quick_tip'] = test_endpoint("Quick Tip", f"{gemini_host}/coaching/quick", method='POST', data=quick_data)
    
    with open('backend/test_results.json', 'w') as f:
        json.dump(final_report, f, indent=2)
    print("Test finished. Results written to backend/test_results.json")

if __name__ == "__main__":
    main()
