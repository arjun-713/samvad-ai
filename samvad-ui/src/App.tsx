import { useState } from 'react';
import './App.css';

function App() {
  const [reverseMode, setReverseMode] = useState(false);
  const [signingSpeed, setSigningSpeed] = useState(1.2);
  const [selectedAvatar, setSelectedAvatar] = useState(0);

  const avatars = [
    { name: 'Maya', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpOrIJ8SjitPHl9rZ6Goljshf4GdVIq2A4n5bD4JGthOdCxH6RzCEGRr9iKCn3aHlekUxxZjl6H06hUVNVLRvEvoOciidUbN5d6PuLd9lxJMg89iehZ5ib0UMdpFX6Mr4o9Nf_j06PL4-7UMOvxGR4R6dDQGcMaa4SyM3CQAu9WL1S7xugC1WnyLrfmoqGsbnRTren_CocH66cq0MOVJTJTC92wa5O6FXQ6E2BediarBDQdXoh2R9X7qU_40EgsHkcToNXrsrwDz-3' },
    { name: 'Arjun', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdAv4av7cKSpRWMWCc7FrCNnmFzwnJ4Ns6uB3klNtXC41aQW4a1TqkWV7EbtRRS9fennSzgrMztMLCTNVxeC2aVnue7JPNva61gsdGkGrVGQRIW80vEAIEoHk6uHYdlGWBt_vylmH-ltvRWxUVfSi3FvKuTiNwRDtwetfdQVt7xjzf8SRBEKTr299hediDfxpR3Yy934VF8AJZyarub4QkEQ-vghIM_E_SMPov4F9wKcdhzT9CXdey-CLgGfSEdp90_ybJgpyzq2bm' },
    { name: 'Priya', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdQ2s3P0uvl06X3lTlXfoUjPJ3whdftr44_63Elbl152yCZZXA-j5uj46BL7KFeSrTtUDUheXt0Ab3200CirZScufwWNzRRs1_aesSWgj_V4QqjiCgoCCt7GzAlCU-2o-Vpp8gO35XhZw9cEEFfPbbuqFeqyJQYewn4NQJbm5ymHfdYV_lEc3wQ_TX7DswnyWL_gOBQFgmd78FnGzox1xLDtzZhkgZOL634olgf0tDiGca9osUAzONlrPuqfBatt-ytb1AWrYP8LYv' }
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <div className="absolute inset-0 mandala-bg pointer-events-none z-0"></div>

      {/* Header */}
      <header className="relative z-10 w-full px-6 py-5 md:px-12 flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-3">
            <div className="size-8 text-[#d97757]">
              <span className="material-symbols-outlined text-[32px]">spa</span>
            </div>
            <h1 className="text-[#2c2420] text-xl font-bold tracking-tight">Samvad AI</h1>
          </div>
          <span className="text-xs text-[#5a4d48] font-medium tracking-wide ml-11">
            Where Voice Becomes Sign
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 bg-white/40 backdrop-blur-md px-6 py-2 rounded-full border border-stone-200 shadow-sm">
          <a className="text-sm font-semibold underline-active transition-colors" href="#">
            Live Session Mode
          </a>
          <a className="text-[#5a4d48] text-sm font-medium hover:text-[#d97757] transition-colors" href="#">
            Streaming
          </a>
          <a className="text-[#5a4d48] text-sm font-medium hover:text-[#d97757] transition-colors" href="#">
            Assistive
          </a>
          <a className="text-[#5a4d48] text-sm font-medium hover:text-[#d97757] transition-colors" href="#">
            Replay
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 mr-2">
            <button className="p-1.5 rounded-full hover:bg-black/5 text-[#5a4d48] transition-colors" title="Keyboard Navigation">
              <span className="material-symbols-outlined text-[20px]">keyboard</span>
            </button>
            <button className="p-1.5 rounded-full hover:bg-black/5 text-[#5a4d48] transition-colors" title="High Contrast">
              <span className="material-symbols-outlined text-[20px]">contrast</span>
            </button>
          </div>
          <button className="bg-[#d97757] text-white px-5 py-2.5 rounded-xl font-semibold shadow-[0_0_15px_rgba(217,119,87,0.3)] hover:shadow-lg transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">accessibility_new</span>
            <span>Start Session</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 w-full max-w-[1440px] mx-auto p-6 md:p-12 md:pt-4 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Section - Video Player */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          {/* Video Player */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5 group">
            <div
              className="absolute inset-0 bg-[#2c2420] bg-cover bg-center"
              style={{
                backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuANX8MvOwzYz3D-jNPOexGkRnq7UZVYlHjLSVThz3wFho5ZcAcUTjkZ5nTy5Gcm_up0sCGbA8gJjw25hWEIB-w96zLG7a_uGINtM-7X92KTokDQxRVkXT_2TwQu8I0ha4qLgR1Dkitqbsj29Y9zJCUx4BgOWpfBlP3bCAzzy3RKv9pyxiuE2mDfAzou-FOPGy09kO5HR49Rr_detsFKKlUcvv5sD_c-ovc1xMNMxFpI4T2Wqbt1cBwH-xnQgFHfurRtOfxtZOakD28A')"
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60"></div>
            </div>

            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 backdrop-blur-[2px]">
              <button className="size-20 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  play_arrow
                </span>
              </button>
            </div>

            {/* PIP Window */}
            <div className="absolute top-6 right-6 w-48 aspect-[3/4] glass-pip rounded-xl overflow-hidden shadow-lg border border-white/20">
              <div
                className="w-full h-full bg-cover bg-center opacity-90"
                style={{
                  backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBpQKw0pAnh89sXV6giTJh62jhAbBb4azoE0LgsiHa1wS5OBRogWNxsIBvGZE2FGM6w0mlWKm0CxPSW0pl-fAY0KHNuj3hNDsF0i0m9p0L7cDl6xlP4vOQptJCjX0tuNTUOF7Lpks-BrDuT5jpbyHn2sJekJMiHujN4MEguYKCkhUC4XUNMH6hfr3x6tawzl2Qj11THLFPh4xVEe2XPwFd3fblsunxwAxpVotK78fbOZ99XI9ykUZpSjCGZWmP4ijdb3igWtt-6K2U2')"
                }}
              ></div>
              <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                <span className="text-xs text-white font-medium drop-shadow-md">Signer</span>
                <div className="size-2 bg-green-400 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
              </div>
            </div>

            {/* Live Badge */}
            <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#d97757]/30 shadow-[0_0_15px_rgba(217,119,87,0.2)]">
              <div className="size-2 bg-[#d97757] rounded-full animate-pulse shadow-[0_0_8px_rgba(217,119,87,0.8)]"></div>
              <span className="text-white text-xs font-bold tracking-wider uppercase">Live Stream</span>
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-2">
            <button className="relative group overflow-hidden rounded-xl px-6 py-3 bg-gradient-to-r from-[#4b4e8c]/10 to-[#d97757]/10 hover:from-[#4b4e8c]/20 hover:to-[#d97757]/20 transition-all w-full sm:w-auto flex-1 max-w-sm border border-transparent">
              <div className="absolute inset-0 rounded-xl border border-transparent group-hover:border-[#d97757]/30 transition-colors"></div>
              <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-[#4b4e8c] to-[#d97757] group-hover:w-full transition-all duration-500"></div>
              <div className="flex items-center justify-center gap-3 relative z-10">
                <span className="material-symbols-outlined text-[#d97757] group-hover:scale-110 transition-transform">
                  videocam
                </span>
                <span className="text-[#2c2420] font-bold text-sm tracking-wide">Connect Live Stream</span>
              </div>
            </button>

            <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[#5a4d48]">Reverse Mode</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={reverseMode}
                    onChange={(e) => setReverseMode(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d97757] shadow-inner"></div>
                  <div className="absolute inset-0 rounded-full ring-2 ring-[#d97757]/20 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"></div>
                </label>
              </div>

              <div className="relative group">
                <button className="flex items-center gap-2 text-[#2c2420] font-medium border-b-2 border-[#d97757]/30 pb-1 hover:border-[#d97757] transition-colors">
                  <span className="material-symbols-outlined text-lg">translate</span>
                  <span>English (UK)</span>
                  <span className="material-symbols-outlined text-sm">expand_more</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Context Panel */}
          <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6 border border-stone-200/50 shadow-[0_4px_20px_-2px_rgba(44,36,32,0.08)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#2c2420] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#d97757]">sensors</span>
                Live Context
              </h2>
              <span className="text-xs text-[#5a4d48] font-medium bg-stone-100 px-2 py-1 rounded-md">
                Real-time Analysis
              </span>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#fdfbf7] border border-stone-200 rounded-full shadow-sm hover:shadow-md transition-shadow cursor-default">
                <span className="size-1.5 rounded-full bg-[#4b4e8c]"></span>
                <span className="text-xs font-semibold text-[#5a4d48]">Detected Language: Kannada</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#fdfbf7] border border-stone-200 rounded-full shadow-sm hover:shadow-md transition-shadow cursor-default">
                <span className="size-1.5 rounded-full bg-[#d97757]"></span>
                <span className="text-xs font-semibold text-[#5a4d48]">Signing Style: Conversational</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#fdfbf7] border border-stone-200 rounded-full shadow-sm hover:shadow-md transition-shadow cursor-default">
                <span className="size-1.5 rounded-full bg-amber-500"></span>
                <span className="text-xs font-semibold text-[#5a4d48]">Cultural Tone: Formal</span>
              </div>
            </div>

            <p className="text-[#5a4d48] text-sm leading-relaxed border-t border-stone-200/50 pt-4 italic">
              "Samvad AI harmonizes spoken word with visual sign language, bridging communication gaps with empathy, precision, and cultural depth."
            </p>
          </div>
        </section>

        {/* Right Section - Translation Deck */}
        <section className="lg:col-span-5 relative">
          <div className="glass-panel rounded-2xl p-8 shadow-[0_4px_20px_-2px_rgba(44,36,32,0.08)] h-full flex flex-col relative z-10 border-t border-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[#2c2420]">Translation Deck</h3>
              <span className="text-xs font-semibold text-[#d97757] bg-[#d97757]/10 px-3 py-1 rounded-full animate-pulse">
                Signing...
              </span>
            </div>

            {/* Text Input Area */}
            <div className="flex-1 bg-[#fdfbf7] rounded-xl p-6 mb-6 shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] relative group border border-stone-100 focus-within:ring-2 focus-within:ring-[#d97757]/20 transition-all">
              <div
                className="absolute inset-0 opacity-40 pointer-events-none rounded-xl"
                style={{
                  backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB6DyUSaOjevX-u4AMZW8YYTOS3QiPH5xpxeWOYHNsexSPXmc4ps6rc9t5iYREKn7jJjPhEVUZ01HV9GgL1f3AiKF7YDDgfZJHPVYgJq-_xG2yzHdCrb0HyDQuYaWFmg9dZVQqnmm5wzDpNlmTxenIjQX7_Bzw4T88e97aoiu9bLtJf_w7OkHgP09dnaxz7zxIOoSKovgtDkE_r5PUZQ4EmxuqcwxDbSLsd6BkvE0JQ0C0-dZu-X_ZKObqFJqgkeCljwIoNloo8cBlU')"
                }}
              ></div>
              <textarea
                className="w-full h-full bg-transparent border-none resize-none focus:ring-0 text-lg text-[#2c2420] placeholder-[#a89b96] font-display leading-relaxed z-10 relative"
                placeholder="Enter text to translate..."
              ></textarea>
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button className="p-2 hover:bg-stone-100 rounded-full text-stone-400 hover:text-[#d97757] transition-colors">
                  <span className="material-symbols-outlined text-xl">mic</span>
                </button>
                <button className="p-2 hover:bg-stone-100 rounded-full text-stone-400 hover:text-[#d97757] transition-colors">
                  <span className="material-symbols-outlined text-xl">upload_file</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
              <button className="bg-white border border-stone-200 hover:border-[#d97757]/50 text-[#5a4d48] px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm hover:shadow-md flex items-center gap-2">
                <span className="material-symbols-outlined text-base">sentiment_satisfied</span>
                Interpret Tone
              </button>
              <button className="bg-white border border-stone-200 hover:border-[#d97757]/50 text-[#5a4d48] px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm hover:shadow-md flex items-center gap-2">
                <span className="material-symbols-outlined text-base">summarize</span>
                Summarize Key Points
              </button>
            </div>

            {/* Avatar Selection */}
            <div className="mt-auto space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#8a7a74] uppercase tracking-wider">
                  Assistant Persona
                </label>
                <div className="flex gap-4">
                  {avatars.map((avatar, index) => (
                    <button
                      key={index}
                      className="relative group"
                      onClick={() => setSelectedAvatar(index)}
                    >
                      <div
                        className={`size-14 rounded-2xl overflow-hidden ${
                          selectedAvatar === index
                            ? 'ring-2 ring-[#d97757] ring-offset-2 ring-offset-[#faf8f6]'
                            : 'ring-1 ring-transparent group-hover:ring-stone-300 opacity-60 hover:opacity-100'
                        } transition-all`}
                      >
                        <img
                          alt={`${avatar.name} avatar`}
                          className="w-full h-full object-cover"
                          src={avatar.image}
                        />
                      </div>
                      {selectedAvatar === index && (
                        <div className="absolute -bottom-1 -right-1 bg-[#d97757] text-white text-[10px] px-1.5 rounded-full shadow-sm">
                          {avatar.name}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Signing Speed Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-[#8a7a74] uppercase tracking-wider">
                    Signing Speed
                  </label>
                  <span className="text-xs font-medium text-[#d97757]">{signingSpeed}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={signingSpeed}
                  onChange={(e) => setSigningSpeed(parseFloat(e.target.value))}
                  className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#d97757]"
                  style={{
                    background: 'linear-gradient(to right, rgba(75, 78, 140, 0.3), rgba(217, 119, 87, 0.3))'
                  }}
                />
              </div>
            </div>

            {/* Accessibility Notice */}
            <div className="mt-8 bg-stone-200/50 rounded-xl p-4 flex items-start gap-3 border border-stone-200">
              <span className="material-symbols-outlined text-[#5a4d48] mt-0.5">accessibility_new</span>
              <div>
                <p className="text-sm font-bold text-[#2c2420]">Accessibility Priority</p>
                <p className="text-xs text-[#5a4d48] mt-1">
                  High contrast mode and screen reader optimization are active. Use{' '}
                  <kbd className="font-mono bg-white px-1 rounded border border-stone-300">Ctrl</kbd> +{' '}
                  <kbd className="font-mono bg-white px-1 rounded border border-stone-300">M</kbd> for menu.
                </p>
              </div>
            </div>
          </div>

          {/* Background Glow */}
          <div className="absolute -bottom-4 -right-4 -left-4 top-8 bg-[#4b4e8c]/5 rounded-[2rem] -z-10 blur-xl"></div>
        </section>
      </main>
    </div>
  );
}

export default App;
