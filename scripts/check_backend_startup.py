import sys
import os
from dotenv import load_dotenv

# Add cwd to path so we can import backend
sys.path.append(os.getcwd())

# Load env variables from backend/.env
env_path = os.path.join(os.getcwd(), 'backend', '.env')
if os.path.exists(env_path):
    print(f"Loading .env from {env_path}")
    load_dotenv(env_path)
else:
    print(f"Warning: .env not found at {env_path}")

print("Checking Model Server...")
try:
    # Set the environment variable to avoid flask trying to start or something unexpected (though direct import usually doesn't start app.run if under __main__)
    from backend import model_server
    print("✅ Model Server module imported successfully.")
    
    # Check if model is loaded object
    if hasattr(model_server, 'model') and model_server.model is not None:
         print(f"✅ Model loaded successfully: {type(model_server.model)}")
    else:
         print("❌ Model object is None or missing")

except Exception as e:
    print(f"❌ Failed to import Model Server or load model: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\nChecking Gemini Server...")
try:
    from backend import gemini_server
    print("✅ Gemini Server module imported successfully.")
    
    if hasattr(gemini_server, 'client') and gemini_server.client:
        print("✅ Gemini Client initialized successfully.")
    else:
        print("⚠️ Gemini Client failed to initialize.")

except SystemExit:
    print("❌ Gemini Server exited (likely missing API key).")
    sys.exit(1)
except Exception as e:
    print(f"❌ Failed to import Gemini Server: {e}")
    sys.exit(1)

print("\nBackend initialization check passed!")
