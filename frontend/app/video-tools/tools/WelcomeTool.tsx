"use client";

import { Zap, Target, Lock } from 'lucide-react';

export default function WelcomeTool() {
    return (
        <div className="text-center py-12">
            <div className="text-7xl mb-6">✨</div>
            <h2 className="text-4xl font-bold mb-4 text-slate-800 dark:text-slate-200">
                Welcome to Video Tools!
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-12">
                Choose a tool from the sidebar to get started. Edit your videos like a pro with our easy-to-use tools!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="text-5xl mb-4">
                        <Zap className="mx-auto text-indigo-600" size={48} />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-200">Lightning Fast</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                        Process videos in seconds with our optimized FFmpeg engine
                    </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="text-5xl mb-4">
                        <Target className="mx-auto text-indigo-600" size={48} />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-200">No Watermarks</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                        All outputs are 100% clean and professional
                    </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="text-5xl mb-4">
                        <Lock className="mx-auto text-indigo-600" size={48} />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-200">Private & Secure</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                        Your videos are processed securely and deleted after 30 minutes
                    </p>
                </div>
            </div>

            <div className="mt-12 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200 dark:border-indigo-900 rounded-2xl p-6">
                <h4 className="font-bold text-lg mb-2 text-indigo-900 dark:text-indigo-200">🎯 Phase 1 Tools Available</h4>
                <p className="text-indigo-700 dark:text-indigo-300 text-sm">
                    <strong>Trim</strong> • <strong>Resize for Platforms</strong> • <strong>Format Converter</strong> • <strong>Extract Audio</strong>
                </p>
                <p className="text-indigo-600 dark:text-indigo-400 text-xs mt-2">
                    More advanced tools coming soon in Phase 2 & 3!
                </p>
            </div>
        </div>
    );
}
