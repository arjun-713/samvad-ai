import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, FileVideo, X, Play } from 'lucide-react'
import StatusPanel from './StatusPanel'
import LanguageSelector from './LanguageSelector'
import { islApi } from '../api/client'
import type { ProcessedVideo, PipelineStatus, ISLResult } from '../types'

interface VideoUploadProps {
    onResult?: (result: ISLResult | null) => void
}

export default function VideoUpload({ onResult }: VideoUploadProps) {
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
        if (onResult) onResult(null)
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
        if (onResult) onResult(null)

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

    // Find current ISL result based on playback time and bubble to parent
    const currentSubtitle = result?.subtitles?.find(
        s => currentTime >= s.start && currentTime <= s.end
    )

    useEffect(() => {
        if (currentSubtitle && onResult) {
            onResult({
                gloss: currentSubtitle.isl_gloss,
                emotional_tone: currentSubtitle.emotional_tone || 'neutral',
                avatar_url: currentSubtitle.avatar_url || '',
                duration_seconds: currentSubtitle.end - currentSubtitle.start,
                cultural_notes: [],
                name_signs: {},
                emphasis_words: [],
            })
        } else if (!currentSubtitle && onResult && result) {
            onResult(null) // Only clear if we are in results view but have no subtitle
        }
    }, [currentSubtitle, onResult, result])

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

    const resetUpload = () => {
        setResult(null);
        setFile(null);
        setStatus({ stage: 'idle', message: '', progress: 0 });
        if (onResult) onResult(null);
    }

    return (
        <div className="flex flex-col h-full space-y-6">

            {/* Main Glass Card */}
            <div className="flex-1 glass-panel bg-white/60 dark:bg-[#151928]/60 rounded-[24px] p-6 shadow-xl flex flex-col relative overflow-hidden group border-t border-white/20">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent opacity-50"></div>

                {/* Header inside card */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-display font-semibold text-gray-800 dark:text-white flex items-center">
                        <Upload className="w-5 h-5 text-[#F59E0B] mr-2" />
                        Video Upload
                    </h2>
                    <LanguageSelector selectedLanguage={language} onLanguageChange={setLanguage} />
                </div>

                {!result ? (
                    <div className="flex flex-col h-full gap-4 justify-center">
                        {/* Drop zone */}
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`w-full min-h-[200px] flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all
                                ${isDragging
                                    ? 'border-[#F59E0B] bg-[#F59E0B]/5'
                                    : file
                                        ? 'border-[#F59E0B]/30 bg-white/10 dark:bg-[#1A1F2E]/80'
                                        : 'border-gray-300 dark:border-[#2D3748] bg-white/5 dark:bg-[#1A1F2E]/50 hover:border-gray-400 dark:hover:border-[#4A5568]'
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
                                <div className="flex items-center gap-4 p-4">
                                    <div className="w-12 h-12 rounded-full bg-[#F59E0B]/10 flex items-center justify-center isolate">
                                        <FileVideo className="w-6 h-6 text-[#F59E0B]" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{file.name}</p>
                                        <p className="text-gray-500 text-xs">{formatSize(file.size)}</p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setFile(null); setError(null) }}
                                        className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full text-gray-500 hover:text-red-500 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="w-16 h-16 rounded-full bg-[#F59E0B]/10 flex items-center justify-center">
                                        <Upload className="w-7 h-7 text-[#F59E0B]" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-gray-800 dark:text-gray-200 font-medium">Drop a video file here</p>
                                        <p className="text-gray-500 text-xs mt-1">or click to browse • MP4, AVI, MOV, MKV (max 100MB)</p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Process button */}
                        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-white/5">
                            <button
                                onClick={processVideo}
                                disabled={!file || status.stage !== 'idle'}
                                className={`w-full py-4 rounded-full shadow-lg font-display font-bold text-lg tracking-wide transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center group relative overflow-hidden ${!file || status.stage !== 'idle'
                                        ? 'bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
                                        : 'bg-[linear-gradient(135deg,#F59E0B_0%,#D97706_100%)] text-white shadow-[#F59E0B]/20 hover:shadow-[#F59E0B]/40'
                                    }`}
                            >
                                {!(!file || status.stage !== 'idle') && <span className="absolute inset-0 w-full h-full bg-white/20 group-hover:translate-x-full transition-transform duration-700 ease-in-out -translate-x-full skew-x-12"></span>}
                                <Play className="w-5 h-5 mr-2" />
                                Process Video
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Results view */
                    <div className="flex flex-col h-full gap-4 overflow-y-auto pr-2">
                        {/* Source Video player */}
                        <div className="w-full aspect-video relative rounded-2xl overflow-hidden bg-black shadow-inner border border-white/10">
                            <video
                                ref={videoRef}
                                src={result.original_url}
                                className="w-full h-full object-contain"
                                controls
                                onTimeUpdate={(e) => setCurrentTime((e.target as HTMLVideoElement).currentTime)}
                            />
                            {/* Hidden dubbed audio */}
                            {selectedDub && <audio ref={audioRef} src={selectedDub} />}
                        </div>

                        {/* Results Controls List */}
                        <div className="flex flex-col gap-3">
                            {/* Dubbed audio selection */}
                            {result.dubbed_audio && result.dubbed_audio.length > 0 && (
                                <div className="bg-white/40 dark:bg-white/5 rounded-xl p-3 border border-gray-200 dark:border-white/10">
                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Dubbed Audio Track</p>
                                    <div className="flex flex-wrap gap-2">
                                        {result.dubbed_audio.map((dub) => (
                                            <button
                                                key={dub.language_code}
                                                onClick={() => handleDubChange(dub.url)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedDub === dub.url
                                                        ? 'bg-[#F59E0B]/20 text-[#D97706] dark:text-[#F59E0B] border border-[#F59E0B]/40'
                                                        : 'bg-white/50 dark:bg-white/10 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/30'
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
                                <div className="bg-white/40 dark:bg-white/5 rounded-xl p-3 border border-gray-200 dark:border-white/10">
                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex justify-between">
                                        <span>Full Transcript</span>
                                        <span className="font-mono lowercase opacity-60">
                                            {result.total_segments || result.subtitles?.length} segments
                                        </span>
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-h-32 overflow-y-auto">
                                        {result.full_transcript}
                                    </p>
                                </div>
                            )}

                            {/* Reset Actions */}
                            <button
                                onClick={resetUpload}
                                className="mt-2 py-3 rounded-xl border border-gray-300 dark:border-[#2D3748] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 text-sm font-semibold transition-colors"
                            >
                                Process Another Video
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Error & Progress Feedback */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-500 text-sm">
                    {error}
                </div>
            )}

            {/* Pipeline Status Component */}
            {status.stage !== 'idle' && !result && (
                <div className="pt-2 flex flex-col gap-2">
                    <StatusPanel status={status} />
                    {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="h-2 w-full bg-gray-200 dark:bg-[#1A1F2E] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#F59E0B] rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    )}
                </div>
            )}

        </div>
    )
}
