import React, { useMemo } from 'react';
import { entities } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingDown, TrendingUp, Minus, User, Flame, Zap, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

function RiskBadge({ score }) {
    if (score >= 75) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-bold border border-red-500/20">Critical</span>;
    if (score >= 50) return <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 font-bold border border-orange-500/20">High Risk</span>;
    if (score >= 25) return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 font-bold border border-yellow-500/20">Medium</span>;
    return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">Healthy</span>;
}

function RiskBar({ score }) {
    const color = score >= 75 ? 'bg-red-500' : score >= 50 ? 'bg-orange-500' : score >= 25 ? 'bg-yellow-500' : 'bg-emerald-500';
    return (
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden w-full">
            <motion.div className={`h-full ${color} rounded-full`} initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.8 }} />
        </div>
    );
}

export default function AdminRisk() {
    const { data: allProfiles = [] } = useQuery({ queryKey: ['admin-profiles'], queryFn: () => entities.UserProfile.list() });
    const { data: allUsers = [] } = useQuery({ queryKey: ['admin-users'], queryFn: () => entities.UserProfile.list() });
    const { data: allMeals = [] } = useQuery({ queryKey: ['admin-all-meals'], queryFn: () => entities.MealLog.list('date', false) });
    const { data: allWorkouts = [] } = useQuery({ queryKey: ['admin-all-workouts'], queryFn: () => entities.WorkoutLog.list('date', false) });
    const { data: allWater = [] } = useQuery({ queryKey: ['admin-all-water'], queryFn: () => entities.WaterLog.list('date', false) });
    const { data: allSleep = [] } = useQuery({ queryKey: ['admin-all-sleep'], queryFn: () => entities.SleepLog.list('date', false) });
    const { data: allSteps = [] } = useQuery({ queryKey: ['admin-all-steps'], queryFn: () => entities.StepLog.list('date', false) });

    const enriched = useMemo(() => {
        return allProfiles.map(p => {
            const user = allUsers.find(u => u.user_email === p.user_email);
            const streakFactor = Math.max(0, 100 - (p.login_streak || 0) * 15);
            const xpFactor = Math.max(0, 60 - Math.min((p.total_xp || 0) / 50, 60));
            const riskScore = Math.min(100, Math.round((streakFactor * 0.6 + xpFactor * 0.4)));
            const reasons = [];
            if ((p.login_streak || 0) === 0) reasons.push('No recent login');
            if ((p.total_xp || 0) < 100) reasons.push('Low engagement score');
            if (!(p.onboarding_complete)) reasons.push('Onboarding incomplete');
            return { ...p, user, riskScore, reasons };
        }).sort((a, b) => b.riskScore - a.riskScore);
    }, [allProfiles, allUsers]);

    const critical = enriched.filter(u => u.riskScore >= 75);
    const highRisk = enriched.filter(u => u.riskScore >= 50 && u.riskScore < 75);
    const healthy = enriched.filter(u => u.riskScore < 25);

    // Real engagement radar from DB
    const summaryData = useMemo(() => {
        const total = allProfiles.length || 1;
        const last7 = format(subDays(new Date(), 7), 'yyyy-MM-dd');
        const loginRate = Math.round((allProfiles.filter(p => p.last_login_date >= last7).length / total) * 100);
        const mealLoggers = Math.round((new Set(allMeals.filter(m => m.date >= last7).map(m => m.user_email)).size / total) * 100);
        const workoutFreq = Math.round((new Set(allWorkouts.filter(w => w.date >= last7).map(w => w.user_email)).size / total) * 100);
        const sleepLogs = Math.round((new Set(allSleep.filter(s => s.date >= last7).map(s => s.user_email)).size / total) * 100);
        const waterTrack = Math.round((new Set(allWater.filter(w => w.date >= last7).map(w => w.user_email)).size / total) * 100);
        const streakKeep = Math.round((allProfiles.filter(p => (p.login_streak || 0) > 3).length / total) * 100);
        return [
            { subject: 'Login Rate', A: loginRate },
            { subject: 'Meal Logs', A: mealLoggers },
            { subject: 'Workout Freq', A: workoutFreq },
            { subject: 'Sleep Logs', A: sleepLogs },
            { subject: 'Water Track', A: waterTrack },
            { subject: 'Streak Keep', A: streakKeep },
        ];
    }, [allProfiles, allMeals, allWorkouts, allSleep, allWater]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-space font-bold flex items-center gap-2">
                    <AlertTriangle className="w-7 h-7 text-red-400" /> Client Risk Monitor
                </h1>
                <p className="text-sm text-muted-foreground mt-1">AI-powered retention prediction & intervention system</p>
            </div>

            {/* Risk Summary */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Critical Risk', count: critical.length, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: AlertTriangle },
                    { label: 'High Risk', count: highRisk.length, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: TrendingDown },
                    { label: 'Healthy', count: healthy.length, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: TrendingUp },
                    { label: 'Total Monitored', count: enriched.length, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: User },
                ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                        <div className={`glass rounded-2xl p-4 border ${s.border}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                                    <s.icon className={`w-5 h-5 ${s.color}`} />
                                </div>
                                <div>
                                    <div className={`text-2xl font-bold font-space ${s.color}`}>{s.count}</div>
                                    <div className="text-xs text-muted-foreground">{s.label}</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Risk Table */}
                <div className="lg:col-span-2 glass rounded-2xl p-5 border border-white/5">
                    <h3 className="font-semibold mb-4">All Clients — Risk Score</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                        {enriched.map((u, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                                className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/3 transition-all group">
                                <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                    {(u.user_email || 'U')[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium truncate">{u.user?.full_name || u.user_email}</span>
                                        <RiskBadge score={u.riskScore} />
                                    </div>
                                    <RiskBar score={u.riskScore} />
                                    {u.reasons.length > 0 && (
                                        <div className="flex gap-1 mt-1 flex-wrap">
                                            {u.reasons.slice(0, 2).map((r, ri) => (
                                                <span key={ri} className="text-[10px] text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded">{r}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <div className={`text-lg font-bold ${u.riskScore >= 75 ? 'text-red-400' : u.riskScore >= 50 ? 'text-orange-400' : u.riskScore >= 25 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                                        {u.riskScore}%
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Radar */}
                <div className="glass rounded-2xl p-5 border border-white/5">
                    <h3 className="font-semibold mb-4">Engagement Radar</h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <RadarChart data={summaryData}>
                            <PolarGrid stroke="rgba(255,255,255,0.1)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                            <Radar dataKey="A" stroke="hsl(142 71% 45%)" fill="hsl(142 71% 45%)" fillOpacity={0.15} strokeWidth={2} />
                        </RadarChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-3">
                        {summaryData.map(d => (
                            <div key={d.subject} className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">{d.subject}</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${d.A}%` }} />
                                    </div>
                                    <span className="w-8 text-right font-medium">{d.A}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Critical Alert Cards */}
            {critical.length > 0 && (
                <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-red-400"><AlertTriangle className="w-4 h-4" /> Intervention Required</h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {critical.slice(0, 6).map((u, i) => (
                            <div key={i} className="glass rounded-2xl p-4 border border-red-500/20 bg-red-500/3">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center font-bold text-xs">
                                            {(u.user_email || 'U')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium">{u.user?.full_name || u.user_email}</div>
                                            <div className="text-[10px] text-muted-foreground">Streak: {u.login_streak || 0} days</div>
                                        </div>
                                    </div>
                                    <div className="text-xl font-bold text-red-400">{u.riskScore}%</div>
                                </div>
                                <div className="space-y-1 mb-3">
                                    {u.reasons.map((r, ri) => (
                                        <div key={ri} className="text-xs text-muted-foreground flex items-center gap-1.5">
                                            <div className="w-1 h-1 bg-red-400 rounded-full" />{r}
                                        </div>
                                    ))}
                                </div>
                                <Link to={`/admin/user/${u.user?.id || i}`}>
                                    <Button size="sm" variant="outline" className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs">
                                        <MessageSquare className="w-3 h-3 mr-1" /> Intervene Now
                                    </Button>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}


