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
        <div className="flex flex-col h-full space-y-6">

            {/* Main Glass Card */}
            <div className="flex-1 glass-panel bg-white/60 dark:bg-[#151928]/60 rounded-[24px] p-6 shadow-xl flex flex-col relative overflow-hidden group border-t border-white/20">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent opacity-50"></div>

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-display font-semibold text-gray-800 dark:text-white flex items-center">
                        <Camera className="w-5 h-5 text-[#F59E0B] mr-2" />
                        Reverse Mode
                        {isActive && (
                            <span className="flex items-center gap-1.5 ml-2 px-2 py-0.5 bg-[#A3E635]/10 border border-[#A3E635]/20 rounded-full">
                                <span className="w-2 h-2 bg-[#A3E635] rounded-full animate-pulse" />
                                <span className="text-[10px] text-[#A3E635] font-bold uppercase tracking-widest">Scanning</span>
                            </span>
                        )}
                    </h2>

                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest
                        ${isConnected
                            ? 'bg-green-500/10 border-green-500/30 text-green-500'
                            : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </div>
                </div>

                <p className="text-gray-500 dark:text-gray-400 text-xs mb-4">
                    For deaf creators — sign into the camera to generate voice and subtitles.
                </p>

                {/* Camera Feed Area */}
                <div className="w-full aspect-video relative rounded-2xl overflow-hidden bg-black shadow-inner border border-white/10 mb-4 flex-shrink-0">
                    {isActive ? (
                        <>
                            <Webcam
                                ref={webcamRef}
                                audio={false}
                                screenshotFormat="image/jpeg"
                                className="w-full h-full object-cover"
                                videoConstraints={{ width: 1280, height: 720, facingMode: 'user' }}
                            />

                            {/* Hand detection overlay alert */}
                            {reverseResult && reverseResult.detected_signs.length > 0 && (
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <span className="text-[10px] text-[#F59E0B] font-bold bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5 uppercase tracking-wider">
                                        <span className="w-2 h-2 bg-[#F59E0B] rounded-full animate-pulse"></span>
                                        Hands Detected
                                    </span>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-[#F59E0B]/10 flex items-center justify-center mb-4">
                                <Camera className="w-8 h-8 text-[#F59E0B]" />
                            </div>
                            <p className="text-gray-400 dark:text-gray-500 text-sm">
                                Ready to detect sign language.<br />Click start to enable your camera.
                            </p>
                        </div>
                    )}
                </div>

                {/* Results Panel */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {/* Generated Speech Display */}
                    <div className="bg-white/40 dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/10">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Generated Speech</p>
                        {reverseResult?.generated_text ? (
                            <div className="relative">
                                <div className="bg-white dark:bg-[#0B0E16] rounded-xl p-4 shadow-sm border border-gray-200 dark:border-white/5">
                                    <p className="text-gray-800 dark:text-gray-100 text-sm leading-relaxed">{reverseResult.generated_text}</p>
                                </div>
                                {/* Confidence Bar */}
                                <div className="mt-3 flex items-center gap-3">
                                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-[#1A1F2E] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#A3E635] rounded-full transition-all duration-500"
                                            style={{ width: `${(reverseResult.confidence || 0) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-mono font-bold">
                                        {Math.round((reverseResult.confidence || 0) * 100)}%
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400 dark:text-gray-500 text-xs italic">Waiting for sign detection...</p>
                        )}
                    </div>

                    {/* Detected Signs Tracking */}
                    <div className="bg-white/40 dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/10">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Sign History</p>
                        {detectedHistory.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {detectedHistory.map((sign, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1 bg-white dark:bg-[#0B0E16] text-[#F59E0B] rounded-full text-[10px] font-mono font-bold border border-gray-200 dark:border-white/5 shadow-sm"
                                    >
                                        {sign}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 dark:text-gray-500 text-xs italic">No signs detected yet</p>
                        )}
                    </div>

                    {/* Audio playback */}
                    {reverseResult?.audio_url && (
                        <div className="bg-white/40 dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/10">
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Voice Output</p>
                            <audio src={reverseResult.audio_url} controls className="w-full h-8 outline-none" />
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <button
                onClick={isActive ? handleStop : handleStart}
                className={`w-full py-4 rounded-full shadow-lg font-display font-bold text-lg tracking-wide transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center group relative overflow-hidden ${isActive
                        ? 'bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 shadow-red-500/10'
                        : 'bg-[linear-gradient(135deg,#F59E0B_0%,#D97706_100%)] text-white shadow-[#F59E0B]/20 hover:shadow-[#F59E0B]/40'
                    }`}
            >
                {!isActive && <span className="absolute inset-0 w-full h-full bg-white/20 group-hover:translate-x-full transition-transform duration-700 ease-in-out -translate-x-full skew-x-12"></span>}
                {isActive ? (
                    <><CameraOff className="w-5 h-5 mr-2" /> Stop Detection</>
                ) : (
                    <><Camera className="w-5 h-5 mr-no-gap mr-2" /> Start Sign Detection</>
                )}
            </button>
        </div>
    )
}
