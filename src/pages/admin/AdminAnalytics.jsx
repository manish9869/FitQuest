import React, { useMemo, useState } from 'react';
import { entities } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area
} from 'recharts';
import GlassCard from '@/components/ui/GlassCard';
import { BarChart3, Users, TrendingUp, Activity, Target, Flame, Droplets, Dumbbell, Moon, Zap, Calendar } from 'lucide-react';
import { goalLabels, activityLabels } from '@/lib/fitnessUtils';
import { format, subDays } from 'date-fns';

const COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f97316', '#ef4444', '#06b6d4', '#f59e0b'];

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-card border border-border rounded-lg p-3 text-xs shadow-lg">
            {label && <p className="font-semibold mb-1 text-muted-foreground">{label}</p>}
            {payload.map(p => <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value?.toLocaleString()}</p>)}
        </div>
    );
};

const KPICard = ({ icon: Icon, label, value, sub, color = 'text-foreground', iconColor = 'text-emerald-400' }) => (
    <div className="glass rounded-xl p-4 border border-border">
        <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <div className={`text-2xl font-bold font-space ${color}`}>{value}</div>
        {sub && <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>}
    </div>
);

export default function AdminAnalytics() {
    const [range, setRange] = useState(30);
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [useCustom, setUseCustom] = useState(false);

    const { data: profiles = [] } = useQuery({ queryKey: ['admin-profiles'], queryFn: () => entities.UserProfile.list() });
    const { data: workoutLogs = [] } = useQuery({ queryKey: ['admin-all-workouts'], queryFn: () => entities.WorkoutLog.list('-date', 500) });
    const { data: mealLogs = [] } = useQuery({ queryKey: ['admin-all-meals'], queryFn: () => entities.MealLog.list('-date', 500) });
    const { data: waterLogs = [] } = useQuery({ queryKey: ['admin-all-water'], queryFn: () => entities.WaterLog.list('-date', 500) });
    const { data: stepLogs = [] } = useQuery({ queryKey: ['admin-all-steps'], queryFn: () => entities.StepLog.list('-date', 500) });

    const today = format(new Date(), 'yyyy-MM-dd');
    const cutoff7 = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    const cutoffN = useCustom && customFrom ? customFrom : format(subDays(new Date(), range), 'yyyy-MM-dd');
    const cutoffEnd = useCustom && customTo ? customTo : today;

    // --- KPIs ---
    const totalUsers = profiles.length;
    const activeUsers7d = useMemo(() => {
        const active = new Set([
            ...workoutLogs.filter(l => l.date >= cutoff7).map(l => l.user_email),
            ...mealLogs.filter(l => l.date >= cutoff7).map(l => l.user_email),
            ...waterLogs.filter(l => l.date >= cutoff7).map(l => l.user_email),
            ...stepLogs.filter(l => l.date >= cutoff7).map(l => l.user_email),
        ]);
        return active.size;
    }, [workoutLogs, mealLogs, waterLogs, stepLogs, cutoff7]);

    const avgXP = useMemo(() => totalUsers ? Math.round(profiles.reduce((s, p) => s + (p.total_xp || 0), 0) / totalUsers) : 0, [profiles]);
    const avgStreak = useMemo(() => totalUsers ? (profiles.reduce((s, p) => s + (p.login_streak || 0), 0) / totalUsers).toFixed(1) : 0, [profiles]);
    const onboardedPct = useMemo(() => totalUsers ? Math.round(profiles.filter(p => p.onboarding_complete).length / totalUsers * 100) : 0, [profiles]);
    const atRisk = useMemo(() => profiles.filter(p => (p.login_streak || 0) === 0).length, [profiles]);

    // --- Charts ---
    const goalDistribution = useMemo(() => {
        const counts = {};
        profiles.forEach(p => { const g = p.fitness_goal || 'not_set'; counts[g] = (counts[g] || 0) + 1; });
        return Object.entries(counts).map(([name, value]) => ({ name: goalLabels[name] || name, value }));
    }, [profiles]);

    const activityDistribution = useMemo(() => {
        const counts = {};
        profiles.forEach(p => { const a = p.activity_level || 'not_set'; counts[a] = (counts[a] || 0) + 1; });
        return Object.entries(counts).map(([name, value]) => ({ name: activityLabels[name] || name, value }));
    }, [profiles]);

    const streakDistribution = useMemo(() => {
        const buckets = { '0 (Inactive)': 0, '1-7d': 0, '8-14d': 0, '15-30d': 0, '30d+': 0 };
        profiles.forEach(p => {
            const s = p.login_streak || 0;
            if (s === 0) buckets['0 (Inactive)']++;
            else if (s <= 7) buckets['1-7d']++;
            else if (s <= 14) buckets['8-14d']++;
            else if (s <= 30) buckets['15-30d']++;
            else buckets['30d+']++;
        });
        return Object.entries(buckets).map(([name, value]) => ({ name, value }));
    }, [profiles]);

    // Daily activity trend over selected range
    const dailyTrend = useMemo(() => {
        const days = [];
        let cur = new Date(cutoffN + 'T00:00:00');
        const end = new Date(cutoffEnd + 'T00:00:00');
        while (cur <= end) {
            const date = format(cur, 'yyyy-MM-dd');
            days.push({
                date: format(cur, 'MMM d'),
                workouts: workoutLogs.filter(l => l.date === date).length,
                meals: new Set(mealLogs.filter(l => l.date === date).map(l => l.user_email)).size,
                water: new Set(waterLogs.filter(l => l.date === date).map(l => l.user_email)).size,
                steps: new Set(stepLogs.filter(l => l.date === date).map(l => l.user_email)).size,
            });
            cur = new Date(cur.getTime() + 86400000);
        }
        return days;
    }, [cutoffN, cutoffEnd, workoutLogs, mealLogs, waterLogs, stepLogs]);

    // XP bucket distribution
    const xpDistribution = useMemo(() => {
        const buckets = { '0': 0, '1-500': 0, '501-2k': 0, '2k-5k': 0, '5k+': 0 };
        profiles.forEach(p => {
            const x = p.total_xp || 0;
            if (x === 0) buckets['0']++;
            else if (x <= 500) buckets['1-500']++;
            else if (x <= 2000) buckets['501-2k']++;
            else if (x <= 5000) buckets['2k-5k']++;
            else buckets['5k+']++;
        });
        return Object.entries(buckets).map(([name, value]) => ({ name, value }));
    }, [profiles]);

    // Workout type breakdown
    const workoutTypeBreakdown = useMemo(() => {
        const counts = {};
        workoutLogs.filter(l => l.date >= cutoffN && l.date <= cutoffEnd).forEach(l => { const t = l.workout_type || 'other'; counts[t] = (counts[t] || 0) + 1; });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
    }, [workoutLogs, cutoffN, cutoffEnd]);

    // Top active users
    const topUsers = useMemo(() => {
        const map = {};
        workoutLogs.filter(l => l.date >= cutoffN && l.date <= cutoffEnd).forEach(l => { map[l.user_email] = (map[l.user_email] || 0) + 1; });
        return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([email, workouts]) => {
            const p = profiles.find(p => p.user_email === email);
            return { email, workouts, xp: p?.total_xp || 0, streak: p?.login_streak || 0 };
        });
    }, [workoutLogs, profiles, cutoffN]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h1 className="text-2xl font-space font-bold flex items-center gap-3"><BarChart3 className="w-7 h-7 text-blue-400" /> Platform Analytics</h1>
                <div className="flex items-center gap-2 flex-wrap">
                    {[7, 14, 30, 60].map(r => (
                        <button key={r} onClick={() => { setRange(r); setUseCustom(false); }}
                            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${!useCustom && range === r ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-muted-foreground hover:bg-black/5 border border-transparent'}`}>
                            {r}d
                        </button>
                    ))}
                    <div className="flex items-center gap-1.5 pl-2 border-l border-border">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                            className="text-xs bg-muted border border-border rounded-lg px-2 py-1.5 text-foreground focus:outline-none focus:border-blue-500/50" />
                        <span className="text-xs text-muted-foreground">–</span>
                        <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                            className="text-xs bg-muted border border-border rounded-lg px-2 py-1.5 text-foreground focus:outline-none focus:border-blue-500/50" />
                        {customFrom && customTo && (
                            <button onClick={() => setUseCustom(true)}
                                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${useCustom ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-muted text-muted-foreground border border-border hover:border-blue-500/30 hover:text-blue-400'}`}>
                                Apply
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <KPICard icon={Users} label="Total Users" value={totalUsers} sub="all registered" iconColor="text-blue-400" color="text-blue-500" />
                <KPICard icon={Activity} label="Active (7d)" value={activeUsers7d} sub="logged any metric" iconColor="text-emerald-400" color="text-emerald-600" />
                <KPICard icon={Flame} label="At Risk" value={atRisk} sub="0-day streak" iconColor="text-red-400" color="text-red-500" />
                <KPICard icon={Zap} label="Avg XP" value={avgXP.toLocaleString()} sub="per user" iconColor="text-yellow-400" color="text-yellow-500" />
                <KPICard icon={TrendingUp} label="Avg Streak" value={`${avgStreak}d`} sub="login days" iconColor="text-orange-400" color="text-orange-500" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KPICard icon={Users} label="Onboarded" value={`${onboardedPct}%`} sub={`${profiles.filter(p => p.onboarding_complete).length} users`} iconColor="text-purple-400" color="text-purple-300" />
                <KPICard icon={Dumbbell} label={`Workouts (${range}d)`} value={workoutLogs.filter(l => l.date >= cutoffN).length} sub="total sessions" iconColor="text-purple-400" />
                <KPICard icon={Droplets} label={`Water Logs (${range}d)`} value={waterLogs.filter(l => l.date >= cutoffN).length} sub="total entries" iconColor="text-cyan-400" />
                <KPICard icon={Moon} label="Best Streak" value={`${Math.max(...profiles.map(p => p.longest_streak || 0), 0)}d`} sub="platform record" iconColor="text-blue-400" />
            </div>

            {/* Daily Engagement Trend */}
            <GlassCard animate={false}>
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400" /> Daily Active Loggers (last {range} days)</h3>
                <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={dailyTrend}>
                        <defs>
                            <linearGradient id="wkg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} /><stop offset="100%" stopColor="#a855f7" stopOpacity={0} /></linearGradient>
                            <linearGradient id="mlg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} /><stop offset="100%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} tick={{ fontSize: 10 }} />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="meals" name="Meal Loggers" stroke="#22c55e" fill="url(#mlg)" strokeWidth={2} dot={false} />
                        <Area type="monotone" dataKey="water" name="Water Loggers" stroke="#06b6d4" fill="none" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                        <Area type="monotone" dataKey="workouts" name="Workouts" stroke="#a855f7" fill="url(#wkg)" strokeWidth={2} dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </GlassCard>

            {/* Goal + Streak Distribution */}
            <div className="grid lg:grid-cols-2 gap-5">
                <GlassCard animate={false}>
                    <h3 className="font-semibold mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-emerald-400" /> Fitness Goal Distribution</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={goalDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                {goalDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </GlassCard>

                <GlassCard animate={false}>
                    <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-purple-400" /> Login Streak Distribution</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={streakDistribution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} />
                            <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} allowDecimals={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" name="Users" radius={[6, 6, 0, 0]}>
                                {streakDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </GlassCard>
            </div>

            {/* Activity Level + XP Distribution */}
            <div className="grid lg:grid-cols-2 gap-5">
                <GlassCard animate={false}>
                    <h3 className="font-semibold mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-400" /> Activity Level Distribution</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={activityDistribution} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis type="number" stroke="rgba(255,255,255,0.3)" fontSize={11} allowDecimals={false} />
                            <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} width={90} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" name="Users" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </GlassCard>

                <GlassCard animate={false}>
                    <h3 className="font-semibold mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /> XP Distribution</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={xpDistribution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                            <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} allowDecimals={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" name="Users" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </GlassCard>
            </div>

            {/* Workout Type Breakdown + Top Active Users */}
            <div className="grid lg:grid-cols-2 gap-5">
                <GlassCard animate={false}>
                    <h3 className="font-semibold mb-4 flex items-center gap-2"><Dumbbell className="w-4 h-4 text-purple-400" /> Workout Types (last {range}d)</h3>
                    {workoutTypeBreakdown.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No workouts logged in this period.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={workoutTypeBreakdown}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} />
                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" name="Sessions" radius={[6, 6, 0, 0]}>
                                    {workoutTypeBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </GlassCard>

                <GlassCard animate={false}>
                    <h3 className="font-semibold mb-4 flex items-center gap-2"><Flame className="w-4 h-4 text-orange-400" /> Most Active Users (last {range}d)</h3>
                    {topUsers.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No activity logged in this period.</p>
                    ) : (
                        <div className="space-y-2">
                            {topUsers.map((u, i) => (
                                <div key={u.email} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/3 text-sm">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' : i === 1 ? 'bg-white/10 text-white' : i === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-muted-foreground'}`}>{i + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="truncate text-xs font-medium">{u.email}</div>
                                        <div className="text-[10px] text-muted-foreground">{u.streak}🔥 streak · {u.xp.toLocaleString()} XP</div>
                                    </div>
                                    <span className="text-purple-400 font-semibold text-xs flex-shrink-0">{u.workouts} sessions</span>
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>
            </div>

            {/* Top Performers Table */}
            <GlassCard animate={false}>
                <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-400" /> Top Performers by XP</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="text-left py-2.5 px-3 text-muted-foreground text-xs">#</th>
                                <th className="text-left py-2.5 px-3 text-muted-foreground text-xs">User</th>
                                <th className="text-left py-2.5 px-3 text-muted-foreground text-xs">Streak</th>
                                <th className="text-left py-2.5 px-3 text-muted-foreground text-xs">XP</th>
                                <th className="text-left py-2.5 px-3 text-muted-foreground text-xs">Goal</th>
                                <th className="text-left py-2.5 px-3 text-muted-foreground text-xs">Activity</th>
                                <th className="text-left py-2.5 px-3 text-muted-foreground text-xs">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...profiles].sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0)).slice(0, 10).map((p, i) => {
                                const s = p.login_streak || 0;
                                const status = s > 3 ? 'Active' : s > 0 ? 'At Risk' : 'Inactive';
                                return (
                                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/2">
                                        <td className="py-2.5 px-3 font-bold text-muted-foreground">{i + 1}</td>
                                        <td className="py-2.5 px-3 text-xs">{p.user_email}</td>
                                        <td className="py-2.5 px-3">{p.login_streak || 0} 🔥</td>
                                        <td className="py-2.5 px-3 font-bold text-yellow-400">{(p.total_xp || 0).toLocaleString()}</td>
                                        <td className="py-2.5 px-3 text-muted-foreground text-xs">{goalLabels[p.fitness_goal] || '—'}</td>
                                        <td className="py-2.5 px-3 text-muted-foreground text-xs">{activityLabels[p.activity_level] || '—'}</td>
                                        <td className="py-2.5 px-3">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : status === 'At Risk' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>{status}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
}