import { useState, useRef, useEffect } from 'react';
import LanguageSelector from './LanguageSelector';
import { checkHealth } from '../services/api';

interface AudioUploadComponentProps {
  onTranscriptReceived?: (transcript: string, language: string) => void;
  maxRecordingTime?: number;
  maxFileSize?: number;
  supportedFormats?: string[];
}

interface AudioUploadState {
  // File upload state
  isDragOver: boolean;
  uploadProgress: number;
  uploadedFile: File | null;
  
  // Recording state
  isRecording: boolean;
  recordingTime: number;
  recordedBlob: Blob | null;
  mediaRecorder: MediaRecorder | null;
  
  // Transcription state
  isTranscribing: boolean;
  transcript: string;
  selectedLanguage: string;
  
  // Error handling
  error: string | null;
  hasPermission: boolean;
}

export default function AudioUploadComponent({
  onTranscriptReceived,
  maxRecordingTime = 30,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  supportedFormats = ['audio/wav', 'audio/mp3', 'audio/mpeg']
}: AudioUploadComponentProps) {
  const [state, setState] = useState<AudioUploadState>({
    isDragOver: false,
    uploadProgress: 0,
    uploadedFile: null,
    isRecording: false,
    recordingTime: 0,
    recordedBlob: null,
    mediaRecorder: null,
    isTranscribing: false,
    transcript: '',
    selectedLanguage: 'en',
    error: null,
    hasPermission: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingTimerRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
      }
      if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
        state.mediaRecorder.stop();
      }
    };
  }, [state.mediaRecorder]);

  const handleLanguageChange = (language: string) => {
    setState(prev => ({ ...prev, selectedLanguage: language }));
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  // File upload handlers
  const validateFile = (file: File): string | null => {
    // Check file type
    if (!supportedFormats.includes(file.type)) {
      return 'Please select a WAV or MP3 audio file';
    }
    
    // Check file size
    if (file.size > maxFileSize) {
      return `File size must be less than ${Math.round(maxFileSize / (1024 * 1024))}MB`;
    }
    
    return null;
  };

  const handleFileSelect = (file: File) => {
    clearError();
    
    const validationError = validateFile(file);
    if (validationError) {
      setState(prev => ({ ...prev, error: validationError }));
      return;
    }
    
    setState(prev => ({ ...prev, uploadedFile: file }));
    // Will implement upload logic in next task
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setState(prev => ({ ...prev, isDragOver: true }));
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setState(prev => ({ ...prev, isDragOver: false }));
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setState(prev => ({ ...prev, isDragOver: false }));
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      
      // Additional check for drag-dropped files
      if (!file.type.startsWith('audio/')) {
        setState(prev => ({ ...prev, error: 'Please drop an audio file (WAV or MP3)' }));
        return;
      }
      
      handleFileSelect(file);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // Microphone recording handlers
  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      
      // Stop the stream immediately, we just needed to check permission
      stream.getTracks().forEach(track => track.stop());
      
      setState(prev => ({ ...prev, hasPermission: true }));
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      
      let errorMessage = 'Microphone access required. Please enable in browser settings';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone access denied. Please allow microphone access and try again';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone detected. Please connect a microphone and try again';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Microphone recording not supported in this browser';
        }
      }
      
      setState(prev => ({ ...prev, error: errorMessage, hasPermission: false }));
      return false;
    }
  };

  const initializeMediaRecorder = async (): Promise<MediaRecorder | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      return mediaRecorder;
    } catch (error) {
      console.error('Failed to initialize MediaRecorder:', error);
      setState(prev => ({ ...prev, error: 'Recording failed. Please try again' }));
      return null;
    }
  };

  const startRecording = async () => {
    clearError();
    
    // Check permission first
    if (!state.hasPermission) {
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) return;
    }

    const mediaRecorder = await initializeMediaRecorder();
    if (!mediaRecorder) return;

    const audioChunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
      const audioFile = processRecordedAudio(audioBlob);
      
      setState(prev => ({ 
        ...prev, 
        recordedBlob: audioBlob,
        uploadedFile: audioFile, // Store as uploadedFile for unified processing
        isRecording: false,
        recordingTime: 0,
        mediaRecorder: null
      }));
      
      // Stop all tracks
      if (mediaRecorder.stream) {
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
    };

    mediaRecorder.start();
    setState(prev => ({ 
      ...prev, 
      isRecording: true, 
      recordingTime: 0,
      mediaRecorder,
      recordedBlob: null
    }));

    // Start timer
    recordingTimerRef.current = window.setInterval(() => {
      setState(prev => {
        const newTime = prev.recordingTime + 1;
        
        // Auto-stop at max recording time
        if (newTime >= maxRecordingTime) {
          if (prev.mediaRecorder && prev.mediaRecorder.state === 'recording') {
            prev.mediaRecorder.stop();
          }
          if (recordingTimerRef.current) {
            window.clearInterval(recordingTimerRef.current);
          }
          return { ...prev, recordingTime: maxRecordingTime };
        }
        
        return { ...prev, recordingTime: newTime };
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (state.mediaRecorder && state.mediaRecorder.state === 'recording') {
      state.mediaRecorder.stop();
    }
    
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Convert Blob to File for backend compatibility
  const blobToFile = (blob: Blob, filename: string): File => {
    return new File([blob], filename, {
      type: blob.type,
      lastModified: Date.now()
    });
  };

  // Process recorded audio
  const processRecordedAudio = (blob: Blob): File => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `recording-${timestamp}.webm`;
    return blobToFile(blob, filename);
  };

  // Backend integration
  const mapLanguageCodeForAPI = (languageCode: string): string => {
    // Map frontend language codes to backend expected format
    const languageMap: { [key: string]: string } = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'bn': 'bn-IN',
      'te': 'te-IN',
      'mr': 'mr-IN',
      'ta': 'ta-IN',
      'gu': 'gu-IN',
      'kn': 'kn-IN',
      'ml': 'ml-IN',
      'or': 'or-IN',
      'pa': 'pa-IN',
      'as': 'as-IN',
      'ur': 'ur-IN'
    };
    
    return languageMap[languageCode] || 'en-US';
  };

  const uploadAndTranscribe = async (audioFile: File) => {
    setState(prev => ({ ...prev, isTranscribing: true, error: null }));
    
    try {
      // Check backend health first
      await checkHealth();
      
      // Prepare form data
      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('language_code', mapLanguageCodeForAPI(state.selectedLanguage));
      
      // Simulate upload progress
      setState(prev => ({ ...prev, uploadProgress: 10 }));
      
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
        method: 'POST',
        body: formData,
      });
      
      setState(prev => ({ ...prev, uploadProgress: 90 }));
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error occurred' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      setState(prev => ({ 
        ...prev, 
        transcript: result.transcript,
        uploadProgress: 100,
        isTranscribing: false
      }));
      
      // Call callback if provided
      if (onTranscriptReceived) {
        onTranscriptReceived(result.transcript, state.selectedLanguage);
      }
      
      // Reset progress after a short delay
      setTimeout(() => {
        setState(prev => ({ ...prev, uploadProgress: 0 }));
      }, 2000);
      
    } catch (error) {
      console.error('Transcription error:', error);
      
      let errorMessage = 'Transcription failed. Please try again';
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Service temporarily unavailable. Please check your connection and try again';
        } else if (error.message.includes('File must be an audio file')) {
          errorMessage = 'Invalid audio file format. Please use WAV or MP3';
        } else {
          errorMessage = error.message;
        }
      }
      
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isTranscribing: false,
        uploadProgress: 0
      }));
    }
  };

  return (
    <div className="bg-white/40 dark:bg-black/20 backdrop-blur-sm rounded-xl p-4 sm:p-6 lg:p-8 border border-stone-200/50 dark:border-stone-700/50 space-y-4 sm:space-y-6">
      <div className="text-center mb-4 sm:mb-6">
        <div className="inline-flex items-center justify-center size-12 sm:size-16 rounded-full bg-primary/10 mb-3 sm:mb-4">
          <span className="material-symbols-outlined text-primary text-[24px] sm:text-[32px]">upload</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#2c2420] dark:text-white mb-2">
          Audio Upload & Recording
        </h2>
        <p className="text-sm text-[#5a4d48] dark:text-stone-400 px-2 sm:px-0">
          Upload an audio file or record directly to get instant transcription
        </p>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <span className="material-symbols-outlined text-red-500 text-[20px] mt-0.5 flex-shrink-0">error</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-red-700 dark:text-red-300 font-medium mb-1">
                Error
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 break-words">
                {state.error}
              </p>
              {(state.error.includes('Service temporarily unavailable') || 
                state.error.includes('Transcription failed')) && (
                <button
                  onClick={() => {
                    clearError();
                    if (state.uploadedFile) {
                      uploadAndTranscribe(state.uploadedFile);
                    }
                  }}
                  className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      )}

      {/* Main Upload Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* File Upload Section */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="font-semibold text-[#2c2420] dark:text-white flex items-center gap-2 text-sm sm:text-base">
            <span className="material-symbols-outlined text-primary text-[18px] sm:text-[20px]">upload_file</span>
            Upload Audio File
          </h3>
          <div
            className={`border-2 border-dashed rounded-lg p-4 sm:p-6 lg:p-8 text-center cursor-pointer transition-all ${
              state.isDragOver
                ? 'border-primary bg-primary/5 dark:bg-primary/10'
                : 'border-stone-300 dark:border-stone-600 hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            {state.uploadedFile ? (
              <div className="space-y-3">
                {state.uploadProgress > 0 && state.uploadProgress < 100 ? (
                  // Upload in progress
                  <div className="space-y-3">
                    <span className="material-symbols-outlined text-primary text-[32px] sm:text-[48px] mb-2 block animate-pulse">
                      cloud_upload
                    </span>
                    <div>
                      <p className="font-medium text-[#2c2420] dark:text-white mb-2 text-sm sm:text-base break-words px-2">
                        Uploading {state.uploadedFile.name}...
                      </p>
                      <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2 mb-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${state.uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-stone-500 dark:text-stone-400">
                        {state.uploadProgress}% complete
                      </p>
                    </div>
                  </div>
                ) : (
                  // Upload complete or ready to upload
                  <div className="space-y-3">
                    <span className="material-symbols-outlined text-green-500 text-[32px] sm:text-[48px] mb-2 block">
                      check_circle
                    </span>
                    <div>
                      <p className="font-medium text-[#2c2420] dark:text-white text-sm sm:text-base break-words px-2">
                        {state.uploadedFile.name}
                      </p>
                      <p className="text-sm text-stone-500 dark:text-stone-400">
                        {(state.uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (state.uploadedFile) {
                            uploadAndTranscribe(state.uploadedFile);
                          }
                        }}
                        disabled={state.isTranscribing}
                        className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {state.isTranscribing ? 'Transcribing...' : 'Transcribe'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setState(prev => ({ ...prev, uploadedFile: null, uploadProgress: 0 }));
                        }}
                        className="text-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 transition-colors px-4 py-2"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <span className="material-symbols-outlined text-stone-400 text-[32px] sm:text-[48px] mb-2 block">
                  {state.isDragOver ? 'file_download' : 'cloud_upload'}
                </span>
                <div>
                  <p className="font-medium text-[#2c2420] dark:text-white mb-1 text-sm sm:text-base px-2">
                    {state.isDragOver ? 'Drop your audio file here' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                    WAV, MP3 files up to 10MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Microphone Recording Section */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="font-semibold text-[#2c2420] dark:text-white flex items-center gap-2 text-sm sm:text-base">
            <span className="material-symbols-outlined text-secondary text-[18px] sm:text-[20px]">mic</span>
            Record Audio
          </h3>
          <div className="border-2 border-dashed border-stone-300 dark:border-stone-600 rounded-lg p-4 sm:p-6 lg:p-8 text-center">
            {state.isRecording ? (
              <div className="space-y-3 sm:space-y-4">
                <div className="relative">
                  <span className="material-symbols-outlined text-red-500 text-[32px] sm:text-[48px] animate-pulse">
                    mic
                  </span>
                  <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full animate-ping"></div>
                </div>
                <div>
                  <p className="font-medium text-[#2c2420] dark:text-white mb-2 text-sm sm:text-base">
                    Recording...
                  </p>
                  <p className="text-base sm:text-lg font-mono text-red-500 mb-2">
                    {formatTime(state.recordingTime)}
                  </p>
                  <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                    Max {maxRecordingTime} seconds
                  </p>
                </div>
                <button
                  onClick={stopRecording}
                  className="bg-red-500 text-white px-4 sm:px-6 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-2 mx-auto"
                >
                  <span className="material-symbols-outlined text-[18px] sm:text-[20px]">stop</span>
                  <span className="hidden sm:inline">Stop Recording</span>
                  <span className="sm:hidden">Stop</span>
                </button>
              </div>
            ) : state.recordedBlob ? (
              <div className="space-y-3 sm:space-y-4">
                <span className="material-symbols-outlined text-green-500 text-[32px] sm:text-[48px]">
                  check_circle
                </span>
                <div>
                  <p className="font-medium text-[#2c2420] dark:text-white mb-2 text-sm sm:text-base">
                    Recording Complete
                  </p>
                  <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mb-3 sm:mb-4">
                    Duration: {formatTime(state.recordingTime)}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    onClick={() => {
                      if (state.uploadedFile) {
                        uploadAndTranscribe(state.uploadedFile);
                      }
                    }}
                    disabled={state.isTranscribing || !state.uploadedFile}
                    className="bg-secondary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary/90 transition-colors disabled:opacity-50"
                  >
                    {state.isTranscribing ? 'Transcribing...' : 'Transcribe'}
                  </button>
                  <button
                    onClick={() => setState(prev => ({ 
                      ...prev, 
                      recordedBlob: null, 
                      recordingTime: 0,
                      uploadedFile: null 
                    }))}
                    className="text-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 transition-colors px-4 py-2"
                  >
                    Record Again
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <span className="material-symbols-outlined text-stone-400 text-[32px] sm:text-[48px]">
                  mic
                </span>
                <div>
                  <p className="font-medium text-[#2c2420] dark:text-white mb-1 text-sm sm:text-base">
                    Click to start recording
                  </p>
                  <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                    Maximum {maxRecordingTime} seconds
                  </p>
                </div>
                <button
                  onClick={startRecording}
                  className="bg-secondary text-white px-4 sm:px-6 py-2 rounded-lg text-sm font-medium hover:bg-secondary/90 transition-colors flex items-center gap-2 mx-auto"
                >
                  <span className="material-symbols-outlined text-[18px] sm:text-[20px]">mic</span>
                  <span className="hidden sm:inline">Start Recording</span>
                  <span className="sm:hidden">Record</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Language Selector */}
      <div className="border-t border-stone-200 dark:border-stone-700 pt-4 sm:pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="font-semibold text-[#2c2420] dark:text-white text-sm sm:text-base">
            Transcription Language
          </h3>
          <div className="sm:ml-auto">
            <LanguageSelector
              selectedLanguage={state.selectedLanguage}
              onLanguageChange={handleLanguageChange}
            />
          </div>
        </div>
      </div>

      {/* Transcript Display */}
      {state.transcript && (
        <div className="border-t border-stone-200 dark:border-stone-700 pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <h3 className="font-semibold text-[#2c2420] dark:text-white flex items-center gap-2 text-sm sm:text-base">
              <span className="material-symbols-outlined text-primary text-[18px] sm:text-[20px]">transcript</span>
              Transcript
            </h3>
            <button
              onClick={() => {
                navigator.clipboard.writeText(state.transcript);
                // Could add a toast notification here
              }}
              className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-[16px]">content_copy</span>
              Copy
            </button>
          </div>
          <div className="bg-stone-50 dark:bg-stone-800 rounded-lg p-3 sm:p-4 border border-stone-200 dark:border-stone-700">
            <p className="text-[#2c2420] dark:text-white whitespace-pre-wrap leading-relaxed text-sm sm:text-base break-words">
              {state.transcript}
            </p>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-stone-200 dark:border-stone-600">
              <span className="material-symbols-outlined text-stone-400 text-[16px]">language</span>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                Language: {state.selectedLanguage.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {state.isTranscribing && (
        <div className="border-t border-stone-200 dark:border-stone-700 pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 py-6 sm:py-8">
            <div className="relative">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
              <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-sm font-medium text-[#2c2420] dark:text-white mb-1">
                Transcribing audio...
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                This may take a few moments
              </p>
            </div>
          </div>
          
          {/* Transcription skeleton */}
          <div className="bg-stone-50 dark:bg-stone-800 rounded-lg p-3 sm:p-4 border border-stone-200 dark:border-stone-700">
            <div className="space-y-2 sm:space-y-3">
              <div className="h-3 sm:h-4 bg-stone-200 dark:bg-stone-600 rounded animate-pulse"></div>
              <div className="h-3 sm:h-4 bg-stone-200 dark:bg-stone-600 rounded animate-pulse w-3/4"></div>
              <div className="h-3 sm:h-4 bg-stone-200 dark:bg-stone-600 rounded animate-pulse w-1/2"></div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={supportedFormats.join(',')}
        className="hidden"
        onChange={handleFileInputChange}
      />
    </div>
  );
}