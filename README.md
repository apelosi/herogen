# HeroGen Comic Creator - Technical Handover

## Project Overview
HeroGen is a mobile-responsive web application that allows users to transform a selfie into a personalized 6-panel comic strip. It utilizes the Google Gemini API for image analysis, narrative scripting, and high-quality character-consistent image generation.

## Current Architecture
The app is a Single Page Application (SPA) built with React 19 and Tailwind CSS. It is designed to run entirely in the browser with local persistence.

### Tech Stack
- **Frontend**: React (ES6 Modules via esm.sh), Tailwind CSS, Lucide React.
- **AI Engine**: `@google/genai` (Gemini API).
- **Authentication**: Google Identity Services (GSI) via external script.
- **Storage**: IndexedDB (via a custom `db.ts` service) for local user profiles and comic data.
- **PDF Export**: `jspdf` for generating downloadable comic books.

### Key Services
1.  **`auth.ts`**: Handles Google Sign-In. Currently uses the `google.accounts.id` library. Decodes JWTs on the client side to establish user identity.
2.  **`db.ts`**: Manages IndexedDB stores for `users` and `comics`. Comics are indexed by `userId`.
3.  **`geminiService.ts`**:
    *   `analyzeImage`: Uses `gemini-3-flash-preview` to extract physical descriptors from the user's photo.
    *   `generateStoryScript`: Uses `gemini-3-flash-preview` with a JSON schema to create a 6-panel plot.
    *   `generatePanelImage`: Uses `gemini-3-pro-image-preview` to generate the final comic panels using the original photo as a character reference.

## Current Status & Known Issues

### 1. Google Authentication (CRITICAL)
- **Status**: Intermittent/Failing.
- **Issue**: The application is hosted in dynamic sandbox environments where the "Authorized JavaScript Origin" changes frequently. Google's OAuth 2.0 policy requires a strict whitelist of origins.
- **Recommended Fix**: Implement a reliable fallback (Guest Mode) or use a proxy/fixed domain for authentication. The current implementation uses the official GSI button but still faces origin mismatch errors in sandbox environments.

### 2. Static Asset Loading (Assets/Images)
- **Status**: Failing.
- **Issue**: Sample images located in the `/public/` folder are currently not resolving to the expected paths in the browser. There is a discrepancy between local development pathing and the production/sandbox environment mapping.
- **Current Behavior**: Images like `/public/sample-1.png` are returning 404s, triggering placeholder fallbacks.
- **Required Check**: Verify the root directory structure and how the server serves static files (whether `/public/` prefix is stripped or required).

### 3. Camera Permissions
- **Status**: Partially Resolved.
- **Issue**: Previously, browser permission popups appeared immediately on homepage load. 
- **Fix Implemented**: The `PhotoCapture` component is now lazy-loaded and `metadata.json` is stripped of global permission requests. Permissions are only requested when the user reaches the "Identity" section in the Dashboard.

### 4. Gemini API Integration
- **Status**: Configured.
- **Models Used**:
    - `gemini-3-flash-preview` for high-speed text and vision analysis.
    - `gemini-3-pro-image-preview` for image generation.
- **Note**: The app requires a Gemini API key. It uses a built-in UI to prompt users to select a key via `window.aistudio.openSelectKey()` if `process.env.API_KEY` is not present.

## Environment Setup
- **GCP Client ID**: `600610510152-lercn1ar908bmhulp4b06p6occlkstd5.apps.googleusercontent.com`
- **Authorized Origins**: Must be updated in GCP Console to match the current running URL.

## Development Roadmap
1.  **Resolve Image Pathing**: Fix the static asset mapping so sample comics display on the landing page.
2.  **Auth Robustness**: finalize a "Sign in with Google" flow that is resilient to dynamic hostnames.
3.  **Progression Save**: Ensure the generation process (which takes ~1-2 minutes) reliably updates IndexedDB panel-by-panel to prevent data loss on page refresh.
