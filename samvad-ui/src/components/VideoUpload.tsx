import { useState, useRef, useCallback } from 'react'
import { Upload, FileVideo, X, Play } from 'lucide-react'
import ISLAvatar from './ISLAvatar'
import StatusPanel from './StatusPanel'
import LanguageSelector from './LanguageSelector'
import { islApi } from '../api/client'
import type { ProcessedVideo, PipelineStatus, ISLResult } from '../types'

export default function VideoUpload() {
    const [file, setFile] = useState<File | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [status, setStatus] = useState<PipelineStatus>({ stage: 'idle', message: '', progress: 0 })
    const [result, setResult] = useState<ProcessedVideo | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [language, setLanguage] = useState('hi-IN')
    const [currentTime, setCurrentTime] = useState(0)
    const [selectedDub, setSelectedDub] = useState<string>('')
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const audioRef = useRef<HTMLAudioElement>(null)

    const handleFileSelect = (selectedFile: File) => {
        const allowed = ['.mp4', '.avi', '.mov', '.mkv']
        const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase()
        if (!allowed.includes(ext)) {
            setError('Unsupported format. Use MP4, AVI, MOV, or MKV.')
            return
        }
        if (selectedFile.size > 100 * 1024 * 1024) {
            setError('File too large. Max 100MB.')
            return
        }
        setFile(selectedFile)
        setError(null)
        setResult(null)
    }

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile) handleFileSelect(droppedFile)
    }, [])

    const processVideo = async () => {
        if (!file) return
        setError(null)
        setResult(null)

        try {
            setStatus({ stage: 'transcribing', message: 'Uploading and processing...', progress: 10 })
            const res = await islApi.processVideo(file, (pct) => {
                setUploadProgress(pct)
                if (pct < 100) setStatus({ stage: 'transcribing', message: `Uploading: ${pct}%`, progress: pct * 0.2 })
            })

            setResult(res.data)
            setStatus({ stage: 'complete', message: 'Processing complete!', progress: 100 })
        } catch (e: any) {
            const msg = e.response?.data?.detail || 'Processing failed. Is the backend running?'
            setError(msg)
            setStatus({ stage: 'error', message: 'Failed', progress: 0 })
        }
    }

    // Find current ISL result based on playback time
    const currentSubtitle = result?.subtitles?.find(
        s => currentTime >= s.start && currentTime <= s.end
    )
    const currentISLResult: ISLResult | null = currentSubtitle ? {
        gloss: currentSubtitle.isl_gloss,
        emotional_tone: currentSubtitle.emotional_tone || 'neutral',
        avatar_url: currentSubtitle.avatar_url || '',
        duration_seconds: currentSubtitle.end - currentSubtitle.start,
        cultural_notes: [],
        name_signs: {},
        emphasis_words: [],
    } : null

    const handleDubChange = (url: string) => {
        setSelectedDub(url)
        if (audioRef.current) {
            audioRef.current.src = url
            if (videoRef.current) {
                audioRef.current.currentTime = videoRef.current.currentTime
                audioRef.current.play()
            }
        }
    }

    const formatSize = (bytes: number) => {
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    return (
        <div className="h-full flex flex-col gap-4 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#F7FAFC] flex items-center gap-2">
                    <Upload className="w-5 h-5 text-[#A3E635]" />
                    Video Upload
                </h2>
                <LanguageSelector selectedLanguage={language} onLanguageChange={setLanguage} />
            </div>

            {!result ? (
                <>
                    {/* Drop zone */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex-1 min-h-[240px] flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed cursor-pointer transition-all
              ${isDragging
                                ? 'border-[#A3E635] bg-[#A3E635]/5'
                                : file
                                    ? 'border-[#A3E635]/30 bg-[#1A1F2E]'
                                    : 'border-[#2D3748] bg-[#1A1F2E] hover:border-[#4A5568]'
                            }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".mp4,.avi,.mov,.mkv"
                            onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]) }}
                            className="hidden"
                        />

                        {file ? (
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-[#A3E635]/10 flex items-center justify-center">
                                    <FileVideo className="w-6 h-6 text-[#A3E635]" />
                                </div>
                                <div>
                                    <p className="text-[#F7FAFC] font-medium text-sm">{file.name}</p>
                                    <p className="text-[#A0AEC0] text-xs">{formatSize(file.size)}</p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setFile(null); setError(null) }}
                                    className="p-1.5 hover:bg-[#2D3748] rounded-lg text-[#A0AEC0] hover:text-red-400 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="w-16 h-16 rounded-full bg-[#A3E635]/10 flex items-center justify-center">
                                    <Upload className="w-7 h-7 text-[#A3E635]" />
                                </div>
                                <div className="text-center">
                                    <p className="text-[#F7FAFC] font-medium">Drop a video file here</p>
                                    <p className="text-[#4A5568] text-xs mt-1">or click to browse • MP4, AVI, MOV, MKV (max 100MB)</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Pipeline status */}
                    {status.stage !== 'idle' && (
                        <div className="bg-[#1A1F2E] rounded-xl p-4 border border-[#2D3748]">
                            <StatusPanel status={status} />
                            {uploadProgress > 0 && uploadProgress < 100 && (
                                <div className="mt-3 h-2 bg-[#2D3748] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#A3E635] rounded-full transition-all"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Process button */}
                    <button
                        onClick={processVideo}
                        disabled={!file || status.stage !== 'idle'}
                        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2
              ${!file || status.stage !== 'idle'
                                ? 'bg-[#2D3748] text-[#4A5568] cursor-not-allowed'
                                : 'bg-[#A3E635] text-[#0F1117] hover:bg-[#BEF264] shadow-lg shadow-[#A3E635]/20'
                            }`}
                    >
                        <Play className="w-4 h-4" />
                        Process Video
                    </button>
                </>
            ) : (
                /* Results view */
                <div className="flex-1 flex flex-col lg:flex-row gap-4">
                    {/* Video player */}
                    <div className="flex-1 relative rounded-xl overflow-hidden bg-black">
                        <video
                            ref={videoRef}
                            src={result.original_url}
                            className="w-full h-full object-contain"
                            controls
                            onTimeUpdate={(e) => setCurrentTime((e.target as HTMLVideoElement).currentTime)}
                        />

                        {/* ISL Avatar PiP */}
                        <div className="absolute bottom-16 right-4 w-1/4 min-w-[140px] rounded-xl border-2 border-[#A3E635]/60 overflow-hidden shadow-2xl">
                            <ISLAvatar result={currentISLResult} className="h-40" showGloss={false} />
                        </div>

                        {/* Gloss subtitle */}
                        {currentSubtitle && (
                            <div className="absolute bottom-16 left-4 right-[30%]">
                                <span className="bg-black/70 text-[#A3E635] font-mono-isl text-sm px-3 py-1 rounded">
                                    {currentSubtitle.isl_gloss}
                                </span>
                            </div>
                        )}

                        {/* Hidden dubbed audio */}
                        {selectedDub && <audio ref={audioRef} src={selectedDub} />}
                    </div>

                    {/* Side panel */}
                    <div className="w-full lg:w-[280px] flex flex-col gap-3 overflow-y-auto">
                        {/* Stats */}
                        <div className="bg-[#1A1F2E] rounded-xl p-4 border border-[#2D3748]">
                            <p className="text-xs font-bold text-[#A0AEC0] uppercase tracking-wider mb-2">Processing Summary</p>
                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between"><span className="text-[#A0AEC0]">Segments</span><span className="text-[#F7FAFC] font-medium">{result.total_segments || result.subtitles?.length}</span></div>
                                <div className="flex justify-between"><span className="text-[#A0AEC0]">Duration (ms)</span><span className="text-[#F7FAFC] font-medium">{result.processing_time_ms || '—'}</span></div>
                            </div>
                        </div>

                        {/* Dubbed audio */}
                        {result.dubbed_audio && result.dubbed_audio.length > 0 && (
                            <div className="bg-[#1A1F2E] rounded-xl p-4 border border-[#2D3748]">
                                <p className="text-xs font-bold text-[#A0AEC0] uppercase tracking-wider mb-2">Dubbed Audio</p>
                                <div className="space-y-2">
                                    {result.dubbed_audio.map((dub) => (
                                        <button
                                            key={dub.language_code}
                                            onClick={() => handleDubChange(dub.url)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all
                        ${selectedDub === dub.url
                                                    ? 'bg-[#A3E635]/20 text-[#A3E635] border border-[#A3E635]/40'
                                                    : 'bg-[#0F1117] text-[#A0AEC0] border border-[#2D3748] hover:border-[#4A5568]'
                                                }`}
                                        >
                                            🔊 {dub.language}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Transcript */}
                        {result.full_transcript && (
                            <div className="bg-[#1A1F2E] rounded-xl p-4 border border-[#2D3748]">
                                <p className="text-xs font-bold text-[#A0AEC0] uppercase tracking-wider mb-2">Full Transcript</p>
                                <p className="text-xs text-[#A0AEC0] leading-relaxed">{result.full_transcript}</p>
                            </div>
                        )}

                        {/* New upload */}
                        <button
                            onClick={() => { setResult(null); setFile(null); setStatus({ stage: 'idle', message: '', progress: 0 }) }}
                            className="text-xs font-semibold text-[#A0AEC0] hover:text-[#A3E635] underline self-center transition-colors"
                        >
                            Upload another video
                        </button>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}
        </div>
    )
}
