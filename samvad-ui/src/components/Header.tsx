import { Settings, Contrast, Globe } from 'lucide-react'
import type { AppMode } from '../types'

interface HeaderProps {
    activeMode: AppMode
    setActiveMode: (mode: AppMode) => void
    backendStatus: 'checking' | 'online' | 'offline'
    onOpenSettings: () => void
    onToggleTheme: () => void
}

const modes: { key: AppMode; label: string }[] = [
    { key: 'text', label: 'Text to ISL' },
    { key: 'live', label: 'Live Stream' },
    { key: 'upload', label: 'Video Upload' },
    { key: 'reverse', label: 'Reverse Mode' }
]

export default function Header({
    activeMode,
    setActiveMode,
    backendStatus,
    onOpenSettings,
    onToggleTheme
}: HeaderProps) {
    return (
        <nav className="relative z-50 w-full max-w-7xl mx-auto mt-6 px-4">
            <div className="glass-panel bg-white/70 dark:bg-[#0F172A]/60 rounded-full px-6 py-3 flex items-center justify-between shadow-lg ring-1 ring-black/5 dark:ring-white/10">

                {/* Left: Logo & Brand */}
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-[linear-gradient(135deg,#F59E0B_0%,#D97706_100%)] flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-xl font-display">S</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-display font-bold text-lg tracking-tight text-gray-900 dark:text-white leading-none">Samvad AI</span>
                        <span className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400">Accessibility</span>
                    </div>
                </div>

                {/* Center: Navigation Pills */}
                <div className="hidden md:flex bg-gray-100 dark:bg-white/5 p-1 rounded-full">
                    {modes.map(mode => (
                        <button
                            key={mode.key}
                            onClick={() => setActiveMode(mode.key)}
                            className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${activeMode === mode.key
                                    ? 'bg-white dark:bg-[#151928] shadow-sm text-[#F59E0B] dark:text-[#F59E0B]'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            {mode.label}
                        </button>
                    ))}
                </div>

                {/* Right: Controls & Status */}
                <div className="flex items-center space-x-4">

                    {/* Language Dropdown */}
                    <div className="hidden sm:flex items-center space-x-2 bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-full">
                        <Globe className="text-gray-500 dark:text-gray-400 w-4 h-4" />
                        <select className="bg-transparent border-none text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-0 py-0 pr-8 cursor-pointer outline-none">
                            <optgroup className="bg-white dark:bg-[#151928]">
                                <option>Hindi</option>
                                <option>English</option>
                                <option>Bengali</option>
                                <option>Tamil</option>
                                <option>Marathi</option>
                                <option>Telugu</option>
                                <option>Gujarati</option>
                                <option>Kannada</option>
                                <option>Malayalam</option>
                            </optgroup>
                        </select>
                    </div>

                    {/* Backend Status */}
                    <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border ${backendStatus === 'online'
                            ? 'bg-green-900/10 dark:bg-green-500/10 border-green-500/20'
                            : backendStatus === 'offline'
                                ? 'bg-red-900/10 dark:bg-red-500/10 border-red-500/20'
                                : 'bg-yellow-900/10 dark:bg-yellow-500/10 border-yellow-500/20'
                        }`}>
                        <span className={`w-2 h-2 rounded-full ${backendStatus === 'online' ? 'bg-green-500 animate-pulse' :
                                backendStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
                            }`}></span>
                        <span className={`text-xs font-medium ${backendStatus === 'online' ? 'text-green-700 dark:text-green-400' :
                                backendStatus === 'offline' ? 'text-red-700 dark:text-red-400' : 'text-yellow-700 dark:text-yellow-400'
                            }`}>
                            {backendStatus === 'online' ? 'Online' : backendStatus === 'offline' ? 'Offline' : 'Checking'}
                        </span>
                    </div>

                    {/* Settings Toggle */}
                    <button
                        onClick={onOpenSettings}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                        <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>

                    {/* Theme Toggle */}
                    <button
                        onClick={onToggleTheme}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                        <Contrast className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>
            </div>
        </nav>
    )
}
