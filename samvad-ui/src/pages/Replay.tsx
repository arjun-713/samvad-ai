export default function Replay() {
  const recentSessions = [
    { id: 1, title: 'Team Meeting - Q4 Review', date: '2026-02-24', duration: '45:32', language: 'Hindi' },
    { id: 2, title: 'Customer Support Call', date: '2026-02-23', duration: '12:18', language: 'English' },
    { id: 3, title: 'Training Session - Product Demo', date: '2026-02-22', duration: '1:23:45', language: 'Tamil' },
    { id: 4, title: 'Conference Keynote', date: '2026-02-20', duration: '38:12', language: 'Kannada' },
  ];

  return (
    <main className="relative z-10 flex-1 w-full max-w-[1440px] mx-auto p-6 md:p-12 md:pt-4">
      <div className="space-y-8">
        <div className="glass-panel dark:bg-black/30 rounded-2xl p-8 shadow-soft border-t border-white dark:border-stone-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#2c2420] dark:text-white mb-2">
                Replay Library
              </h1>
              <p className="text-[#5a4d48] dark:text-stone-300">
                Access and review your past interpretation sessions
              </p>
            </div>
            <button className="bg-primary text-white px-6 py-3 rounded-xl font-semibold shadow-glow hover:shadow-lg transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">upload</span>
              <span>Upload Recording</span>
            </button>
          </div>

          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                search
              </span>
              <input
                type="text"
                placeholder="Search recordings..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-[#2c2420] dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <button className="px-6 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-[#2c2420] dark:text-white hover:border-primary transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
              <span>Filter</span>
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          {recentSessions.map((session) => (
            <div
              key={session.id}
              className="glass-panel dark:bg-black/30 rounded-xl p-6 shadow-soft border border-stone-200/50 dark:border-stone-700/50 hover:border-primary/50 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="size-32 rounded-xl bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[48px]">
                      play_circle
                    </span>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {session.duration}
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[#2c2420] dark:text-white mb-2 group-hover:text-primary transition-colors">
                    {session.title}
                  </h3>
                  <div className="flex flex-wrap gap-3 mb-3">
                    <span className="inline-flex items-center gap-1.5 text-sm text-[#5a4d48] dark:text-stone-400">
                      <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                      {session.date}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm text-[#5a4d48] dark:text-stone-400">
                      <span className="material-symbols-outlined text-[16px]">translate</span>
                      {session.language}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                      Interpreted
                    </span>
                    <span className="text-xs bg-secondary/10 text-secondary px-3 py-1 rounded-full font-medium">
                      Archived
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-all" title="Play">
                    <span className="material-symbols-outlined text-[24px]">play_arrow</span>
                  </button>
                  <button className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-[#5a4d48] dark:text-stone-400 transition-all" title="Download">
                    <span className="material-symbols-outlined text-[24px]">download</span>
                  </button>
                  <button className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-[#5a4d48] dark:text-stone-400 transition-all" title="Share">
                    <span className="material-symbols-outlined text-[24px]">share</span>
                  </button>
                  <button className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-all" title="Delete">
                    <span className="material-symbols-outlined text-[24px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-panel dark:bg-black/30 rounded-xl p-8 shadow-soft border border-stone-200/50 dark:border-stone-700/50 text-center">
          <span className="material-symbols-outlined text-stone-400 text-[64px] mb-4 block">
            video_library
          </span>
          <h3 className="font-bold text-[#2c2420] dark:text-white mb-2">No more recordings</h3>
          <p className="text-sm text-[#5a4d48] dark:text-stone-400">
            You've reached the end of your replay library
          </p>
        </div>
      </div>
    </main>
  );
}
