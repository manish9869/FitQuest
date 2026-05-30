import React, { useState } from 'react';
import { entities } from '@/api/entities';
import { invokeLLM } from '@/api/llm';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, RefreshCw, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';

const CAT_COLORS = {
    Hydration: 'text-blue-400 bg-blue-500/10',
    Nutrition: 'text-emerald-400 bg-emerald-500/10',
    Activity: 'text-orange-400 bg-orange-500/10',
    Recovery: 'text-purple-400 bg-purple-500/10',
    Workout: 'text-pink-400 bg-pink-500/10',
    'Mindful Eating': 'text-yellow-400 bg-yellow-500/10',
    'Gut Health': 'text-lime-400 bg-lime-500/10',
    Sleep: 'text-indigo-400 bg-indigo-500/10',
};

const FALLBACK_TIPS = [
    { tip: "Drink a glass of warm water first thing in the morning to kickstart metabolism.", category: "Hydration" },
    { tip: "Eating protein within 30 minutes post-workout maximizes muscle protein synthesis.", category: "Nutrition" },
    { tip: "Sleep is your #1 recovery tool. Aim for 7–9 hours to optimize hormone balance.", category: "Recovery" },
    { tip: "Compound movements like squats & deadlifts burn more calories than isolated exercises.", category: "Workout" },
];

export default function DailyTip() {
    const { user } = useAuth();
    const [aiTip, setAiTip] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fallbackIdx, setFallbackIdx] = useState(() => new Date().getDate() % FALLBACK_TIPS.length);

    const { data: profiles = [] } = useQuery({
        queryKey: ['userProfile', user?.email],
        queryFn: () => entities.UserProfile.filter({ user_email: user?.email }),
        enabled: !!user?.email,
    });
    const profile = profiles[0];

    const fetchAiTip = async () => {
        setLoading(true);
        setAiTip(null);
        const goal = profile?.fitness_goal || 'general_fitness';
        const res = await invokeLLM({
            prompt: `Give one practical, actionable fitness tip for someone with goal: ${goal.replace('_', ' ')}. Keep it under 2 sentences. Also provide a category (one of: Hydration, Nutrition, Recovery, Workout, Activity, Sleep, Mindful Eating, Gut Health).`,
            response_json_schema: {
                type: 'object',
                properties: {
                    tip: { type: 'string' },
                    category: { type: 'string' },
                }
            }
        });
        setAiTip(res);
        setLoading(false);
    };

    const handleNext = () => {
        if (aiTip) {
            setAiTip(null);
        } else {
            setFallbackIdx(i => (i + 1) % FALLBACK_TIPS.length);
            fetchAiTip();
        }
    };

    const displayTip = aiTip || FALLBACK_TIPS[fallbackIdx];
    const tipKey = aiTip ? 'ai' : fallbackIdx;

    return (
        <motion.div className="glass rounded-2xl p-4 border border-yellow-500/20 bg-yellow-500/5"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Lightbulb className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-semibold text-yellow-400">Daily Tip</span>
                            {displayTip.category && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${CAT_COLORS[displayTip.category] || 'bg-white/10 text-muted-foreground'}`}>
                                    {displayTip.category}
                                </span>
                            )}
                            {aiTip && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">✨ AI</span>}
                        </div>
                        <AnimatePresence mode="wait">
                            {loading ? (
                                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating personalized tip...
                                </motion.div>
                            ) : (
                                <motion.p key={tipKey} className="text-sm text-muted-foreground leading-relaxed"
                                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}>
                                    {displayTip.tip}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
                <button onClick={handleNext} disabled={loading}
                    className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-all flex-shrink-0 disabled:opacity-50">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>
        </motion.div>
    );
}


