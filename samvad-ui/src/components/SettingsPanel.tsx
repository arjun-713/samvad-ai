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
            <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

            {/* Drawer */}
            <div className="fixed top-0 right-0 w-80 h-full bg-[#1A1F2E] border-l border-[#2D3748] z-50 overflow-y-auto animate-slide-in">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[#2D3748]">
                    <h2 className="text-lg font-bold text-[#F7FAFC]">Settings</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-[#2D3748] rounded-lg transition-colors">
                        <X className="w-5 h-5 text-[#A0AEC0]" />
                    </button>
                </div>

                <div className="p-5 space-y-6">
                    {/* Avatar Selection */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-xs font-bold text-[#A0AEC0] uppercase tracking-wider">
                            <User className="w-3.5 h-3.5" /> Avatar Style
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['female', 'male', 'neutral'] as const).map(g => (
                                <button
                                    key={g}
                                    onClick={() => update('avatar_gender', g)}
                                    className={`py-2 px-3 rounded-lg text-xs font-medium capitalize transition-all
                    ${settings.avatar_gender === g
                                            ? 'bg-[#A3E635]/20 text-[#A3E635] border border-[#A3E635]/50'
                                            : 'bg-[#0F1117] text-[#A0AEC0] border border-[#2D3748] hover:border-[#4A5568]'
                                        }`}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Signing Speed */}
                    <div className="space-y-3">
                        <label className="flex items-center justify-between text-xs font-bold text-[#A0AEC0] uppercase tracking-wider">
                            <span className="flex items-center gap-2"><Gauge className="w-3.5 h-3.5" /> Speed</span>
                            <span className="text-[#A3E635] normal-case">{settings.signing_speed}x</span>
                        </label>
                        <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.25"
                            value={settings.signing_speed}
                            onChange={(e) => update('signing_speed', parseFloat(e.target.value))}
                            className="w-full"
                        />
                        <div className="flex justify-between text-[10px] text-[#4A5568]">
                            <span>0.5x</span><span>1x</span><span>1.5x</span><span>2x</span>
                        </div>
                    </div>

                    {/* PiP Size */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-xs font-bold text-[#A0AEC0] uppercase tracking-wider">
                            <Move className="w-3.5 h-3.5" /> Avatar Size
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['small', 'medium', 'large'] as const).map(s => (
                                <button
                                    key={s}
                                    onClick={() => update('pip_size', s)}
                                    className={`py-2 px-3 rounded-lg text-xs font-medium capitalize transition-all
                    ${settings.pip_size === s
                                            ? 'bg-[#A3E635]/20 text-[#A3E635] border border-[#A3E635]/50'
                                            : 'bg-[#0F1117] text-[#A0AEC0] border border-[#2D3748] hover:border-[#4A5568]'
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* PiP Position */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-[#A0AEC0] uppercase tracking-wider">Position</label>
                        <div className="grid grid-cols-2 gap-2 w-24">
                            {pipPositions.map(p => (
                                <button
                                    key={p.key}
                                    onClick={() => update('pip_position', p.key)}
                                    className={`py-1.5 rounded text-[10px] font-bold transition-all
                    ${settings.pip_position === p.key
                                            ? 'bg-[#A3E635] text-[#0F1117]'
                                            : 'bg-[#2D3748] text-[#A0AEC0] hover:bg-[#4A5568]'
                                        }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Show Gloss Toggle */}
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs font-bold text-[#A0AEC0] uppercase tracking-wider">
                            <Eye className="w-3.5 h-3.5" /> Show ISL Gloss
                        </label>
                        <button
                            onClick={() => update('show_isl_gloss', !settings.show_isl_gloss)}
                            className={`w-10 h-5 rounded-full relative transition-colors
                ${settings.show_isl_gloss ? 'bg-[#A3E635]' : 'bg-[#2D3748]'}`}
                        >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform
                ${settings.show_isl_gloss ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                    </div>

                    {/* Target Languages */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-xs font-bold text-[#A0AEC0] uppercase tracking-wider">
                            <Languages className="w-3.5 h-3.5" /> Dubbing Languages
                        </label>
                        <div className="space-y-1.5">
                            {allLanguages.map(lang => (
                                <label key={lang.code} className="flex items-center gap-3 cursor-pointer group">
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
                                        className="w-4 h-4 rounded border-[#2D3748] bg-[#0F1117] text-[#A3E635] focus:ring-[#A3E635]/30"
                                    />
                                    <span className="text-sm text-[#F7FAFC] group-hover:text-[#A3E635] transition-colors">
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
