// pages/WaterTracker.jsx  ─  Full fixed version

import React, { useMemo, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import ProgressRing from '@/components/ui/ProgressRing';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { useDateFilter } from '@/lib/useDateFilter';
import { Button } from '@/components/ui/button';
import { Droplets, Plus, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

const quickAmounts = [150, 250, 350, 500, 750];

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.[0]) return null;
    return (
        <div className="glass rounded-xl p-3 text-xs border border-white/10 shadow-xl">
            <p className="text-muted-foreground mb-1">{label}</p>
            <p className="font-bold text-blue-400">{payload[0].value?.toLocaleString()} ml</p>
        </div>
    );
};

export default function WaterTracker() {
    const { user } = useAuth();
    const qc = useQueryClient();
    const dateFilter = useDateFilter(7);
    const [detailDate, setDetailDate] = useState(null);

    /* ── Profile ── */
    const { data: profiles } = useQuery({
        queryKey: ['userProfile', user?.email],
        queryFn: () => entities.UserProfile.filter({ user_email: user?.email }),
        enabled: !!user?.email,
    });
    const profile = profiles?.[0];
    const goal = profile?.water_goal_ml || 2500;

    /* ── All logs ── */
    const { data: allLogs = [] } = useQuery({
        queryKey: ['water-all', user?.email],
        queryFn: () => entities.WaterLog.filter({ user_email: user?.email }),
        enabled: !!user?.email,
        staleTime: 1000 * 60 * 2,
    });

    const todayStr = dateFilter.todayStr;
    const todayLogs = useMemo(() => allLogs.filter(l => l.date === todayStr), [allLogs, todayStr]);
    const todayTotal = todayLogs.reduce((s, l) => s + (l.amount_ml || 0), 0);
    const glasses = Math.floor(todayTotal / 250);

    /* ── Chart ── */
    const chartData = useMemo(() =>
        dateFilter.dateRange.map(date => ({
            date,
            label: format(parseISO(date), dateFilter.dateRange.length <= 7 ? 'EEE' : dateFilter.dateRange.length <= 31 ? 'MMM d' : 'MMM'),
            ml: allLogs.filter(l => l.date === date).reduce((s, l) => s + (l.amount_ml || 0), 0),
        })),
        [dateFilter.dateRange, allLogs]
    );

    const avgMl = useMemo(() => {
        const active = chartData.filter(d => d.ml > 0);
        return active.length ? Math.round(active.reduce((s, d) => s + d.ml, 0) / active.length) : 0;
    }, [chartData]);

    /* ── Detail view ── */
    const detailLogs = useMemo(() =>
        allLogs.filter(l => l.date === (detailDate ?? todayStr)),
        [allLogs, detailDate, todayStr]
    );
    const detailTotal = detailLogs.reduce((s, l) => s + (l.amount_ml || 0), 0);
    const detailIdx = detailDate ? dateFilter.dateRange.indexOf(detailDate) : -1;
    const canNavPrev = detailIdx > 0;
    const canNavNext = detailIdx < dateFilter.dateRange.length - 1;

    /* ── Mutations ── */
    const addWater = useMutation({
        mutationFn: (ml) => entities.WaterLog.create({
            user_email: user.email,
            date: todayStr,
            amount_ml: ml,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['water-all'] }),
    });

    const deleteWater = useMutation({
        mutationFn: (id) => entities.WaterLog.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['water-all'] }),
    });

    /* ─────────────────────────────────── */
    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h1 className="text-2xl font-space font-bold">Water Tracker</h1>
                <DateRangePicker
                    preset={dateFilter.preset}
                    startDate={dateFilter.startDate}
                    endDate={dateFilter.endDate}
                    isCustom={dateFilter.isCustom}
                    onSelectPreset={dateFilter.selectPreset}
                    onSelectCustom={dateFilter.selectCustom}
                />
            </div>

            {/* ── Ring + Quick Add ── */}
            <div className="grid lg:grid-cols-3 gap-6">
                <GlassCard className="lg:col-span-1 flex flex-col items-center">
                    <p className="text-xs text-muted-foreground mb-3 uppercase tracking-widest">Today's Hydration</p>
                    <ProgressRing value={todayTotal} max={goal} size={200} strokeWidth={14} color="#3b82f6">
                        <div className="text-center">
                            <Droplets className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                            <div className="text-3xl font-bold font-space text-blue-400">
                                <AnimatedCounter value={Math.round(todayTotal / 10) * 10} />
                            </div>
                            <div className="text-xs text-muted-foreground">/ {goal} ml</div>
                        </div>
                    </ProgressRing>
                    <div className="mt-4 space-y-1 text-center">
                        <div className="text-sm text-muted-foreground">{glasses} glasses today</div>
                        <div className="text-xs text-muted-foreground">{Math.round((todayTotal / goal) * 100)}% of daily goal</div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 w-full text-center">
                        <div className="glass rounded-xl p-2">
                            <div className="text-sm font-bold text-blue-400">{avgMl.toLocaleString()}</div>
                            <div className="text-[10px] text-muted-foreground">avg ml/day</div>
                        </div>
                        <div className="glass rounded-xl p-2">
                            <div className="text-sm font-bold text-emerald-400">
                                {chartData.filter(d => d.ml >= goal).length}
                            </div>
                            <div className="text-[10px] text-muted-foreground">goal days</div>
                        </div>
                    </div>
                </GlassCard>

                {/* Quick add + detail */}
                <GlassCard className="lg:col-span-2">
                    <h3 className="font-semibold mb-4">Quick Add</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
                        {quickAmounts.map(ml => (
                            <motion.button key={ml}
                                className="glass rounded-2xl p-4 text-center hover:bg-blue-500/10 transition-colors"
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={() => addWater.mutate(ml)}>
                                <Droplets className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                                <div className="text-sm font-bold">{ml}ml</div>
                            </motion.button>
                        ))}
                    </div>

                    {/* Day detail header */}
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            {detailDate
                                ? <><span>Logs:</span> <span className="text-blue-400">{format(parseISO(detailDate), 'MMM d')}</span></>
                                : "Today's Log"}
                        </h3>
                        <div className="flex items-center gap-2">
                            {detailDate && (
                                <>
                                    <button disabled={!canNavPrev} onClick={() => setDetailDate(dateFilter.dateRange[detailIdx - 1])}
                                        className="p-1 rounded-lg hover:bg-white/5 disabled:opacity-30 text-white/50">
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <button disabled={!canNavNext} onClick={() => setDetailDate(dateFilter.dateRange[detailIdx + 1])}
                                        className="p-1 rounded-lg hover:bg-white/5 disabled:opacity-30 text-white/50">
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => setDetailDate(null)} className="p-1 rounded-lg hover:bg-white/5 text-white/30">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </>
                            )}
                            <span className="text-xs text-muted-foreground font-normal">{detailTotal.toLocaleString()} ml total</span>
                        </div>
                    </div>

                    {detailLogs.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No water logged. Stay hydrated! 💧</p>
                    ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {detailLogs.map(log => (
                                <motion.div key={log.id} className="flex items-center justify-between glass rounded-xl p-3"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <div className="flex items-center gap-3">
                                        <Droplets className="w-4 h-4 text-blue-400" />
                                        <div>
                                            <span className="font-medium text-sm">{log.amount_ml}ml</span>
                                            <span className="text-xs text-muted-foreground ml-2">{log.time}</span>
                                        </div>
                                    </div>
                                    {log.date === todayStr && (
                                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-400 h-8 w-8"
                                            onClick={() => deleteWater.mutate(log.id)}>
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </GlassCard>
            </div>

            {/* ── Area Chart ── */}
            <GlassCard animate={false}>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-blue-400" /> Hydration Trend
                    </h3>
                    <span className="text-xs text-muted-foreground">
                        Avg: <span className="text-blue-400 font-semibold">{avgMl.toLocaleString()} ml/day</span>
                    </span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData}
                        onClick={(e) => { if (e?.activePayload?.[0]) setDetailDate(e.activePayload[0].payload.date); }}>
                        <defs>
                            <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                        <ReferenceLine y={goal} stroke="#3b82f6" strokeDasharray="5 5" strokeOpacity={0.4}
                            label={{ value: 'Goal', fill: '#3b82f6', fontSize: 10, position: 'insideTopRight' }} />
                        <Area type="monotone" dataKey="ml" stroke="#3b82f6" fill="url(#waterGrad)" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} activeDot={{ r: 5 }} />
                    </AreaChart>
                </ResponsiveContainer>
                <p className="text-center text-xs text-muted-foreground mt-2 opacity-60">Click a point to inspect that day ↑</p>
            </GlassCard>
        </div>
    );
}