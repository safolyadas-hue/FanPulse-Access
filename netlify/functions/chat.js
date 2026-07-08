const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: {
        'Allow': 'POST'
      }
    };
  }

  try {
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      console.error('Missing GEMINI_API_KEY environment variable');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error.' })
      };
    }

    const { systemPrompt, userMessage, history = [], context: stadiumContext = '' } = JSON.parse(event.body);

    if (!userMessage) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing userMessage in request body.' })
      };
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const chat = model.startChat({
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemPrompt || '' }],
      },
      history: history.map((h) => ({
        role: h.role,
        parts: [{ text: h.parts }],
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
      headers: {
        'Content-Type': 'application/json'
      }
    };
  } catch (error) {
    console.error('Error generating response:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate response.' })
    };
  }
};
