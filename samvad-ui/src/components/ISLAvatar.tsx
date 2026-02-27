import { useRef, useEffect } from 'react'
import type { ISLResult } from '../types'

interface ISLAvatarProps {
    result: ISLResult | null
    speed?: number
    className?: string
    showGloss?: boolean
}

const toneColors: Record<string, string> = {
    neutral: 'bg-[#A3E635]/20 text-[#A3E635]',
    happy: 'bg-yellow-500/20 text-yellow-400',
    sad: 'bg-blue-400/20 text-blue-400',
    angry: 'bg-red-500/20 text-red-400',
    urgent: 'bg-red-600/20 text-red-500',
    sarcastic: 'bg-purple-500/20 text-purple-400',
    excited: 'bg-orange-500/20 text-orange-400',
}

function CSSAvatar({ gloss, tone }: { gloss: string; tone: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-full bg-[#0F1117] rounded-xl p-4">
            {/* Simple SVG avatar */}
            <svg viewBox="0 0 100 150" className="w-20 h-28 mb-3">
                {/* Head */}
                <circle cx="50" cy="25" r="18" fill="#D4A574" />
                {/* Eyes */}
                <circle cx="43" cy="22" r="2" fill="#2D3748" />
                <circle cx="57" cy="22" r="2" fill="#2D3748" />
                {/* Smile */}
                <path d="M42 30 Q50 36 58 30" fill="none" stroke="#2D3748" strokeWidth="1.5" />
                {/* Body */}
                <rect x="35" y="43" width="30" height="40" rx="4" fill="#1A1F2E" />
                {/* Arms - animated */}
                <line x1="35" y1="50" x2="15" y2="65" stroke="#D4A574" strokeWidth="6" strokeLinecap="round"
                    className={tone === 'urgent' || tone === 'excited' ? 'animate-bounce' : ''}>
                    <animateTransform
                        attributeName="transform"
                        type="rotate"
                        values="0 35 50;-15 35 50;0 35 50;15 35 50;0 35 50"
                        dur="2s"
                        repeatCount="indefinite"
                    />
                </line>
                <line x1="65" y1="50" x2="85" y2="65" stroke="#D4A574" strokeWidth="6" strokeLinecap="round">
                    <animateTransform
                        attributeName="transform"
                        type="rotate"
                        values="0 65 50;15 65 50;0 65 50;-15 65 50;0 65 50"
                        dur="2s"
                        repeatCount="indefinite"
                    />
                </line>
                {/* Hands */}
                <circle cx="15" cy="67" r="6" fill="#D4A574">
                    <animateTransform attributeName="transform" type="translate" values="0,0;-5,-10;0,0;5,-5;0,0" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="85" cy="67" r="6" fill="#D4A574">
                    <animateTransform attributeName="transform" type="translate" values="0,0;5,-5;0,0;-5,-10;0,0" dur="2s" repeatCount="indefinite" />
                </circle>
                {/* Legs */}
                <line x1="42" y1="83" x2="42" y2="110" stroke="#D4A574" strokeWidth="5" strokeLinecap="round" />
                <line x1="58" y1="83" x2="58" y2="110" stroke="#D4A574" strokeWidth="5" strokeLinecap="round" />
            </svg>

            {/* Gloss words */}
            <div className="text-center flex flex-wrap justify-center gap-1">
                {gloss.split(' ').map((word, i) => (
                    <span
                        key={i}
                        className="inline-block px-2 py-0.5 rounded bg-[#A3E635]/10 text-[#A3E635] text-xs font-mono-isl font-medium"
                        style={{ animationDelay: `${i * 0.3}s` }}
                    >
                        {word}
                    </span>
                ))}
            </div>
        </div>
    )
}

export default function ISLAvatar({ result, speed = 1, className = '', showGloss = true }: ISLAvatarProps) {
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        if (videoRef.current && speed) {
            videoRef.current.playbackRate = speed
        }
    }, [speed])

    if (!result) {
        return (
            <div className={`flex items-center justify-center bg-[#1A1F2E] rounded-xl ${className}`}>
                <div className="text-center p-4">
                    <svg viewBox="0 0 100 150" className="w-16 h-24 mx-auto mb-2 opacity-30">
                        <circle cx="50" cy="25" r="18" fill="#4A5568" />
                        <rect x="35" y="43" width="30" height="40" rx="4" fill="#2D3748" />
                        <line x1="35" y1="50" x2="15" y2="70" stroke="#4A5568" strokeWidth="5" strokeLinecap="round" />
                        <line x1="65" y1="50" x2="85" y2="70" stroke="#4A5568" strokeWidth="5" strokeLinecap="round" />
                    </svg>
                    <p className="text-sm text-[#A0AEC0]">Waiting for input...</p>
                </div>
            </div>
        )
    }

    const tone = result.emotional_tone || 'neutral'
    const toneClass = toneColors[tone] || toneColors.neutral

    return (
        <div className={`relative overflow-hidden rounded-xl bg-[#1A1F2E] ${className}`}>
            {/* Tone badge */}
            <div className="absolute top-2 left-2 z-10">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${toneClass}`}>
                    {tone}
                </span>
            </div>

            {/* Avatar content */}
            {result.avatar_url ? (
                <video
                    ref={videoRef}
                    src={result.avatar_url}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                />
            ) : (
                <CSSAvatar gloss={result.gloss} tone={tone} />
            )}

            {/* Gloss text overlay */}
            {showGloss && result.gloss && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-[#A3E635] font-mono-isl text-xs text-center truncate">
                        {result.gloss}
                    </p>
                </div>
            )}
        </div>
    )
}
