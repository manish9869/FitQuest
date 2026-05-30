import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Users, TrendingUp, Star, Flame, Shield, Trophy, Heart, Target } from 'lucide-react';

const stats = [
    { icon: Users, value: '500+', label: 'Transformations', color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    { icon: Zap, value: '10K+', label: 'Workouts Logged', color: 'text-blue-400', bg: 'bg-blue-500/15' },
    { icon: Star, value: '95%', label: 'Satisfaction Rate', color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
    { icon: TrendingUp, value: '2.4M', label: 'Calories Burned', color: 'text-purple-400', bg: 'bg-purple-500/15' },
];

const features = [
    { icon: Target, text: 'Personalized calorie & macro goals' },
    { icon: Trophy, text: 'Gamified XP, streaks & achievements' },
    { icon: Heart, text: 'AI-powered readiness & recovery score' },
    { icon: Zap, text: 'Smart meal scanner & food tracking' },
];

const quotes = [
    { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
    { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
    { text: "Your body can stand almost anything. It's your mind you have to convince.", author: "Unknown" },
];

export default function AuthVisualPanel({ quoteIndex = 0 }) {
    const [currentQuote, setCurrentQuote] = useState(quoteIndex % quotes.length);

    useEffect(() => {
        const timer = setInterval(() => setCurrentQuote(q => (q + 1) % quotes.length), 5000);
        return () => clearInterval(timer);
    }, []);

    const quote = quotes[currentQuote];

    return (
        <div className="relative h-full flex flex-col justify-between overflow-hidden p-8 lg:p-10">
            {/* Background */}
            <div className="absolute inset-0">
                <img
                    src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80"
                    alt="Fitness"
                    className="w-full h-full object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-emerald-950/60 to-black/95" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent" />
            </div>

            {/* Animated orbs */}
            <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.12, 0.22, 0.12] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-1/4 -left-24 w-80 h-80 bg-emerald-500 rounded-full blur-[120px] pointer-events-none"
            />
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.18, 0.08] }}
                transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
                className="absolute bottom-1/4 -right-20 w-72 h-72 bg-blue-500 rounded-full blur-[100px] pointer-events-none"
            />

            {/* Logo */}
            <div className="relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                        <Flame className="w-6 h-6 text-black" />
                    </div>
                    <div>
                        <div className="font-space font-bold text-xl text-white">FitElite</div>
                        <div className="text-[10px] text-emerald-400 tracking-widest uppercase">Transform · Perform · Elevate</div>
                    </div>
                </div>
            </div>

            {/* Center Content */}
            <div className="relative z-10 space-y-7">
                {/* Rotating Quote */}
                <div>
                    <div className="w-10 h-0.5 bg-gradient-to-r from-emerald-400 to-transparent mb-5" />
                    <AnimatePresence mode="wait">
                        <motion.blockquote key={currentQuote}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.5 }}
                            className="text-xl lg:text-2xl font-space font-bold text-white leading-tight">
                            "{quote.text}"
                        </motion.blockquote>
                    </AnimatePresence>
                    <p className="text-sm text-emerald-400 mt-3 font-medium">— {quote.author}</p>
                </div>

                {/* Feature list */}
                <div className="space-y-3">
                    {features.map((f, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                            className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                <f.icon className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                            <span className="text-sm text-white/70">{f.text}</span>
                        </motion.div>
                    ))}
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-2.5 mt-2">
                    {stats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div key={stat.label}
                                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.08 }}
                                className="glass rounded-2xl p-3.5 border border-white/8">
                                <div className={`w-7 h-7 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
                                    <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                                </div>
                                <div className={`text-lg font-space font-bold ${stat.color}`}>{stat.value}</div>
                                <div className="text-[10px] text-white/50 mt-0.5">{stat.label}</div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom trust badge */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
                className="relative z-10 flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 glass rounded-full px-4 py-2 border border-emerald-500/25">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs text-white/70">Trusted by <span className="text-emerald-400 font-semibold">1,000+ clients</span></span>
                </div>
                <div className="flex -space-x-2">
                    {['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-yellow-500'].map((c, i) => (
                        <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-black flex items-center justify-center text-[10px] font-bold text-black`}>
                            {['A', 'B', 'C', 'D'][i]}
                        </div>
                    ))}
                    <div className="w-7 h-7 rounded-full bg-white/10 border-2 border-black flex items-center justify-center text-[10px] font-bold text-white">+</div>
                </div>
            </motion.div>
        </div>
    );
}


