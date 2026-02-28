/**
 * API service for communicating with Samvad AI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------
export interface HealthCheckResponse {
  status: string;
  service: string;
  version: string;
}

export interface StatusResponse {
  backend: string;
  aws_configured: boolean;
  services: {
    transcribe: string;
    polly: string;
    bedrock: string;
    s3: string;
  };
}

export interface TranscribeResponse {
  transcript: string;
  language_detected: string;
  job_name: string;
  status: string;
}

export interface ISLGlossResponse {
  isl_gloss: string[];
  emotional_tone: string;
  confidence: number;
  notes: string;
  original_text: string;
  model_used: string;
  status: string;
}

export interface SynthesizeResponse {
  audio_base64: string;
  content_type: string;
  voice_id: string;
  language_code: string;
  text_length: number;
  status: string;
}

export interface ProcessAudioResponse {
  transcript: string;
  isl_gloss: string[];
  emotional_tone: string;
  confidence: number;
  gloss_notes: string;
  dubbed_audio_base64: string;
  dubbed_voice: string;
  dubbed_language: string;
  model_used: string;
  status: string;
}

export interface SignToSpeechResponse {
  natural_text: string;
  audio_base64: string;
  content_type: string;
  voice_id: string;
  gesture_input: string;
  status: string;
}

// -------------------------------------------------------------------
// Base fetch wrapper
// -------------------------------------------------------------------
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// -------------------------------------------------------------------
// Health / Status
// -------------------------------------------------------------------
export async function checkHealth(): Promise<HealthCheckResponse> {
  return fetchAPI<HealthCheckResponse>('/api/health');
}

export async function getStatus(): Promise<StatusResponse> {
  return fetchAPI<StatusResponse>('/api/status');
}

export async function testConnection(): Promise<boolean> {
  try {
    const response = await checkHealth();
    return response.status === 'Samvad Backend is alive';
  } catch {
    return false;
  }
}

// -------------------------------------------------------------------
// Transcribe – Audio file → Text
// -------------------------------------------------------------------
export async function transcribeAudio(
  audioFile: File | Blob,
  language: string = 'en'
): Promise<TranscribeResponse> {
  const formData = new FormData();
  formData.append('audio', audioFile, audioFile instanceof File ? audioFile.name : 'recording.wav');
  formData.append('language', language);

  const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
    throw new Error(error.detail || 'Transcription failed');
  }

  return response.json();
}

// -------------------------------------------------------------------
// Translate to ISL – Text → ISL Gloss
// -------------------------------------------------------------------
export async function translateToISL(
  text: string,
  sourceLanguage: string = 'en'
): Promise<ISLGlossResponse> {
  return fetchAPI<ISLGlossResponse>('/api/translate-to-isl', {
    method: 'POST',
    body: JSON.stringify({ text, source_language: sourceLanguage }),
  });
}

// -------------------------------------------------------------------
// Synthesize Audio – Text → Dubbed Audio (Polly)
// -------------------------------------------------------------------
export async function synthesizeAudio(
  text: string,
  targetLanguage: string = 'hi'
): Promise<SynthesizeResponse> {
  return fetchAPI<SynthesizeResponse>('/api/synthesize-audio', {
    method: 'POST',
    body: JSON.stringify({ text, target_language: targetLanguage }),
  });
}

// -------------------------------------------------------------------
// Process Audio – Full pipeline (Audio → Transcript → ISL → Audio)
// -------------------------------------------------------------------
export async function processAudio(
  audioFile: File | Blob,
  sourceLanguage: string = 'en',
  targetLanguage: string = 'hi'
): Promise<ProcessAudioResponse> {
  const formData = new FormData();
  formData.append('audio', audioFile, audioFile instanceof File ? audioFile.name : 'recording.wav');
  formData.append('source_language', sourceLanguage);
  formData.append('target_language', targetLanguage);

  const response = await fetch(`${API_BASE_URL}/api/process-audio`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
    throw new Error(error.detail || 'Audio processing failed');
  }

  return response.json();
}

// -------------------------------------------------------------------
// Sign to Speech – Reverse mode (ISL description → spoken audio)
// -------------------------------------------------------------------
export async function signToSpeech(
  gestureDescription: string,
  targetLanguage: string = 'hi'
): Promise<SignToSpeechResponse> {
  return fetchAPI<SignToSpeechResponse>('/api/sign-to-speech', {
    method: 'POST',
    body: JSON.stringify({ gesture_description: gestureDescription, target_language: targetLanguage }),
  });
}

// -------------------------------------------------------------------
// Helper: play base64 audio
// -------------------------------------------------------------------
export function playBase64Audio(base64Data: string, contentType: string = 'audio/mpeg'): HTMLAudioElement {
  const audioUrl = `data:${contentType};base64,${base64Data}`;
  const audio = new Audio(audioUrl);
  audio.play();
  return audio;
}

export default {
  checkHealth,
  getStatus,
  testConnection,
  transcribeAudio,
  translateToISL,
  synthesizeAudio,
  processAudio,
  signToSpeech,
  playBase64Audio,
};
