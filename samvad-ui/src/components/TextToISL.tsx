import { useState } from 'react'
import { Type, RefreshCw } from 'lucide-react'
import StatusPanel from './StatusPanel'
import { useISLPipeline } from '../hooks/useISLPipeline'
import type { ISLResult } from '../types'

const quickPhrases = [
    'How can I help you?',
    'Where is the station?',
    'Thank you very much',
]

interface TextToISLProps {
    onResult: (result: ISLResult) => void
}

export default function TextToISL({ onResult }: TextToISLProps) {
    const [text, setText] = useState('')
    const { status, error, loading, processText } = useISLPipeline()

    const handleSubmit = async () => {
        if (!text.trim()) return
        const res = await processText(text.trim(), 'hi-IN')
        if (res) onResult(res)
    }

    const handleQuickPhrase = async (phrase: string) => {
        setText(phrase)
        const res = await processText(phrase, 'hi-IN')
        if (res) onResult(res)
    }

    return (
        <div className="flex flex-col h-full space-y-6">

            {/* Input Card */}
            <div className="flex-1 glass-panel bg-white/60 dark:bg-[#151928]/60 rounded-[24px] p-6 shadow-xl flex flex-col relative overflow-hidden group border-t border-white/20">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent opacity-50"></div>

                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-display font-semibold text-gray-800 dark:text-white flex items-center">
                        <Type className="text-[#F59E0B] mr-2 w-5 h-5" />
                        Input Text
                    </h2>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                        {text.length}/500
                    </span>
                </div>

                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value.slice(0, 500))}
                    placeholder="Type what you want the AI assistant to sign..."
                    className="flex-1 w-full bg-transparent border-0 resize-none focus:ring-0 text-lg md:text-xl text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 leading-relaxed font-light outline-none"
                ></textarea>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/5">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Quick Phrases</p>
                    <div className="flex flex-wrap gap-2">
                        {quickPhrases.map((phrase) => (
                            <button
                                key={phrase}
                                onClick={() => handleQuickPhrase(phrase)}
                                disabled={loading}
                                className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-[#F59E0B]/10 hover:text-[#F59E0B] dark:hover:bg-[#F59E0B]/20 dark:hover:text-[#F59E0B] border border-transparent hover:border-[#F59E0B]/30 text-xs text-gray-600 dark:text-gray-300 transition-all duration-200 disabled:opacity-50"
                            >
                                {phrase}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sign This Button */}
            <button
                onClick={handleSubmit}
                disabled={loading || !text.trim()}
                className={`w-full py-4 rounded-full shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 font-display font-bold text-lg tracking-wide transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center group relative overflow-hidden ${loading || !text.trim()
                        ? 'bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-[linear-gradient(135deg,#F59E0B_0%,#D97706_100%)] text-white'
                    }`}
            >
                <span className="absolute inset-0 w-full h-full bg-white/20 group-hover:translate-x-full transition-transform duration-700 ease-in-out -translate-x-full skew-x-12"></span>
                {loading ? (
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                    <span className="material-symbols-rounded mr-2 group-hover:rotate-12 transition-transform">sign_language</span>
                )}
                {loading ? 'Translating...' : 'Sign This'}
            </button>

            {/* Error display */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 animate-fade-in text-red-500 text-sm">
                    {error}
                </div>
            )}

            {/* Pipeline Status Component */}
            <div className="pt-2">
                <StatusPanel status={status} />
            </div>

        </div>
    )
}
