import { useState, useRef, useEffect } from 'react';

const INDIAN_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া' },
  { code: 'mai', name: 'Maithili', native: 'मैथिली' },
  { code: 'mag', name: 'Magahi', native: 'मगही' },
  { code: 'bho', name: 'Bhojpuri', native: 'भोजपुरी' },
  { code: 'raj', name: 'Rajasthani', native: 'राजस्थानी' },
  { code: 'chhg', name: 'Chhattisgarhi', native: 'छत्तीसगढ़ी' },
  { code: 'sd', name: 'Sindhi', native: 'سنڌي' },
  { code: 'ks', name: 'Kashmiri', native: 'कॉशुर' },
  { code: 'ne', name: 'Nepali', native: 'नेपाली' },
  { code: 'sat', name: 'Santali', native: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
];

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

export default function LanguageSelector({ selectedLanguage, onLanguageChange }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = INDIAN_LANGUAGES.find(lang => lang.code === selectedLanguage) || INDIAN_LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative group" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-[#2c2420] dark:text-white font-medium border-b-2 border-primary/30 pb-1 hover:border-primary transition-colors"
      >
        <span className="material-symbols-outlined text-lg">translate</span>
        <span>{currentLang.name}</span>
        <span className={`material-symbols-outlined text-sm transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#2c2420] rounded-xl shadow-2xl border border-stone-200 dark:border-stone-700 max-h-96 overflow-y-auto z-50">
          <div className="p-2">
            {INDIAN_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  onLanguageChange(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors flex items-center justify-between ${
                  lang.code === selectedLanguage
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-[#2c2420] dark:text-white'
                }`}
              >
                <span className="flex flex-col">
                  <span className="text-sm font-medium">{lang.name}</span>
                  <span className="text-xs opacity-70">{lang.native}</span>
                </span>
                {lang.code === selectedLanguage && (
                  <span className="material-symbols-outlined text-primary text-lg">check</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
