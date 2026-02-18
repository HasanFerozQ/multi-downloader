export default function BlogPage() {
    return (
        <main className="min-h-screen pt-24 px-4 pb-12 bg-slate-950">
            <div className="max-w-6xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    Blog & Tutorials
                </h1>
                <p className="text-slate-400 text-lg mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 max-w-2xl mx-auto">
                    Latest updates, guides, and tips for content creators.
                </p>

                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
                    <div className="p-4 bg-slate-800 rounded-full mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Coming Soon</h2>
                    <p className="text-slate-500">Stay tuned for insightful articles and tutorials.</p>
                </div>
            </div>
        </main>
    );
}
