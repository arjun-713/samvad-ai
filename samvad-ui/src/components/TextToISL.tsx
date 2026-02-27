import { useState } from 'react'
import { Type, Zap, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import ISLAvatar from './ISLAvatar'
import StatusPanel from './StatusPanel'
import LanguageSelector from './LanguageSelector'
import { useISLPipeline } from '../hooks/useISLPipeline'

const quickPhrases = [
    'How can I help you today?',
    'Where is the nearest station?',
    'Thank you very much',
    'Please wait a moment',
    'I am going to school tomorrow',
    'The weather is very hot today',
]

export default function TextToISL() {
    const [text, setText] = useState('')
    const [language, setLanguage] = useState('hi-IN')
    const [showNotes, setShowNotes] = useState(false)
    const [speed, setSpeed] = useState(1.0)
    const { status, result, error, loading, processText, reset } = useISLPipeline()

    const handleSubmit = () => {
        if (!text.trim()) return
        processText(text.trim(), language)
    }

    const handleQuickPhrase = (phrase: string) => {
        setText(phrase)
        processText(phrase, language)
    }

    return (
        <div className="h-full flex flex-col lg:flex-row gap-6 animate-fade-in">
            {/* Left: Input */}
            <div className="flex-1 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[#F7FAFC] flex items-center gap-2">
                        <Type className="w-5 h-5 text-[#A3E635]" />
                        Text to ISL
                    </h2>
                    <LanguageSelector selectedLanguage={language} onLanguageChange={setLanguage} />
                </div>

                {/* Textarea */}
                <div className="relative flex-1">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value.slice(0, 500))}
                        placeholder="Type what you want the AI assistant to sign..."
                        className="w-full h-full min-h-[180px] bg-[#1A1F2E] border border-[#2D3748] rounded-xl p-4 text-[#F7FAFC] placeholder:text-[#4A5568] resize-none focus:outline-none focus:border-[#A3E635]/50 focus:ring-1 focus:ring-[#A3E635]/20 transition-all text-base leading-relaxed"
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-[#4A5568]">
                        {text.length}/500
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !text.trim()}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm transition-all
              ${loading || !text.trim()
                                ? 'bg-[#2D3748] text-[#4A5568] cursor-not-allowed'
                                : 'bg-[#A3E635] text-[#0F1117] hover:bg-[#BEF264] shadow-lg shadow-[#A3E635]/20'
                            }`}
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Zap className="w-4 h-4" />
                                Translate to ISL
                            </>
                        )}
                    </button>
                    {result && (
                        <button
                            onClick={reset}
                            className="py-3 px-4 rounded-xl border border-[#2D3748] text-[#A0AEC0] hover:bg-[#2D3748]/50 text-sm font-medium transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {/* Speed control */}
                <div className="flex items-center gap-4">
                    <span className="text-xs font-medium text-[#A0AEC0] uppercase tracking-wider">Speed</span>
                    <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.25"
                        value={speed}
                        onChange={(e) => setSpeed(parseFloat(e.target.value))}
                        className="flex-1"
                    />
                    <span className="text-xs font-bold text-[#A3E635] w-8">{speed}x</span>
                </div>

                {/* Quick phrases */}
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-[#A0AEC0] uppercase tracking-wider">Quick Phrases</p>
                    <div className="flex flex-wrap gap-2">
                        {quickPhrases.map((phrase) => (
                            <button
                                key={phrase}
                                onClick={() => handleQuickPhrase(phrase)}
                                disabled={loading}
                                className="px-3 py-1.5 bg-[#1A1F2E] border border-[#2D3748] rounded-full text-xs text-[#A0AEC0] hover:border-[#A3E635]/30 hover:text-[#A3E635] transition-colors disabled:opacity-50"
                            >
                                {phrase}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Pipeline status */}
                <StatusPanel status={status} className="mt-2" />
            </div>

            {/* Right: Result */}
            <div className="w-full lg:w-[340px] flex flex-col gap-4">
                {/* Avatar */}
                <ISLAvatar result={result} speed={speed} className="h-64" showGloss={true} />

                {/* ISL Gloss */}
                {result && (
                    <div className="bg-[#1A1F2E] rounded-xl p-4 border border-[#2D3748] animate-fade-in">
                        <p className="text-xs font-bold text-[#A0AEC0] uppercase tracking-wider mb-2">ISL Gloss</p>
                        <p className="text-[#A3E635] font-mono-isl text-sm leading-relaxed">{result.gloss}</p>
                    </div>
                )}

                {/* Cultural Notes */}
                {result && result.cultural_notes && result.cultural_notes.length > 0 && (
                    <div className="bg-[#1A1F2E] rounded-xl border border-[#2D3748] overflow-hidden">
                        <button
                            onClick={() => setShowNotes(!showNotes)}
                            className="w-full flex items-center justify-between p-3 text-xs font-bold text-[#A0AEC0] uppercase tracking-wider hover:bg-[#2D3748]/30 transition-colors"
                        >
                            <span>Cultural Notes ({result.cultural_notes.length})</span>
                            {showNotes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {showNotes && (
                            <div className="px-3 pb-3 space-y-1.5">
                                {result.cultural_notes.map((note, i) => (
                                    <p key={i} className="text-xs text-[#A0AEC0] flex items-start gap-2">
                                        <span className="text-[#7C3AED] mt-0.5">•</span>
                                        {note}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 animate-fade-in">
                        <p className="text-red-400 text-sm font-medium">{error}</p>
                        <button
                            onClick={() => processText(text, language)}
                            className="mt-2 text-xs font-semibold text-red-400 hover:text-red-300 underline"
                        >
                            Retry
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
