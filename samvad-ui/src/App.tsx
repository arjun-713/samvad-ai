import { useState, useEffect } from 'react'
import Header from './components/Header'
import HeroAvatarStage from './components/HeroAvatarStage'
import TextToISL from './components/TextToISL'
import LiveStream from './components/LiveStream'
import VideoUpload from './components/VideoUpload'
import ReverseMode from './components/ReverseMode'
import SettingsPanel from './components/SettingsPanel'
import { islApi } from './api/client'
import type { AppMode, ISLResult } from './types'

export default function App() {
  const [activeMode, setActiveMode] = useState<AppMode>('text')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  // Lifted state to pass to HeroAvatarStage
  const [currentResult, setCurrentResult] = useState<ISLResult | null>(null)

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

  const renderLeftPanelContent = () => {
    switch (activeMode) {
      case 'text':
        return <TextToISL
          onResult={(res) => { setCurrentResult(res); }}
        />
      case 'live':
        return <LiveStream onResult={(res) => { setCurrentResult(res); }} />
      case 'upload':
        return <VideoUpload />
      case 'reverse':
        return <ReverseMode />
    }
  }

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
  }

  return (
    <div className="bg-[#F0F4F8] dark:bg-[#0B0E16] text-gray-800 dark:text-gray-100 min-h-screen flex flex-col overflow-hidden transition-colors duration-300">

      {/* Global Background Layers */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-white dark:from-[#1B1F3B] dark:to-[#0F172A] opacity-100 transition-colors duration-500"></div>
        <div className="absolute inset-0 jaali-bg z-0 pointer-events-none"></div>
      </div>

      {/* Navigation Header */}
      <Header
        activeMode={activeMode}
        setActiveMode={(m) => { setActiveMode(m); setCurrentResult(null); }}
        backendStatus={backendStatus}
        onOpenSettings={() => setSettingsOpen(true)}
        onToggleTheme={toggleTheme}
      />

      {/* Main Two-Column Layout */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-100px)]">

        {/* Left Column (40% Input & Controls) */}
        <section className="lg:col-span-5 flex flex-col h-full space-y-6">
          {renderLeftPanelContent()}
        </section>

        {/* Right Column (60% Hero Stage) */}
        <section className="lg:col-span-7 h-full relative group hidden lg:block">
          <HeroAvatarStage result={currentResult} />
        </section>
      </main>

      {/* Settings panel */}
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
