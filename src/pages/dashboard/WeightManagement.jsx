import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entities } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, parseISO } from 'date-fns';
import {
    AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Scale, TrendingDown, TrendingUp, Target, Plus, Trash2, Calendar, ChevronDown, Award, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/ui/GlassCard';
import { today } from '@/lib/fitnessUtils';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.[0]) return null;
    return (
        <div className="glass rounded-xl p-3 text-xs border border-white/10 shadow-xl">
            <p className="text-muted-foreground mb-1">{label}</p>
            <p className="font-bold text-emerald-400">{payload[0].value} kg</p>
        </div>
    );
};

export default function WeightManagement() {
    const { user } = useAuth();
    const qc = useQueryClient();
    const [weight, setWeight] = useState('');
    const [date, setDate] = useState(today());
    const [notes, setNotes] = useState('');
    const [range, setRange] = useState(30);
    const [showForm, setShowForm] = useState(false);
    const [logRange, setLogRange] = useState(90);
    const [customLogFrom, setCustomLogFrom] = useState('');
    const [customLogTo, setCustomLogTo] = useState('');
    const [useCustomLog, setUseCustomLog] = useState(false);

    const { data: profiles = [] } = useQuery({
        queryKey: ['userProfile', user?.email],
        queryFn: () => entities.UserProfile.filter({ user_email: user?.email }),
        enabled: !!user?.email,
    });
    const profile = profiles[0];

    const { data: logs = [], isLoading } = useQuery({
        queryKey: ['weight-logs', user?.email],
        queryFn: () => entities.WeightLog.filter({ user_email: user?.email }),
        enabled: !!user?.email,
    });

    const addLog = useMutation({
        mutationFn: (d) => entities.WeightLog.create(d),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['weight-logs'] });
            setWeight('');
            setNotes('');
            setDate(today());
            setShowForm(false);
        },
    });

    const deleteLog = useMutation({
        mutationFn: (id) => entities.WeightLog.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['weight-logs'] }),
    });

    const handleAdd = () => {
        if (!weight || isNaN(parseFloat(weight))) return;
        addLog.mutate({ user_email: user.email, date, weight_kg: parseFloat(weight), notes });
    };

    // Sort and filter logs
    const sorted = useMemo(() => [...logs].sort((a, b) => a.date.localeCompare(b.date)), [logs]);

    const rangeStart = format(subDays(new Date(), range), 'yyyy-MM-dd');
    const chartData = useMemo(() =>
        sorted
            .filter(l => l.date >= rangeStart)
            .map(l => ({ date: format(parseISO(l.date), range <= 30 ? 'MMM d' : 'MMM d'), weight: l.weight_kg, id: l.id })),
        [sorted, rangeStart, range]
    );

    const latest = sorted[sorted.length - 1];
    const first = sorted[0];
    const weekAgo = sorted.filter(l => l.date >= format(subDays(new Date(), 7), 'yyyy-MM-dd'))[0];
    const totalChange = first && latest ? (latest.weight_kg - first.weight_kg).toFixed(1) : null;
    const weekChange = weekAgo && latest ? (latest.weight_kg - weekAgo.weight_kg).toFixed(1) : null;
    const targetWeight = profile?.target_weight_kg;
    const toGoal = latest && targetWeight ? (latest.weight_kg - targetWeight).toFixed(1) : null;
    const avgWeight = chartData.length ? (chartData.reduce((s, d) => s + d.weight, 0) / chartData.length).toFixed(1) : null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-space font-bold flex items-center gap-2">
                        <Scale className="w-6 h-6 text-emerald-400" /> Weight Management
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Track your progress toward your goal weight</p>
                </div>
                <Button onClick={() => setShowForm(v => !v)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl gap-2 shadow-lg shadow-emerald-500/20">
                    <Plus className="w-4 h-4" /> Log Weight
                </Button>
            </div>

            {/* Quick Log Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <GlassCard animate={false} className="border border-emerald-500/20">
                            <div className="flex flex-col sm:flex-row gap-3 items-end">
                                <div className="flex-1">
                                    <label className="text-xs text-muted-foreground mb-1.5 block">Weight (kg)</label>
                                    <Input value={weight} onChange={e => setWeight(e.target.value)} type="number" step="0.1" placeholder="e.g. 78.5"
                                        className="bg-white/5 border-white/10 focus:border-emerald-500/50 text-lg font-bold" autoFocus />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1.5 block">Date</label>
                                    <Input value={date} onChange={e => setDate(e.target.value)} type="date"
                                        className="bg-white/5 border-white/10 focus:border-emerald-500/50" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-muted-foreground mb-1.5 block">Notes (optional)</label>
                                    <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Morning, after workout..."
                                        className="bg-white/5 border-white/10 focus:border-emerald-500/50" />
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={handleAdd} disabled={addLog.isPending || !weight}
                                        className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold">
                                        {addLog.isPending ? 'Saving...' : 'Save'}
                                    </Button>
                                    <Button variant="ghost" onClick={() => setShowForm(false)} className="text-muted-foreground">
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    {
                        label: 'Current Weight',
                        value: latest ? `${latest.weight_kg} kg` : '—',
                        sub: latest ? format(parseISO(latest.date), 'MMM d') : 'No logs yet',
                        color: 'text-white', icon: Scale, bg: 'bg-emerald-500/10', iconColor: 'text-emerald-400',
                    },
                    {
                        label: 'Total Change',
                        value: totalChange !== null ? `${totalChange > 0 ? '+' : ''}${totalChange} kg` : '—',
                        sub: `since first log`,
                        color: totalChange < 0 ? 'text-emerald-400' : totalChange > 0 ? 'text-red-400' : 'text-white',
                        icon: totalChange < 0 ? TrendingDown : TrendingUp, bg: 'bg-blue-500/10', iconColor: 'text-blue-400',
                    },
                    {
                        label: 'This Week',
                        value: weekChange !== null ? `${weekChange > 0 ? '+' : ''}${weekChange} kg` : '—',
                        sub: '7-day change',
                        color: weekChange < 0 ? 'text-emerald-400' : weekChange > 0 ? 'text-red-400' : 'text-white',
                        icon: Calendar, bg: 'bg-purple-500/10', iconColor: 'text-purple-400',
                    },
                    {
                        label: 'To Goal',
                        value: toGoal !== null ? `${Math.abs(toGoal)} kg` : '—',
                        sub: targetWeight ? `Target: ${targetWeight} kg` : 'Set in settings',
                        color: Math.abs(toGoal) < 2 ? 'text-emerald-400' : 'text-yellow-400',
                        icon: Target, bg: 'bg-yellow-500/10', iconColor: 'text-yellow-400',
                    },
                ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                            <GlassCard animate={false} className="h-full">
                                <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                                    <Icon className={`w-4.5 h-4.5 ${stat.iconColor}`} />
                                </div>
                                <div className={`text-xl font-bold font-space ${stat.color}`}>{stat.value}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                                <div className="text-[10px] text-muted-foreground/60 mt-0.5">{stat.sub}</div>
                            </GlassCard>
                        </motion.div>
                    );
                })}
            </div>

            {/* Chart + Range selector */}
            <GlassCard animate={false}>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h3 className="font-semibold flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-emerald-400" /> Weight Trend
                    </h3>
                    <div className="flex gap-1">
                        {[7, 30, 90, 180].map(r => (
                            <button key={r} onClick={() => setRange(r)}
                                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${range === r ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}>
                                {r === 7 ? '1W' : r === 30 ? '1M' : r === 90 ? '3M' : '6M'}
                            </button>
                        ))}
                    </div>
                </div>

                {chartData.length < 2 ? (
                    <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                        Log at least 2 entries to see your trend
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} tick={{ fill: 'rgba(255,255,255,0.4)' }} />
                            <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tick={{ fill: 'rgba(255,255,255,0.4)' }}
                                domain={['auto', 'auto']} />
                            <Tooltip content={<CustomTooltip />} />
                            {targetWeight && (
                                <ReferenceLine y={targetWeight} stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={1.5}
                                    label={{ value: `Goal: ${targetWeight}kg`, fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }} />
                            )}
                            <Area type="monotone" dataKey="weight" stroke="#22c55e" fill="url(#weightGrad)" strokeWidth={2.5} dot={{ fill: '#22c55e', r: 3 }} activeDot={{ r: 5 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                )}

                {avgWeight && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 text-xs text-muted-foreground">
                        <span>Avg in period: <span className="text-white font-semibold">{avgWeight} kg</span></span>
                        {targetWeight && <span>Target: <span className="text-yellow-400 font-semibold">{targetWeight} kg</span></span>}
                    </div>
                )}
            </GlassCard>

            {/* All Entries Log */}
            <GlassCard animate={false}>
                <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-400" /> All Entries
                    </h3>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {[30, 90, 180].map(r => (
                            <button key={r} onClick={() => { setLogRange(r); setUseCustomLog(false); }}
                                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${!useCustomLog && logRange === r ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-muted-foreground hover:bg-white/5 border border-transparent'}`}>
                                {r === 30 ? '1M' : r === 90 ? '3M' : '6M'}
                            </button>
                        ))}
                        <button onClick={() => { setLogRange(99999); setUseCustomLog(false); }}
                            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${!useCustomLog && logRange === 99999 ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-muted-foreground hover:bg-white/5 border border-transparent'}`}>
                            All
                        </button>
                        <div className="flex items-center gap-1 border-l border-white/10 pl-1.5">
                            <Filter className="w-3 h-3 text-muted-foreground" />
                            <input type="date" value={customLogFrom} onChange={e => setCustomLogFrom(e.target.value)}
                                className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-foreground w-28 focus:outline-none" />
                            <span className="text-xs text-muted-foreground">–</span>
                            <input type="date" value={customLogTo} onChange={e => setCustomLogTo(e.target.value)}
                                className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-foreground w-28 focus:outline-none" />
                            {customLogFrom && customLogTo && (
                                <button onClick={() => setUseCustomLog(true)}
                                    className={`text-xs px-2.5 py-1 rounded-lg transition-all ${useCustomLog ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-white/5 text-muted-foreground border border-white/10 hover:border-blue-500/30'}`}>
                                    Apply
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>
                ) : sorted.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        <Scale className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No weight logs yet</p>
                        <button onClick={() => setShowForm(true)} className="text-emerald-400 text-sm mt-2 hover:underline">Log your first entry →</button>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {[...sorted].reverse().filter(log => {
                            if (useCustomLog && customLogFrom && customLogTo) return log.date >= customLogFrom && log.date <= customLogTo;
                            if (logRange === 99999) return true;
                            const cutoff = format(subDays(new Date(), logRange), 'yyyy-MM-dd');
                            return log.date >= cutoff;
                        }).map((log, i, arr) => {
                            const prev = arr[i + 1];
                            const diff = prev ? (log.weight_kg - prev.weight_kg).toFixed(1) : null;
                            return (
                                <div key={log.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/3 group transition-colors">
                                    <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                                        <Scale className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-white">{log.weight_kg} kg</span>
                                            {diff !== null && (
                                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${parseFloat(diff) < 0 ? 'text-emerald-400 bg-emerald-500/10' : parseFloat(diff) > 0 ? 'text-red-400 bg-red-500/10' : 'text-muted-foreground bg-white/5'}`}>
                                                    {parseFloat(diff) > 0 ? '+' : ''}{diff}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">{format(parseISO(log.date), 'EEEE, MMM d yyyy')}</div>
                                        {log.notes && <div className="text-[11px] text-muted-foreground/60 mt-0.5 truncate">{log.notes}</div>}
                                    </div>
                                    <button onClick={() => deleteLog.mutate(log.id)}
                                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            );
                        })}
                        {[...sorted].reverse().filter(log => {
                            if (useCustomLog && customLogFrom && customLogTo) return log.date >= customLogFrom && log.date <= customLogTo;
                            if (logRange === 99999) return true;
                            const cutoff = format(subDays(new Date(), logRange), 'yyyy-MM-dd');
                            return log.date >= cutoff;
                        }).length === 0 && (
                                <div className="text-center py-8 text-muted-foreground text-sm">No entries in this date range.</div>
                            )}
                    </div>
                )}
            </GlassCard>

            {/* Milestone callout */}
            {toGoal !== null && Math.abs(parseFloat(toGoal)) <= 5 && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="glass rounded-2xl p-4 border border-emerald-500/30 bg-emerald-500/5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <Award className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <div className="font-semibold text-emerald-400">Almost there! 🎯</div>
                        <div className="text-sm text-muted-foreground mt-0.5">
                            {Math.abs(parseFloat(toGoal)) < 0.5 ? "You've reached your goal weight! 🏆" : `Only ${Math.abs(toGoal)} kg away from your goal weight of ${targetWeight} kg.`}
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}