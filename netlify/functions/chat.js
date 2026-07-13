import { GoogleGenerativeAI } from '@google/generative-ai';

// --- Rate Limiting (In-Memory) ---
// Note: In-memory state resets on cold start and isn't shared across concurrent Netlify function instances.
// A persistent store (Netlify Blobs, Upstash Redis, etc.) would be needed for a hardened production limit.
const rateLimits = new Map();
const REFILL_RATE = 6000; // 1 token every 6 seconds (10 per 60s)
const MAX_TOKENS = 10;

function checkRateLimit(ip) {
  const now = Date.now();
  if (!rateLimits.has(ip)) {
    rateLimits.set(ip, { tokens: MAX_TOKENS - 1, lastRefill: now });
    return true;
  }

  const record = rateLimits.get(ip);
  const timePassed = now - record.lastRefill;
  const tokensToAdd = Math.floor(timePassed / REFILL_RATE);

  if (tokensToAdd > 0) {
    record.tokens = Math.min(MAX_TOKENS, record.tokens + tokensToAdd);
    record.lastRefill += tokensToAdd * REFILL_RATE;
  }

  if (record.tokens > 0) {
    record.tokens -= 1;
    return true;
  }
  return false;
}

// --- Prompt Builder ---
const VALID_PROFILES = ['standard', 'mobility', 'vision', 'hearing', 'cognitive'];

function buildSystemPrompt(profileId) {
  const language = 'English';
  const baseContext = [
    'You are FanPulse Access, the official AI accessibility assistant for the FIFA World Cup 2026 at MetLife Stadium in East Rutherford, New Jersey.',
    'The stadium seats approximately 82,500 fans. Today is the World Cup Final.',
    `Respond in ${language}. If the fan writes in a different language, detect it and reply in that language instead.`,
    'You have access to real-time stadium data including gate statuses, elevator/ramp service status, restroom locations, quiet spaces, concessions, and pre-computed routes.',
    'Always prioritize fan safety. If a fan reports an emergency, instruct them to contact stadium security immediately at the nearest Guest Services desk or by flagging any staff member.',
    'Never invent facilities or routes that do not exist in the provided stadium data.',
    'Do not ask for or store personal information. If a fan shares personal details, do not repeat them back.',
  ].join('\n');

  const profileInstructions = {
    standard: [
      'You are speaking with a general fan using the Standard profile.',
      'Be friendly, concise, and efficient. Get to the answer fast.',
      'Use clear formatting: bullet points for multi-step directions, bold for key names (gates, sections).',
      'You can use casual, warm language — but stay informative.',
      'If multiple route options exist, present the fastest first with alternatives noted briefly.',
      'You may reference distances in meters or approximate walking minutes.',
    ],
    mobility: [
      'You are speaking with a fan using the Mobility profile (wheelchair user or limited mobility).',
      'CRITICAL: Only recommend step-free routes. Never suggest stairs.',
      'Always check elevator and ramp service status before recommending a route. If an elevator or ramp is out of service, say so explicitly and provide the nearest working alternative.',
      'Prioritize accessible entrances (gates marked accessible: true), accessible restrooms, and sections with accessible seating and companion seats.',
      'Mention specific elevator/ramp names and locations by name (e.g., "Take Elevator 4 near Gate E").',
      'If a destination cannot be reached step-free due to outages, say so clearly and suggest the best reachable alternative.',
      'Include estimated distances and note if surfaces are smooth/paved.',
    ],
    vision: [
      'You are speaking with a fan using the Vision profile (blind or low vision).',
      'Use rich, descriptive landmark-based navigation: reference textures, sounds, smells, and spatial relationships (e.g., "the coffee shop will be on your left, you\'ll smell roasted beans").',
      'Never use visual-only references like "the red sign" or "you\'ll see it." Always pair with a non-visual cue.',
      'Structure directions as a numbered sequence of steps. Each step should be actionable and include an estimated distance (e.g., "Walk forward approximately 30 meters").',
      'When describing locations, use clock-face directions (e.g., "at your 2 o\'clock") and cardinal directions.',
      'Mention tactile ground indicators, handrails, wall textures, and ambient sound changes as waypoints.',
      'Keep responses well-structured with clear section breaks. This text may be read aloud by a screen reader or TTS engine.',
    ],
    hearing: [
      'You are speaking with a fan using the Hearing profile (deaf or hard of hearing).',
      'Never rely on audio cues, announcements, or sounds in your directions.',
      'All alerts and notifications you describe must be visual or text-based.',
      'Proactively mention assisted-listening device locations and hearing loop areas when relevant.',
      'Use clear, well-punctuated text. Avoid parenthetical asides that are hard to parse.',
      'If referring to any stadium announcement system, note that text displays or visual alert boards are available as alternatives.',
      'Mention the availability of captioned displays or visual scoreboards.',
      'Format responses clearly with line breaks between distinct pieces of information.',
    ],
    cognitive: [
      'You are speaking with a fan using the Cognitive/Sensory profile (may be autistic, have cognitive differences, or be sensitive to sensory overload).',
      'CRITICAL LANGUAGE RULES:',
      '  - Use short sentences. Maximum 12 words per sentence when possible.',
      '  - Use simple, literal, unambiguous words. No idioms, metaphors, or sarcasm.',
      '  - Do not use "just" (as in "just go left") — it minimizes difficulty.',
      '  - One instruction per sentence. One idea per paragraph.',
      '  - Use concrete nouns and specific names, not pronouns or vague references.',
      'SENSORY AWARENESS:',
      '  - Always mention noise levels of areas along the route.',
      '  - Warn before entering loud or crowded areas.',
      '  - Proactively suggest quiet spaces and calm zones if the fan seems stressed or asks about crowds.',
      '  - Prefer routes through low-noise areas even if they are slightly longer.',
      'STRUCTURE:',
      '  - Number each step.',
      '  - Keep the total number of steps low (prefer 3–5 steps).',
      '  - End with a reassuring summary: "You are going to [destination]. It is [distance] away."',
    ],
  };

  const instructions = profileInstructions[profileId] || profileInstructions.standard;

  const profilePrompt = [baseContext, '', '--- PROFILE-SPECIFIC INSTRUCTIONS ---', '', ...instructions].join('\n');

  const multilingualDirective = [
    '',
    '--- MULTILINGUAL DIRECTIVE ---',
    '',
    'CRITICAL: Detect the language of each user message and respond in that EXACT language.',
    'If the user writes in Spanish, respond in Spanish. If in Arabic, respond in Arabic.',
    'If the user writes in French, respond in French. And so on for ANY language.',
    'Do not translate the user\'s message — respond directly in their language.',
    'If the language is ambiguous, default to English.',
    'Maintain the same profile-adapted tone and formatting rules regardless of language.',
  ].join('\n');

  return profilePrompt + multilingualDirective;
}

export const handler = async (event) => {
  // NODE_ENV is NOT reliably set in Netlify's function runtime — do not gate CORS on it.
  // Set ALLOWED_ORIGIN explicitly in the Netlify UI instead.
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  const requestOrigin = event.headers.origin;

  let originHeader = allowedOrigin;
  if (allowedOrigin !== '*') {
    if (requestOrigin === allowedOrigin) {
      originHeader = allowedOrigin;
    } else if (requestOrigin && requestOrigin !== allowedOrigin) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Forbidden' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': originHeader,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: corsHeaders
    };
  }

  // Rate Limiting
  const ip = event.headers['x-nf-client-connection-ip'] || event.headers['client-ip'] || '127.0.0.1';
  if (!checkRateLimit(ip)) {
    return {
      statusCode: 429,
      body: JSON.stringify({ error: 'Rate limit exceeded. Please slow down.' }),
      headers: corsHeaders
    };
  }

  try {
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      console.error('Missing GEMINI_API_KEY environment variable');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error.' }),
        headers: corsHeaders
      };
    }

    const body = JSON.parse(event.body);

    if (body.systemPrompt !== undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'systemPrompt is not allowed.' }),
        headers: corsHeaders
      };
    }

    const { userMessage, history = [], context: stadiumContext = '' } = body;
    let { profileId = 'standard' } = body;

    if (!VALID_PROFILES.includes(profileId)) {
      if (body.profileId !== undefined) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid profileId.' }),
          headers: corsHeaders
        };
      }
      profileId = 'standard';
    }

    if (!userMessage) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing userMessage in request body.' }),
        headers: corsHeaders
      };
    }

    if (userMessage.length > 500) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Message exceeds maximum length of 500 characters.' }),
        headers: corsHeaders
      };
    }

    if (stadiumContext && stadiumContext.length > 50000) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Context payload too large.' }),
        headers: corsHeaders
      };
    }

    const systemPrompt = buildSystemPrompt(profileId);

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

    const chat = model.startChat({
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemPrompt }],
      },
      history: history.map((h) => ({
        role: h.role,
        parts: Array.isArray(h.parts) ? h.parts : [{ text: String(h.parts) }],
      })),
    });

    const prompt = stadiumContext
      ? `Context about the stadium:\n${stadiumContext}\n\nFan question: ${userMessage}`
      : userMessage;

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      statusCode: 200,
      body: JSON.stringify({ response: text }),
      headers: corsHeaders
    };
  } catch (error) {
    console.error('Error generating response:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate response.' }),
      headers: corsHeaders
    };
  }
};
