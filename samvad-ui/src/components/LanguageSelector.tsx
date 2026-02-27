import { ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface LanguageSelectorProps {
  selectedLanguage: string
  onLanguageChange: (lang: string) => void
  className?: string
}

const languages = [
  { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
  { code: 'en-IN', name: 'English (Indian)', flag: '🇬🇧' },
  { code: 'ta-IN', name: 'Tamil', flag: '🇮🇳' },
  { code: 'te-IN', name: 'Telugu', flag: '🇮🇳' },
  { code: 'bn-IN', name: 'Bengali', flag: '🇮🇳' },
  { code: 'mr-IN', name: 'Marathi', flag: '🇮🇳' },
  { code: 'kn-IN', name: 'Kannada', flag: '🇮🇳' },
  { code: 'ml-IN', name: 'Malayalam', flag: '🇮🇳' },
  { code: 'gu-IN', name: 'Gujarati', flag: '🇮🇳' },
]

export default function LanguageSelector({ selectedLanguage, onLanguageChange, className = '' }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selected = languages.find(l => l.code === selectedLanguage) || languages[0]

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1A1F2E] border border-[#2D3748] hover:border-[#A3E635]/30 transition-colors text-sm"
      >
        <span>{selected.flag}</span>
        <span className="text-[#F7FAFC] font-medium">{selected.name}</span>
        <ChevronDown className={`w-4 h-4 text-[#A0AEC0] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 right-0 w-56 bg-[#1A1F2E] border border-[#2D3748] rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { onLanguageChange(lang.code); setIsOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                ${lang.code === selectedLanguage
                  ? 'bg-[#A3E635]/10 text-[#A3E635]'
                  : 'text-[#F7FAFC] hover:bg-[#2D3748]/50'
                }`}
            >
              <span className="text-base">{lang.flag}</span>
              <span className="font-medium">{lang.name}</span>
              {lang.code === selectedLanguage && (
                <span className="ml-auto text-[#A3E635]">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
