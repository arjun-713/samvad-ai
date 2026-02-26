import { useState } from 'react';
import AudioUploadComponent from '../components/AudioUploadComponent';

export default function Assistive() {
  const [latestTranscript, setLatestTranscript] = useState<string>('');

  const handleTranscriptReceived = (transcript: string, language: string) => {
    setLatestTranscript(transcript);
    console.log('Transcript received:', transcript, 'Language:', language);
    // Future integration: Could trigger sign language avatar generation here
    // Could also integrate with other assistive features
  };
  return (
    <main className="relative z-10 flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-6 md:p-12 md:pt-4">
      <div className="glass-panel dark:bg-black/30 rounded-2xl p-6 sm:p-8 md:p-12 shadow-soft border-t border-white dark:border-stone-700">
        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
          <div className="inline-flex items-center justify-center size-20 sm:size-24 rounded-full bg-secondary/10 mb-4">
            <span className="material-symbols-outlined text-secondary text-[48px] sm:text-[64px]">accessibility_new</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-[#2c2420] dark:text-white">
            Assistive Mode
          </h1>
          
          <p className="text-base sm:text-lg text-[#5a4d48] dark:text-stone-300 leading-relaxed px-2 sm:px-0">
            Real-time assistance for daily conversations. Use your device camera or microphone 
            to get instant sign language interpretation for face-to-face interactions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-8 sm:mt-12">
            <div className="bg-white/40 dark:bg-black/20 backdrop-blur-sm rounded-xl p-6 sm:p-8 border border-stone-200/50 dark:border-stone-700/50 text-left">
              <span className="material-symbols-outlined text-secondary text-[40px] sm:text-[48px] mb-4 block">
                mic
              </span>
              <h3 className="font-bold text-[#2c2420] dark:text-white mb-3 text-lg sm:text-xl">Voice to Sign</h3>
              <p className="text-sm text-[#5a4d48] dark:text-stone-400 mb-4">
                Speak naturally and see your words translated into sign language in real-time
              </p>
              <ul className="space-y-2 text-sm text-[#5a4d48] dark:text-stone-400">
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-secondary flex-shrink-0"></span>
                  Continuous speech recognition
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-secondary flex-shrink-0"></span>
                  Context-aware interpretation
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-secondary flex-shrink-0"></span>
                  Multi-language support
                </li>
              </ul>
            </div>

            <div className="bg-white/40 dark:bg-black/20 backdrop-blur-sm rounded-xl p-6 sm:p-8 border border-stone-200/50 dark:border-stone-700/50 text-left">
              <span className="material-symbols-outlined text-primary text-[40px] sm:text-[48px] mb-4 block">
                sign_language
              </span>
              <h3 className="font-bold text-[#2c2420] dark:text-white mb-3 text-lg sm:text-xl">Sign to Voice</h3>
              <p className="text-sm text-[#5a4d48] dark:text-stone-400 mb-4">
                Use your camera to capture sign language and hear it spoken aloud
              </p>
              <ul className="space-y-2 text-sm text-[#5a4d48] dark:text-stone-400">
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-primary flex-shrink-0"></span>
                  Advanced gesture recognition
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-primary flex-shrink-0"></span>
                  Natural voice synthesis
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-primary flex-shrink-0"></span>
                  Offline capability
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-r from-secondary/10 to-primary/10 rounded-xl p-6 sm:p-8 mt-8 sm:mt-12">
            <h3 className="font-bold text-[#2c2420] dark:text-white mb-4 text-lg sm:text-xl">Accessibility Features</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[28px] sm:text-[32px]">contrast</span>
                <span className="text-xs font-medium text-[#5a4d48] dark:text-stone-300 text-center">High Contrast</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[28px] sm:text-[32px]">text_fields</span>
                <span className="text-xs font-medium text-[#5a4d48] dark:text-stone-300 text-center">Large Text</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[28px] sm:text-[32px]">keyboard</span>
                <span className="text-xs font-medium text-[#5a4d48] dark:text-stone-300 text-center">Keyboard Nav</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[28px] sm:text-[32px]">record_voice_over</span>
                <span className="text-xs font-medium text-[#5a4d48] dark:text-stone-300 text-center">Screen Reader</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 sm:mt-12">
            <button className="bg-secondary text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold shadow-glow hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base">
              <span className="material-symbols-outlined text-[20px] sm:text-[24px]">mic</span>
              <span>Start Voice Mode</span>
            </button>
            <button className="bg-primary text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold shadow-glow hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base">
              <span className="material-symbols-outlined text-[20px] sm:text-[24px]">videocam</span>
              <span>Start Camera Mode</span>
            </button>
          </div>

          {/* Audio Upload Component */}
          <div className="mt-8 sm:mt-12">
            <AudioUploadComponent 
              onTranscriptReceived={handleTranscriptReceived}
              maxRecordingTime={30}
              maxFileSize={10 * 1024 * 1024} // 10MB
            />
          </div>

          {/* Show latest transcript if available */}
          {latestTranscript && (
            <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300 font-medium mb-1">
                Latest Transcript:
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 break-words">
                {latestTranscript}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
