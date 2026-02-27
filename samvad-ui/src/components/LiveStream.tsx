import { useState, useRef, useCallback, useEffect } from 'react'
import Webcam from 'react-webcam'
import { Video, VideoOff, Mic, MicOff } from 'lucide-react'
import ISLAvatar from './ISLAvatar'
import StatusPanel from './StatusPanel'
import LanguageSelector from './LanguageSelector'
import { useWebSocket } from '../hooks/useWebSocket'

export default function LiveStream() {
    const [isStreaming, setIsStreaming] = useState(false)
    const [language, setLanguage] = useState('hi-IN')
    const [isMuted, setIsMuted] = useState(false)
    const webcamRef = useRef<Webcam>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const sequenceRef = useRef(0)
    const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const { isConnected, latestISL, status, sendAudioChunk, startLiveStream, stopLiveStream } = useWebSocket()

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
        if (intervalRef.current) clearTimeout(intervalRef.current)
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop()
        }
        mediaRecorderRef.current = null
    }, [stopLiveStream])

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
        <div className="h-full flex flex-col gap-4 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#F7FAFC] flex items-center gap-2">
                    <Video className="w-5 h-5 text-[#A3E635]" />
                    Live Stream
                    {isStreaming && (
                        <span className="flex items-center gap-1.5 ml-2 px-2 py-0.5 bg-red-500/20 rounded-full">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-xs text-red-400 font-semibold">LIVE</span>
                        </span>
                    )}
                </h2>
                <div className="flex items-center gap-3">
                    <LanguageSelector selectedLanguage={language} onLanguageChange={setLanguage} />
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium
            ${isConnected ? 'bg-[#68D391]/20 text-[#68D391]' : 'bg-red-500/20 text-red-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#68D391]' : 'bg-red-400'}`} />
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col lg:flex-row gap-4">
                {/* Camera feed */}
                <div className="flex-1 relative rounded-xl overflow-hidden bg-[#1A1F2E] border border-[#2D3748]">
                    {isStreaming ? (
                        <>
                            <Webcam
                                ref={webcamRef}
                                audio={!isMuted}
                                className="w-full h-full object-cover"
                                videoConstraints={{ width: 1280, height: 720, facingMode: 'user' }}
                                onUserMedia={handleUserMedia}
                            />

                            {/* ISL Avatar PiP overlay */}
                            <div className="absolute bottom-4 right-4 w-1/4 min-w-[160px] rounded-xl border-2 border-[#A3E635]/60 overflow-hidden shadow-2xl glow-green">
                                <ISLAvatar result={latestISL} className="h-48" showGloss={false} />
                            </div>

                            {/* Gloss text overlay */}
                            {latestISL && (
                                <div className="absolute bottom-4 left-4 right-[30%]">
                                    <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2">
                                        <p className="text-[#A3E635] font-mono-isl text-sm">{latestISL.gloss}</p>
                                    </div>
                                </div>
                            )}

                            {/* LIVE badge */}
                            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                <span className="text-white text-xs font-bold tracking-wider uppercase">Live</span>
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-full min-h-[360px] flex flex-col items-center justify-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-[#A3E635]/10 flex items-center justify-center">
                                <Video className="w-8 h-8 text-[#A3E635]" />
                            </div>
                            <p className="text-[#A0AEC0] text-sm font-medium">Click "Start Live Stream" to begin</p>
                            <p className="text-[#4A5568] text-xs max-w-sm text-center">
                                Your camera feed will be captured, audio transcribed every 3 seconds,
                                and real-time ISL avatar overlay will appear in the bottom-right corner.
                            </p>
                        </div>
                    )}
                </div>

                {/* Side panel */}
                <div className="w-full lg:w-[280px] flex flex-col gap-3">
                    {/* Pipeline status */}
                    <div className="bg-[#1A1F2E] rounded-xl p-4 border border-[#2D3748]">
                        <p className="text-xs font-bold text-[#A0AEC0] uppercase tracking-wider mb-3">Pipeline Status</p>
                        <StatusPanel status={status} />
                    </div>

                    {/* ISL Avatar (larger view) */}
                    <div className="bg-[#1A1F2E] rounded-xl border border-[#2D3748] overflow-hidden">
                        <p className="text-xs font-bold text-[#A0AEC0] uppercase tracking-wider p-3 pb-0">ISL Avatar</p>
                        <ISLAvatar result={latestISL} className="h-52" showGloss={true} />
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
                <button
                    onClick={isStreaming ? handleStop : handleStart}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all
            ${isStreaming
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                            : 'bg-[#A3E635] text-[#0F1117] hover:bg-[#BEF264] shadow-lg shadow-[#A3E635]/20'
                        }`}
                >
                    {isStreaming ? (
                        <>
                            <VideoOff className="w-4 h-4" />
                            Stop Stream
                        </>
                    ) : (
                        <>
                            <Video className="w-4 h-4" />
                            Start Live Stream
                        </>
                    )}
                </button>

                {isStreaming && (
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`p-3 rounded-xl border transition-all
              ${isMuted
                                ? 'bg-red-500/20 border-red-500/30 text-red-400'
                                : 'border-[#2D3748] text-[#A0AEC0] hover:bg-[#2D3748]/50'
                            }`}
                    >
                        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                )}
            </div>
        </div>
    )
}
