# FanPulse Access

**An adaptive, AI-driven accessibility and operations engine for the FIFA World Cup 2026.**

**FanPulse Access** bridges the gap between fan accessibility and stadium operations. It provides fans with dynamic, profile-adapted wayfinding, a multilingual AI chat assistant, and native text-to-speech services, while simultaneously empowering stadium staff with a real-time issue reporting dashboard to resolve accessibility blockers instantly. 

---

## Core Architecture & Features

This application is built with a highly dynamic, state-driven architecture, avoiding hardcoded placeholders in favor of robust, computable systems:

### 1. Multilingual Chat Assistant
- **Gemini API Integration**: Leverages the Gemini SDK for real-time natural language processing.
- **Strict JSON System Prompts**: Utilizes a dynamic profile engine (`profileEngine.js`) to inject accessibility-specific constraints into the AI's context window.
- **Language Auto-Detection**: The assistant is explicitly prompted to detect the user's language and respond fluently in that exact language, ensuring a globally accessible experience for World Cup fans.
- **Adaptive UI**: The chat interface dynamically scales and adjusts its styling (e.g., high-contrast, large text) based on the globally active accessibility profile.

### 2. Adaptive Wayfinding Engine
- **Dynamic Math & Distance Calculation**: Distance and estimated walking times are *not* hardcoded. The routing engine calculates realistic distances using Euclidean math based on live coordinates provided in `stadium.json`.
- **Profile-Specific Dynamics**: Time estimates adapt dynamically based on the active accessibility profile's defined walking speed (e.g., a standard 1.4 m/s vs. 0.8 m/s for the Mobility profile).
- **Step-Free Pathing**: The routing algorithm recalculates paths to strictly utilize elevators and ramps when the Mobility profile is active.
- **Native TTS Integration**: Leverages the browser's native `window.speechSynthesis` API (`useSpeech.js`) to provide accessible, on-demand audio directions, specifically optimized for the Vision and Cognitive profiles.

### 3. Two-Sided Operations Loop
- **Global Ticket State (`useTickets.js`)**: A centralized React state manager that enables real-time, two-way data binding. 
- **Fan Issue Reporter**: Fans can instantly flag blockers (e.g., broken elevators, spills) with location data tied directly to the stadium topology.
- **Live Staff Dashboard**: Submitted tickets instantly hydrate the operations dashboard, allowing staff to triage, update statuses, and clear blockers efficiently.

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
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
4. Start the development server:
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
