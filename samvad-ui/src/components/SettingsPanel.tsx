import { X, User, Gauge, Move, Eye, Languages } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { AppSettings } from '../types'

interface SettingsPanelProps {
    isOpen: boolean
    onClose: () => void
}

const defaultSettings: AppSettings = {
    avatar_gender: 'neutral',
    signing_speed: 1.0,
    pip_position: 'bottom-right',
    pip_size: 'medium',
    target_languages: ['hi-IN', 'ta-IN', 'te-IN'],
    show_isl_gloss: true,
    reverse_mode: false,
}

function loadSettings(): AppSettings {
    try {
        const saved = localStorage.getItem('samvad_settings')
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings
    } catch {
        return defaultSettings
    }
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
    const [settings, setSettings] = useState<AppSettings>(loadSettings)

    useEffect(() => {
        localStorage.setItem('samvad_settings', JSON.stringify(settings))
    }, [settings])

    const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }))
    }

    if (!isOpen) return null

    const pipPositions: Array<{ key: AppSettings['pip_position']; label: string }> = [
        { key: 'top-left', label: 'TL' },
        { key: 'top-right', label: 'TR' },
        { key: 'bottom-left', label: 'BL' },
        { key: 'bottom-right', label: 'BR' },
    ]

    const allLanguages = [
        { code: 'hi-IN', name: 'Hindi' },
        { code: 'en-IN', name: 'English' },
        { code: 'ta-IN', name: 'Tamil' },
        { code: 'te-IN', name: 'Telugu' },
        { code: 'bn-IN', name: 'Bengali' },
        { code: 'mr-IN', name: 'Marathi' },
    ]

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />

            {/* Drawer */}
            <div className="fixed top-0 right-0 w-80 h-full glass-panel bg-white/90 dark:bg-[#0B0E16]/90 border-l border-gray-200 dark:border-white/10 z-50 overflow-y-auto animate-slide-in shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent opacity-50"></div>
                    <h2 className="text-lg font-display font-bold text-gray-800 dark:text-[#F7FAFC]">Settings</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                <div className="p-5 space-y-8">
                    {/* Avatar Selection */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                            <User className="w-3.5 h-3.5 text-[#F59E0B]" /> Avatar Style
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['female', 'male', 'neutral'] as const).map(g => (
                                <button
                                    key={g}
                                    onClick={() => update('avatar_gender', g)}
                                    className={`py-2 px-3 rounded-xl text-xs font-medium capitalize transition-all
                                        ${settings.avatar_gender === g
                                            ? 'bg-[#F59E0B]/20 text-[#D97706] dark:text-[#F59E0B] border border-[#F59E0B]/50 shadow-sm'
                                            : 'bg-white/50 dark:bg-[#151928] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/5 hover:border-gray-400 dark:hover:border-white/20'
                                        }`}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Signing Speed */}
                    <div className="space-y-3">
                        <label className="flex items-center justify-between text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                            <span className="flex items-center gap-2"><Gauge className="w-3.5 h-3.5 text-[#F59E0B]" /> Speed</span>
                            <span className="text-[#F59E0B] normal-case bg-[#F59E0B]/10 px-2 py-0.5 rounded-md border border-[#F59E0B]/20">{settings.signing_speed}x</span>
                        </label>
                        <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.25"
                            value={settings.signing_speed}
                            onChange={(e) => update('signing_speed', parseFloat(e.target.value))}
                            className="w-full mt-2"
                        />
                        <div className="flex justify-between text-[10px] font-mono text-gray-400 dark:text-gray-500">
                            <span>0.5x</span><span>1.0x</span><span>1.5x</span><span>2.0x</span>
                        </div>
                    </div>

                    {/* PiP Size */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                            <Move className="w-3.5 h-3.5 text-[#F59E0B]" /> Avatar Size (PiP)
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['small', 'medium', 'large'] as const).map(s => (
                                <button
                                    key={s}
                                    onClick={() => update('pip_size', s)}
                                    className={`py-2 px-3 rounded-xl text-xs font-medium capitalize transition-all
                                        ${settings.pip_size === s
                                            ? 'bg-[#F59E0B]/20 text-[#D97706] dark:text-[#F59E0B] border border-[#F59E0B]/50 shadow-sm'
                                            : 'bg-white/50 dark:bg-[#151928] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/5 hover:border-gray-400 dark:hover:border-white/20'
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* PiP Position */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-5">Position</label>
                        <div className="grid grid-cols-2 gap-2 w-28 ml-5">
                            {pipPositions.map(p => (
                                <button
                                    key={p.key}
                                    onClick={() => update('pip_position', p.key)}
                                    className={`py-2 rounded-lg text-[10px] font-bold transition-all
                                        ${settings.pip_position === p.key
                                            ? 'bg-[#F59E0B] text-white shadow-md'
                                            : 'bg-gray-200 dark:bg-[#151928] text-gray-500 hover:bg-gray-300 dark:hover:bg-white/10'
                                        }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-white/10 my-6"></div>

                    {/* Show Gloss Toggle */}
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                            <Eye className="w-3.5 h-3.5 text-[#F59E0B]" /> Show ISL Gloss
                        </label>
                        <button
                            onClick={() => update('show_isl_gloss', !settings.show_isl_gloss)}
                            className={`w-11 h-6 rounded-full relative transition-colors shadow-inner
                                ${settings.show_isl_gloss ? 'bg-[#F59E0B]' : 'bg-gray-300 dark:bg-gray-700'}`}
                        >
                            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform
                                ${settings.show_isl_gloss ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                    </div>

                    {/* Target Languages */}
                    <div className="space-y-4 pt-4">
                        <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                            <Languages className="w-3.5 h-3.5 text-[#F59E0B]" /> Dubbing Languages
                        </label>
                        <div className="space-y-2.5">
                            {allLanguages.map(lang => (
                                <label key={lang.code} className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors
                                        ${settings.target_languages.includes(lang.code)
                                            ? 'bg-[#F59E0B] border-[#F59E0B]'
                                            : 'border-gray-300 dark:border-gray-600 bg-transparent group-hover:border-[#F59E0B]/50'}`}>
                                        {settings.target_languages.includes(lang.code) && (
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={settings.target_languages.includes(lang.code)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                update('target_languages', [...settings.target_languages, lang.code])
                                            } else {
                                                update('target_languages', settings.target_languages.filter(l => l !== lang.code))
                                            }
                                        }}
                                        className="hidden"
                                    />
                                    <span className={`text-sm tracking-wide transition-colors ${settings.target_languages.includes(lang.code)
                                            ? 'text-gray-800 dark:text-gray-200'
                                            : 'text-gray-500 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                                        }`}>
                                        {lang.name}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
