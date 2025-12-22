# HeroGen Comic Creator - Technical Overview

HeroGen is a high-performance, mobile-responsive web application that transforms a single user selfie into a personalized 6-panel superhero (or villain) comic strip. It leverages the cutting-edge Gemini 3 models for character-consistent image generation and narrative orchestration.

## Key Features
- **Identity Scanning**: Capture a live photo or upload an image to define your hero's visual signature.
- **Thematic Multiverse**: Choose from 12 distinct visual themes (Cyberpunk, Space Opera, Noir, etc.).
- **Moral Alignment**: Decide whether to forge the saga of a noble Hero or a calculated Villain.
- **AI Narrative Engine**: Automatic script generation including cinematic titles and frame-by-frame captions.
- **Consistent Image Generation**: High-fidelity, character-consistent panels generated via `gemini-3-pro-image-preview`.
- **Global Archives**: Save comics locally (IndexedDB) or publish them to a shareable public URL.
- **Epic Export**: Download the full saga as a high-quality PDF with integrated copyright protection.

## Tech Stack
- **Framework**: React 19 (ES6 Modules)
- **Styling**: Tailwind CSS with custom Comic-Style Halftone effects and Material Design principles.
- **AI Integration**: `@google/genai` (Google Gemini API).
- **Client-Side DB**: IndexedDB for persistent user sessions and story archives.
- **Authentication**: Google Identity Services (GSI).
- **PDF Engine**: `jspdf` for document manifestation.

## Gemini Model Architecture
- **Analysis**: `gemini-3-flash-preview` extracts biometric features for character consistency.
- **Scripting**: `gemini-3-flash-preview` generates JSON-structured narrative scripts.
- **Manifestation**: `gemini-3-pro-image-preview` performs character-reference image generation at 1K resolution.

## Recent UI/UX Refinements
- **Hero Animation**: A 2-second per frame cinematic sequence on the landing page showcasing the potential of the engine.
- **Halftone Aesthetics**: Integrated classic comic book "dot" patterns and bold border styles across the app.
- **Clean Panel Design**: Removed technical overlays (Panel IDs) from the final artwork for a more immersive reading experience.
- **Simplified Dashboard**: Streamlined "Command Center" focusing on the user's name and identity.
- **Optimized Layouts**: Horizontally centered primary action buttons (like "Download PDF") and mobile-first responsive grid systems.
- **Unified Messaging**: Synchronized call-to-actions across the public and private views to drive user engagement ("Forge Your Own Saga").

## Environment Requirements
- **API Key**: Requires a Gemini API key with billing enabled (accessible via `process.env.API_KEY` or the integrated Key Selector).
- **GCP Configuration**: Google Client ID `600610510152-lercn1ar908bmhulp4b06p6occlkstd5.apps.googleusercontent.com` must have the current hosting origin whitelisted for authentication to function.

## Development Status
The application is fully functional for end-to-end comic generation. Static asset fallbacks are implemented to ensure the UI remains robust even if specific sample images fail to resolve in various sandbox environments.