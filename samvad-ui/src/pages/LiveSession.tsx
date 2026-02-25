import { useState } from 'react';
import LanguageSelector from '../components/LanguageSelector';
import { checkHealth, getStatus } from '../services/api';

export default function LiveSession() {
  const [reverseMode, setReverseMode] = useState(false);
  const [signingSpeed, setSigningSpeed] = useState(1.2);
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [backendMessage, setBackendMessage] = useState<string>('');

  const avatars = [
    { name: 'Maya', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpOrIJ8SjitPHl9rZ6Goljshf4GdVIq2A4n5bD4JGthOdCxH6RzCEGRr9iKCn3aHlekUxxZjl6H06hUVNVLRvEvoOciidUbN5d6PuLd9lxJMg89iehZ5ib0UMdpFX6Mr4o9Nf_j06PL4-7UMOvxGR4R6dDQGcMaa4SyM3CQAu9WL1S7xugC1WnyLrfmoqGsbnRTren_CocH66cq0MOVJTJTC92wa5O6FXQ6E2BediarBDQdXoh2R9X7qU_40EgsHkcToNXrsrwDz-3' },
    { name: 'Arjun', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdAv4av7cKSpRWMWCc7FrCNnmFzwnJ4Ns6uB3klNtXC41aQW4a1TqkWV7EbtRRS9fennSzgrMztMLCTNVxeC2aVnue7JPNva61gsdGkGrVGQRIW80vEAIEoHk6uHYdlGWBt_vylmH-ltvRWxUVfSi3FvKuTiNwRDtwetfdQVt7xjzf8SRBEKTr299hediDfxpR3Yy934VF8AJZyarub4QkEQ-vghIM_E_SMPov4F9wKcdhzT9CXdey-CLgGfSEdp90_ybJgpyzq2bm' },
    { name: 'Priya', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdQ2s3P0uvl06X3lTlXfoUjPJ3whdftr44_63Elbl152yCZZXA-j5uj46BL7KFeSrTtUDUheXt0Ab3200CirZScufwWNzRRs1_aesSWgj_V4QqjiCgoCCt7GzAlCU-2o-Vpp8gO35XhZw9cEEFfPbbuqFeqyJQYewn4NQJbm5ymHfdYV_lEc3wQ_TX7DswnyWL_gOBQFgmd78FnGzox1xLDtzZhkgZOL634olgf0tDiGca9osUAzONlrPuqfBatt-ytb1AWrYP8LYv' }
  ];

  const handleConnectStream = async () => {
    setConnectionStatus('connecting');
    setBackendMessage('Connecting to backend...');
    
    try {
      // Test health endpoint
      const healthResponse = await checkHealth();
      console.log('Health Check Response:', healthResponse);
      
      // Get system status
      const statusResponse = await getStatus();
      console.log('Status Response:', statusResponse);
      
      setConnectionStatus('connected');
      setBackendMessage(`✓ ${healthResponse.status}`);
      
      // Show success message for 3 seconds
      setTimeout(() => {
        setConnectionStatus('idle');
        setBackendMessage('');
      }, 3000);
    } catch (error) {
      console.error('Connection failed:', error);
      setConnectionStatus('error');
      setBackendMessage('✗ Backend connection failed. Is the server running?');
      
      // Reset after 5 seconds
      setTimeout(() => {
        setConnectionStatus('idle');
        setBackendMessage('');
      }, 5000);
    }
  };

  return (
    <main className="relative z-10 flex-1 w-full max-w-[1440px] mx-auto p-6 md:p-12 md:pt-4 grid grid-cols-1 lg:grid-cols-12 gap-10">
      <section className="lg:col-span-7 flex flex-col gap-6">
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5 dark:ring-white/10 group">
          <div
            className="absolute inset-0 bg-[#2c2420] bg-cover bg-center"
            style={{
              backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuANX8MvOwzYz3D-jNPOexGkRnq7UZVYlHjLSVThz3wFho5ZcAcUTjkZ5nTy5Gcm_up0sCGbA8gJjw25hWEIB-w96zLG7a_uGINtM-7X92KTokDQxRVkXT_2TwQu8I0ha4qLgR1Dkitqbsj29Y9zJCUx4BgOWpfBlP3bCAzzy3RKv9pyxiuE2mDfAzou-FOPGy09kO5HR49Rr_detsFKKlUcvv5sD_c-ovc1xMNMxFpI4T2Wqbt1cBwH-xnQgFHfurRtOfxtZOakD28A')"
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60"></div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 backdrop-blur-[2px]">
            <button className="size-20 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                play_arrow
              </span>
            </button>
          </div>

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

          <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-primary/30 shadow-[0_0_15px_rgba(217,119,87,0.2)]">
            <div className="size-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(217,119,87,0.8)]"></div>
            <span className="text-white text-xs font-bold tracking-wider uppercase">Live Stream</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-2">
          <button 
            onClick={handleConnectStream}
            disabled={connectionStatus === 'connecting'}
            className={`relative group overflow-hidden rounded-xl px-6 py-3 transition-all w-full sm:w-auto flex-1 max-w-sm border ${
              connectionStatus === 'connected' 
                ? 'bg-green-500/20 border-green-500/50' 
                : connectionStatus === 'error'
                ? 'bg-red-500/20 border-red-500/50'
                : 'bg-gradient-to-r from-secondary/10 to-primary/10 hover:from-secondary/20 hover:to-primary/20 border-transparent'
            } ${connectionStatus === 'connecting' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="absolute inset-0 rounded-xl border border-transparent group-hover:border-primary/30 transition-colors"></div>
            <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-secondary to-primary group-hover:w-full transition-all duration-500"></div>
            <div className="flex items-center justify-center gap-3 relative z-10">
              {connectionStatus === 'connecting' ? (
                <>
                  <span className="material-symbols-outlined text-primary animate-spin">
                    progress_activity
                  </span>
                  <span className="text-[#2c2420] dark:text-white font-bold text-sm tracking-wide">Connecting...</span>
                </>
              ) : connectionStatus === 'connected' ? (
                <>
                  <span className="material-symbols-outlined text-green-600">
                    check_circle
                  </span>
                  <span className="text-[#2c2420] dark:text-white font-bold text-sm tracking-wide">Connected!</span>
                </>
              ) : connectionStatus === 'error' ? (
                <>
                  <span className="material-symbols-outlined text-red-600">
                    error
                  </span>
                  <span className="text-[#2c2420] dark:text-white font-bold text-sm tracking-wide">Connection Failed</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">
                    videocam
                  </span>
                  <span className="text-[#2c2420] dark:text-white font-bold text-sm tracking-wide">Connect Live Stream</span>
                </>
              )}
            </div>
          </button>

          {backendMessage && (
            <div className={`text-sm font-medium ${
              connectionStatus === 'connected' ? 'text-green-600 dark:text-green-400' : 
              connectionStatus === 'error' ? 'text-red-600 dark:text-red-400' : 
              'text-[#5a4d48] dark:text-stone-300'
            }`}>
              {backendMessage}
            </div>
          )}

          <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-[#5a4d48] dark:text-stone-300">Reverse Mode</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={reverseMode}
                  onChange={(e) => setReverseMode(e.target.checked)}
                />
                <div className="w-11 h-6 bg-stone-200 dark:bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                <div className="absolute inset-0 rounded-full ring-2 ring-primary/20 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"></div>
              </label>
            </div>

            <LanguageSelector selectedLanguage={selectedLanguage} onLanguageChange={setSelectedLanguage} />
          </div>
        </div>

        <div className="bg-white/40 dark:bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-stone-200/50 dark:border-stone-700/50 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#2c2420] dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">sensors</span>
              Live Context
            </h2>
            <span className="text-xs text-[#5a4d48] dark:text-stone-300 font-medium bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-md">
              Real-time Analysis
            </span>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#fdfbf7] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full shadow-sm hover:shadow-md transition-shadow cursor-default">
              <span className="size-1.5 rounded-full bg-secondary"></span>
              <span className="text-xs font-semibold text-[#5a4d48] dark:text-stone-300">Detected Language: Kannada</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#fdfbf7] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full shadow-sm hover:shadow-md transition-shadow cursor-default">
              <span className="size-1.5 rounded-full bg-primary"></span>
              <span className="text-xs font-semibold text-[#5a4d48] dark:text-stone-300">Signing Style: Conversational</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#fdfbf7] dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full shadow-sm hover:shadow-md transition-shadow cursor-default">
              <span className="size-1.5 rounded-full bg-amber-500"></span>
              <span className="text-xs font-semibold text-[#5a4d48] dark:text-stone-300">Cultural Tone: Formal</span>
            </div>
          </div>

          <p className="text-[#5a4d48] dark:text-stone-300 text-sm leading-relaxed border-t border-stone-200/50 dark:border-stone-700/50 pt-4 italic">
            "Samvad AI harmonizes spoken word with visual sign language, bridging communication gaps with empathy, precision, and cultural depth."
          </p>
        </div>
      </section>

      <section className="lg:col-span-5 relative">
        <div className="glass-panel dark:bg-black/30 rounded-2xl p-8 shadow-soft h-full flex flex-col relative z-10 border-t border-white dark:border-stone-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[#2c2420] dark:text-white">Translation Deck</h3>
            <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full animate-pulse">
              Signing...
            </span>
          </div>

          <div className="flex-1 bg-[#fdfbf7] dark:bg-stone-900 rounded-xl p-6 mb-6 shadow-inner-glow relative group border border-stone-100 dark:border-stone-700 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <textarea
              className="w-full h-full bg-transparent border-none resize-none focus:ring-0 text-lg text-[#2c2420] dark:text-white placeholder-[#a89b96] dark:placeholder-stone-500 font-display leading-relaxed z-10 relative"
              placeholder="Enter text to translate..."
            ></textarea>
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full text-stone-400 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-xl">mic</span>
              </button>
              <button className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full text-stone-400 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-xl">upload_file</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-8">
            <button className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-primary/50 text-[#5a4d48] dark:text-stone-300 px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm hover:shadow-md flex items-center gap-2">
              <span className="material-symbols-outlined text-base">sentiment_satisfied</span>
              Interpret Tone
            </button>
            <button className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-primary/50 text-[#5a4d48] dark:text-stone-300 px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm hover:shadow-md flex items-center gap-2">
              <span className="material-symbols-outlined text-base">summarize</span>
              Summarize Key Points
            </button>
          </div>

          <div className="mt-auto space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-bold text-[#8a7a74] dark:text-stone-400 uppercase tracking-wider">
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
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-[#faf8f6] dark:ring-offset-[#2c2420]'
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
                      <div className="absolute -bottom-1 -right-1 bg-primary text-white text-[10px] px-1.5 rounded-full shadow-sm">
                        {avatar.name}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-[#8a7a74] dark:text-stone-400 uppercase tracking-wider">
                  Signing Speed
                </label>
                <span className="text-xs font-medium text-primary">{signingSpeed}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={signingSpeed}
                onChange={(e) => setSigningSpeed(parseFloat(e.target.value))}
                className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>

          <div className="mt-8 bg-stone-200/50 dark:bg-stone-800/50 rounded-xl p-4 flex items-start gap-3 border border-stone-200 dark:border-stone-700">
            <span className="material-symbols-outlined text-[#5a4d48] dark:text-stone-300 mt-0.5">accessibility_new</span>
            <div>
              <p className="text-sm font-bold text-[#2c2420] dark:text-white">Accessibility Priority</p>
              <p className="text-xs text-[#5a4d48] dark:text-stone-400 mt-1">
                High contrast mode and screen reader optimization are active. Use{' '}
                <kbd className="font-mono bg-white dark:bg-stone-900 px-1 rounded border border-stone-300 dark:border-stone-600">Ctrl</kbd> +{' '}
                <kbd className="font-mono bg-white dark:bg-stone-900 px-1 rounded border border-stone-300 dark:border-stone-600">M</kbd> for menu.
              </p>
            </div>
          </div>
        </div>

        <div className="absolute -bottom-4 -right-4 -left-4 top-8 bg-secondary/5 dark:bg-secondary/10 rounded-[2rem] -z-10 blur-xl"></div>
      </section>
    </main>
  );
}
