import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export interface DreamAnalysis {
  summary: string;
  archetypes: string[];
  symbols: { name: string; meaning: string }[];
  emotionalTheme: string;
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const reader = new FileReader();
  const base64Promise = new Promise<string>((resolve) => {
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
  });
  reader.readAsDataURL(audioBlob);
  const base64Data = await base64Promise;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: "Transcribe the following dream recording accurately. If there is no speech, say 'No transcription available'." },
          { inlineData: { data: base64Data, mimeType: audioBlob.type || "audio/webm" } }
        ]
      }
    ]
  });

  return response.text || "No transcription available";
}

export async function analyzeDream(transcription: string): Promise<DreamAnalysis> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: transcription,
    config: {
      systemInstruction: "You are a professional dream analyst specialized in Jungian psychology and deep subconscious archetypes. Provide a structured psychological interpretation of the dream. Focus on symbols and emotional themes.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          archetypes: { type: Type.ARRAY, items: { type: Type.STRING } },
          symbols: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                meaning: { type: Type.STRING }
              },
              required: ["name", "meaning"]
            }
          },
          emotionalTheme: { type: Type.STRING, description: "The single most dominant emotional theme of the dream." }
        },
        required: ["summary", "archetypes", "symbols", "emotionalTheme"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function generateDreamImage(emotionalTheme: string): Promise<string> {
  const prompt = `A surrealist masterpiece representing the primal emotional theme: ${emotionalTheme}. The style is ethereal, merging Salvador Dali's melting perspectives with modern digital surrealism. Dreamlike physics, evocative lighting, deep subconscious symbolism, 4k highly detailed.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-image-preview',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: "1K"
      }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Failed to generate dream image");
}

export async function chatAboutDream(dreamContext: string, history: { role: 'user' | 'model'; content: string }[], newMessage: string) {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: `You are 'Oneiric Admin', a specialized AI dream guide. You have just analyzed a user's dream with the context: ${dreamContext}. Answer follow-up questions about specific symbols or feelings in the dream. Stay professional, empathetic, and grounded in psychological theory (primarily Jungian).`,
    },
    history: history.map(h => ({ role: h.role, parts: [{ text: h.content }] }))
  });

  const response = await chat.sendMessage({ message: newMessage });
  return response.text;
}
