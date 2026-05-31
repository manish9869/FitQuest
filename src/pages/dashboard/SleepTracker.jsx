// pages/SleepTracker.jsx  ─  Full fixed version

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import GlassCard from '@/components/ui/GlassCard';
import ProgressRing from '@/components/ui/ProgressRing';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { useDateFilter } from '@/lib/useDateFilter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Moon, Plus, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.[0]) return null;
    return (
        <div className="glass rounded-xl p-3 text-xs border border-white/10 shadow-xl">
            <p className="text-muted-foreground mb-1">{label}</p>
            <p className="font-bold text-purple-400">{payload[0].value}h sleep</p>
        </div>
    );
};

const qualityColors = {
    poor: 'text-red-400',
    fair: 'text-yellow-400',
    good: 'text-blue-400',
    excellent: 'text-emerald-400',
};
const qualityEmoji = { poor: '😴', fair: '😐', good: '😊', excellent: '🌟' };

export default function SleepTracker() {
    const { user } = useAuth();
    const qc = useQueryClient();
    const dateFilter = useDateFilter(7);
    const [open, setOpen] = useState(false);
    const [detailDate, setDetailDate] = useState(null);
    const [form, setForm] = useState({ hours: '', quality: 'good', bed_time: '', wake_time: '' });

    /* ── Profile ── */
    const { data: profiles } = useQuery({
        queryKey: ['userProfile', user?.email],
        queryFn: () => entities.UserProfile.filter({ user_email: user?.email }),
        enabled: !!user?.email,
    });
    const profile = profiles?.[0];
    const sleepGoal = profile?.sleep_hours || 8;

    /* ── All logs ── */
    const { data: allLogs = [] } = useQuery({
        queryKey: ['sleep-all', user?.email],
        queryFn: () => entities.SleepLog.filter({ user_email: user?.email }),
        enabled: !!user?.email,
        staleTime: 1000 * 60 * 2,
    });

    const todayStr = dateFilter.todayStr;
    const todayLogs = useMemo(() => allLogs.filter(l => l.date === todayStr), [allLogs, todayStr]);
    const todayTotal = todayLogs.reduce((s, l) => s + (l.hours || 0), 0);

    /* ── Chart data ── */
    const chartData = useMemo(() =>
        dateFilter.dateRange.map(date => {
            const hours = allLogs.filter(l => l.date === date).reduce((s, l) => s + (l.hours || 0), 0);
            return {
                date,
                label: format(parseISO(date), dateFilter.dateRange.length <= 7 ? 'EEE' : dateFilter.dateRange.length <= 31 ? 'MMM d' : 'MMM'),
                hours,
                goalMet: hours >= sleepGoal,
            };
        }),
        [dateFilter.dateRange, allLogs, sleepGoal]
    );

    const activeDays = chartData.filter(d => d.hours > 0);
    const avgSleep = activeDays.length
        ? (activeDays.reduce((s, d) => s + d.hours, 0) / activeDays.length).toFixed(1)
        : '0.0';

    /* ── Detail view ── */
    const detailLogs = useMemo(() =>
        allLogs.filter(l => l.date === (detailDate ?? todayStr)),
        [allLogs, detailDate, todayStr]
    );
    const detailIdx = detailDate ? dateFilter.dateRange.indexOf(detailDate) : -1;
    const canNavPrev = detailIdx > 0;
    const canNavNext = detailIdx < dateFilter.dateRange.length - 1;

    /* ── Mutations ── */
    const addSleep = useMutation({
        mutationFn: (data) => entities.SleepLog.create({ ...data, user_email: user.email, date: todayStr }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['sleep-all'] });
            setOpen(false);
            setForm({ hours: '', quality: 'good', bed_time: '', wake_time: '' });
        },
    });

    const deleteSleep = useMutation({
        mutationFn: (id) => entities.SleepLog.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['sleep-all'] }),
    });

    /* ─────────────────────────────────── */
    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h1 className="text-2xl font-space font-bold">Sleep Tracker</h1>
                <div className="flex items-center gap-2">
                    <DateRangePicker
                        preset={dateFilter.preset}
                        startDate={dateFilter.startDate}
                        endDate={dateFilter.endDate}
                        isCustom={dateFilter.isCustom}
                        onSelectPreset={dateFilter.selectPreset}
                        onSelectCustom={dateFilter.selectCustom}
                    />
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl">
                                <Plus className="w-4 h-4 mr-2" /> Log Sleep
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="glass border-white/10">
                            <DialogHeader><DialogTitle>Log Sleep</DialogTitle></DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label>Hours Slept</Label>
                                    <Input type="number" step="0.5" value={form.hours}
                                        onChange={e => setForm(f => ({ ...f, hours: e.target.value }))}
                                        placeholder="e.g. 7.5" className="mt-1 bg-white/5 border-white/10" />
                                </div>
                                <div>
                                    <Label>Quality</Label>
                                    <Select value={form.quality} onValueChange={v => setForm(f => ({ ...f, quality: v }))}>
                                        <SelectTrigger className="mt-1 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="poor">Poor 😴</SelectItem>
                                            <SelectItem value="fair">Fair 😐</SelectItem>
                                            <SelectItem value="good">Good 😊</SelectItem>
                                            <SelectItem value="excellent">Excellent 🌟</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><Label>Bed Time</Label><Input type="time" value={form.bed_time} onChange={e => setForm(f => ({ ...f, bed_time: e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
                                    <div><Label>Wake Time</Label><Input type="time" value={form.wake_time} onChange={e => setForm(f => ({ ...f, wake_time: e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
                                </div>
                                <Button className="w-full bg-indigo-500 hover:bg-indigo-600 font-semibold"
                                    disabled={!form.hours || addSleep.isPending}
                                    onClick={() => addSleep.mutate({ ...form, hours: Number(form.hours) })}>
                                    {addSleep.isPending ? 'Logging…' : 'Log Sleep'}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* ── Ring + Stats ── */}
            <div className="grid lg:grid-cols-3 gap-6">
                <GlassCard className="flex flex-col items-center">
                    <p className="text-xs text-muted-foreground mb-3 uppercase tracking-widest">Last Night</p>
                    <ProgressRing value={todayTotal} max={sleepGoal} size={180} strokeWidth={12} color="#a855f7">
                        <div className="text-center">
                            <Moon className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                            <div className="text-3xl font-bold font-space text-purple-400">{todayTotal}h</div>
                            <div className="text-xs text-muted-foreground">/ {sleepGoal}h goal</div>
                        </div>
                    </ProgressRing>
                    <div className="mt-3 text-center space-y-1">
                        <p className="text-xs text-muted-foreground">
                            Avg (period): <span className="text-purple-400 font-semibold">{avgSleep}h</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Goal days: <span className="text-emerald-400 font-semibold">{chartData.filter(d => d.goalMet).length}/{chartData.length}</span>
                        </p>
                    </div>
                </GlassCard>

                {/* ── Day Detail ── */}
                <GlassCard className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">
                            {detailDate
                                ? <>Sleep on <span className="text-purple-400">{format(parseISO(detailDate), 'EEEE, MMM d')}</span></>
                                : 'Today\'s Sleep Entries'}
                        </h3>
                        {detailDate && (
                            <div className="flex items-center gap-1">
                                <button disabled={!canNavPrev} onClick={() => setDetailDate(dateFilter.dateRange[detailIdx - 1])}
                                    className="p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-30 text-white/50 hover:text-white transition-all">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button disabled={!canNavNext} onClick={() => setDetailDate(dateFilter.dateRange[detailIdx + 1])}
                                    className="p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-30 text-white/50 hover:text-white transition-all">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                                <button onClick={() => setDetailDate(null)} className="ml-1 p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {detailLogs.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No sleep logged. Sweet dreams! 🌙</p>
                    ) : (
                        <div className="space-y-3 max-h-56 overflow-y-auto">
                            {detailLogs.map(log => (
                                <div key={log.id} className="flex items-center justify-between glass rounded-xl p-4">
                                    <div>
                                        <div className="font-semibold flex items-center gap-2">
                                            {log.hours} hours
                                            <span className="text-base">{qualityEmoji[log.quality]}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                            <span className={qualityColors[log.quality]}>{log.quality}</span>
                                            {log.bed_time && <span>🛏 {log.bed_time}</span>}
                                            {log.wake_time && <span>⏰ {log.wake_time}</span>}
                                        </div>
                                    </div>
                                    {log.date === todayStr && (
                                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-400"
                                            onClick={() => deleteSleep.mutate(log.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
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
                        <Moon className="w-4 h-4 text-purple-400" /> Sleep History
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Goal met</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-400 inline-block" /> Below goal</span>
                        {detailDate && (
                            <button onClick={() => setDetailDate(null)} className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                <X className="w-3 h-3" /> Clear
                            </button>
                        )}
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} barSize={chartData.length > 15 ? 8 : 20}
                        onClick={(e) => { if (e?.activePayload?.[0]) setDetailDate(e.activePayload[0].payload.date); }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} domain={[0, Math.max(sleepGoal + 2, 10)]} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                        <ReferenceLine y={sleepGoal} stroke="#a855f7" strokeDasharray="5 5" strokeOpacity={0.5}
                            label={{ value: 'Goal', fill: '#a855f7', fontSize: 10, position: 'insideTopRight' }} />
                        <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, i) => (
                                <Cell key={i}
                                    fill={entry.date === detailDate ? '#60a5fa' : entry.goalMet ? '#22c55e' : '#a855f7'}
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