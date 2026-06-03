import React, { useMemo, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { Zap, Flame, Dumbbell, Droplets, Footprints, Moon, Utensils, Star, Trophy, Calendar, TrendingUp, Filter } from 'lucide-react';
import { XP_VALUES } from '@/lib/xpEngine';
import { format, subDays, eachDayOfInterval, parseISO, isWithinInterval } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const ACTION_META = {
    login_streak: { icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Daily Login', xp: XP_VALUES.streak_day },
    log_meal: { icon: Utensils, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Meal Logged', xp: XP_VALUES.log_meal },
    log_water: { icon: Droplets, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Water Logged', xp: XP_VALUES.log_water },
    log_steps: { icon: Footprints, color: 'text-orange-300', bg: 'bg-orange-400/10', label: 'Steps Logged', xp: XP_VALUES.log_steps },
    log_workout: { icon: Dumbbell, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Workout Logged', xp: XP_VALUES.log_workout },
    log_sleep: { icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-500/10', label: 'Sleep Logged', xp: XP_VALUES.log_sleep },
    log_weight: { icon: TrendingUp, color: 'text-pink-400', bg: 'bg-pink-500/10', label: 'Weight Logged', xp: XP_VALUES.log_weight },
    mission_complete: { icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Mission Complete', xp: 50 },
    perfect_day: { icon: Trophy, color: 'text-yellow-300', bg: 'bg-yellow-400/10', label: 'Perfect Day Bonus', xp: XP_VALUES.perfect_day },
};

export default function XPHistory() {
    const { user } = useAuth();

    const { data: profiles = [] } = useQuery({
        queryKey: ['userProfile', user?.email],
        queryFn: () => entities.UserProfile.filter({ user_email: user?.email }),
        enabled: !!user?.email,
    });
    const profile = profiles[0];

    // Fetch recent logs to reconstruct XP history
    const { data: mealLogs = [] } = useQuery({ queryKey: ['xp-meals', user?.email], queryFn: () => entities.MealLog.filter({ user_email: user?.email }, 'created_at', 100), enabled: !!user?.email });
    const { data: waterLogs = [] } = useQuery({ queryKey: ['xp-water', user?.email], queryFn: () => entities.WaterLog.filter({ user_email: user?.email }, 'created_at', 100), enabled: !!user?.email });
    const { data: stepLogs = [] } = useQuery({ queryKey: ['xp-steps', user?.email], queryFn: () => entities.StepLog.filter({ user_email: user?.email }, 'created_at', 100), enabled: !!user?.email });
    const { data: workoutLogs = [] } = useQuery({ queryKey: ['xp-workouts', user?.email], queryFn: () => entities.WorkoutLog.filter({ user_email: user?.email }, 'created_at', 100), enabled: !!user?.email });
    const { data: sleepLogs = [] } = useQuery({ queryKey: ['xp-sleep', user?.email], queryFn: () => entities.SleepLog.filter({ user_email: user?.email }, 'created_at', 100), enabled: !!user?.email });
    const { data: weightLogs = [] } = useQuery({ queryKey: ['xp-weight', user?.email], queryFn: () => entities.WeightLog.filter({ user_email: user?.email }, 'created_at', 100), enabled: !!user?.email });
    const { data: achievements = [] } = useQuery({ queryKey: ['achievements'], queryFn: () => entities.Achievement.list() });

    // Build a synthetic timeline of XP events from activity logs
    const timeline = useMemo(() => {
        const events = [];

        // Group meals by date — one XP event per meal entry
        const mealsByDate = {};
        mealLogs.forEach(m => {
            if (!mealsByDate[m.date]) mealsByDate[m.date] = 0;
            mealsByDate[m.date]++;
        });
        Object.entries(mealsByDate).forEach(([date, count]) => {
            events.push({ date, type: 'log_meal', xp: Math.min(count, 5) * XP_VALUES.log_meal, detail: `${count} meal(s) logged`, ts: date });
        });

        // Water per date
        const waterByDate = {};
        waterLogs.forEach(w => {
            if (!waterByDate[w.date]) waterByDate[w.date] = 0;
            waterByDate[w.date]++;
        });
        Object.entries(waterByDate).forEach(([date, count]) => {
            events.push({ date, type: 'log_water', xp: Math.min(count, 4) * XP_VALUES.log_water, detail: `${count} water log(s)`, ts: date });
        });

        // Steps per date
        const stepsByDate = {};
        stepLogs.forEach(s => {
            if (!stepsByDate[s.date]) stepsByDate[s.date] = 0;
            stepsByDate[s.date]++;
        });
        Object.entries(stepsByDate).forEach(([date]) => {
            events.push({ date, type: 'log_steps', xp: XP_VALUES.log_steps, detail: 'Steps logged', ts: date });
        });

        // Workouts
        const workoutsByDate = {};
        workoutLogs.forEach(w => {
            if (!workoutsByDate[w.date]) workoutsByDate[w.date] = [];
            workoutsByDate[w.date].push(w.name);
        });
        Object.entries(workoutsByDate).forEach(([date, names]) => {
            events.push({ date, type: 'log_workout', xp: names.length * XP_VALUES.log_workout, detail: names.join(', '), ts: date });
        });

        // Sleep
        const sleepByDate = {};
        sleepLogs.forEach(s => {
            if (!sleepByDate[s.date]) sleepByDate[s.date] = true;
        });
        Object.keys(sleepByDate).forEach(date => {
            events.push({ date, type: 'log_sleep', xp: XP_VALUES.log_sleep, detail: 'Sleep logged', ts: date });
        });

        // Weight
        const weightByDate = {};
        weightLogs.forEach(w => {
            if (!weightByDate[w.date]) weightByDate[w.date] = true;
        });
        Object.keys(weightByDate).forEach(date => {
            events.push({ date, type: 'log_weight', xp: XP_VALUES.log_weight, detail: 'Weight logged', ts: date });
        });

        // Login streak (simulate from last_login / streak count)
        if (profile?.login_streak > 0) {
            const streakDays = Math.min(profile.login_streak, 30);
            for (let i = 0; i < streakDays; i++) {
                const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
                events.push({ date, type: 'login_streak', xp: XP_VALUES.streak_day, detail: `Day ${streakDays - i} login streak`, ts: date });
            }
        }

        // Earned achievements
        const earnedIds = profile?.achievements || [];
        earnedIds.forEach(achId => {
            const ach = achievements.find(a => a.achievement_id === achId);
            if (ach) {
                events.push({ date: profile.last_login_date || format(new Date(), 'yyyy-MM-dd'), type: 'mission_complete', xp: ach.xp_reward || 100, detail: `🏆 ${ach.name}`, ts: profile.last_login_date });
            }
        });

        return events.sort((a, b) => b.date.localeCompare(a.date));
    }, [mealLogs, waterLogs, stepLogs, workoutLogs, sleepLogs, weightLogs, profile, achievements]);

    // Group by date for display
    const byDate = useMemo(() => {
        const map = {};
        timeline.forEach(ev => {
            if (!map[ev.date]) map[ev.date] = [];
            map[ev.date].push(ev);
        });
        return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
    }, [timeline]);

    const [range, setRange] = useState(30);
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [useCustom, setUseCustom] = useState(false);

    const rangeStart = useMemo(() => {
        if (useCustom && customFrom) return customFrom;
        return format(subDays(new Date(), range - 1), 'yyyy-MM-dd');
    }, [range, useCustom, customFrom]);
    const rangeEnd = useMemo(() => {
        if (useCustom && customTo) return customTo;
        return format(new Date(), 'yyyy-MM-dd');
    }, [useCustom, customTo]);

    const filteredByDate = useMemo(() =>
        byDate.filter(([date]) => date >= rangeStart && date <= rangeEnd),
        [byDate, rangeStart, rangeEnd]);

    const chartData = useMemo(() => {
        const from = parseISO(rangeStart);
        const to = parseISO(rangeEnd);
        const days = eachDayOfInterval({ start: from, end: to });
        return days.map(d => {
            const dateStr = format(d, 'yyyy-MM-dd');
            const dayXP = timeline.filter(e => e.date === dateStr).reduce((s, e) => s + e.xp, 0);
            return { date: format(d, 'MMM d'), xp: dayXP };
        });
    }, [timeline, rangeStart, rangeEnd]);

    const totalXP = profile?.total_xp || 0;
    const earnedAch = (profile?.achievements || []).length;
    const streak = profile?.login_streak || 0;
    const periodXP = filteredByDate.flatMap(([, evts]) => evts).reduce((s, e) => s + e.xp, 0);

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div>
                <h1 className="text-2xl font-space font-bold flex items-center gap-2">
                    <Zap className="w-7 h-7 text-yellow-400" /> XP History
                </h1>
                <p className="text-sm text-muted-foreground mt-1">All your earned experience points</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total XP', value: totalXP.toLocaleString(), icon: Zap, color: 'text-yellow-400' },
                    { label: 'Period XP', value: `+${periodXP}`, icon: TrendingUp, color: 'text-emerald-400' },
                    { label: 'Achievements', value: earnedAch, icon: Trophy, color: 'text-orange-400' },
                    { label: 'Login Streak', value: `${streak}d`, icon: Flame, color: 'text-red-400' },
                ].map(s => (
                    <GlassCard key={s.label} animate={false} className="text-center py-4">
                        <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-2`} />
                        <div className="text-xl font-bold font-space">{s.value}</div>
                        <div className="text-xs text-muted-foreground">{s.label}</div>
                    </GlassCard>
                ))}
            </div>

            {/* Date filter */}
            <GlassCard animate={false} className="py-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                    {[7, 14, 30, 60, 90].map(r => (
                        <button key={r} onClick={() => { setRange(r); setUseCustom(false); }}
                            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${!useCustom && range === r ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : 'text-muted-foreground hover:bg-white/5 border border-transparent'}`}>
                            {r}d
                        </button>
                    ))}
                    <div className="flex items-center gap-1.5 border-l border-white/10 pl-2 ml-1">
                        <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                            className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-foreground focus:outline-none focus:border-yellow-500/50" />
                        <span className="text-xs text-muted-foreground">–</span>
                        <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                            className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-foreground focus:outline-none focus:border-yellow-500/50" />
                        {customFrom && customTo && (
                            <button onClick={() => setUseCustom(true)}
                                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all ${useCustom ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : 'bg-white/5 text-muted-foreground border border-white/10 hover:border-yellow-500/30'}`}>
                                Apply
                            </button>
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground ml-auto">{filteredByDate.length} days with activity</span>
                </div>
            </GlassCard>

            {/* XP over time chart */}
            <GlassCard animate={false}>
                <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-widest">XP Earned — {useCustom ? `${customFrom} – ${customTo}` : `Last ${range} Days`}</h3>
                <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
                        <YAxis hide />
                        <Tooltip contentStyle={{ background: 'hsl(220 18% 7%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#9ca3af' }} itemStyle={{ color: '#f59e0b' }} />
                        <Area type="monotone" dataKey="xp" stroke="#f59e0b" strokeWidth={2} fill="url(#xpGrad)" dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </GlassCard>

            {/* Timeline */}
            <div className="space-y-4">
                {filteredByDate.length === 0 ? (
                    <GlassCard animate={false} className="text-center py-12 text-muted-foreground">
                        <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p>No XP history in this period. Try a wider range.</p>
                    </GlassCard>
                ) : filteredByDate.map(([date, events], gi) => {
                    const dayXP = events.reduce((s, e) => s + e.xp, 0);
                    const isToday = date === format(new Date(), 'yyyy-MM-dd');
                    const label = isToday ? 'Today' : date === format(subDays(new Date(), 1), 'yyyy-MM-dd') ? 'Yesterday' : format(new Date(date + 'T12:00:00'), 'EEEE, MMM d');
                    return (
                        <motion.div key={date} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.04 }}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
                                </div>
                                <span className="text-xs font-bold text-yellow-400 flex items-center gap-1"><Zap className="w-3 h-3" />+{dayXP} XP</span>
                            </div>
                            <div className="space-y-2">
                                {events.map((ev, i) => {
                                    const meta = ACTION_META[ev.type] || ACTION_META.login_streak;
                                    const Icon = meta.icon;
                                    return (
                                        <div key={i} className={`flex items-center gap-3 glass rounded-xl p-3 border border-white/5`}>
                                            <div className={`w-9 h-9 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                                                <Icon className={`w-4 h-4 ${meta.color}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium">{meta.label}</div>
                                                <div className="text-xs text-muted-foreground truncate">{ev.detail}</div>
                                            </div>
                                            <div className="text-sm font-bold text-yellow-400 flex items-center gap-0.5">
                                                <Zap className="w-3 h-3" />+{ev.xp}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}