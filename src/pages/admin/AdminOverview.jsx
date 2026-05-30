import React, { useMemo } from 'react';
import { entities } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import { Link } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { useAuth } from '@/lib/AuthContext';
import DashboardCustomizer, { parseLayout, ALL_ADMIN_WIDGETS } from '@/components/dashboard/DashboardCustomizer';
import {
    Users, Activity, Flame, Target, TrendingUp, TrendingDown, AlertTriangle,
    Brain, Zap, ChevronRight, Star, CheckCircle, Utensils, Droplets, Moon, Dumbbell
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ResizableWidget from '@/components/ui/ResizableWidget';

function StatCard({ icon: Icon, label, value, color, bg, trend, delay = 0, suffix = '' }) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
            <div className="glass rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all">
                <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    {trend !== undefined && (
                        <div className={`flex items-center gap-1 text-xs ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {Math.abs(trend)}%
                        </div>
                    )}
                </div>
                <div className="text-2xl font-bold font-space mb-1"><AnimatedCounter value={value} suffix={suffix} /></div>
                <div className="text-xs text-muted-foreground">{label}</div>
            </div>
        </motion.div>
    );
}

const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="glass rounded-lg p-3 text-xs border border-white/10">
            <p className="font-semibold mb-1">{label}</p>
            {payload.map(p => <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>)}
        </div>
    );
};

export default function AdminOverview() {
    const { user: admin } = useAuth();
    const qc = useQueryClient();

    const { data: allProfiles = [] } = useQuery({ queryKey: ['admin-profiles'], queryFn: () => entities.UserProfile.list() });
    const { data: allUsers = [] } = useQuery({ queryKey: ['admin-users'], queryFn: () => entities.UserProfile.list() });
    const { data: allMeals = [] } = useQuery({ queryKey: ['admin-all-meals'], queryFn: () => entities.MealLog.list('date', false) });
    const { data: allWorkouts = [] } = useQuery({ queryKey: ['admin-all-workouts'], queryFn: () => entities.WorkoutLog.list('date', false) });
    const { data: allWater = [] } = useQuery({ queryKey: ['admin-all-water'], queryFn: () => entities.WaterLog.list('date', false) });
    const { data: allSleep = [] } = useQuery({ queryKey: ['admin-all-sleep'], queryFn: () => entities.SleepLog.list('date', false) });

    // Admin layout preference — stored on their own profile
    const adminProfile = allProfiles.find(p => p.user_email === admin?.email);
    const saveAdminLayout = useMutation({
        mutationFn: (layout) => adminProfile
            ? entities.UserProfile.update(adminProfile.id, { admin_dashboard_layout: layout })
            : Promise.resolve(),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-profiles'] }),
    });
    const adminLayout = parseLayout(adminProfile?.admin_dashboard_layout, ALL_ADMIN_WIDGETS);

    // KPI stats
    const stats = useMemo(() => {
        const activeUsers = allProfiles.filter(p => (p.login_streak || 0) > 0).length;
        const atRisk = allProfiles.filter(p => (p.login_streak || 0) === 0).length;
        const avgStreak = allProfiles.length ? Math.round(allProfiles.reduce((s, p) => s + (p.login_streak || 0), 0) / allProfiles.length) : 0;
        return { activeUsers, atRisk, avgStreak };
    }, [allProfiles]);

    const last7days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
        const d = subDays(new Date(), 6 - i);
        return format(d, 'yyyy-MM-dd');
    }), []);

    const weeklyActivity = useMemo(() => last7days.map(date => ({
        day: format(new Date(date), 'EEE'),
        logins: allProfiles.filter(p => p.last_login_date === date).length,
        meals: allMeals.filter(m => m.date === date).length,
        workouts: allWorkouts.filter(w => w.date === date).length,
    })), [last7days, allProfiles, allMeals, allWorkouts]);

    const platformHealth = useMemo(() => {
        const uniqueUserEmails = [...new Set(allProfiles.map(p => p.user_email))];
        const totalUsers = uniqueUserEmails.length || 1;
        const last7start = format(subDays(new Date(), 7), 'yyyy-MM-dd');

        const mealLoggers = new Set(allMeals.filter(m => m.date >= last7start).map(m => m.user_email)).size;
        const workoutLoggers = new Set(allWorkouts.filter(w => w.date >= last7start).map(w => w.user_email)).size;
        const waterLoggers = new Set(allWater.filter(w => w.date >= last7start).map(w => w.user_email)).size;
        const sleepLoggers = new Set(allSleep.filter(s => s.date >= last7start).map(s => s.user_email)).size;

        return [
            { label: 'Meal Compliance', pct: Math.round((mealLoggers / totalUsers) * 100), color: 'bg-emerald-500' },
            { label: 'Workout Adherence', pct: Math.round((workoutLoggers / totalUsers) * 100), color: 'bg-blue-500' },
            { label: 'Water Tracking', pct: Math.round((waterLoggers / totalUsers) * 100), color: 'bg-cyan-500' },
            { label: 'Sleep Logging', pct: Math.round((sleepLoggers / totalUsers) * 100), color: 'bg-purple-500' },
        ];
    }, [allProfiles, allMeals, allWorkouts, allWater, allSleep]);

    const aiInsights = useMemo(() => {
        const insights = [];
        const noLogin5d = allProfiles.filter(p => (p.login_streak || 0) === 0).length;
        if (noLogin5d > 0) insights.push({ text: `${noLogin5d} user${noLogin5d > 1 ? 's' : ''} have no active streak — intervention recommended`, priority: 'high', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' });

        const streak30 = allProfiles.filter(p => (p.login_streak || 0) >= 30).length;
        if (streak30 > 0) insights.push({ text: `${streak30} user${streak30 > 1 ? 's' : ''} hit 30-day streaks — send congratulations!`, priority: 'low', icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-500/10' });

        const totalActive = allProfiles.filter(p => (p.login_streak || 0) > 3).length;
        if (totalActive > 0) insights.push({ text: `${totalActive} users are actively engaged with 3+ day streaks`, priority: 'low', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' });

        const noGoal = allProfiles.filter(p => !p.fitness_goal).length;
        if (noGoal > 0) insights.push({ text: `${noGoal} user${noGoal > 1 ? 's' : ''} haven't set a fitness goal yet`, priority: 'medium', icon: Target, color: 'text-blue-400', bg: 'bg-blue-500/10' });

        return insights.slice(0, 4);
    }, [allProfiles]);

    const riskUsers = useMemo(() =>
        allProfiles.filter(p => (p.login_streak || 0) === 0).slice(0, 6),
        [allProfiles]);

    const topUsers = useMemo(() =>
        [...allProfiles].sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0)).slice(0, 8),
        [allProfiles]);

    // --- Widget renderers ---
    const WIDGET_RENDERERS = {
        kpis: () => (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Total Users" value={allUsers.length} color="text-blue-400" bg="bg-blue-500/10" delay={0} />
                <StatCard icon={Activity} label="Active Users" value={stats.activeUsers} color="text-emerald-400" bg="bg-emerald-500/10" delay={0.05} />
                <StatCard icon={AlertTriangle} label="At Risk" value={stats.atRisk} color="text-red-400" bg="bg-red-500/10" delay={0.1} />
                <StatCard icon={Flame} label="Avg Streak" value={stats.avgStreak} color="text-orange-400" bg="bg-orange-500/10" suffix=" days" delay={0.15} />
            </div>
        ),

        activity_chart: () => (
            <div className="glass rounded-2xl p-5 border border-white/5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Weekly Activity (last 7 days)</h3>
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">{allUsers.length} users total</span>
                </div>
                <ResizableWidget defaultHeight={200}>
                    {(h) => (
                        <ResponsiveContainer width="100%" height={Math.max(100, h - 16)}>
                            <AreaChart data={weeklyActivity}>
                                <defs>
                                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="mealGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                                <Tooltip content={<ChartTooltip />} />
                                <Area type="monotone" dataKey="logins" name="Logins" stroke="hsl(142 71% 45%)" strokeWidth={2} fill="url(#areaGrad)" dot={false} />
                                <Area type="monotone" dataKey="meals" name="Meals" stroke="#3b82f6" strokeWidth={2} fill="url(#mealGrad)" dot={false} />
                                <Area type="monotone" dataKey="workouts" name="Workouts" stroke="#a855f7" strokeWidth={1.5} fill="none" dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </ResizableWidget>
            </div>
        ),

        platform_health: () => (
            <div className="glass rounded-2xl p-5 border border-white/5 space-y-4">
                <h3 className="font-semibold">Platform Health <span className="text-xs text-muted-foreground font-normal">(last 7 days)</span></h3>
                {platformHealth.map(s => (
                    <div key={s.label}>
                        <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-muted-foreground">{s.label}</span>
                            <span className="font-medium">{s.pct}%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div className={`h-full ${s.color} rounded-full`} initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ duration: 1, delay: 0.3 }} />
                        </div>
                    </div>
                ))}
            </div>
        ),

        ai_insights: () => (
            <div className="glass rounded-2xl p-5 border border-purple-500/20">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2"><Brain className="w-5 h-5 text-purple-400" /> AI Insights</h3>
                    <Link to="/admin/ai-insights" className="text-xs text-purple-400 hover:underline flex items-center gap-1">View all <ChevronRight className="w-3 h-3" /></Link>
                </div>
                <div className="space-y-3">
                    {aiInsights.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No insights available yet.</p>
                    ) : aiInsights.map((ins, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                            className={`flex items-start gap-3 p-3 rounded-xl ${ins.bg} border border-white/5`}>
                            <ins.icon className={`w-4 h-4 ${ins.color} mt-0.5 flex-shrink-0`} />
                            <p className="text-sm text-muted-foreground">{ins.text}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        ),

        risk_clients: () => (
            <div className="glass rounded-2xl p-5 border border-red-500/20">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-400" /> High Risk Clients</h3>
                    <Link to="/admin/risk" className="text-xs text-red-400 hover:underline flex items-center gap-1">View all <ChevronRight className="w-3 h-3" /></Link>
                </div>
                <ResizableWidget defaultHeight={280} className="overflow-y-auto">
                    <div className="space-y-2">
                        {riskUsers.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground text-sm">
                                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />All users are engaged!
                            </div>
                        ) : riskUsers.map((p, i) => {
                            const user = allUsers.find(u => u.user_email === p.user_email);
                            return (
                                <Link key={p.id} to={`/admin/user/${user?.id || ''}`}>
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/3 hover:bg-white/5 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 font-bold text-xs">
                                                {(p.user_email || 'U')[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium">{user?.full_name || p.user_email}</div>
                                                <div className="text-xs text-muted-foreground">Streak: {p.login_streak || 0} days · {p.fitness_goal?.replace('_', ' ') || 'No goal'}</div>
                                            </div>
                                        </div>
                                        <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-semibold">At Risk</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </ResizableWidget>
            </div>
        ),

        top_performers: () => (
            <div className="glass rounded-2xl p-5 border border-white/5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2"><Star className="w-5 h-5 text-yellow-400" /> Top Performers</h3>
                    <Link to="/admin/users" className="text-xs text-muted-foreground hover:text-white flex items-center gap-1">All users <ChevronRight className="w-3 h-3" /></Link>
                </div>
                <ResizableWidget defaultHeight={300} className="overflow-y-auto">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/5">
                                    {['Rank', 'User', 'Goal', 'Streak', 'XP', 'Status'].map(h => (
                                        <th key={h} className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {topUsers.map((p, i) => {
                                    const u = allUsers.find(u => u.user_email === p.user_email);
                                    const streak = p.login_streak || 0;
                                    const status = streak > 3 ? 'Active' : streak > 0 ? 'At Risk' : 'Inactive';
                                    const sc = status === 'Active' ? 'text-emerald-400 bg-emerald-500/10' : status === 'At Risk' ? 'text-yellow-400 bg-yellow-500/10' : 'text-red-400 bg-red-500/10';
                                    return (
                                        <tr key={p.id} className="border-b border-white/3 hover:bg-white/3 transition-colors">
                                            <td className="py-2.5 px-3">
                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' : i === 1 ? 'bg-gray-500/20 text-gray-400' : i === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-muted-foreground'}`}>{i + 1}</span>
                                            </td>
                                            <td className="py-2.5 px-3 font-medium">{u?.full_name || p.user_email?.split('@')[0]}</td>
                                            <td className="py-2.5 px-3 text-muted-foreground capitalize text-xs">{p.fitness_goal?.replace('_', ' ') || '—'}</td>
                                            <td className="py-2.5 px-3">{streak} 🔥</td>
                                            <td className="py-2.5 px-3 font-semibold text-yellow-400">{p.total_xp || 0}</td>
                                            <td className="py-2.5 px-3"><span className={`text-xs px-2 py-0.5 rounded-full ${sc}`}>{status}</span></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </ResizableWidget>
            </div>
        ),
    };

    // Widgets that can share a row
    const ROW_GROUPS = {
        activity_chart: { group: 'charts', cols: 'lg:col-span-2', rowCols: 'lg:grid-cols-3' },
        platform_health: { group: 'charts', cols: 'lg:col-span-1', rowCols: 'lg:grid-cols-3' },
        ai_insights: { group: 'insights', cols: '', rowCols: 'lg:grid-cols-2' },
        risk_clients: { group: 'insights', cols: '', rowCols: 'lg:grid-cols-2' },
    };

    const visibleLayout = adminLayout.filter(w => w.visible);
    const rows = [];
    const seen = new Set();

    for (const widget of visibleLayout) {
        if (seen.has(widget.id)) continue;
        const rg = ROW_GROUPS[widget.id];
        if (rg) {
            const siblings = visibleLayout.filter(w => ROW_GROUPS[w.id]?.group === rg.group && !seen.has(w.id));
            if (siblings.length > 1) {
                siblings.forEach(s => seen.add(s.id));
                rows.push({ type: 'group', widgets: siblings, rowCols: rg.rowCols });
            } else {
                seen.add(widget.id);
                rows.push({ type: 'single', widget });
            }
        } else {
            seen.add(widget.id);
            rows.push({ type: 'single', widget });
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-space font-bold">Command Center</h1>
                    <p className="text-sm text-muted-foreground mt-1">Platform intelligence overview</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="glass px-4 py-2 rounded-xl border border-emerald-500/20 flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-xs text-emerald-400 font-medium">System Live</span>
                    </div>
                    <DashboardCustomizer
                        layout={adminLayout}
                        registry={ALL_ADMIN_WIDGETS}
                        onSave={(l) => saveAdminLayout.mutate(l)}
                        isSaving={saveAdminLayout.isPending}
                        accentColor="purple"
                        title="Customize Admin Dashboard"
                    />
                </div>
            </div>

            {rows.map((row, i) => {
                if (row.type === 'group') {
                    return (
                        <div key={i} className={`grid ${row.rowCols} gap-6`}>
                            {row.widgets.map(w => {
                                const renderer = WIDGET_RENDERERS[w.id];
                                if (!renderer) return null;
                                const rg = ROW_GROUPS[w.id];
                                return (
                                    <div key={w.id} className={rg?.cols || ''}>
                                        {renderer()}
                                    </div>
                                );
                            })}
                        </div>
                    );
                }
                const renderer = WIDGET_RENDERERS[row.widget.id];
                if (!renderer) return null;
                return <div key={i}>{renderer()}</div>;
            })}
        </div>
    );
}


