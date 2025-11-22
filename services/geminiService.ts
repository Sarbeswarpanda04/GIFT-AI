import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { GenerationConfigState } from "../types";

// --- Helper to get Client ---
const getClient = async (requirePaidKey: boolean = false) => {
  // For Veo/Pro Image, we need the paid key flow
  if (requirePaidKey && (window as any).aistudio) {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await (window as any).aistudio.openSelectKey();
    }
  }
  // In this environment, process.env.API_KEY is populated automatically
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// --- Text & Multimodal Chat ---
export const generateChatResponse = async (
  prompt: string,
  files: { mimeType: string; data: string }[],
  configState: GenerationConfigState
) => {
  const ai = await getClient(configState.thinkingMode); 

  let model = "gemini-3-pro-preview";
  
  // Model selection based on features
  if (configState.thinkingMode) {
    model = "gemini-3-pro-preview";
  } else if (configState.searchEnabled) {
      // Use Flash for search grounding as per original requirements
      model = "gemini-2.5-flash"; 
  } else {
      // Default to Pro for high quality chat
      model = "gemini-3-pro-preview";
  }

  const tools: any[] = [];
  if (configState.searchEnabled) tools.push({ googleSearch: {} });

  const config: any = {
    tools: tools.length > 0 ? tools : undefined,
  };

  // Thinking Config
  if (configState.thinkingMode) {
    config.thinkingConfig = { thinkingBudget: 32768 }; // Max for 3 Pro
  }

  const parts: any[] = [];
  files.forEach(f => {
    parts.push({ inlineData: { mimeType: f.mimeType, data: f.data } });
  });
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config
  });

  return response;
};

// --- Image Generation ---
export const generateImage = async (prompt: string, configState: GenerationConfigState) => {
  // User requested no key requirement for image generation
  const ai = await getClient(false); 
  
  const model = "gemini-3-pro-image-preview"; // Nano Banana Pro

  const response = await ai.models.generateContent({
    model,
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: configState.aspectRatio || "1:1",
        imageSize: configState.imageSize || "1K"
      }
    }
  });
  
  return response;
};

// --- Image Editing ---
export const editImage = async (prompt: string, base64Image: string, mimeType: string) => {
    const ai = await getClient();
    const model = "gemini-2.5-flash-image"; // Nano banana for edits
    
    const response = await ai.models.generateContent({
        model,
        contents: {
            parts: [
                { inlineData: { mimeType, data: base64Image } },
                { text: prompt }
            ]
        }
    });
    return response;
};

// --- TTS ---
export const generateSpeech = async (text: string) => {
    const ai = await getClient();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            }
        }
    });
    return response;
};

// --- Transcription ---
export const transcribeAudio = async (base64Audio: string, mimeType: string) => {
    const ai = await getClient();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
            parts: [
                { inlineData: { mimeType, data: base64Audio } },
                { text: "Transcribe this audio exactly." }
            ]
        }
    });
    return response.text;
};

// --- Live API Connection ---
export const connectLive = async (
    onAudioData: (data: ArrayBuffer) => void,
    onClose: () => void
) => {
    const ai = await getClient();
    // Setup Audio Contexts
    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
            systemInstruction: "You are a helpful AI assistant. Keep responses concise."
        },
        callbacks: {
            onopen: () => {
                console.log("Live Session Opened");
                const source = inputAudioContext.createMediaStreamSource(stream);
                const processor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                
                processor.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    // Convert Float32 to PCM16
                    const l = inputData.length;
                    const int16 = new Int16Array(l);
                    for (let i = 0; i < l; i++) {
                        int16[i] = inputData[i] * 32768;
                    }
                    const pcmData = encode(new Uint8Array(int16.buffer));
                    
                    sessionPromise.then(session => {
                        session.sendRealtimeInput({
                            media: {
                                mimeType: 'audio/pcm;rate=16000',
                                data: pcmData
                            }
                        });
                    });
                };
                source.connect(processor);
                processor.connect(inputAudioContext.destination);
            },
            onmessage: (msg: LiveServerMessage) => {
                const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (base64Audio) {
                   const binary = window.atob(base64Audio);
                   const len = binary.length;
                   const bytes = new Uint8Array(len);
                   for (let i=0; i<len; i++) bytes[i] = binary.charCodeAt(i);
                   onAudioData(bytes.buffer);
                }
            },
            onclose: () => {
                onClose();
                inputAudioContext.close();
                stream.getTracks().forEach(t => t.stop());
            },
            onerror: (e) => {
                console.error("Live API Error", e);
                onClose();
            }
        }
    });

    return {
        disconnect: async () => {
            const session = await sessionPromise;
            session.close();
            inputAudioContext.close();
            stream.getTracks().forEach(t => t.stop());
        }
    };
};

function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}