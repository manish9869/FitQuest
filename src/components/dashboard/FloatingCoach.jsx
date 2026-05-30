import React, { useState, useRef, useEffect } from 'react';
import { invokeLLM } from '@/api/llm';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const QUICK_REPLIES = [
    "How am I doing today?",
    "Give me a workout tip",
    "What should I eat?",
    "Motivate me! 💪",
];

function Bubble({ msg }) {
    const isUser = msg.role === 'user';
    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
            {!isUser && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                    <Sparkles className="w-3 h-3 text-white" />
                </div>
            )}
            <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${isUser
                ? 'bg-emerald-500 text-white rounded-tr-sm'
                : 'glass border border-white/10 rounded-tl-sm text-muted-foreground'}`}>
                {isUser ? msg.content : (
                    <ReactMarkdown className="prose-sm prose-invert [&>*]:my-0.5 [&>p]:leading-snug text-xs">
                        {msg.content}
                    </ReactMarkdown>
                )}
            </div>
        </motion.div>
    );
}

export default function FloatingCoach() {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: `Hey ${user?.user_metadata?.full_name?.split(' ')[0] || 'Athlete'}! 👋 I'm your AI Coach. Ask me anything about fitness, nutrition, or your progress!` }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const endRef = useRef(null);

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const send = async (text) => {
        const msg = text || input.trim();
        if (!msg) return;
        setInput('');
        const newMessages = [...messages, { role: 'user', content: msg }];
        setMessages(newMessages);
        setLoading(true);

        const history = newMessages.slice(-8).map(m => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content}`).join('\n');
        const reply = await invokeLLM({
            prompt: `You are an elite AI fitness coach for ${user?.user_metadata?.full_name || 'the user'}. Be motivational, concise, and personalized. Use emojis sparingly. Max 3 sentences per response.\n\nConversation:\n${history}\n\nCoach:`
        });

        setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
        setLoading(false);
    };

    return (
        <>
            <AnimatePresence>
                {!open && (
                    <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        onClick={() => setOpen(true)}
                        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/40 hover:scale-110 transition-transform"
                        style={{ boxShadow: '0 0 30px rgba(34,197,94,0.4), 0 4px 20px rgba(0,0,0,0.4)' }}>
                        <MessageSquare className="w-6 h-6 text-white" />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full text-[9px] font-bold text-black flex items-center justify-center">AI</span>
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {open && (
                    <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 flex flex-col rounded-3xl overflow-hidden border border-white/10"
                        style={{ height: 500, background: 'hsl(220 20% 5%)', boxShadow: '0 0 40px rgba(0,0,0,0.6)' }}>
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 flex-shrink-0"
                            style={{ background: 'linear-gradient(to right, rgba(34,197,94,0.15), rgba(16,185,129,0.05))' }}>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold text-sm">AI Coach</div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                    <span className="text-[10px] text-emerald-400">Online • Elite Mode</span>
                                </div>
                            </div>
                            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-3">
                            {messages.map((m, i) => <Bubble key={i} msg={m} />)}
                            {loading && (
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                        <Sparkles className="w-3 h-3 text-emerald-400" />
                                    </div>
                                    <div className="glass border border-white/10 rounded-2xl rounded-tl-sm px-3 py-2">
                                        <div className="flex gap-1">
                                            {[0, 1, 2].map(i => (
                                                <motion.div key={i} className="w-1.5 h-1.5 bg-emerald-400 rounded-full"
                                                    animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={endRef} />
                        </div>

                        <div className="px-3 pb-1 flex gap-1.5 overflow-x-auto flex-shrink-0">
                            {QUICK_REPLIES.map(q => (
                                <button key={q} onClick={() => send(q)}
                                    className="flex-shrink-0 text-[10px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-muted-foreground hover:text-white hover:border-white/20 transition-all whitespace-nowrap">
                                    {q}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-2 p-3 border-t border-white/5 flex-shrink-0">
                            <input value={input} onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && send()}
                                placeholder="Ask your coach..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-emerald-500/50" />
                            <button onClick={() => send()} disabled={!input.trim() || loading}
                                className="w-9 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 flex items-center justify-center transition-colors flex-shrink-0">
                                <Send className="w-4 h-4 text-black" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}


