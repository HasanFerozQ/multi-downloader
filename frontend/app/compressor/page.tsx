export default function CompressorPage() {
    return (
        <main className="min-h-screen pt-24 px-4 pb-12 bg-slate-950">
            <div className="max-w-6xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    Media Compressor
                </h1>
                <p className="text-slate-400 text-lg mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 max-w-2xl mx-auto">
                    Professional video and image compression tool. Reduce file size without losing quality.
                </p>

                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
                    <div className="p-4 bg-slate-800 rounded-full mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Coming Soon</h2>
                    <p className="text-slate-500">We are working on bringing you the best compression algorithms.</p>
                </div>
            </div>
        </main>
    );
}
