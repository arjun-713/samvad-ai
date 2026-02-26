import { useState } from 'react';
import BackendStatus from './BackendStatus';

interface HeaderProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
}

export default function Header({ currentPage, onPageChange, darkMode, onDarkModeToggle }: HeaderProps) {
  return (
    <header className="relative z-10 w-full px-6 py-5 md:px-12 flex items-center justify-between">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-3">
          <div className="size-8 text-primary">
            <span className="material-symbols-outlined text-[32px]">spa</span>
          </div>
          <h1 className="text-[#2c2420] dark:text-white text-xl font-bold tracking-tight">
            Samvad AI
          </h1>
        </div>
        <span className="text-xs text-[#5a4d48] dark:text-stone-300 font-medium tracking-wide ml-11">
          Where Voice Becomes Sign
        </span>
      </div>

      <nav className="hidden md:flex items-center gap-8 bg-white/40 dark:bg-black/20 backdrop-blur-md px-6 py-2 rounded-full border border-stone-200 dark:border-stone-700 shadow-sm">
        <button
          onClick={() => onPageChange('live')}
          className={`text-sm font-semibold transition-colors ${
            currentPage === 'live' ? 'underline-active' : 'text-[#5a4d48] dark:text-stone-300 hover:text-primary'
          }`}
        >
          Live Session Mode
        </button>
        <button
          onClick={() => onPageChange('streaming')}
          className={`text-sm font-semibold transition-colors ${
            currentPage === 'streaming' ? 'underline-active' : 'text-[#5a4d48] dark:text-stone-300 hover:text-primary'
          }`}
        >
          Streaming
        </button>
        <button
          onClick={() => onPageChange('assistive')}
          className={`text-sm font-semibold transition-colors ${
            currentPage === 'assistive' ? 'underline-active' : 'text-[#5a4d48] dark:text-stone-300 hover:text-primary'
          }`}
        >
          Assistive
        </button>
        <button
          onClick={() => onPageChange('replay')}
          className={`text-sm font-semibold transition-colors ${
            currentPage === 'replay' ? 'underline-active' : 'text-[#5a4d48] dark:text-stone-300 hover:text-primary'
          }`}
        >
          Replay
        </button>
      </nav>

      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-2 mr-2">
          <button
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#5a4d48] dark:text-stone-300 transition-colors"
            title="Keyboard Navigation"
          >
            <span className="material-symbols-outlined text-[20px]">keyboard</span>
          </button>
          <button
            onClick={onDarkModeToggle}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#5a4d48] dark:text-stone-300 transition-colors"
            title="Toggle Dark Mode"
          >
            <span className="material-symbols-outlined text-[20px]">
              {darkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
        <BackendStatus />
        <button className="bg-primary text-white px-5 py-2.5 rounded-xl font-semibold shadow-glow hover:shadow-lg transition-all flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">accessibility_new</span>
          <span>Start Session</span>
        </button>
      </div>
    </header>
  );
}
