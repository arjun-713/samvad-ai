import { useState, useRef, useCallback, useEffect } from 'react'
import Webcam from 'react-webcam'
import { Video, VideoOff, Mic, MicOff } from 'lucide-react'
import StatusPanel from './StatusPanel'
import LanguageSelector from './LanguageSelector'
import { useWebSocket } from '../hooks/useWebSocket'
import type { ISLResult } from '../types'

interface LiveStreamProps {
    onResult: (result: ISLResult | null) => void
}

export default function LiveStream({ onResult }: LiveStreamProps) {
    const [isStreaming, setIsStreaming] = useState(false)
    const [language, setLanguage] = useState('hi-IN')
    const [isMuted, setIsMuted] = useState(false)
    const webcamRef = useRef<Webcam>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const sequenceRef = useRef(0)
    const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const { isConnected, latestISL, status, sendAudioChunk, startLiveStream, stopLiveStream } = useWebSocket()

    // Pass the latest ISL result up to App so the HeroAvatarStage can play it
    useEffect(() => {
        if (latestISL) {
            onResult(latestISL)
        }
    }, [latestISL, onResult])

    const blobToBase64 = (blob: Blob): Promise<string> =>
        new Promise((res) => {
            const reader = new FileReader()
            reader.onloadend = () => res((reader.result as string).split(',')[1])
            reader.readAsDataURL(blob)
        })

    const startAudioCapture = useCallback((stream: MediaStream) => {
        try {
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data)
            }
            recorder.onstop = async () => {
                if (audioChunksRef.current.length > 0) {
                    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
                    const base64 = await blobToBase64(blob)
                    sendAudioChunk(base64, sequenceRef.current++)
                    audioChunksRef.current = []
                }
            }
            mediaRecorderRef.current = recorder
        } catch (err) {
            console.error('MediaRecorder init failed:', err)
        }
    }, [sendAudioChunk])

    const handleStart = useCallback(() => {
        setIsStreaming(true)
        startLiveStream({ language })
        sequenceRef.current = 0

        // Start recording cycles
        const startCycle = () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
                mediaRecorderRef.current.start()
                intervalRef.current = setTimeout(() => {
                    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                        mediaRecorderRef.current.stop()
                        // Start next cycle after a brief pause
                        setTimeout(startCycle, 200)
                    }
                }, 3000)
            }
        }

        // Wait briefly for webcam to initialize audio
        setTimeout(startCycle, 1000)
    }, [language, startLiveStream])

    const handleStop = useCallback(() => {
        setIsStreaming(false)
        stopLiveStream()
        onResult(null) // Clear avatar stage
        if (intervalRef.current) clearTimeout(intervalRef.current)
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop()
        }
        mediaRecorderRef.current = null
    }, [stopLiveStream, onResult])

    const handleUserMedia = useCallback((stream: MediaStream) => {
        startAudioCapture(stream)
    }, [startAudioCapture])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearTimeout(intervalRef.current)
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop()
            }
        }
    }, [])

    return (
        <div className="flex flex-col h-full space-y-6">

            {/* Control Panel Glass Card */}
            <div className="glass-panel bg-white/60 dark:bg-[#151928]/60 rounded-[24px] p-6 shadow-xl flex flex-col relative overflow-hidden group border-t border-white/20">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent opacity-50"></div>

                {/* Header inside card */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-display font-semibold text-gray-800 dark:text-white flex items-center">
                        <Video className="w-5 h-5 text-[#F59E0B] mr-2" />
                        Live Stream
                        {isStreaming && (
                            <span className="flex items-center gap-1.5 ml-2 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Live</span>
                            </span>
                        )}
                    </h2>

                    <div className="flex items-center gap-3">
                        <LanguageSelector selectedLanguage={language} onLanguageChange={setLanguage} />
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest
                            ${isConnected
                                ? 'bg-green-500/10 border-green-500/30 text-green-500'
                                : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                            {isConnected ? 'Connected' : 'Disconnected'}
                        </div>
                    </div>
                </div>

                {/* Main Camera Feed */}
                <div className="w-full aspect-video relative rounded-xl overflow-hidden bg-black/80 border border-white/10 shadow-inner">
                    {isStreaming ? (
                        <>
                            <Webcam
                                ref={webcamRef}
                                audio={!isMuted}
                                className="w-full h-full object-cover"
                                videoConstraints={{ width: 1280, height: 720, facingMode: 'user' }}
                                onUserMedia={handleUserMedia}
                            />
                            {/* Gloss Subtitles Overlay inside the camera feed */}
                            {latestISL && (
                                <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
                                    <div className="bg-black/60 backdrop-blur-md pb-1 pt-1.5 px-4 rounded-full border border-white/10">
                                        <p className="text-[#F59E0B] font-display font-bold tracking-wide text-sm">{latestISL.gloss}</p>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-[#F59E0B]/10 flex items-center justify-center mb-4">
                                <Video className="w-6 h-6 text-[#F59E0B]" />
                            </div>
                            <p className="text-gray-400 dark:text-gray-500 text-sm">
                                Camera feed will appear here.<br />Audio is captured and transcribed every 3s.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={isStreaming ? handleStop : handleStart}
                    className={`flex-1 py-4 rounded-full shadow-lg font-display font-bold text-lg tracking-wide transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center group relative overflow-hidden ${isStreaming
                            ? 'bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 shadow-red-500/10'
                            : 'bg-[linear-gradient(135deg,#F59E0B_0%,#D97706_100%)] text-white shadow-[#F59E0B]/20 hover:shadow-[#F59E0B]/40'
                        }`}
                >
                    {!isStreaming && <span className="absolute inset-0 w-full h-full bg-white/20 group-hover:translate-x-full transition-transform duration-700 ease-in-out -translate-x-full skew-x-12"></span>}
                    {isStreaming ? (
                        <><VideoOff className="w-5 h-5 mr-no-gap mr-2" /> Stop Stream</>
                    ) : (
                        <><Video className="w-5 h-5 mr-no-gap mr-2" /> Start Stream</>
                    )}
                </button>

                {isStreaming && (
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`w-16 flex items-center justify-center rounded-full border transition-all
                            ${isMuted
                                ? 'bg-red-500/10 border-red-500/30 text-red-500'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                            }`}
                    >
                        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                )}
            </div>

            {/* Pipeline Status */}
            <div className="pt-2">
                <StatusPanel status={status} />
            </div>

        </div>
    )
}
