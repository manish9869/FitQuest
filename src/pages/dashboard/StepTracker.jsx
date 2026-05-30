// pages/StepTracker.jsx  ─  Full fixed version

import React, { useState, useMemo } from 'react';
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
import { Input } from '@/components/ui/input';
import { Footprints, Plus, Flame, Trash2, ChevronLeft, ChevronRight, X, TrendingUp } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.[0]) return null;
    return (
        <div className="glass rounded-xl p-3 text-xs border border-white/10 shadow-xl">
            <p className="text-muted-foreground mb-1">{label}</p>
            <p className="font-bold text-orange-400">{payload[0].value?.toLocaleString()} steps</p>
        </div>
    );
};

export default function StepTracker() {
    const { user } = useAuth();
    const qc = useQueryClient();
    const dateFilter = useDateFilter(7);
    const [stepInput, setStepInput] = useState('');
    const [detailDate, setDetailDate] = useState(null);

    /* ── Profile ── */
    const { data: profiles } = useQuery({
        queryKey: ['userProfile', user?.email],
        queryFn: () => entities.UserProfile.filter({ user_email: user?.email }),
        enabled: !!user?.email,
    });
    const profile = profiles?.[0];

    /* ── All logs ── */
    const { data: allLogs = [] } = useQuery({
        queryKey: ['steps-all', user?.email],
        queryFn: () => entities.StepLog.filter({ user_email: user?.email }),
        enabled: !!user?.email,
        staleTime: 1000 * 60 * 2,
    });

    const todayStr = dateFilter.todayStr;
    const goal = profile?.step_goal || 10000;
    const todayLogs = useMemo(() => allLogs.filter(l => l.date === todayStr), [allLogs, todayStr]);
    const todayTotal = todayLogs.reduce((s, l) => s + (l.steps || 0), 0);
    const todayCals = todayLogs.reduce((s, l) => s + (l.calories_burned || 0), 0);

    /* ── Chart ── */
    const chartData = useMemo(() =>
        dateFilter.dateRange.map(date => {
            const steps = allLogs.filter(l => l.date === date).reduce((s, l) => s + (l.steps || 0), 0);
            return {
                date,
                label: format(parseISO(date), dateFilter.dateRange.length <= 7 ? 'EEE' : dateFilter.dateRange.length <= 31 ? 'MMM d' : 'MMM'),
                steps,
                goalMet: steps >= goal,
            };
        }),
        [dateFilter.dateRange, allLogs, goal]
    );

    const activeDays = chartData.filter(d => d.steps > 0);
    const avgSteps = activeDays.length
        ? Math.round(activeDays.reduce((s, d) => s + d.steps, 0) / activeDays.length)
        : 0;
    const goalDays = chartData.filter(d => d.goalMet).length;

    /* ── Detail view ── */
    const detailLogs = useMemo(() =>
        allLogs.filter(l => l.date === (detailDate ?? todayStr)),
        [allLogs, detailDate, todayStr]
    );
    const detailTotal = detailLogs.reduce((s, l) => s + (l.steps || 0), 0);
    const detailCals = detailLogs.reduce((s, l) => s + (l.calories_burned || 0), 0);
    const detailIdx = detailDate ? dateFilter.dateRange.indexOf(detailDate) : -1;
    const canNavPrev = detailIdx > 0;
    const canNavNext = detailIdx < dateFilter.dateRange.length - 1;

    /* ── Mutations ── */
    const addSteps = useMutation({
        mutationFn: (steps) => entities.StepLog.create({
            user_email: user.email,
            date: todayStr,
            steps,
            calories_burned: Math.round(steps * 0.04),
        }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['steps-all'] }); setStepInput(''); },
    });

    const deleteLog = useMutation({
        mutationFn: (id) => entities.StepLog.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['steps-all'] }),
    });

    const quickSteps = [1000, 2500, 5000, 8000];

    /* ─────────────────────────────── */
    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h1 className="text-2xl font-space font-bold">Step Tracker</h1>
                <DateRangePicker
                    preset={dateFilter.preset}
                    startDate={dateFilter.startDate}
                    endDate={dateFilter.endDate}
                    isCustom={dateFilter.isCustom}
                    onSelectPreset={dateFilter.selectPreset}
                    onSelectCustom={dateFilter.selectCustom}
                />
            </div>

            {/* ── Ring + Log input ── */}
            <div className="grid lg:grid-cols-3 gap-6">
                <GlassCard className="flex flex-col items-center">
                    <p className="text-xs text-muted-foreground mb-3 uppercase tracking-widest">Today's Steps</p>
                    <ProgressRing value={todayTotal} max={goal} size={200} strokeWidth={14} color="#f97316">
                        <div className="text-center">
                            <Footprints className="w-6 h-6 text-orange-400 mx-auto mb-1" />
                            <div className="text-3xl font-bold font-space text-orange-400">
                                <AnimatedCounter value={todayTotal} />
                            </div>
                            <div className="text-xs text-muted-foreground">/ {goal.toLocaleString()}</div>
                        </div>
                    </ProgressRing>
                    <div className="flex items-center gap-2 mt-4">
                        <Flame className="w-4 h-4 text-red-400" />
                        <span className="text-sm"><AnimatedCounter value={todayCals} /> cal burned</span>
                    </div>
                    {/* Period stats */}
                    <div className="mt-4 grid grid-cols-2 gap-3 w-full text-center">
                        <div className="glass rounded-xl p-2">
                            <div className="text-sm font-bold text-orange-400">{avgSteps.toLocaleString()}</div>
                            <div className="text-[10px] text-muted-foreground">avg/day</div>
                        </div>
                        <div className="glass rounded-xl p-2">
                            <div className="text-sm font-bold text-emerald-400">{goalDays}</div>
                            <div className="text-[10px] text-muted-foreground">goal days</div>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="lg:col-span-2">
                    <h3 className="font-semibold mb-4">Log Steps</h3>
                    <div className="flex gap-3 mb-4">
                        <Input
                            type="number"
                            placeholder="Enter steps…"
                            value={stepInput}
                            onChange={e => setStepInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && stepInput && addSteps.mutate(Number(stepInput))}
                            className="bg-white/5 border-white/10"
                        />
                        <Button className="bg-orange-500 hover:bg-orange-600 text-black font-semibold"
                            disabled={!stepInput || addSteps.isPending}
                            onClick={() => addSteps.mutate(Number(stepInput))}>
                            <Plus className="w-4 h-4 mr-1" /> Add
                        </Button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mb-6">
                        {quickSteps.map(s => (
                            <motion.button key={s}
                                className="glass rounded-xl p-3 text-center hover:bg-orange-500/10 transition-colors"
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={() => addSteps.mutate(s)}>
                                <Footprints className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                                <div className="text-xs font-bold">+{s.toLocaleString()}</div>
                            </motion.button>
                        ))}
                    </div>

                    {/* Day detail panel */}
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-sm">
                            {detailDate
                                ? <>Logs: <span className="text-orange-400">{format(parseISO(detailDate), 'MMM d')}</span></>
                                : "Today's Entries"}
                        </h3>
                        <div className="flex items-center gap-2">
                            {detailDate && (
                                <>
                                    <button disabled={!canNavPrev} onClick={() => setDetailDate(dateFilter.dateRange[detailIdx - 1])}
                                        className="p-1 rounded-lg hover:bg-white/5 disabled:opacity-30 text-white/50 hover:text-white">
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <button disabled={!canNavNext} onClick={() => setDetailDate(dateFilter.dateRange[detailIdx + 1])}
                                        className="p-1 rounded-lg hover:bg-white/5 disabled:opacity-30 text-white/50 hover:text-white">
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => setDetailDate(null)} className="p-1 rounded-lg hover:bg-white/5 text-white/30">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </>
                            )}
                            {detailLogs.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                    {detailTotal.toLocaleString()} steps · {detailCals} cal
                                </span>
                            )}
                        </div>
                    </div>

                    {detailLogs.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No steps logged. Get moving! 👟</p>
                    ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {detailLogs.map(log => (
                                <div key={log.id} className="flex items-center justify-between glass rounded-xl p-3">
                                    <div className="flex items-center gap-3">
                                        <Footprints className="w-4 h-4 text-orange-400" />
                                        <span className="font-medium text-sm">{log.steps?.toLocaleString()} steps</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-muted-foreground">{log.calories_burned} cal</span>
                                        {log.date === todayStr && (
                                            <button onClick={() => deleteLog.mutate(log.id)}
                                                className="p-1 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>
            </div>

            {/* ── Bar Chart ── */}
            <GlassCard animate={false}>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Footprints className="w-4 h-4 text-orange-400" /> Step History
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Goal met</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Below goal</span>
                        <span className="text-orange-400/70">Avg: {avgSteps.toLocaleString()}</span>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} barSize={chartData.length > 15 ? 8 : 20}
                        onClick={(e) => { if (e?.activePayload?.[0]) setDetailDate(e.activePayload[0].payload.date); }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                        <ReferenceLine y={goal} stroke="#f97316" strokeDasharray="5 5" strokeOpacity={0.5}
                            label={{ value: 'Goal', fill: '#f97316', fontSize: 10, position: 'insideTopRight' }} />
                        <Bar dataKey="steps" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, i) => (
                                <Cell key={i}
                                    fill={entry.date === detailDate ? '#60a5fa' : entry.goalMet ? '#22c55e' : '#f97316'}
                                    fillOpacity={0.85}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
                <p className="text-center text-xs text-muted-foreground mt-2 opacity-60">Click a bar to inspect that day ↑</p>
            </GlassCard>
        </div>
    );
}