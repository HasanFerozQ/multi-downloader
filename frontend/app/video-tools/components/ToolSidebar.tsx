"use client";

import { Scissors, Maximize2, RefreshCw, Music, Home } from 'lucide-react';

interface Tool {
    id: string;
    name: string;
    icon: React.ReactNode;
    category: string;
}

interface ToolSidebarProps {
    activeTool: string;
    onToolChange: (toolId: string) => void;
}

const TOOLS: Tool[] = [
    { id: 'welcome', name: 'Home', icon: <Home size={20} />, category: 'Start' },
    { id: 'trim', name: 'Trim Video', icon: <Scissors size={20} />, category: 'Basic Editing' },
    { id: 'resize', name: 'Resize for Platforms', icon: <Maximize2 size={20} />, category: 'Basic Editing' },
    { id: 'convert', name: 'Format Converter', icon: <RefreshCw size={20} />, category: 'Convert & Extract' },
    { id: 'audio', name: 'Extract Audio', icon: <Music size={20} />, category: 'Convert & Extract' },
];

export default function ToolSidebar({ activeTool, onToolChange }: ToolSidebarProps) {
    const categories = Array.from(new Set(TOOLS.map(t => t.category)));

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 sticky top-24 h-fit">
            <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                🛠️ Select Tool
            </h2>

            {categories.map(category => {
                const categoryTools = TOOLS.filter(t => t.category === category);

                return (
                    <div key={category} className="mb-6 last:mb-0">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                            {category}
                        </h3>

                        <div className="space-y-2">
                            {categoryTools.map(tool => (
                                <button
                                    key={tool.id}
                                    onClick={() => onToolChange(tool.id)}
                                    className={`
                    w-full px-4 py-3 rounded-xl text-left font-medium
                    transition-all duration-200 flex items-center gap-3
                    ${activeTool === tool.id
                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:translate-x-1'
                                        }
                  `}
                                >
                                    <span className={activeTool === tool.id ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}>
                                        {tool.icon}
                                    </span>
                                    <span className="text-sm">{tool.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
