import { useState, useRef, useCallback } from 'react';
import LanguageSelector from '../components/LanguageSelector';
import {
  processAudio,
  transcribeAudio,
  translateToISL,
  synthesizeAudio,
  signToSpeech,
  playBase64Audio,
  type ProcessAudioResponse,
  type SignToSpeechResponse,
} from '../services/api';

type PipelineStage = 'idle' | 'uploading' | 'transcribing' | 'translating' | 'synthesizing' | 'complete' | 'error';

export default function Assistive() {
  // State
  const [sourceLanguage, setSourceLanguage] = useState('hi');
  const [targetLanguage, setTargetLanguage] = useState('ta');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [stage, setStage] = useState<PipelineStage>('idle');
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  // Pipeline results
  const [transcript, setTranscript] = useState('');
  const [islGloss, setIslGloss] = useState<string[]>([]);
  const [emotionalTone, setEmotionalTone] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [glossNotes, setGlossNotes] = useState('');
  const [dubbedAudioBase64, setDubbedAudioBase64] = useState('');

  // Reverse mode
  const [reverseMode, setReverseMode] = useState(false);
  const [gestureInput, setGestureInput] = useState('');
  const [reverseResult, setReverseResult] = useState<SignToSpeechResponse | null>(null);
  const [reverseLoading, setReverseLoading] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // --------------- File handling ---------------
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setRecordedBlob(null);
      resetResults();
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('audio/') || file.name.match(/\.(wav|mp3|ogg|flac|m4a|webm)$/i))) {
      setAudioFile(file);
      setRecordedBlob(null);
      resetResults();
    }
  }, []);

  // --------------- Mic recording ---------------
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        setAudioFile(null);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      resetResults();

      // Auto-stop after 30s
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
      }, 30000);
    } catch (err) {
      setError('Microphone access denied. Please allow microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // --------------- Pipeline ---------------
  const resetResults = () => {
    setTranscript('');
    setIslGloss([]);
    setEmotionalTone('');
    setConfidence(0);
    setGlossNotes('');
    setDubbedAudioBase64('');
    setError('');
    setStage('idle');
  };

  const runPipeline = async () => {
    const input = audioFile || recordedBlob;
    if (!input) return;

    setError('');
    setStage('uploading');

    try {
      setStage('transcribing');
      const result: ProcessAudioResponse = await processAudio(
        input,
        sourceLanguage,
        targetLanguage
      );

      setTranscript(result.transcript);
      setStage('translating');
      setIslGloss(result.isl_gloss);
      setEmotionalTone(result.emotional_tone);
      setConfidence(result.confidence);
      setGlossNotes(result.gloss_notes);
      setStage('synthesizing');
      setDubbedAudioBase64(result.dubbed_audio_base64);
      setStage('complete');
    } catch (err: any) {
      setError(err.message || 'Pipeline failed. Check backend connection.');
      setStage('error');
    }
  };

  // --------------- Reverse mode ---------------
  const runReverse = async () => {
    if (!gestureInput.trim()) return;
    setReverseLoading(true);
    setError('');
    try {
      const result = await signToSpeech(gestureInput, targetLanguage);
      setReverseResult(result);
    } catch (err: any) {
      setError(err.message || 'Sign-to-speech failed.');
    } finally {
      setReverseLoading(false);
    }
  };

  // --------------- Audio playback ---------------
  const playDubbedAudio = () => {
    if (dubbedAudioBase64) {
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
      audioPlayerRef.current = playBase64Audio(dubbedAudioBase64);
    }
  };

  const playReverseAudio = () => {
    if (reverseResult?.audio_base64) {
      playBase64Audio(reverseResult.audio_base64);
    }
  };

  // --------------- Stage indicator label ---------------
  const stageLabel: Record<PipelineStage, string> = {
    idle: '',
    uploading: 'Uploading audio...',
    transcribing: '🎧 Transcribing with Amazon Transcribe...',
    translating: '🧠 Generating ISL Gloss with Amazon Bedrock...',
    synthesizing: '🔊 Synthesizing dubbed audio with Amazon Polly...',
    complete: '✅ Pipeline complete!',
    error: '❌ Error occurred',
  };

  const hasInput = !!audioFile || !!recordedBlob;
  const isProcessing = !['idle', 'complete', 'error'].includes(stage);
  const hasResults = stage === 'complete';

  // Confidence bar color
  const confColor = confidence >= 0.8 ? 'bg-green-500' : confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500';

  // Tone emoji
  const toneEmoji: Record<string, string> = {
    neutral: '😐', happy: '😊', sad: '😢', angry: '😠', surprised: '😲', questioning: '🤔',
  };

  return (
    <main className="relative z-10 flex-1 w-full max-w-[1440px] mx-auto p-6 md:p-12 md:pt-4">
      {/* Mode Toggle */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <button
          onClick={() => setReverseMode(false)}
          className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${!reverseMode
              ? 'bg-secondary text-white shadow-glow'
              : 'bg-white/40 dark:bg-black/20 text-[#5a4d48] dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-secondary'
            }`}
        >
          <span className="material-symbols-outlined text-[20px]">mic</span>
          Voice → Sign
        </button>
        <button
          onClick={() => setReverseMode(true)}
          className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${reverseMode
              ? 'bg-primary text-white shadow-glow'
              : 'bg-white/40 dark:bg-black/20 text-[#5a4d48] dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-primary'
            }`}
        >
          <span className="material-symbols-outlined text-[20px]">sign_language</span>
          Sign → Voice
        </button>
      </div>

      {!reverseMode ? (
        /* ========== VOICE → SIGN MODE ========== */
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column: Input */}
          <div className="space-y-6">
            <div className="glass-panel dark:bg-black/30 rounded-2xl p-8 shadow-soft border-t border-white dark:border-stone-700">
              <h2 className="text-2xl font-bold text-[#2c2420] dark:text-white mb-2 flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-[32px]">mic</span>
                Audio Input
              </h2>
              <p className="text-sm text-[#5a4d48] dark:text-stone-400 mb-6">
                Upload an audio file or record from your microphone (max 30 seconds)
              </p>

              {/* Language selectors */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[160px]">
                  <label className="text-xs font-bold text-[#8a7a74] dark:text-stone-400 uppercase tracking-wider mb-2 block">Source Language</label>
                  <LanguageSelector selectedLanguage={sourceLanguage} onLanguageChange={setSourceLanguage} />
                </div>
                <div className="flex items-end pb-1">
                  <span className="material-symbols-outlined text-primary">arrow_forward</span>
                </div>
                <div className="flex-1 min-w-[160px]">
                  <label className="text-xs font-bold text-[#8a7a74] dark:text-stone-400 uppercase tracking-wider mb-2 block">Dub To</label>
                  <LanguageSelector selectedLanguage={targetLanguage} onLanguageChange={setTargetLanguage} />
                </div>
              </div>

              {/* Drag-and-drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${dragOver
                    ? 'border-secondary bg-secondary/10 scale-[1.01]'
                    : 'border-stone-300 dark:border-stone-600 hover:border-secondary/50 hover:bg-secondary/5'
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,.wav,.mp3,.ogg,.flac,.m4a,.webm"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <span className="material-symbols-outlined text-[48px] text-stone-400 dark:text-stone-500 mb-3 block">
                  {audioFile ? 'audio_file' : 'cloud_upload'}
                </span>
                {audioFile ? (
                  <div>
                    <p className="font-semibold text-[#2c2420] dark:text-white">{audioFile.name}</p>
                    <p className="text-xs text-[#5a4d48] dark:text-stone-400 mt-1">
                      {(audioFile.size / 1024).toFixed(1)} KB • Click to change
                    </p>
                  </div>
                ) : recordedBlob ? (
                  <div>
                    <p className="font-semibold text-[#2c2420] dark:text-white">🎙️ Recorded Audio</p>
                    <p className="text-xs text-[#5a4d48] dark:text-stone-400 mt-1">
                      {(recordedBlob.size / 1024).toFixed(1)} KB • Click to upload file instead
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-[#5a4d48] dark:text-stone-300">
                      Drop audio file here or <span className="text-secondary underline">browse</span>
                    </p>
                    <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                      WAV, MP3, OGG, FLAC, WebM supported
                    </p>
                  </div>
                )}
              </div>

              {/* Mic recording */}
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-[#5a4d48] dark:text-stone-400">Or record from microphone:</span>
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${isRecording
                      ? 'bg-red-500 text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                      : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-[#2c2420] dark:text-white hover:border-red-400'
                    }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {isRecording ? 'stop_circle' : 'mic'}
                  </span>
                  {isRecording ? 'Stop Recording' : 'Record'}
                </button>
              </div>

              {/* Process button */}
              <button
                onClick={runPipeline}
                disabled={!hasInput || isProcessing}
                className={`w-full mt-6 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${!hasInput || isProcessing
                    ? 'bg-stone-200 dark:bg-stone-700 text-stone-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-secondary to-primary text-white shadow-glow hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]'
                  }`}
              >
                {isProcessing ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[24px]">rocket_launch</span>
                    Process with Samvad AI
                  </>
                )}
              </button>

              {/* Stage indicator */}
              {stage !== 'idle' && (
                <div className={`mt-4 text-sm font-medium text-center py-2 px-4 rounded-lg ${stage === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                    stage === 'complete' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
                      'bg-secondary/10 text-secondary'
                  }`}>
                  {stageLabel[stage]}
                </div>
              )}

              {error && (
                <div className="mt-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="space-y-6">
            {/* Transcript */}
            <div className="glass-panel dark:bg-black/30 rounded-2xl p-8 shadow-soft border-t border-white dark:border-stone-700">
              <h3 className="text-lg font-bold text-[#2c2420] dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">description</span>
                Transcript
              </h3>
              {transcript ? (
                <div className="bg-[#fdfbf7] dark:bg-stone-900 rounded-xl p-5 border border-stone-100 dark:border-stone-700 min-h-[80px]">
                  <p className="text-[#2c2420] dark:text-white leading-relaxed">{transcript}</p>
                </div>
              ) : (
                <div className="bg-stone-50 dark:bg-stone-900/50 rounded-xl p-5 border border-dashed border-stone-200 dark:border-stone-700 min-h-[80px] flex items-center justify-center">
                  <p className="text-stone-400 dark:text-stone-500 text-sm italic">Transcript will appear here after processing...</p>
                </div>
              )}
            </div>

            {/* ISL Gloss */}
            <div className="glass-panel dark:bg-black/30 rounded-2xl p-8 shadow-soft border-t border-white dark:border-stone-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#2c2420] dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">sign_language</span>
                  ISL Gloss
                </h3>
                {islGloss.length > 0 && (
                  <button
                    onClick={() => navigator.clipboard.writeText(islGloss.join(' '))}
                    className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                    Copy Gloss
                  </button>
                )}
              </div>

              {islGloss.length > 0 ? (
                <div className="space-y-4">
                  {/* Gloss tokens as chips */}
                  <div className="flex flex-wrap gap-2">
                    {islGloss.map((token, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-full text-sm font-semibold text-[#2c2420] dark:text-white shadow-sm"
                      >
                        {token}
                      </span>
                    ))}
                  </div>

                  {/* Emotional tone */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#8a7a74] dark:text-stone-400 uppercase tracking-wider">Tone:</span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fdfbf7] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full text-sm font-medium text-[#2c2420] dark:text-white">
                      {toneEmoji[emotionalTone] || '😐'} {emotionalTone}
                    </span>
                  </div>

                  {/* Confidence */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#8a7a74] dark:text-stone-400 uppercase tracking-wider">Confidence</span>
                      <span className="text-xs font-semibold text-[#2c2420] dark:text-white">{(confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2.5">
                      <div
                        className={`${confColor} h-2.5 rounded-full transition-all duration-700`}
                        style={{ width: `${confidence * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Notes */}
                  {glossNotes && (
                    <p className="text-xs text-[#5a4d48] dark:text-stone-400 italic border-t border-stone-200/50 dark:border-stone-700/50 pt-3">
                      💡 {glossNotes}
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-stone-50 dark:bg-stone-900/50 rounded-xl p-5 border border-dashed border-stone-200 dark:border-stone-700 min-h-[80px] flex items-center justify-center">
                  <p className="text-stone-400 dark:text-stone-500 text-sm italic">ISL Gloss tokens will appear here...</p>
                </div>
              )}
            </div>

            {/* Dubbed Audio */}
            <div className="glass-panel dark:bg-black/30 rounded-2xl p-8 shadow-soft border-t border-white dark:border-stone-700">
              <h3 className="text-lg font-bold text-[#2c2420] dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">volume_up</span>
                Dubbed Audio
              </h3>

              {dubbedAudioBase64 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={playDubbedAudio}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold shadow-glow hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span className="material-symbols-outlined text-[24px]">play_arrow</span>
                      Play Dubbed Audio
                    </button>
                    <a
                      href={`data:audio/mpeg;base64,${dubbedAudioBase64}`}
                      download="samvad-dubbed-audio.mp3"
                      className="flex items-center gap-2 px-4 py-3 border border-stone-200 dark:border-stone-700 rounded-xl text-[#5a4d48] dark:text-stone-300 hover:border-primary/50 transition-all text-sm font-medium"
                    >
                      <span className="material-symbols-outlined text-[20px]">download</span>
                      Download
                    </a>
                  </div>

                  {/* Audio element for playback control */}
                  <audio
                    controls
                    className="w-full mt-2 rounded-lg"
                    src={`data:audio/mpeg;base64,${dubbedAudioBase64}`}
                  />
                </div>
              ) : (
                <div className="bg-stone-50 dark:bg-stone-900/50 rounded-xl p-5 border border-dashed border-stone-200 dark:border-stone-700 min-h-[60px] flex items-center justify-center">
                  <p className="text-stone-400 dark:text-stone-500 text-sm italic">Dubbed audio will appear here...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ========== SIGN → VOICE MODE (REVERSE) ========== */
        <div className="max-w-3xl mx-auto">
          <div className="glass-panel dark:bg-black/30 rounded-2xl p-8 shadow-soft border-t border-white dark:border-stone-700">
            <h2 className="text-2xl font-bold text-[#2c2420] dark:text-white mb-2 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[32px]">sign_language</span>
              Sign → Voice (Bi-directional)
            </h2>
            <p className="text-sm text-[#5a4d48] dark:text-stone-400 mb-6">
              Enter ISL gloss tokens or describe sign gestures to convert to spoken audio
            </p>

            {/* Target language */}
            <div className="mb-6">
              <label className="text-xs font-bold text-[#8a7a74] dark:text-stone-400 uppercase tracking-wider mb-2 block">Output Language</label>
              <LanguageSelector selectedLanguage={targetLanguage} onLanguageChange={setTargetLanguage} />
            </div>

            {/* Gesture input */}
            <textarea
              value={gestureInput}
              onChange={(e) => setGestureInput(e.target.value)}
              placeholder="Enter ISL gloss tokens (e.g., SCHOOL I GO NOW) or describe the gestures..."
              className="w-full h-32 bg-[#fdfbf7] dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl p-5 text-[#2c2420] dark:text-white placeholder-stone-400 dark:placeholder-stone-500 resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-lg"
            />

            <button
              onClick={runReverse}
              disabled={!gestureInput.trim() || reverseLoading}
              className={`w-full mt-4 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${!gestureInput.trim() || reverseLoading
                  ? 'bg-stone-200 dark:bg-stone-700 text-stone-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary to-secondary text-white shadow-glow hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]'
                }`}
            >
              {reverseLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
                  Converting...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[24px]">record_voice_over</span>
                  Convert to Speech
                </>
              )}
            </button>

            {error && (
              <div className="mt-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Reverse result */}
            {reverseResult && (
              <div className="mt-6 space-y-4">
                <div className="bg-[#fdfbf7] dark:bg-stone-900 rounded-xl p-5 border border-stone-100 dark:border-stone-700">
                  <h4 className="text-xs font-bold text-[#8a7a74] dark:text-stone-400 uppercase tracking-wider mb-2">Natural Speech Text</h4>
                  <p className="text-[#2c2420] dark:text-white text-lg leading-relaxed">{reverseResult.natural_text}</p>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={playReverseAudio}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold shadow-glow hover:shadow-lg transition-all"
                  >
                    <span className="material-symbols-outlined text-[24px]">play_arrow</span>
                    Play Audio
                  </button>
                  <a
                    href={`data:audio/mpeg;base64,${reverseResult.audio_base64}`}
                    download="samvad-sign-to-speech.mp3"
                    className="flex items-center gap-2 px-4 py-3 border border-stone-200 dark:border-stone-700 rounded-xl text-[#5a4d48] dark:text-stone-300 hover:border-primary/50 transition-all text-sm font-medium"
                  >
                    <span className="material-symbols-outlined text-[20px]">download</span>
                    Download
                  </a>
                </div>

                <audio
                  controls
                  className="w-full rounded-lg"
                  src={`data:audio/mpeg;base64,${reverseResult.audio_base64}`}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Architecture note */}
      <div className="mt-8 bg-gradient-to-r from-secondary/10 to-primary/10 rounded-xl p-6 max-w-4xl mx-auto">
        <div className="flex items-start gap-4">
          <span className="material-symbols-outlined text-primary text-[32px]">architecture</span>
          <div>
            <h3 className="font-bold text-[#2c2420] dark:text-white mb-2">Powered by AWS</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 text-sm text-[#5a4d48] dark:text-stone-300">
                <span className="size-2 rounded-full bg-secondary"></span>
                Amazon Transcribe (STT)
              </div>
              <div className="flex items-center gap-2 text-sm text-[#5a4d48] dark:text-stone-300">
                <span className="size-2 rounded-full bg-primary"></span>
                Amazon Bedrock / Claude (AI)
              </div>
              <div className="flex items-center gap-2 text-sm text-[#5a4d48] dark:text-stone-300">
                <span className="size-2 rounded-full bg-amber-500"></span>
                Amazon Polly (TTS)
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
