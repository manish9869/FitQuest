import React, { useState } from 'react';
import { entities } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import {
    Brain, Loader2, TrendingUp, TrendingDown, AlertTriangle, Target,
    Droplets, Dumbbell, Utensils, Zap, RefreshCw, Star, CheckCircle, Flame
} from 'lucide-react';
import { toast } from 'sonner';
import { invokeLLM } from '@/api/llm';

const PRIORITY_CONFIG = {
    critical: { label: 'Critical', color: 'text-red-400 bg-red-500/10' },
    high: { label: 'High Priority', color: 'text-orange-400 bg-orange-500/10' },
    medium: { label: 'Medium', color: 'text-yellow-400 bg-yellow-500/10' },
    positive: { label: 'Positive', color: 'text-emerald-400 bg-emerald-500/10' },
};

export default function AdminAIInsights() {
    const [aiSummary, setAiSummary] = useState(null);
    const [liveInsights, setLiveInsights] = useState([]);
    const [insightsLoading, setInsightsLoading] = useState(false);
    const [loading, setLoading] = useState(false);

    const { data: allProfiles = [] } = useQuery({ queryKey: ['admin-profiles'], queryFn: () => entities.UserProfile.list() });
    const { data: allUsers = [] } = useQuery({ queryKey: ['admin-users'], queryFn: () => entities.UserProfile.list() });

    const generateLiveInsights = async () => {
        setInsightsLoading(true);
        const activeCount = allProfiles.filter(p => (p.login_streak || 0) > 0).length;
        const riskCount = allProfiles.filter(p => (p.login_streak || 0) === 0).length;
        const avgXP = allProfiles.length ? Math.round(allProfiles.reduce((s, p) => s + (p.total_xp || 0), 0) / allProfiles.length) : 0;
        const streakHeroes = allProfiles.filter(p => (p.login_streak || 0) >= 30).length;
        const res = await invokeLLM({
            prompt: `You are a fitness platform AI. Based on these stats generate 6 specific actionable insight cards for the coaching team:
- Total users: ${allUsers.length}
- Active users (streak>0): ${activeCount}
- At-risk users (no streak): ${riskCount}
- Avg XP: ${avgXP}
- Users with 30+ day streak: ${streakHeroes}
Each card must have: category, title, body (1-2 sentences, specific), action (button label), priority (critical/high/medium/positive), icon_type (one of: retention, nutrition, workout, hydration, engagement, milestone)`,
            response_json_schema: {
                type: 'object',
                properties: {
                    insights: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                category: { type: 'string' },
                                title: { type: 'string' },
                                body: { type: 'string' },
                                action: { type: 'string' },
                                priority: { type: 'string' },
                                icon_type: { type: 'string' },
                            }
                        }
                    }
                }
            }
        });
        setLiveInsights(res.insights || []);
        setInsightsLoading(false);
    };

    const generateDailySummary = async () => {
        setLoading(true);
        const activeCount = allProfiles.filter(p => (p.login_streak || 0) > 0).length;
        const riskCount = allProfiles.filter(p => (p.login_streak || 0) === 0).length;
        const avgStreak = allProfiles.length ? Math.round(allProfiles.reduce((s, p) => s + (p.login_streak || 0), 0) / allProfiles.length) : 0;
        const res = await invokeLLM({
            prompt: `You are an AI fitness platform analytics engine. Generate a comprehensive daily admin summary for a fitness coaching platform.

Platform stats:
- Total users: ${allUsers.length}
- Active users (streak > 0): ${activeCount}
- At-risk users (no recent login): ${riskCount}
- Average login streak: ${avgStreak} days

Generate actionable insights, specific recommendations, and a prioritized action plan for the coaching team. Include metrics comparisons and specific intervention strategies.`,
            response_json_schema: {
                type: 'object',
                properties: {
                    summary: { type: 'string' },
                    key_metrics: { type: 'array', items: { type: 'object', properties: { metric: { type: 'string' }, value: { type: 'string' }, trend: { type: 'string' }, status: { type: 'string' } } } },
                    top_priorities: { type: 'array', items: { type: 'string' } },
                    recommended_actions: { type: 'array', items: { type: 'object', properties: { action: { type: 'string' }, reason: { type: 'string' }, impact: { type: 'string' } } } },
                    coaching_tip: { type: 'string' },
                }
            }
        });
        setAiSummary(res);
        setLoading(false);
        toast.success('AI summary generated!');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-space font-bold flex items-center gap-2">
                        <Brain className="w-7 h-7 text-purple-400" /> AI Platform Insights
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Intelligent platform analytics & coaching recommendations</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button onClick={generateLiveInsights} disabled={insightsLoading} variant="outline" className="border-white/10">
                        {insightsLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Zap className="w-4 h-4 mr-2" /> Generate Insights</>}
                    </Button>
                    <Button onClick={generateDailySummary} disabled={loading}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-semibold shadow-lg shadow-purple-500/20">
                        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> : <><Brain className="w-4 h-4 mr-2" /> Generate AI Summary</>}
                    </Button>
                </div>
            </div>

            {/* AI Summary Result */}
            {aiSummary && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl p-6 border border-purple-500/30 bg-purple-500/5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <Brain className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <div className="font-bold">AI Daily Summary</div>
                            <div className="text-xs text-muted-foreground">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        </div>
                        <Button variant="ghost" size="icon" className="ml-auto" onClick={generateDailySummary}><RefreshCw className="w-4 h-4" /></Button>
                    </div>

                    <p className="text-sm text-muted-foreground mb-5 leading-relaxed bg-white/3 rounded-xl p-4 border border-white/5 italic">"{aiSummary.summary}"</p>

                    {aiSummary.key_metrics?.length > 0 && (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                            {aiSummary.key_metrics.map((m, i) => (
                                <div key={i} className="glass rounded-xl p-3 border border-white/5">
                                    <div className="text-xs text-muted-foreground mb-1">{m.metric}</div>
                                    <div className="font-bold text-sm">{m.value}</div>
                                    <div className={`text-[10px] mt-1 ${m.status === 'positive' ? 'text-emerald-400' : m.status === 'negative' ? 'text-red-400' : 'text-yellow-400'}`}>{m.trend}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {aiSummary.recommended_actions?.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold mb-3 text-purple-300">Recommended Actions</h4>
                            <div className="space-y-2">
                                {aiSummary.recommended_actions.map((a, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
                                        <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                                        <div>
                                            <div className="text-sm font-medium">{a.action}</div>
                                            <div className="text-xs text-muted-foreground">{a.reason}</div>
                                            {a.impact && <div className="text-xs text-emerald-400 mt-0.5">Impact: {a.impact}</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {aiSummary.coaching_tip && (
                        <div className="mt-4 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                            <span className="text-xs text-emerald-400 font-semibold">Coach Tip: </span>
                            <span className="text-xs text-muted-foreground">{aiSummary.coaching_tip}</span>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Live AI Insights Grid */}
            {liveInsights.length === 0 && !insightsLoading ? (
                <div className="glass rounded-2xl p-10 border border-white/5 text-center text-muted-foreground">
                    <Brain className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Click "Generate Insights" to get AI-powered platform insights based on real user data.</p>
                </div>
            ) : insightsLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="glass rounded-2xl p-5 border border-white/5 animate-pulse h-40" />
                    ))}
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {liveInsights.map((ins, i) => {
                        const iconMap = { retention: TrendingDown, nutrition: Utensils, workout: Dumbbell, hydration: Droplets, engagement: Flame, milestone: Star };
                        const colorMap = { retention: 'text-red-400 bg-red-500/10 border-red-500/20', nutrition: 'text-orange-400 bg-orange-500/10 border-orange-500/20', workout: 'text-blue-400 bg-blue-500/10 border-blue-500/20', hydration: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', engagement: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', milestone: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
                        const IconComp = iconMap[ins.icon_type] || Star;
                        const styles = colorMap[ins.icon_type] || 'text-purple-400 bg-purple-500/10 border-purple-500/20';
                        const [textColor, bgColor, borderColor] = styles.split(' ');
                        return (
                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                                <div className={`glass rounded-2xl p-5 border h-full ${bgColor} ${borderColor}`}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`w-9 h-9 rounded-xl ${bgColor} flex items-center justify-center`}>
                                            <IconComp className={`w-4 h-4 ${textColor}`} />
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${PRIORITY_CONFIG[ins.priority]?.color || 'text-muted-foreground bg-white/5'}`}>
                                            {PRIORITY_CONFIG[ins.priority]?.label || ins.priority}
                                        </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground mb-1">{ins.category}</div>
                                    <h4 className="font-semibold text-sm mb-2">{ins.title}</h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">{ins.body}</p>
                                    <button className={`text-xs font-semibold ${textColor} hover:underline`}>{ins.action} →</button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}


