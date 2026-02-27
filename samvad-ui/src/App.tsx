import { useState, useEffect } from 'react'
import { Type, Video, Upload, Hand, Settings, Wifi, WifiOff } from 'lucide-react'
import TextToISL from './components/TextToISL'
import LiveStream from './components/LiveStream'
import VideoUpload from './components/VideoUpload'
import ReverseMode from './components/ReverseMode'
import SettingsPanel from './components/SettingsPanel'
import { islApi } from './api/client'
import type { AppMode } from './types'

const modes: { key: AppMode; label: string; icon: React.ReactNode; description: string }[] = [
  { key: 'text', label: 'Text to ISL', icon: <Type className="w-5 h-5" />, description: 'Type text to sign' },
  { key: 'live', label: 'Live Stream', icon: <Video className="w-5 h-5" />, description: 'Real-time ISL overlay' },
  { key: 'upload', label: 'Video Upload', icon: <Upload className="w-5 h-5" />, description: 'Process uploaded video' },
  { key: 'reverse', label: 'Reverse Mode', icon: <Hand className="w-5 h-5" />, description: 'Sign to speech' },
]

export default function App() {
  const [activeMode, setActiveMode] = useState<AppMode>('text')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  // Check backend health on mount
  useEffect(() => {
    const check = async () => {
      try {
        await islApi.health()
        setBackendStatus('online')
      } catch {
        setBackendStatus('offline')
      }
    }
    check()
    const interval = setInterval(check, 30000) // Re-check every 30s
    return () => clearInterval(interval)
  }, [])

  const renderContent = () => {
    switch (activeMode) {
      case 'text': return <TextToISL />
      case 'live': return <LiveStream />
      case 'upload': return <VideoUpload />
      case 'reverse': return <ReverseMode />
    }
  }

  return (
    <div className="min-h-screen bg-[#0F1117] flex">
      {/* Sidebar */}
      <aside className="w-[72px] lg:w-[240px] flex flex-col bg-[#0D0F15] border-r border-[#1A1F2E] flex-shrink-0">
        {/* Logo */}
        <div className="p-4 lg:p-5 border-b border-[#1A1F2E]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#A3E635] to-[#7C3AED] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg font-black">S</span>
            </div>
            <div className="hidden lg:block">
              <h1 className="text-[#F7FAFC] font-bold text-base leading-tight">Samvad AI</h1>
              <p className="text-[#4A5568] text-[10px] font-medium">ISL Accessibility</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1.5">
          {modes.map((mode) => (
            <button
              key={mode.key}
              onClick={() => setActiveMode(mode.key)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group
                ${activeMode === mode.key
                  ? 'bg-[#A3E635]/10 text-[#A3E635]'
                  : 'text-[#A0AEC0] hover:bg-[#1A1F2E] hover:text-[#F7FAFC]'
                }`}
            >
              <div className={`flex-shrink-0 ${activeMode === mode.key ? 'text-[#A3E635]' : ''}`}>
                {mode.icon}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-semibold">{mode.label}</p>
                <p className={`text-[10px] ${activeMode === mode.key ? 'text-[#A3E635]/70' : 'text-[#4A5568]'}`}>
                  {mode.description}
                </p>
              </div>
              {activeMode === mode.key && (
                <div className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-[#A3E635]" />
              )}
            </button>
          ))}
        </nav>

        {/* Settings button */}
        <div className="p-3 border-t border-[#1A1F2E]">
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#A0AEC0] hover:bg-[#1A1F2E] hover:text-[#F7FAFC] transition-all"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className="hidden lg:block text-sm font-medium">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 lg:px-6 border-b border-[#1A1F2E] flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-[#F7FAFC] font-bold text-lg">
              {modes.find(m => m.key === activeMode)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Backend status */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
              ${backendStatus === 'online'
                ? 'bg-[#68D391]/10 text-[#68D391]'
                : backendStatus === 'offline'
                  ? 'bg-red-500/10 text-red-400'
                  : 'bg-yellow-500/10 text-yellow-400'
              }`}
            >
              {backendStatus === 'online'
                ? <><Wifi className="w-3 h-3" /> Backend Live</>
                : backendStatus === 'offline'
                  ? <><WifiOff className="w-3 h-3" /> Offline</>
                  : <><span className="w-3 h-3 animate-pulse">⏳</span> Checking...</>
              }
            </div>

            {/* Environment badge */}
            <span className="px-2 py-0.5 bg-[#7C3AED]/20 text-[#7C3AED] rounded text-[10px] font-bold uppercase tracking-wider">
              Local
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {renderContent()}
        </main>
      </div>

      {/* Settings panel */}
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
