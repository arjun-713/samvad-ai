export interface ISLResult {
    gloss: string;
    emotional_tone: string;
    avatar_url: string;
    duration_seconds: number;
    cultural_notes: string[];
    name_signs: Record<string, string>;
    emphasis_words: string[];
}

export interface TranscriptionResult {
    text: string;
    language: string;
    confidence: number;
    start_time: number;
    end_time: number;
}

export interface ProcessedVideo {
    original_url: string;
    isl_overlay_url: string;
    subtitles: SubtitleEntry[];
    dubbed_audio: DubbedAudio[];
    processing_time_ms: number;
    full_transcript?: string;
    total_segments?: number;
}

export interface SubtitleEntry {
    start: number;
    end: number;
    text: string;
    isl_gloss: string;
    avatar_url?: string;
    emotional_tone?: string;
}

export interface DubbedAudio {
    language: string;
    language_code: string;
    url: string;
}

export interface PipelineStatus {
    stage: 'idle' | 'transcribing' | 'transcreating' | 'generating_avatar' | 'dubbing' | 'complete' | 'error';
    message: string;
    progress: number;
}

export interface StreamChunk {
    audio_base64: string;
    timestamp: number;
    sequence: number;
}

export interface ReverseModeResult {
    detected_signs: string[];
    generated_text: string;
    audio_url: string;
    confidence: number;
    hand_count?: number;
}

export interface AppSettings {
    avatar_gender: 'female' | 'male' | 'neutral';
    signing_speed: number;
    pip_position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    pip_size: 'small' | 'medium' | 'large';
    target_languages: string[];
    show_isl_gloss: boolean;
    reverse_mode: boolean;
}

export interface Language {
    code: string;
    name: string;
}

export type AppMode = 'text' | 'live' | 'upload' | 'reverse';
