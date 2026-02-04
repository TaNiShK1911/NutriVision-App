# NutriVision Deployment Guide

## 1. Deploy Backend to Render

1.  **Push your code to GitHub**:
    The code is already committed. You just need to push it to your repository.
    ```bash
    git push origin main
    ```

2.  **Create Blueprint on Render**:
    *   Go to [dashboard.render.com](https://dashboard.render.com/blueprints).
    *   Click **New Endpoint/Blueprint**.
    *   Select your repository (`nutrivision-app`).
    *   Render will read the `render.yaml` file and propose 3 services:
        *   `nutrivision-gemini-api` (Python)
        *   `nutrivision-model-api` (Python)
        *   `nutrivision-web` (Static Site)
    *   Click **Apply**.

3.  **Get Production URLs**:
    *   Once deployed, Render will assign URLs to your services (e.g., `https://nutrivision-gemini-api-xcv1.onrender.com`).
    *   Copy the URL for **Gemini API** and **Model API**.

## 2. Update Environment Variables

1.  **Update `.env`**:
    Replace the local IPs in your `.env` file with the new Render URLs:
    ```env
    EXPO_PUBLIC_MODEL_API_URL=https://nutrivision-model-api-[suffix].onrender.com
    EXPO_PUBLIC_GEMINI_API_URL=https://nutrivision-gemini-api-[suffix].onrender.com
    ```

## 3. Deploy Mobile App (Expo)

1.  **Build successfully**:
    Ensure paths are correct and URLs are set in `.env`.

2.  **Run EAS Build**:
    To create an Android build (APK) that allows you to install natively:
    ```bash
    npx eas-cli build --platform android --profile preview
    ```
    *   Follow the prompts.
    *   Once finished, scan the QR code to install.

3.  **Production Publish**:
    To publish an update to existing users (if configured):
    ```bash
    npx expo-cli export
    npx eas-cli update
    ```
