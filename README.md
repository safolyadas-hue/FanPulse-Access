# FanPulse Access

**An adaptive, AI-driven accessibility and operations engine for the FIFA World Cup 2026.**

**Chosen Vertical:** Stadium Accessibility, Fan Experience & Venue Operations.

## Alignment with Challenge 4
- **Navigation**: profile-adaptive wayfinding engine (routingEngine.js)
- **Accessibility**: 5 accessibility profiles adapting routing, UI, and audio (profileEngine.js)
- **Multilingual Assistance**: Gemini-powered chat auto-detects and responds in the fan's language (netlify/functions/chat.js)
- **Crowd Management**: the Cognitive/Sensory profile's routing actively avoids high-noise, high-density concourse segments via a weighted noise score (routingEngine.js's weightedNoiseScore + avoidCrowds preference)
- **Real-Time Decision Support / Operational Intelligence**: the Staff Dashboard gives venue staff a live, filterable view of fan-reported issues for immediate triage
**FanPulse Access** bridges the gap between fan accessibility and stadium operations. It provides fans with dynamic, profile-adapted wayfinding, a multilingual AI chat assistant, and native text-to-speech services, while simultaneously empowering stadium staff with a real-time issue reporting dashboard to resolve accessibility blockers instantly.

---

## Approach and Logic

Our approach avoids hardcoded placeholders in favor of robust, computable systems:

- **Dynamic Math & Distance Calculation:** Instead of static routing, the wayfinding logic calculates realistic distances using Euclidean math based on live coordinates provided in our stadium topology (`stadium.json`).
- **Profile-Specific Dynamics:** The routing logic actively monitors the global React state. Time estimates adapt dynamically based on the active accessibility profile's defined walking speed (e.g., standard 1.4 m/s vs. 0.8 m/s for the Mobility profile).
- **Two-Sided Operations Loop:** We utilize a centralized React state manager (`useTickets.js`) to create two-way data binding. Fans submit geo-tagged issues, which dynamically hydrate a Staff Dashboard for live triage.

## How the Solution Works

The application functions as a unified front-end interface with specialized AI and accessibility hooks:

1. **Multilingual AI Assistant:** Leverages the Google Gemini SDK. We inject strict JSON system prompts and the active user profile directly into the AI's context window, forcing it to auto-detect languages and format responses (e.g., high-contrast text) based on user needs.
2. **Adaptive Wayfinding Engine:** Users select a destination, and the algorithm recalculates the path. If the "Mobility" profile is active, the engine alters the route to strictly utilize elevators and ramps, bypassing stairs.
3. **Native TTS Integration:** For the Vision and Cognitive profiles, the solution taps directly into the browser's native `window.speechSynthesis` API, generating on-demand audio navigation without needing external audio files.

## Assumptions Made

To scope this MVP for the hackathon, the following technical and environmental assumptions were made:

1. **2D Stadium Topology:** The Euclidean distance calculations assume the stadium footprint can be mapped to a 2D Cartesian plane for node-to-node distance routing.
2. **Standardized Walking Speeds:** We assume an average human walking speed of 1.4 meters per second, adjusting mathematically to 0.8 m/s for mobility-impaired profiles.
3. **Modern Browser Capabilities:** We assume users have access to modern smartphones/browsers that support the Web Speech API for text-to-speech features.
4. **Network Connectivity:** The Gemini AI assistant assumes the user has an active 4G/5G or stadium Wi-Fi connection to process natural language queries.

---

## Technical Stack

- **Framework**: React 18 & Vite
- **Styling**: Tailwind CSS
- **Design System**: Material Design 3 (M3) with custom premium glassmorphic UI tokens
- **AI Backend**: Google Gemini SDK
- **State Management**: React Hooks (Context-like global state patterns)

---

## Local Setup & Testing

### Prerequisites

Make sure you have Node.js installed on your machine.

### Installation

1. Clone the repository and navigate into the root directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and add your Gemini API key:
   **WARNING**: Never prefix this variable with `VITE_` — that would expose it in the public browser bundle.
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
4. **CORS Setup for Production**:
   ALLOWED_ORIGIN must be set in the Netlify dashboard under Site settings > Environment variables, scoped to Functions — it will not work if only added to .env or netlify.toml, since those aren't available to the deployed function at runtime.
5. Start the development server:
   ```bash
   npm run dev
   ```

---

## Reviewer Guide

To fully experience the dynamic architecture of FanPulse Access, please follow these testing steps:

1. **Test the Adaptive State**:
   - Click the **Profile** button at the bottom of the left sidebar.
   - Switch to the **Mobility** profile. Observe the global UI shift.
   - Navigate to the **Wayfinding** tab and generate a route. You will see the time estimates dynamically increase (due to the slower 0.8 m/s walking speed constraint) and the route instructions adapt to avoid stairs.
2. **Test the TTS Integration**:
   - Switch to the **Vision** profile.
   - Generate a route in the Wayfinding tab and notice the **Play Audio** buttons appear. Click them to hear the native `window.speechSynthesis` engine read the directions aloud.
3. **Test the Operations Data Binding**:
   - Go to the **Report Issue** tab. Submit a new ticket (e.g., "Spill near Gate A").
   - Switch immediately to the **Staff View** tab.
   - Observe your new ticket instantly populating the dashboard feed, proving the real-time global state architecture.
4. **Test the Multilingual AI**:
   - Go to the **Chat** tab.
   - Send a message in a language other than English (e.g., "Hola, ¿dónde está el baño?"). Watch the Gemini engine seamlessly auto-detect and respond in the matching language while adhering to its profile-specific system prompt.
