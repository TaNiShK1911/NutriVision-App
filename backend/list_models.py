
from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

try:
    print("Listing models...")
    for model in client.models.list(config={"page_size": 100}):
        print(f"- {model.name}")
except Exception as e:
    print(f"Error listing models: {e}")
