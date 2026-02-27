import { useState, useRef, useCallback, useEffect } from 'react'
import Webcam from 'react-webcam'
import { Camera, CameraOff } from 'lucide-react'
import { useWebSocket } from '../hooks/useWebSocket'

export default function ReverseMode() {
    const [isActive, setIsActive] = useState(false)
    const webcamRef = useRef<Webcam>(null)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const { isConnected, reverseResult, sendVideoFrame } = useWebSocket()
    const [detectedHistory, setDetectedHistory] = useState<string[]>([])

    const captureAndSend = useCallback(() => {
        if (!webcamRef.current) return
        const screenshot = webcamRef.current.getScreenshot()
        if (screenshot) {
            const base64 = screenshot.split(',')[1]
            sendVideoFrame(base64)
        }
    }, [sendVideoFrame])

    const handleStart = () => {
        setIsActive(true)
        setDetectedHistory([])
        // Send frames every 500ms (not 100ms to avoid overwhelming)
        intervalRef.current = setInterval(captureAndSend, 500)
    }

    const handleStop = () => {
        setIsActive(false)
        if (intervalRef.current) clearInterval(intervalRef.current)
    }

    // Track detected signs
    useEffect(() => {
        if (reverseResult?.detected_signs?.length) {
            setDetectedHistory(prev => [...prev.slice(-20), ...reverseResult.detected_signs])
        }
    }, [reverseResult])

    // Cleanup
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [])

    return (
        <div className="h-full flex flex-col gap-4 animate-fade-in">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-[#F7FAFC] flex items-center gap-2 mb-1">
                    <span className="text-2xl">🤟</span>
                    Reverse Mode
                </h2>
                <p className="text-[#A0AEC0] text-sm">For deaf creators — sign into camera to generate voice and subtitles</p>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col lg:flex-row gap-4">
                {/* Camera feed */}
                <div className="flex-1 relative rounded-xl overflow-hidden bg-[#1A1F2E] border border-[#2D3748]">
                    {isActive ? (
                        <>
                            <Webcam
                                ref={webcamRef}
                                audio={false}
                                screenshotFormat="image/jpeg"
                                className="w-full h-full object-cover"
                                videoConstraints={{ width: 1280, height: 720, facingMode: 'user' }}
                            />

                            {/* Hand detection overlay area */}
                            {reverseResult && reverseResult.detected_signs.length > 0 && (
                                <div className="absolute inset-4 border-2 border-[#A3E635]/40 rounded-xl pointer-events-none">
                                    <span className="absolute top-2 left-2 text-xs text-[#A3E635] font-bold bg-black/50 px-2 py-0.5 rounded">
                                        ✋ Hands Detected
                                    </span>
                                </div>
                            )}

                            {/* Active badge */}
                            <div className="absolute top-4 right-4 flex items-center gap-2 bg-[#A3E635]/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                <span className="w-2 h-2 bg-[#A3E635] rounded-full animate-pulse" />
                                <span className="text-[#A3E635] text-xs font-bold">Scanning</span>
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-[#7C3AED]/10 flex items-center justify-center">
                                <Camera className="w-8 h-8 text-[#7C3AED]" />
                            </div>
                            <p className="text-[#A0AEC0] text-sm font-medium">Ready to detect sign language</p>
                            <p className="text-[#4A5568] text-xs max-w-sm text-center">
                                Your camera will capture video frames, detect hand gestures using MediaPipe,
                                and generate spoken text + subtitles from recognized signs.
                            </p>
                        </div>
                    )}
                </div>

                {/* Results panel */}
                <div className="w-full lg:w-[300px] flex flex-col gap-3">
                    {/* Connection status */}
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
            ${isConnected ? 'bg-[#68D391]/10 text-[#68D391]' : 'bg-red-500/10 text-red-400'}`}>
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#68D391]' : 'bg-red-400'}`} />
                        {isConnected ? 'WebSocket Connected' : 'Disconnected'}
                    </div>

                    {/* Detected signs */}
                    <div className="bg-[#1A1F2E] rounded-xl p-4 border border-[#2D3748]">
                        <p className="text-xs font-bold text-[#A0AEC0] uppercase tracking-wider mb-3">Detected Signs</p>
                        {detectedHistory.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                                {detectedHistory.map((sign, i) => (
                                    <span
                                        key={i}
                                        className="px-2.5 py-1 bg-[#7C3AED]/20 text-[#7C3AED] rounded-full text-xs font-mono-isl font-medium"
                                    >
                                        {sign}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[#4A5568] text-xs italic">No signs detected yet</p>
                        )}
                    </div>

                    {/* Generated text */}
                    <div className="bg-[#1A1F2E] rounded-xl p-4 border border-[#2D3748]">
                        <p className="text-xs font-bold text-[#A0AEC0] uppercase tracking-wider mb-3">Generated Speech</p>
                        {reverseResult?.generated_text ? (
                            <div className="relative">
                                {/* Speech bubble */}
                                <div className="bg-[#0F1117] rounded-xl p-3 border border-[#2D3748]">
                                    <p className="text-[#F7FAFC] text-sm leading-relaxed">{reverseResult.generated_text}</p>
                                </div>
                                {/* Confidence */}
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-[#2D3748] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#7C3AED] rounded-full transition-all"
                                            style={{ width: `${(reverseResult.confidence || 0) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] text-[#A0AEC0] font-medium">
                                        {Math.round((reverseResult.confidence || 0) * 100)}%
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-[#4A5568] text-xs italic">Waiting for sign detection...</p>
                        )}
                    </div>

                    {/* Audio playback */}
                    {reverseResult?.audio_url && (
                        <div className="bg-[#1A1F2E] rounded-xl p-4 border border-[#2D3748]">
                            <p className="text-xs font-bold text-[#A0AEC0] uppercase tracking-wider mb-2">Voice Output</p>
                            <audio src={reverseResult.audio_url} controls className="w-full h-8" />
                        </div>
                    )}

                    {/* Phase 1 notice */}
                    <div className="bg-[#7C3AED]/5 border border-[#7C3AED]/20 rounded-xl p-3">
                        <p className="text-[10px] text-[#A0AEC0] leading-relaxed">
                            <span className="text-[#7C3AED] font-bold">Phase 1:</span> Uses mock sign classification.
                            Real ISL recognition model coming in Phase 2 with SageMaker.
                        </p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <button
                onClick={isActive ? handleStop : handleStart}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2
          ${isActive
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                        : 'bg-[#7C3AED] text-white hover:bg-[#8B5CF6] shadow-lg shadow-[#7C3AED]/20'
                    }`}
            >
                {isActive ? (
                    <>
                        <CameraOff className="w-4 h-4" />
                        Stop Detection
                    </>
                ) : (
                    <>
                        <Camera className="w-4 h-4" />
                        Start Sign Detection
                    </>
                )}
            </button>
        </div>
    )
}
