import type { ISLResult } from '../types'
import { FastForward, AlignLeft, Video } from 'lucide-react'

interface HeroAvatarStageProps {
    result: ISLResult | null
}

export default function HeroAvatarStage({ result }: HeroAvatarStageProps) {
    // If we have a video URL, we play it. 
    // Otherwise, we show the idle state or CSS fallback.
    const hasVideo = result?.avatar_url && result.avatar_url.length > 0;

    return (
        <div className="w-full h-full glass-panel bg-gray-900/5 dark:bg-[#151928]/30 rounded-[32px] overflow-hidden relative shadow-2xl border border-white/20 dark:border-white/5 flex items-center justify-center">

            {/* Cinematic Particles */}
            <div className="dust-particle" style={{ left: '10%', top: '80%', width: '4px', height: '4px', animationDuration: '12s' }}></div>
            <div className="dust-particle" style={{ left: '30%', top: '60%', width: '2px', height: '2px', animationDuration: '8s' }}></div>
            <div className="dust-particle" style={{ left: '70%', top: '40%', width: '3px', height: '3px', animationDuration: '15s' }}></div>
            <div className="dust-particle" style={{ left: '90%', top: '90%', width: '2px', height: '2px', animationDuration: '10s' }}></div>

            {/* Background Spotlight */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.15)_0%,rgba(15,23,42,0)_60%)] pointer-events-none"></div>

            {hasVideo ? (
                <video
                    key={result.avatar_url} // Force re-render when URL changes
                    src={result.avatar_url}
                    className="w-full h-full object-contain relative z-10"
                    autoPlay
                    controls={false}
                    loop
                    muted
                />
            ) : result ? (
                // CSS Fallback (Active but no video available)
                <div className="relative z-10 flex flex-col items-center justify-center opacity-90 scale-105 transition-transform duration-700">
                    <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-t from-indigo-500/20 to-transparent flex items-center justify-center relative">
                        <div className="absolute inset-0 rounded-full border border-indigo-500/40 animate-pulse"></div>
                        {/* Simple visual fallback for avatar */}
                        <div className="w-24 h-24 bg-indigo-500/30 rounded-full flex items-center justify-center">
                            <span className="text-white text-4xl">🤖</span>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col items-center gap-3 bg-[#0F1117]/60 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                        <div className="flex flex-wrap items-center justify-center gap-2 max-w-sm">
                            {result.gloss.split(' ').map((word, i) => (
                                <span key={i} className="px-3 py-1 bg-[#A3E635]/20 border border-[#A3E635]/30 rounded text-[#A3E635] font-mono font-bold text-sm">
                                    {word}
                                </span>
                            ))}
                        </div>

                        {/* Emotional Tone Badge */}
                        <div className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border 
                ${result.emotional_tone === 'urgent'
                                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'}`}>
                            Tone: {result.emotional_tone || 'neutral'}
                        </div>
                    </div>
                </div>
            ) : (
                // Idle State
                <div className="relative z-0 flex flex-col items-center justify-center opacity-60">
                    <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-t from-indigo-500/10 to-transparent flex items-center justify-center relative">
                        <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-pulse-slow"></div>
                        <span className="text-7xl md:text-9xl text-indigo-300/20 dark:text-white/10 material-symbols-rounded">accessibility_new</span>
                    </div>
                    <p className="mt-6 text-indigo-900/40 dark:text-indigo-200/40 font-display font-light text-lg tracking-widest uppercase">
                        Waiting for input...
                    </p>
                </div>
            )}

            {/* Floating Overlay Controls */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center space-y-6 bg-white/80 dark:bg-black/40 backdrop-blur-md p-2 rounded-full border border-white/20 shadow-lg z-20">
                <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white/20 hover:text-[#F59E0B] transition-colors tooltip" title="Speed">
                    <FastForward className="w-5 h-5" />
                </button>
                <div className="h-24 w-1 bg-gray-300 dark:bg-white/20 rounded-full relative">
                    <div className="absolute bottom-1/2 left-0 w-full h-1/2 bg-[#F59E0B] rounded-full"></div>
                    <div className="absolute bottom-1/2 left-1/2 -translate-x-1/2 translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md cursor-pointer border border-gray-200"></div>
                </div>
                <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white/20 hover:text-[#F59E0B] transition-colors tooltip" title="Captions">
                    <AlignLeft className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white/20 hover:text-[#F59E0B] transition-colors tooltip" title="Camera Angle">
                    <Video className="w-5 h-5" />
                </button>
            </div>

            {/* Camera/Status Tags */}
            <div className="absolute bottom-6 left-6 flex items-center space-x-2 z-20">
                <div className="px-3 py-1 bg-black/40 dark:bg-black/60 backdrop-blur-sm rounded-lg border border-white/10">
                    <span className="text-xs text-white/70 font-mono">CAM_01</span>
                </div>
                <div className="px-3 py-1 bg-black/40 dark:bg-black/60 backdrop-blur-sm rounded-lg border border-white/10">
                    <span className="text-xs text-[#F59E0B] font-mono">
                        {result ? (hasVideo ? 'PLAYING' : 'RENDERING') : 'READY'}
                    </span>
                </div>
            </div>

        </div>
    )
}
