"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface FAQItem {
    q: string;
    a: string;
}

interface FAQSectionProps {
    items: FAQItem[];
    title?: string;
}

export default function FAQSection({ items, title = "Frequently Asked Questions" }: FAQSectionProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

    return (
        <section className="max-w-3xl mx-auto px-4 py-16">
            {/* Header */}
            <div className="text-center mb-10">
                <span className="inline-block bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4 border border-blue-500/20">
                    FAQ
                </span>
                <h2 className="text-3xl font-black text-white">{title}</h2>
                <p className="text-slate-400 mt-2 text-sm">Everything you need to know</p>
            </div>

            {/* Accordion */}
            <div className="space-y-3">
                {items.map((item, i) => {
                    const isOpen = openIndex === i;
                    return (
                        <div
                            key={i}
                            className={`rounded-2xl border transition-all duration-300 ${isOpen
                                    ? "border-blue-500/40 bg-blue-500/5 shadow-lg shadow-blue-500/5"
                                    : "border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5"
                                }`}
                        >
                            <button
                                onClick={() => toggle(i)}
                                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                                aria-expanded={isOpen}
                            >
                                <span className={`font-semibold text-sm md:text-base transition-colors ${isOpen ? "text-white" : "text-slate-200"}`}>
                                    {item.q}
                                </span>
                                <ChevronDown
                                    size={18}
                                    className={`flex-shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-blue-400" : ""}`}
                                />
                            </button>

                            {/* Answer — animated */}
                            <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                                    }`}
                            >
                                <div className="px-6 pb-5">
                                    <div className="h-px bg-white/8 mb-4" />
                                    <p className="text-slate-400 text-sm leading-relaxed">{item.a}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
