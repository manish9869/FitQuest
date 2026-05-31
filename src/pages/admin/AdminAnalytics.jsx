import React, { useState, useMemo } from 'react';
import { entities } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { format, subDays, parseISO, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import {
    Brain, Loader2, TrendingUp, TrendingDown, AlertTriangle, Target,
    Droplets, Dumbbell, Utensils, Zap, RefreshCw, Star, Flame,
    Users, Activity, Moon, Scale, CalendarRange, ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { invokeLLM } from '@/api/llm';
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

// ── Tooltip ───────────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="glass rounded-lg p-2.5 text-xs border border-white/10 shadow-xl">
            <p className="font-semibold mb-1 text-muted-foreground">{label}</p>
            {payload.map(p => (
                <p key={p.name} style={{ color: p.color }}>
                    {p.name}: <span className="font-bold">{p.value?.toLocaleString()}</span>
                </p>
            ))}
        </div>
    );
};

const StatCard = ({ label, value, sub, color = 'text-white', icon: Icon, trend, trendLabel }) => (
    <div className="glass rounded-2xl p-4 border border-white/5">
        <div className="flex items-start justify-between mb-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color === 'text-emerald-400' ? 'bg-emerald-500/10' : color === 'text-blue-400' ? 'bg-blue-500/10' : color === 'text-orange-400' ? 'bg-orange-500/10' : color === 'text-purple-400' ? 'bg-purple-500/10' : color === 'text-cyan-400' ? 'bg-cyan-500/10' : color === 'text-yellow-400' ? 'bg-yellow-500/10' : color === 'text-red-400' ? 'bg-red-500/10' : 'bg-white/5'}`}>
                {Icon && <Icon className={`w-4 h-4 ${color}`} />}
            </div>
            {trend !== undefined && (
                <div className={`flex items-center gap-0.5 text-[10px] font-semibold ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(trend)}%
                </div>
            )}
        </div>
        <div className={`text-2xl font-bold font-space ${color}`}>{value}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
        {sub && <div className="text-[10px] text-muted-foreground/50 mt-0.5">{sub}</div>}
        {trendLabel && <div className="text-[10px] text-muted-foreground/60 mt-1">{trendLabel}</div>}
    </div>
);

const PRIORITY_CONFIG = {
    critical: { label: 'Critical', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
    high: { label: 'High Priority', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
    medium: { label: 'Medium', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
    positive: { label: 'Positive', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
};

const RANGE_PRESETS = [
    { label: '7d', days: 7 },
    { label: '14d', days: 14 },
    { label: '30d', days: 30 },
    { label: '90d', days: 90 },
];

export default function AdminAIInsights() {
    const [aiSummary, setAiSummary] = useState(null);
    const [liveInsights, setLiveInsights] = useState([]);
    const [insightsLoading, setInsightsLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [rangeStart, setRangeStart] = useState(format(subDays(new Date(), 13), 'yyyy-MM-dd'));
    const [rangeEnd, setRangeEnd] = useState(format(new Date(), 'yyyy-MM-dd'));

    const setPreset = (days) => {
        setRangeStart(format(subDays(new Date(), days - 1), 'yyyy-MM-dd'));
        setRangeEnd(format(new Date(), 'yyyy-MM-dd'));
    };

    // ── Queries ───────────────────────────────────────────────────────────────
    const { data: allProfiles = [] } = useQuery({ queryKey: ['ai-profiles'], queryFn: () => entities.UserProfile.list() });
    const { data: allMeals = [] } = useQuery({ queryKey: ['ai-meals'], queryFn: () => entities.MealLog.list() });
    const { data: allWorkouts = [] } = useQuery({ queryKey: ['ai-workouts'], queryFn: () => entities.WorkoutLog.list() });
    const { data: allWater = [] } = useQuery({ queryKey: ['ai-water'], queryFn: () => entities.WaterLog.list() });
    const { data: allSteps = [] } = useQuery({ queryKey: ['ai-steps'], queryFn: () => entities.StepLog.list() });
    const { data: allSleep = [] } = useQuery({ queryKey: ['ai-sleep'], queryFn: () => entities.SleepLog.list() });
    const { data: allWeight = [] } = useQuery({ queryKey: ['ai-weight'], queryFn: () => entities.WeightLog.list() });
    const { data: allMissions = [] } = useQuery({ queryKey: ['ai-missions'], queryFn: () => entities.Mission.list() });
    const { data: allChallenges = [] } = useQuery({ queryKey: ['ai-challenges'], queryFn: () => entities.Challenge.list() });

    // ── Date range ────────────────────────────────────────────────────────────
    const rangeDates = useMemo(() => {
        const s = parseISO(rangeStart), e = parseISO(rangeEnd);
        if (e < s) return [rangeStart];
        return eachDayOfInterval({ start: s, end: e }).map(d => format(d, 'yyyy-MM-dd'));
    }, [rangeStart, rangeEnd]);

    const inRange = (date) => date >= rangeStart && date <= rangeEnd;

    // ── Platform KPIs ─────────────────────────────────────────────────────────
    const kpis = useMemo(() => {
        const total = allProfiles.length;
        const active = allProfiles.filter(p => (p.login_streak || 0) > 0).length;
        const atRisk = allProfiles.filter(p => (p.login_streak || 0) === 0).length;
        const avgXP = total ? Math.round(allProfiles.reduce((s, p) => s + (p.total_xp || 0), 0) / total) : 0;
        const avgStreak = total ? +(allProfiles.reduce((s, p) => s + (p.login_streak || 0), 0) / total).toFixed(1) : 0;
        const streakHeroes = allProfiles.filter(p => (p.login_streak || 0) >= 7).length;

        const rangeMeals = allMeals.filter(m => inRange(m.date));
        const rangeWorkouts = allWorkouts.filter(w => inRange(w.date));
        const rangeWater = allWater.filter(w => inRange(w.date));
        const rangeSteps = allSteps.filter(s => inRange(s.date));
        const rangeSleep = allSleep.filter(s => inRange(s.date));

        const days = rangeDates.length || 1;
        const avgDailyWorkouts = +(rangeWorkouts.length / days).toFixed(1);
        const avgDailyCalories = rangeMeals.length
            ? Math.round(rangeMeals.reduce((s, m) => s + (m.calories || 0), 0) / days)
            : 0;
        const avgDailyWater = rangeWater.length
            ? Math.round(rangeWater.reduce((s, w) => s + (w.amount_ml || 0), 0) / days)
            : 0;
        const avgDailySteps = rangeSteps.length
            ? Math.round(rangeSteps.reduce((s, st) => s + (st.steps || 0), 0) / days)
            : 0;
        const avgSleepHours = rangeSleep.length
            ? +(rangeSleep.reduce((s, sl) => s + (sl.hours || 0), 0) / rangeSleep.length).toFixed(1)
            : 0;

        const uniqueActiveUsers = new Set([
            ...rangeMeals.map(m => m.user_email),
            ...rangeWorkouts.map(w => w.user_email),
            ...rangeSteps.map(s => s.user_email),
        ]).size;

        return {
            total, active, atRisk, avgXP, avgStreak, streakHeroes,
            avgDailyWorkouts, avgDailyCalories, avgDailyWater, avgDailySteps,
            avgSleepHours, uniqueActiveUsers,
            totalWorkouts: rangeWorkouts.length,
            totalMealsLogged: rangeMeals.length,
        };
    }, [allProfiles, allMeals, allWorkouts, allWater, allSteps, allSleep, rangeDates]);

    // ── Daily activity chart ──────────────────────────────────────────────────
    const dailyActivityData = useMemo(() => rangeDates.map(date => ({
        date: format(parseISO(date), rangeDates.length <= 31 ? 'MMM d' : 'MMM d'),
        workouts: allWorkouts.filter(w => w.date === date).length,
        meals: allMeals.filter(m => m.date === date).length,
        water: Math.round(allWater.filter(w => w.date === date).reduce((s, w) => s + (w.amount_ml || 0), 0) / 1000 * 10) / 10,
        steps: Math.round(allSteps.filter(s => s.date === date).reduce((s, st) => s + (st.steps || 0), 0) / 1000 * 10) / 10,
    })), [rangeDates, allWorkouts, allMeals, allWater, allSteps]);

    // ── Sleep quality chart ───────────────────────────────────────────────────
    const sleepData = useMemo(() => rangeDates.map(date => ({
        date: format(parseISO(date), 'MMM d'),
        hours: +(allSleep.filter(s => s.date === date).reduce((s, sl) => s + (sl.hours || 0), 0)).toFixed(1),
    })), [rangeDates, allSleep]);

    // ── User engagement over time ─────────────────────────────────────────────
    const engagementData = useMemo(() => rangeDates.map(date => {
        const activeUsers = new Set([
            ...allMeals.filter(m => m.date === date).map(m => m.user_email),
            ...allWorkouts.filter(w => w.date === date).map(w => w.user_email),
            ...allSteps.filter(s => s.date === date).map(s => s.user_email),
            ...allWater.filter(w => w.date === date).map(w => w.user_email),
        ]).size;
        return {
            date: format(parseISO(date), 'MMM d'),
            activeUsers,
        };
    }), [rangeDates, allMeals, allWorkouts, allSteps, allWater]);

    // ── Workout type breakdown ────────────────────────────────────────────────
    const workoutTypeData = useMemo(() => {
        const rangeWorkouts = allWorkouts.filter(w => inRange(w.date));
        const counts = {};
        rangeWorkouts.forEach(w => { counts[w.workout_type] = (counts[w.workout_type] || 0) + 1; });
        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [allWorkouts, rangeStart, rangeEnd]);

    // ── Meal type breakdown ───────────────────────────────────────────────────
    const mealTypeData = useMemo(() => {
        const rangeMeals = allMeals.filter(m => inRange(m.date));
        const counts = {};
        rangeMeals.forEach(m => { counts[m.meal_type] = (counts[m.meal_type] || 0) + 1; });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [allMeals, rangeStart, rangeEnd]);

    // ── User streaks distribution ─────────────────────────────────────────────
    const streakDistData = useMemo(() => {
        const buckets = { '0': 0, '1-3': 0, '4-7': 0, '8-14': 0, '15-30': 0, '30+': 0 };
        allProfiles.forEach(p => {
            const s = p.login_streak || 0;
            if (s === 0) buckets['0']++;
            else if (s <= 3) buckets['1-3']++;
            else if (s <= 7) buckets['4-7']++;
            else if (s <= 14) buckets['8-14']++;
            else if (s <= 30) buckets['15-30']++;
            else buckets['30+']++;
        });
        return Object.entries(buckets).map(([name, value]) => ({ name, value }));
    }, [allProfiles]);

    // ── Plan distribution ─────────────────────────────────────────────────────
    const planData = useMemo(() => {
        const counts = { free: 0, basic: 0, premium: 0, elite: 0 };
        allProfiles.forEach(p => { counts[p.plan || 'free']++; });
        return Object.entries(counts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
    }, [allProfiles]);

    // ── Calorie trend ─────────────────────────────────────────────────────────
    const calorieTrendData = useMemo(() => rangeDates.map(date => {
        const dayMeals = allMeals.filter(m => m.date === date);
        return {
            date: format(parseISO(date), 'MMM d'),
            calories: dayMeals.reduce((s, m) => s + (m.calories || 0), 0),
            protein: dayMeals.reduce((s, m) => s + (m.protein || 0), 0),
        };
    }), [rangeDates, allMeals]);

    // ── Weight trend (avg across all users) ──────────────────────────────────
    const weightTrendData = useMemo(() => rangeDates.map(date => {
        const dayLogs = allWeight.filter(w => w.date === date);
        const avg = dayLogs.length ? +(dayLogs.reduce((s, w) => s + (w.weight_kg || 0), 0) / dayLogs.length).toFixed(1) : null;
        return { date: format(parseISO(date), 'MMM d'), avgWeight: avg };
    }).filter(d => d.avgWeight !== null), [rangeDates, allWeight]);

    // ── Top users by XP ───────────────────────────────────────────────────────
    const topUsers = useMemo(() =>
        [...allProfiles].sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0)).slice(0, 5),
        [allProfiles]);

    // ── At-risk users ─────────────────────────────────────────────────────────
    const atRiskUsers = useMemo(() =>
        allProfiles.filter(p => (p.login_streak || 0) === 0).slice(0, 5),
        [allProfiles]);

    const PIE_COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#f97316', '#3b82f6', '#ec4899'];

    const generateLiveInsights = async () => {
        setInsightsLoading(true);
        try {
            const res = await invokeLLM({
                prompt: `You are a fitness platform AI analyst. Generate 6 specific actionable insight cards for the coaching team based on these REAL platform stats:

Users: ${kpis.total} total, ${kpis.active} active, ${kpis.atRisk} at-risk
Engagement: ${kpis.uniqueActiveUsers} unique active users in date range
Avg daily workouts: ${kpis.avgDailyWorkouts}
Avg daily calories logged: ${kpis.avgDailyCalories} kcal
Avg daily water: ${kpis.avgDailyWater}ml
Avg daily steps: ${kpis.avgDailySteps.toLocaleString()}
Avg sleep: ${kpis.avgSleepHours}h
Avg XP: ${kpis.avgXP}
Users with 7+ day streak: ${kpis.streakHeroes}
Total workouts in period: ${kpis.totalWorkouts}
Total meals logged: ${kpis.totalMealsLogged}
Active challenges: ${allChallenges.filter(c => c.is_active).length}

Generate 6 specific, data-driven insights. Reference actual numbers.`,
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
        } catch { toast.error('Failed to generate insights'); }
        finally { setInsightsLoading(false); }
    };

    const generateDailySummary = async () => {
        setLoading(true);
        try {
            const res = await invokeLLM({
                prompt: `You are an AI fitness platform analytics engine. Generate a comprehensive admin summary based on REAL data:

Platform Stats (${rangeStart} to ${rangeEnd}):
- Total users: ${kpis.total} (${kpis.active} active, ${kpis.atRisk} at-risk)
- Unique active users in period: ${kpis.uniqueActiveUsers}
- Avg daily workouts logged: ${kpis.avgDailyWorkouts}
- Avg daily calories: ${kpis.avgDailyCalories} kcal
- Avg daily water: ${kpis.avgDailyWater}ml (goal: 2000ml)
- Avg daily steps: ${kpis.avgDailySteps.toLocaleString()} (goal: 10,000)
- Avg sleep: ${kpis.avgSleepHours}h (ideal: 7-9h)
- Platform avg XP: ${kpis.avgXP}
- Avg login streak: ${kpis.avgStreak} days
- Users with 7+ day streak: ${kpis.streakHeroes}/${kpis.total}
- Total workouts: ${kpis.totalWorkouts}
- Total meals logged: ${kpis.totalMealsLogged}
- Active challenges: ${allChallenges.filter(c => c.is_active).length}

Provide specific, data-driven analysis and actionable recommendations.`,
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
            toast.success('AI summary generated!');
        } catch { toast.error('Failed to generate summary'); }
        finally { setLoading(false); }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-space font-bold flex items-center gap-2">
                        <Brain className="w-7 h-7 text-purple-400" /> AI Platform Insights
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Real data analytics & AI coaching recommendations</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button onClick={generateLiveInsights} disabled={insightsLoading} variant="outline" className="border-white/10">
                        {insightsLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Zap className="w-4 h-4 mr-2" />Generate Insights</>}
                    </Button>
                    <Button onClick={generateDailySummary} disabled={loading}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-semibold">
                        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</> : <><Brain className="w-4 h-4 mr-2" />AI Summary</>}
                    </Button>
                </div>
            </div>

            {/* Date range filter */}
            <div className="glass rounded-2xl px-4 py-3 border border-white/5 flex flex-wrap items-center gap-3">
                <CalendarRange className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Date Range</span>
                <div className="flex gap-1">
                    {RANGE_PRESETS.map(p => (
                        <button key={p.label} onClick={() => setPreset(p.days)}
                            className="text-xs px-2.5 py-1 rounded-lg font-medium text-muted-foreground hover:bg-white/5 hover:text-white transition-all border border-white/5">
                            {p.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
                    <input type="date" value={rangeStart} onChange={e => setRangeStart(e.target.value)}
                        className="bg-transparent text-xs text-white border-none outline-none w-[115px] [color-scheme:dark]" />
                    <span className="text-muted-foreground text-xs">→</span>
                    <input type="date" value={rangeEnd} onChange={e => setRangeEnd(e.target.value)}
                        className="bg-transparent text-xs text-white border-none outline-none w-[115px] [color-scheme:dark]" />
                </div>
                <span className="text-xs text-muted-foreground ml-auto">{rangeDates.length} days selected</span>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <StatCard label="Total Users" value={kpis.total} icon={Users} color="text-purple-400" />
                <StatCard label="Active Users" value={kpis.active} sub="streak > 0" icon={Flame} color="text-orange-400" />
                <StatCard label="At Risk" value={kpis.atRisk} sub="no streak" icon={AlertTriangle} color="text-red-400" />
                <StatCard label="Avg Daily Steps" value={kpis.avgDailySteps.toLocaleString()} sub="platform avg" icon={Activity} color="text-emerald-400" />
                <StatCard label="Avg Sleep" value={kpis.avgSleepHours ? `${kpis.avgSleepHours}h` : '—'} sub="platform avg" icon={Moon} color="text-blue-400" />
                <StatCard label="Avg XP" value={kpis.avgXP.toLocaleString()} sub="per user" icon={Star} color="text-yellow-400" />
                <StatCard label="Daily Workouts" value={kpis.avgDailyWorkouts} sub="avg per day" icon={Dumbbell} color="text-purple-400" />
                <StatCard label="Avg Calories" value={kpis.avgDailyCalories ? `${kpis.avgDailyCalories}` : '—'} sub="daily avg" icon={Utensils} color="text-orange-400" />
                <StatCard label="Avg Water" value={kpis.avgDailyWater ? `${kpis.avgDailyWater}ml` : '—'} sub="daily avg" icon={Droplets} color="text-cyan-400" />
                <StatCard label="Streak Heroes" value={kpis.streakHeroes} sub="7+ day streak" icon={Flame} color="text-yellow-400" />
                <StatCard label="Unique Active" value={kpis.uniqueActiveUsers} sub="in date range" icon={Users} color="text-emerald-400" />
                <StatCard label="Total Workouts" value={kpis.totalWorkouts} sub="in date range" icon={Dumbbell} color="text-blue-400" />
            </div>

            {/* Row 1: User Engagement + Daily Workouts */}
            <div className="grid lg:grid-cols-2 gap-5">
                <div className="glass rounded-2xl p-5 border border-white/5">
                    <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-400" /> Daily Active Users
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={engagementData}>
                            <defs>
                                <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.25)" fontSize={10} />
                            <YAxis stroke="rgba(255,255,255,0.25)" fontSize={10} />
                            <Tooltip content={<ChartTooltip />} />
                            <Area type="monotone" dataKey="activeUsers" name="Active Users" stroke="#8b5cf6" fill="url(#engGrad)" strokeWidth={2} dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="glass rounded-2xl p-5 border border-white/5">
                    <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                        <Dumbbell className="w-4 h-4 text-blue-400" /> Daily Workouts Logged
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={dailyActivityData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.25)" fontSize={10} />
                            <YAxis stroke="rgba(255,255,255,0.25)" fontSize={10} />
                            <Tooltip content={<ChartTooltip />} />
                            <Bar dataKey="workouts" name="Workouts" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Row 2: Calories + Steps */}
            <div className="grid lg:grid-cols-2 gap-5">
                <div className="glass rounded-2xl p-5 border border-white/5">
                    <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-orange-400" /> Platform Calories & Protein
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={calorieTrendData}>
                            <defs>
                                <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.25} />
                                    <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="proGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.25)" fontSize={10} />
                            <YAxis stroke="rgba(255,255,255,0.25)" fontSize={10} />
                            <Tooltip content={<ChartTooltip />} />
                            <Area type="monotone" dataKey="calories" name="Calories" stroke="#f97316" fill="url(#calGrad)" strokeWidth={2} dot={false} />
                            <Area type="monotone" dataKey="protein" name="Protein (g)" stroke="#3b82f6" fill="url(#proGrad)" strokeWidth={2} dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="glass rounded-2xl p-5 border border-white/5">
                    <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-400" /> Daily Steps (000s)
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={dailyActivityData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.25)" fontSize={10} />
                            <YAxis stroke="rgba(255,255,255,0.25)" fontSize={10} />
                            <Tooltip content={<ChartTooltip />} />
                            <Bar dataKey="steps" name="Steps (k)" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Row 3: Sleep + Water */}
            <div className="grid lg:grid-cols-2 gap-5">
                <div className="glass rounded-2xl p-5 border border-white/5">
                    <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                        <Moon className="w-4 h-4 text-blue-400" /> Sleep Duration Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={sleepData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.25)" fontSize={10} />
                            <YAxis stroke="rgba(255,255,255,0.25)" fontSize={10} domain={[0, 10]} />
                            <Tooltip content={<ChartTooltip />} />
                            <Bar dataKey="hours" name="Sleep (h)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="glass rounded-2xl p-5 border border-white/5">
                    <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-cyan-400" /> Daily Water (L)
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={dailyActivityData}>
                            <defs>
                                <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.25)" fontSize={10} />
                            <YAxis stroke="rgba(255,255,255,0.25)" fontSize={10} />
                            <Tooltip content={<ChartTooltip />} />
                            <Area type="monotone" dataKey="water" name="Water (L)" stroke="#06b6d4" fill="url(#waterGrad)" strokeWidth={2} dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Row 4: Workout types + Meal types + Streak dist + Plan dist */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="glass rounded-2xl p-5 border border-white/5">
                    <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                        <Dumbbell className="w-4 h-4 text-purple-400" /> Workout Types
                    </h3>
                    {workoutTypeData.length === 0
                        ? <p className="text-xs text-muted-foreground italic">No data</p>
                        : <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie data={workoutTypeData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                                    {workoutTypeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip content={<ChartTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    }
                    <div className="space-y-1 mt-2">
                        {workoutTypeData.slice(0, 4).map((w, i) => (
                            <div key={w.name} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                    <span className="text-muted-foreground capitalize">{w.name}</span>
                                </div>
                                <span className="font-semibold">{w.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass rounded-2xl p-5 border border-white/5">
                    <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-orange-400" /> Meal Types
                    </h3>
                    {mealTypeData.length === 0
                        ? <p className="text-xs text-muted-foreground italic">No data</p>
                        : <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie data={mealTypeData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                                    {mealTypeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip content={<ChartTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    }
                    <div className="space-y-1 mt-2">
                        {mealTypeData.map((m, i) => (
                            <div key={m.name} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                    <span className="text-muted-foreground capitalize">{m.name}</span>
                                </div>
                                <span className="font-semibold">{m.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass rounded-2xl p-5 border border-white/5">
                    <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-400" /> Streak Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={streakDistData} layout="vertical">
                            <XAxis type="number" stroke="rgba(255,255,255,0.25)" fontSize={10} />
                            <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.25)" fontSize={10} width={35} />
                            <Tooltip content={<ChartTooltip />} />
                            <Bar dataKey="value" name="Users" fill="#f97316" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="glass rounded-2xl p-5 border border-white/5">
                    <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-400" /> Plan Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie data={planData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                                {planData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                            </Pie>
                            <Tooltip content={<ChartTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1 mt-2">
                        {planData.map((p, i) => (
                            <div key={p.name} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                    <span className="text-muted-foreground">{p.name}</span>
                                </div>
                                <span className="font-semibold">{p.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Row 5: Weight trend (if data exists) */}
            {weightTrendData.length > 1 && (
                <div className="glass rounded-2xl p-5 border border-white/5">
                    <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                        <Scale className="w-4 h-4 text-emerald-400" /> Avg Platform Weight Trend
                        <span className="text-xs text-muted-foreground font-normal">(across all users)</span>
                    </h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={weightTrendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.25)" fontSize={10} />
                            <YAxis stroke="rgba(255,255,255,0.25)" fontSize={10} domain={['auto', 'auto']} />
                            <Tooltip content={<ChartTooltip />} />
                            <Line type="monotone" dataKey="avgWeight" name="Avg Weight (kg)" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Row 6: Top users + At-risk users */}
            <div className="grid lg:grid-cols-2 gap-5">
                <div className="glass rounded-2xl p-5 border border-white/5">
                    <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-400" /> Top Users by XP
                    </h3>
                    <div className="space-y-2">
                        {topUsers.map((u, i) => (
                            <div key={u.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/3 transition-colors">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' : i === 1 ? 'bg-gray-400/20 text-gray-300' : i === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-muted-foreground'}`}>
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{u.user_email?.split('@')[0]}</div>
                                    <div className="text-xs text-muted-foreground">{u.user_email}</div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <div className="text-sm font-bold text-yellow-400">{(u.total_xp || 0).toLocaleString()} XP</div>
                                    <div className="text-xs text-muted-foreground">🔥 {u.login_streak || 0}d streak</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass rounded-2xl p-5 border border-white/5">
                    <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" /> At-Risk Users
                        <span className="text-xs text-muted-foreground font-normal">(no active streak)</span>
                    </h3>
                    {atRiskUsers.length === 0
                        ? <p className="text-sm text-emerald-400 italic">🎉 All users have active streaks!</p>
                        : <div className="space-y-2">
                            {atRiskUsers.map(u => (
                                <div key={u.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-500/3 border border-red-500/10">
                                    <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center text-sm font-bold text-red-400 flex-shrink-0">
                                        {u.user_email?.[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">{u.user_email?.split('@')[0]}</div>
                                        <div className="text-xs text-muted-foreground">{u.user_email}</div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className="text-xs text-red-400 font-semibold">No streak</div>
                                        <div className="text-xs text-muted-foreground">{(u.total_xp || 0)} XP</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    }
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
                            <div className="font-bold">AI Analysis Summary</div>
                            <div className="text-xs text-muted-foreground">{rangeStart} → {rangeEnd}</div>
                        </div>
                        <Button variant="ghost" size="icon" className="ml-auto" onClick={generateDailySummary}>
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-5 leading-relaxed bg-white/3 rounded-xl p-4 border border-white/5 italic">
                        "{aiSummary.summary}"
                    </p>
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

            {/* AI Insights Grid */}
            {liveInsights.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" /> AI Generated Insights
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {liveInsights.map((ins, i) => {
                            const iconMap = { retention: TrendingDown, nutrition: Utensils, workout: Dumbbell, hydration: Droplets, engagement: Flame, milestone: Star };
                            const colorMap = {
                                retention: 'text-red-400 bg-red-500/10 border-red-500/20',
                                nutrition: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
                                workout: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                                hydration: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
                                engagement: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
                                milestone: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                            };
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
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${PRIORITY_CONFIG[ins.priority]?.color || 'text-muted-foreground bg-white/5 border-white/10'}`}>
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
                </div>
            )}

            {/* Empty state for insights */}
            {liveInsights.length === 0 && !insightsLoading && (
                <div className="glass rounded-2xl p-10 border border-white/5 text-center text-muted-foreground">
                    <Brain className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Click "Generate Insights" for AI-powered recommendations based on the real data above.</p>
                </div>
            )}
        </div>
    );
}