import { GoogleGenAI, Modality } from "@google/genai";

const PRIMARY_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash"
];

const TTS_MODELS = [
  "gemini-3.8-flash-tts",
  "gemini-3.8-flash-lite-tts",
  "gemini-3.1-flash-tts-preview"
];

async function generateWithFallback(ai: GoogleGenAI, config: any, models = PRIMARY_MODELS) {
  let lastErr: any;
  for (const model of models) {
    try {
      return await ai.models.generateContent({
        ...config,
        model,
      });
    } catch (err: any) {
      lastErr = err;
      const errMsg = String(err?.message || '');
      const isOverloaded = err?.status === 503 || err?.code === 503 || errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE') || errMsg.includes('RESOURCE_EXHAUSTED');
      if (isOverloaded) {
        console.warn(`Model ${model} experiencing high demand, falling back to next available model...`);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

const safeParseJSON = (text: string | null | undefined) => {
  if (!text) return {};
  try {
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Failed to parse JSON response from Gemini:", text);
    throw new Error("Invalid JSON format received from AI.");
  }
};

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return res.status(401).json({
      error: 'GEMINI_API_KEY is not configured in Vercel project environment variables. Please add GEMINI_API_KEY in your Vercel Project Settings.'
    });
  }

  const { action, payload } = req.body || {};
  if (!action) {
    return res.status(400).json({ error: 'Missing action parameter in request body' });
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    switch (action) {
      case 'analyzeVideo': {
        const { videoBase64, mimeType, prompt } = payload;
        const response = await generateWithFallback(ai, {
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType,
                    data: videoBase64,
                  },
                },
              ],
            },
          ],
          config: {
            responseMimeType: "application/json",
          },
        });
        const parsed = safeParseJSON(response.text);
        return res.status(200).json(parsed);
      }

      case 'askEvidenceQuestion': {
        const { report, question } = payload;
        const prompt = `
          You are Viksit Andhra, a highly professional AI Forensics Assistant.
          You have analyzed some video evidence and generated the following official forensic report:
          ${JSON.stringify(report, null, 2)}
          
          The investigating officer has asked the following exact question regarding this evidence:
          "${question}"
          
          Answer the question strictly based on the extracted evidence data above. Maintain a highly professional, objective, and analytical tone suitable for law enforcement officials.
          If the answer is not present in the evidence data, state clearly that the current evidence does not contain this information and refrain from guessing or hallucinating.
        `;

        const response = await generateWithFallback(ai, {
          contents: [{ parts: [{ text: prompt }] }]
        });

        return res.status(200).json({ answer: response.text });
      }

      case 'extractIdDetails': {
        const { imageBase64, mimeType, prompt } = payload;
        const response = await generateWithFallback(ai, {
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType,
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          config: {
            responseMimeType: "application/json",
          },
        });
        const parsed = safeParseJSON(response.text);
        return res.status(200).json(parsed);
      }

      case 'analyzeLiveFrame': {
        const { imageBase64, prompt } = payload;
        const response = await generateWithFallback(ai, {
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          config: {
            responseMimeType: "application/json",
          },
        });
        const parsed = safeParseJSON(response.text);
        return res.status(200).json(parsed);
      }

      case 'analyzeCrowd': {
        const { imageBase64, prompt } = payload;
        const response = await generateWithFallback(ai, {
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          config: {
            responseMimeType: "application/json",
          },
        });
        const parsed = safeParseJSON(response.text);
        return res.status(200).json(parsed);
      }

      case 'generateSpeech': {
        const { text, voice } = payload;
        const voiceMap: Record<string, string> = {
          'Male': 'Fenrir',
          'Female': 'Kore',
          'Child': 'Puck'
        };

        const response = await generateWithFallback(ai, {
          contents: [{ parts: [{ text }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceMap[voice] || 'Kore' },
              },
            },
          },
        }, TTS_MODELS);

        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return res.status(200).json({ audioData });
      }

      case 'processComplaintTurn': {
        const { history, currentData, language, userAudioBase64, systemInstruction } = payload;
        const parts: any[] = [{ text: systemInstruction }];

        if (Array.isArray(history)) {
          history.forEach((h: any) => {
            parts.push({ text: `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}` });
          });
        }

        if (userAudioBase64) {
          parts.push({
            inlineData: {
              mimeType: "audio/webm",
              data: userAudioBase64
            }
          });
          parts.push({ text: "The user just spoke the above audio. Transcribe it and extract information." });
        }

        const response = await generateWithFallback(ai, {
          contents: [{ parts }],
          config: {
            responseMimeType: "application/json",
          },
        });

        const parsed = safeParseJSON(response.text);
        return res.status(200).json(parsed);
      }

      default:
        return res.status(400).json({ error: `Unsupported AI action: ${action}` });
    }
  } catch (err: any) {
    console.error(`Vercel Serverless Gemini API error (${action}):`, err);
    let message = err?.message || 'Gemini API Execution Error';
    try {
      const parsed = typeof message === 'string' && message.startsWith('{') ? JSON.parse(message) : null;
      if (parsed?.error?.message) {
        message = parsed.error.message;
      }
    } catch {}
    if (message.includes('high demand') || message.includes('UNAVAILABLE') || message.includes('503')) {
      message = 'Google AI is currently experiencing high demand. Please try again in a few moments.';
    }
    return res.status(500).json({ error: message });
  }
}
