"use client";
import { useState, useRef, useEffect } from "react";
import { MessageSquarePlus, X, Send, Loader2, CheckCircle2 } from "lucide-react";

export default function FeedbackWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [contact, setContact] = useState("");
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState("");
    const modalRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setLoading(true);
        setStatus('idle');
        try {
            const res = await fetch("https://formspree.io/f/xeelroon", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message,
                    contact: contact || "Anonymous",
                }),
            });

            if (!res.ok) throw new Error("Failed to send feedback");

            setStatus('success');
            setMessage("");
            setContact("");
            setTimeout(() => {
                setIsOpen(false);
                setStatus('idle');
            }, 2000);

        } catch (err) {
            setStatus('error');
            setErrorMsg("Failed to send. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 z-50 bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-full shadow-lg shadow-indigo-600/30 transition-all hover:scale-110 active:scale-95 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                title="Send Feedback"
            >
                <MessageSquarePlus size={24} />
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:justify-end p-4 sm:p-6 bg-black/20 backdrop-blur-[2px]">
                    <div
                        ref={modalRef}
                        className="bg-slate-900 border border-indigo-500/30 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300"
                    >
                        {/* Header */}
                        <div className="bg-indigo-600/10 p-4 border-b border-indigo-500/20 flex justify-between items-center">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <MessageSquarePlus size={18} className="text-indigo-400" />
                                Send Feedback
                            </h3>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5">
                            {status === 'success' ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in">
                                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-3">
                                        <CheckCircle2 size={32} className="text-emerald-400" />
                                    </div>
                                    <h4 className="text-white font-bold text-lg">Thank You!</h4>
                                    <p className="text-slate-400 text-sm mt-1">Your feedback has been received.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Message</label>
                                        <textarea
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm focus:border-indigo-500 outline-none transition-colors min-h-[100px] resize-none"
                                            placeholder="Report a bug, suggest a feature, or just say hi..."
                                            value={message}
                                            onChange={e => setMessage(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contact (Optional)</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm focus:border-indigo-500 outline-none transition-colors"
                                            placeholder="Email or Discord ID"
                                            value={contact}
                                            onChange={e => setContact(e.target.value)}
                                        />
                                    </div>

                                    {status === 'error' && (
                                        <div className="text-red-400 text-xs bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                                            {errorMsg}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading || !message.trim()}
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                        Send Feedback
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
