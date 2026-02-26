export default function Streaming() {
  return (
    <main className="relative z-10 flex-1 w-full max-w-[1440px] mx-auto p-6 md:p-12 md:pt-4">
      <div className="glass-panel dark:bg-black/30 rounded-2xl p-12 shadow-soft border-t border-white dark:border-stone-700">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center justify-center size-24 rounded-full bg-primary/10 mb-4">
            <span className="material-symbols-outlined text-primary text-[64px]">stream</span>
          </div>
          
          <h1 className="text-4xl font-bold text-[#2c2420] dark:text-white">
            Streaming Mode
          </h1>
          
          <p className="text-lg text-[#5a4d48] dark:text-stone-300 leading-relaxed">
            Connect your live video stream and broadcast sign language interpretation in real-time. 
            Perfect for webinars, conferences, and live events.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white/40 dark:bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-stone-200/50 dark:border-stone-700/50">
              <span className="material-symbols-outlined text-primary text-[48px] mb-4 block">
                video_camera_front
              </span>
              <h3 className="font-bold text-[#2c2420] dark:text-white mb-2">Multi-Camera Support</h3>
              <p className="text-sm text-[#5a4d48] dark:text-stone-400">
                Connect multiple video sources for comprehensive coverage
              </p>
            </div>

            <div className="bg-white/40 dark:bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-stone-200/50 dark:border-stone-700/50">
              <span className="material-symbols-outlined text-primary text-[48px] mb-4 block">
                cloud_upload
              </span>
              <h3 className="font-bold text-[#2c2420] dark:text-white mb-2">Cloud Recording</h3>
              <p className="text-sm text-[#5a4d48] dark:text-stone-400">
                Automatically save and archive your interpreted streams
              </p>
            </div>

            <div className="bg-white/40 dark:bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-stone-200/50 dark:border-stone-700/50">
              <span className="material-symbols-outlined text-primary text-[48px] mb-4 block">
                share
              </span>
              <h3 className="font-bold text-[#2c2420] dark:text-white mb-2">Easy Sharing</h3>
              <p className="text-sm text-[#5a4d48] dark:text-stone-400">
                Generate shareable links for your audience instantly
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <button className="bg-primary text-white px-8 py-4 rounded-xl font-semibold shadow-glow hover:shadow-lg transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[24px]">play_circle</span>
              <span>Start Streaming</span>
            </button>
            <button className="bg-white dark:bg-stone-800 text-[#2c2420] dark:text-white px-8 py-4 rounded-xl font-semibold border border-stone-200 dark:border-stone-700 hover:border-primary transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[24px]">settings</span>
              <span>Configure Stream</span>
            </button>
          </div>

          <div className="mt-12 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 mt-0.5">info</span>
              <div className="text-left">
                <p className="text-sm font-bold text-amber-900 dark:text-amber-200">Stream Requirements</p>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                  Minimum 5 Mbps upload speed recommended. RTMP, WebRTC, and HLS protocols supported.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
