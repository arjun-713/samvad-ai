import type { PipelineStatus } from '../types'

interface StatusPanelProps {
    status: PipelineStatus
    className?: string
}

const stages = [
    { key: 'transcribing', label: 'Listening', icon: '🎤' },
    { key: 'transcreating', label: 'Adapting', icon: '🧠' },
    { key: 'generating_avatar', label: 'Signing', icon: '🤟' },
    { key: 'dubbing', label: 'Dubbing', icon: '🔊' },
    { key: 'complete', label: 'Done', icon: '✅' },
]

const stageOrder = ['idle', 'transcribing', 'transcreating', 'generating_avatar', 'dubbing', 'complete']

export default function StatusPanel({ status, className = '' }: StatusPanelProps) {
    const currentIndex = stageOrder.indexOf(status.stage)

    return (
        <div className={`${className}`}>
            {/* Stage dots */}
            <div className="flex items-center justify-between gap-1">
                {stages.map((stage, i) => {
                    const stageIdx = stageOrder.indexOf(stage.key)
                    const isComplete = currentIndex > stageIdx
                    const isActive = status.stage === stage.key
                    const isError = status.stage === 'error'

                    return (
                        <div key={stage.key} className="flex items-center flex-1">
                            {/* Stage dot + label */}
                            <div className="flex flex-col items-center gap-1.5 flex-1">
                                <div
                                    className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300
                    ${isError ? 'bg-red-500/20 border border-red-500/50' :
                                            isComplete ? 'bg-[#A3E635]/20 border border-[#A3E635]/50' :
                                                isActive ? 'bg-[#A3E635]/30 border-2 border-[#A3E635] animate-stage-pulse' :
                                                    'bg-[#2D3748]/50 border border-[#2D3748]'}
                  `}
                                >
                                    {isError ? '❌' : stage.icon}
                                </div>
                                <span
                                    className={`text-[10px] font-medium tracking-wide uppercase
                    ${isError ? 'text-red-400' :
                                            isComplete ? 'text-[#A3E635]' :
                                                isActive ? 'text-[#A3E635] font-bold' :
                                                    'text-[#4A5568]'}
                  `}
                                >
                                    {stage.label}
                                </span>
                            </div>

                            {/* Connector line */}
                            {i < stages.length - 1 && (
                                <div
                                    className={`h-0.5 flex-1 rounded-full mx-1 transition-all duration-500
                    ${isComplete ? 'bg-[#A3E635]/40' : 'bg-[#2D3748]'}
                  `}
                                />
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Status message */}
            {status.message && (
                <div className="mt-3 text-center">
                    <p className={`text-xs font-medium ${status.stage === 'error' ? 'text-red-400' : 'text-[#A0AEC0]'}`}>
                        {status.message}
                    </p>
                </div>
            )}

            {/* Progress bar */}
            {status.progress > 0 && status.stage !== 'error' && (
                <div className="mt-2 h-1 bg-[#2D3748] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-[#A3E635] to-[#7C3AED] rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${status.progress}%` }}
                    />
                </div>
            )}
        </div>
    )
}
