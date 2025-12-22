
import { GoogleGenAI, Type } from "@google/genai";
import { Alignment, Theme, ComicPanel } from "../types";

// Helper to remove data URL prefix
const stripBase64 = (dataUrl: string) => dataUrl.split(',')[1];

/**
 * Step 1: Analyze the user's face.
 * Timeout: 8 seconds.
 */
// Use process.env.API_KEY directly as per guidelines. Removed apiKey argument.
export const analyzeImage = async (userPhotoDataUrl: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const analysisPromise = (async () => {
    try {
      // Upgraded to gemini-3-flash-preview for vision/text analysis
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: stripBase64(userPhotoDataUrl) } },
            { text: "Describe the physical appearance of the person in this photo briefly but precisely (gender, hair color/style, skin tone, facial features, glasses/beard if any). Do not describe the background or clothing." }
          ]
        }
      });
      return response.text || "A mysterious figure";
    } catch (e) {
      console.warn("Image analysis failed, using default.", e);
      return "A mysterious figure";
    }
  })();

  const timeoutPromise = new Promise<string>((resolve) => {
    setTimeout(() => {
        resolve("A mysterious figure");
    }, 8000);
  });

  return Promise.race([analysisPromise, timeoutPromise]);
};

/**
 * Step 2: Write the script.
 * Timeout: 15 seconds.
 * Fallback: Uses a template if AI fails/times out.
 */
// Use process.env.API_KEY directly as per guidelines. Removed apiKey argument.
export const generateStoryScript = async (
  theme: Theme,
  alignment: Alignment,
  userDescription: string
): Promise<{ title: string; panels: { id: number; caption: string; visualPrompt: string }[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // 1. Define the AI Task
  const taskPromise = (async () => {
      const storyPrompt = `
        Create a 6-panel comic script.
        Theme: ${theme.name}.
        Role: ${alignment}.
        Character: ${userDescription}.
      `;

      const response = await ai.models.generateContent({
        // Upgraded to gemini-3-flash-preview for text generation
        model: 'gemini-3-flash-preview',
        contents: storyPrompt,
        config: { 
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    panels: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.INTEGER },
                                caption: { type: Type.STRING },
                                visualPrompt: { type: Type.STRING }
                            },
                            required: ["id", "caption", "visualPrompt"]
                        }
                    }
                },
                required: ["title", "panels"]
            }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No script generated");
      return JSON.parse(text);
  })();

  // 2. Define the Timeout/Fallback
  const timeoutPromise = new Promise<any>((_, reject) => {
    setTimeout(() => reject(new Error("Timeout")), 15000);
  });

  try {
    const result = await Promise.race([taskPromise, timeoutPromise]);
    if (!result.panels || result.panels.length === 0) throw new Error("Empty panels");
    return result;
  } catch (err) {
    console.error("Script generation failed or timed out, using fallback.", err);
    // FALLBACK SCRIPT to ensure app never hangs
    return {
      title: `The ${alignment === 'HERO' ? 'Rise' : 'Reign'} of the ${theme.name} ${alignment === 'HERO' ? 'Hero' : 'Villain'}`,
      panels: [
        { id: 1, caption: `The ${alignment.toLowerCase()} enters the ${theme.name} world.`, visualPrompt: `Wide shot, ${theme.name} city skyline, ${userDescription} standing tall looking at horizon, cinematic lighting` },
        { id: 2, caption: "A sudden threat appears from the shadows.", visualPrompt: `Close up of ${userDescription} looking surprised and determined, ${theme.name} background, dramatic shadows` },
        { id: 3, caption: "There is no time to waste.", visualPrompt: `Action shot, ${userDescription} running or flying towards danger, speed lines, dynamic angle` },
        { id: 4, caption: "Power surges through their veins.", visualPrompt: `Mid shot, ${userDescription} displaying superpowers or weapons, glowing energy effects, ${theme.name} particles` },
        { id: 5, caption: "The enemy is overwhelmed by their might.", visualPrompt: `Explosion or bright light effect, ${userDescription} in silhouette striking a pose, dust and debris` },
        { id: 6, caption: `The ${alignment.toLowerCase()} stands victorious.`, visualPrompt: `Low angle hero shot, ${userDescription} smiling or looking intense, sun setting or rising in background` }
      ]
    };
  }
};

/**
 * Step 3: Generate a single panel image.
 */
// Use process.env.API_KEY directly as per guidelines. Removed apiKey argument.
export const generatePanelImage = async (
  userPhotoDataUrl: string,
  theme: Theme,
  alignment: Alignment,
  panel: { id: number; visualPrompt: string; caption: string }
): Promise<ComicPanel> => {
  // Always create a new GoogleGenAI instance right before the API call as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const finalPrompt = `
    [Style: Masterpiece Comic Book Art, ${theme.name} Aesthetic]
    [Subject: ${alignment === 'HERO' ? 'Superhero' : 'Supervillain'}]
    [Action: ${panel.visualPrompt}]
    [Character Reference: Match the face of the uploaded image]
  `;
    
  try {
    const imageResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: stripBase64(userPhotoDataUrl) } },
          { text: finalPrompt }
        ]
      },
      config: {
        // Explicitly set aspect ratio and size as per image generation rules
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    let base64Image = "";
    // Iterating through all parts to find the image part as recommended
    for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        base64Image = part.inlineData.data;
        break;
      }
    }

    if (!base64Image) {
      throw new Error(`No image generated for panel ${panel.id}`);
    }

    return {
      id: panel.id,
      caption: panel.caption,
      imageUrl: `data:image/png;base64,${base64Image}`
    };
  } catch (e: any) {
    console.error(`Error generating panel ${panel.id}`, e);
    // Propagate specific errors to UI for handling (e.g. API key reset)
    throw e;
  }
};
