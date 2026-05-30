import React, { useMemo } from 'react';
import { entities } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { TrendingUp, DollarSign, Users, RefreshCw, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const MRR_DATA = [
    { month: 'Dec', mrr: 4200, new: 800, churn: 200 },
    { month: 'Jan', mrr: 5100, new: 1200, churn: 300 },
    { month: 'Feb', mrr: 6400, new: 1800, churn: 500 },
    { month: 'Mar', mrr: 7200, new: 1400, churn: 600 },
    { month: 'Apr', mrr: 8900, new: 2100, churn: 400 },
    { month: 'May', mrr: 11200, new: 2900, churn: 600 },
];

const PLAN_DATA = [
    { name: 'Basic', value: 45, color: '#6366f1', revenue: 2250 },
    { name: 'Pro', value: 35, color: '#22c55e', revenue: 5250 },
    { name: 'Elite', value: 15, color: '#f59e0b', revenue: 3750 },
    { name: 'Custom', value: 5, color: '#ec4899', revenue: 1250 },
];

const FUNNEL_DATA = [
    { stage: 'Visitors', count: 1240, pct: 100 },
    { stage: 'Sign-ups', count: 412, pct: 33 },
    { stage: 'Trial Start', count: 198, pct: 16 },
    { stage: 'Converted', count: 87, pct: 7 },
    { stage: 'Retained', count: 71, pct: 5.7 },
];

const RETENTION_DATA = Array.from({ length: 12 }, (_, i) => ({
    month: `M${i + 1}`, retained: Math.round(100 * Math.pow(0.88, i)),
}));

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="glass border border-white/10 rounded-xl px-3 py-2 text-xs">
            <div className="font-semibold mb-1">{label}</div>
            {payload.map((p, i) => (
                <div key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' && p.name?.toLowerCase().includes('mrr') ? `$${p.value.toLocaleString()}` : p.value}</div>
            ))}
        </div>
    );
};

export default function AdminRevenue() {
    const { data: allProfiles = [] } = useQuery({ queryKey: ['admin-profiles'], queryFn: () => entities.UserProfile.list() });
    const { data: allUsers = [] } = useQuery({ queryKey: ['admin-users'], queryFn: () => entities.UserProfile.list() });

    const currentMRR = MRR_DATA[MRR_DATA.length - 1].mrr;
    const prevMRR = MRR_DATA[MRR_DATA.length - 2].mrr;
    const mrrGrowth = Math.round(((currentMRR - prevMRR) / prevMRR) * 100);
    const activeUsers = allProfiles.filter(p => (p.login_streak || 0) > 0).length || allUsers.length;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-space font-bold flex items-center gap-2"><TrendingUp className="w-7 h-7 text-emerald-400" /> Revenue Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-1">SaaS business intelligence & subscription analytics</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Monthly MRR', value: currentMRR, prefix: '$', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10', trend: mrrGrowth },
                    { label: 'Active Users', value: activeUsers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', trend: 8 },
                    { label: 'Trial Conv.', value: 44, suffix: '%', icon: Target, color: 'text-purple-400', bg: 'bg-purple-500/10', trend: 3 },
                    { label: 'Churn Rate', value: 4.2, suffix: '%', icon: RefreshCw, color: 'text-red-400', bg: 'bg-red-500/10', trend: -1 },
                ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                        <div className="glass rounded-2xl p-5 border border-white/5">
                            <div className="flex items-center justify-between mb-3">
                                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                                    <s.icon className={`w-4 h-4 ${s.color}`} />
                                </div>
                                <div className={`flex items-center gap-1 text-xs ${s.trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {s.trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                    {Math.abs(s.trend)}%
                                </div>
                            </div>
                            <div className="text-2xl font-bold font-space">{s.prefix || ''}<AnimatedCounter value={s.value} />{s.suffix || ''}</div>
                            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* MRR Chart */}
                <div className="lg:col-span-2 glass rounded-2xl p-5 border border-white/5">
                    <h3 className="font-semibold mb-1">Monthly Recurring Revenue</h3>
                    <p className="text-xs text-muted-foreground mb-5">6-month growth trend</p>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={MRR_DATA}>
                            <defs>
                                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(1)}k`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="mrr" name="MRR" stroke="hsl(142 71% 45%)" strokeWidth={2} fill="url(#mrrGrad)" dot={false} />
                            <Area type="monotone" dataKey="new" name="New MRR" stroke="hsl(217 91% 60%)" strokeWidth={1.5} fill="none" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Plan Breakdown */}
                <div className="glass rounded-2xl p-5 border border-white/5">
                    <h3 className="font-semibold mb-4">Plan Distribution</h3>
                    <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                            <Pie data={PLAN_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                                {PLAN_DATA.map((d, i) => <Cell key={i} fill={d.color} opacity={0.85} />)}
                            </Pie>
                            <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: 'hsl(220 18% 7%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-3">
                        {PLAN_DATA.map(d => (
                            <div key={d.name} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} /><span className="text-muted-foreground">{d.name}</span></div>
                                <div className="flex items-center gap-3">
                                    <span className="font-semibold">{d.value}%</span>
                                    <span className="text-xs text-muted-foreground">${d.revenue.toLocaleString()}/mo</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Conversion Funnel */}
                <div className="glass rounded-2xl p-5 border border-white/5">
                    <h3 className="font-semibold mb-5">Conversion Funnel</h3>
                    <div className="space-y-3">
                        {FUNNEL_DATA.map((f, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-muted-foreground">{f.stage}</span>
                                    <span className="font-semibold">{f.count.toLocaleString()} <span className="text-muted-foreground">({f.pct}%)</span></span>
                                </div>
                                <div className="h-7 bg-white/5 rounded-lg overflow-hidden">
                                    <motion.div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center pl-3"
                                        initial={{ width: 0 }} animate={{ width: `${f.pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}>
                                        {f.pct > 10 && <span className="text-xs text-white font-semibold">{f.count}</span>}
                                    </motion.div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Retention Curve */}
                <div className="glass rounded-2xl p-5 border border-white/5">
                    <h3 className="font-semibold mb-1">Cohort Retention</h3>
                    <p className="text-xs text-muted-foreground mb-4">% users retained by month</p>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={RETENTION_DATA}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="retained" name="Retained" stroke="hsl(217 91% 60%)" strokeWidth={2.5} dot={{ fill: 'hsl(217 91% 60%)', r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}


