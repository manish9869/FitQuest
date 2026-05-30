// pages/WorkoutTracker.jsx  ─  Full fixed version

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { useDateFilter } from '@/lib/useDateFilter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
    Dumbbell, Plus, Trash2, Clock, Flame, Zap,
    ChevronRight, ChevronLeft, Search, Check, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const workoutTypes = {
    strength: 'Strength', cardio: 'Cardio', hiit: 'HIIT',
    yoga: 'Yoga', flexibility: 'Flexibility', sports: 'Sports', other: 'Other'
};
const intensityColors = {
    low: 'text-green-400', moderate: 'text-blue-400',
    high: 'text-orange-400', extreme: 'text-red-400'
};
const typeColors = {
    strength: '#a855f7', cardio: '#3b82f6', hiit: '#ef4444',
    yoga: '#22c55e', flexibility: '#f97316', sports: '#f59e0b', other: '#6b7280'
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.[0]) return null;
    return (
        <div className="glass rounded-xl p-3 text-xs border border-white/10 shadow-xl">
            <p className="text-muted-foreground mb-1">{label}</p>
            <p className="font-bold text-purple-400">{payload[0].value} min</p>
            {payload[1] && <p className="text-red-400">{payload[1].value} cal</p>}
        </div>
    );
};

export default function WorkoutTracker() {
    const { user } = useAuth();
    const qc = useQueryClient();
    const dateFilter = useDateFilter(7);
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState('select');
    const [searchQ, setSearchQ] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [selectedWorkout, setSelectedWorkout] = useState(null);
    const [detailDate, setDetailDate] = useState(null);
    const [form, setForm] = useState({
        workout_type: 'strength', name: '', duration_min: '',
        calories_burned: '', intensity: 'moderate'
    });

    /* ── Data ── */
    const { data: allWorkouts = [] } = useQuery({
        queryKey: ['workouts-all', user?.email],
        queryFn: () => entities.WorkoutLog.filter({ user_email: user?.email }),
        enabled: !!user?.email,
        staleTime: 1000 * 60 * 2,
    });

    const { data: templates = [] } = useQuery({
        queryKey: ['workout-templates'],
        queryFn: () => entities.WorkoutTemplate.filter({ is_active: true }, 'sort_order', true),
    });

    const todayStr = dateFilter.todayStr;
    const todayWorkouts = useMemo(() => allWorkouts.filter(w => w.date === todayStr), [allWorkouts, todayStr]);

    /* ── Chart ── */
    const chartData = useMemo(() =>
        dateFilter.dateRange.map(date => {
            const dayW = allWorkouts.filter(w => w.date === date);
            return {
                date,
                label: format(parseISO(date), dateFilter.dateRange.length <= 7 ? 'EEE' : dateFilter.dateRange.length <= 31 ? 'MMM d' : 'MMM'),
                duration: dayW.reduce((s, w) => s + (w.duration_min || 0), 0),
                calories: dayW.reduce((s, w) => s + (w.calories_burned || 0), 0),
                count: dayW.length,
            };
        }),
        [dateFilter.dateRange, allWorkouts]
    );

    /* ── Detail view ── */
    const detailWorkouts = useMemo(() =>
        allWorkouts.filter(w => w.date === (detailDate ?? todayStr)),
        [allWorkouts, detailDate, todayStr]
    );
    const detailDuration = detailWorkouts.reduce((s, w) => s + (w.duration_min || 0), 0);
    const detailCalories = detailWorkouts.reduce((s, w) => s + (w.calories_burned || 0), 0);
    const detailIdx = detailDate ? dateFilter.dateRange.indexOf(detailDate) : -1;
    const canNavPrev = detailIdx > 0;
    const canNavNext = detailIdx < dateFilter.dateRange.length - 1;

    /* ── Stats for selected/today ── */
    const activeDays = chartData.filter(d => d.count > 0).length;

    /* ── Mutations ── */
    const addWorkout = useMutation({
        mutationFn: (data) => entities.WorkoutLog.create({ ...data, user_email: user.email, date: todayStr }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['workouts-all'] });
            setOpen(false); setStep('select'); setSelectedWorkout(null);
            setForm({ workout_type: 'strength', name: '', duration_min: '', calories_burned: '', intensity: 'moderate' });
        },
    });

    const deleteWorkout = useMutation({
        mutationFn: (id) => entities.WorkoutLog.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['workouts-all'] }),
    });

    /* ── Library filter ── */
    const filteredLibrary = useMemo(() => templates.filter(w => {
        const matchSearch = !searchQ || w.name.toLowerCase().includes(searchQ.toLowerCase());
        const matchType = selectedType === 'all' || w.workout_type === selectedType;
        return matchSearch && matchType;
    }), [templates, searchQ, selectedType]);

    const selectWorkoutTemplate = (w) => {
        setSelectedWorkout(w);
        const dur = w.default_duration_min || 30;
        setForm({
            workout_type: w.workout_type, name: w.name,
            duration_min: String(dur),
            calories_burned: String(Math.round((w.cal_per_min || 5) * dur)),
            intensity: w.intensity || 'moderate',
        });
        setStep('confirm');
    };

    const handleDurationChange = (val) => {
        const dur = Number(val) || 0;
        setForm(f => ({ ...f, duration_min: val, calories_burned: String(Math.round((selectedWorkout?.cal_per_min || 5) * dur)) }));
    };

    /* ─────────────────────────────────────── */
    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h1 className="text-2xl font-space font-bold">Workout Tracker</h1>
                <div className="flex items-center gap-2">
                    <DateRangePicker
                        preset={dateFilter.preset}
                        startDate={dateFilter.startDate}
                        endDate={dateFilter.endDate}
                        isCustom={dateFilter.isCustom}
                        onSelectPreset={dateFilter.selectPreset}
                        onSelectCustom={dateFilter.selectCustom}
                    />
                    <Link to="/dashboard/smart-fit">
                        <Button variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 rounded-xl">
                            <Zap className="w-4 h-4 mr-2" /> SmartFit AI
                        </Button>
                    </Link>
                    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setStep('select'); setSelectedWorkout(null); } }}>
                        <DialogTrigger asChild>
                            <Button className="bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl">
                                <Plus className="w-4 h-4 mr-2" /> Log Workout
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="glass border-white/10 max-w-2xl max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    {step === 'select'
                                        ? <><Search className="w-5 h-5 text-purple-400" /> Choose Workout</>
                                        : <><Check className="w-5 h-5 text-emerald-400" /> Confirm & Log</>}
                                </DialogTitle>
                            </DialogHeader>

                            {step === 'select' ? (
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                                                placeholder="Search workouts…" className="pl-9 bg-white/5 border-white/10" />
                                        </div>
                                        <Select value={selectedType} onValueChange={setSelectedType}>
                                            <SelectTrigger className="w-32 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Types</SelectItem>
                                                {Object.entries(workoutTypes).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto pr-1">
                                        {filteredLibrary.map(w => (
                                            <button key={w.id} onClick={() => selectWorkoutTemplate(w)}
                                                className="glass rounded-xl p-3 text-left border border-white/5 hover:border-purple-500/40 transition-all group">
                                                {w.emoji && <div className="text-lg mb-1">{w.emoji}</div>}
                                                <div className="text-sm font-medium group-hover:text-purple-400 transition-colors">{w.name}</div>
                                                <div className="text-xs text-muted-foreground mt-1">{w.default_duration_min}m · ~{Math.round((w.cal_per_min || 5) * (w.default_duration_min || 30))} cal</div>
                                                <div className={`text-[10px] capitalize mt-1 ${intensityColors[w.intensity]}`}>{w.intensity}</div>
                                            </button>
                                        ))}
                                        {filteredLibrary.length === 0 && (
                                            <div className="col-span-full text-center py-8 text-muted-foreground text-sm">No templates found.</div>
                                        )}
                                    </div>
                                    <div className="border-t border-white/5 pt-3">
                                        <button className="text-sm text-muted-foreground hover:text-white" onClick={() => setStep('confirm')}>
                                            + Log custom workout manually
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {selectedWorkout && (
                                        <div className="glass rounded-xl p-3 border border-purple-500/20 flex items-center gap-3">
                                            {selectedWorkout.emoji && <span className="text-2xl">{selectedWorkout.emoji}</span>}
                                            <div>
                                                <div className="font-medium">{selectedWorkout.name}</div>
                                                <div className="text-xs text-muted-foreground">Auto-filled · edit if needed</div>
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <Label>Workout Name</Label>
                                        <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1 bg-white/5 border-white/10" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label>Type</Label>
                                            <Select value={form.workout_type} onValueChange={v => setForm(f => ({ ...f, workout_type: v }))}>
                                                <SelectTrigger className="mt-1 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                                <SelectContent>{Object.entries(workoutTypes).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Intensity</Label>
                                            <Select value={form.intensity} onValueChange={v => setForm(f => ({ ...f, intensity: v }))}>
                                                <SelectTrigger className="mt-1 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="low">Low</SelectItem>
                                                    <SelectItem value="moderate">Moderate</SelectItem>
                                                    <SelectItem value="high">High</SelectItem>
                                                    <SelectItem value="extreme">Extreme</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><Label>Duration (min)</Label><Input type="number" value={form.duration_min} onChange={e => handleDurationChange(e.target.value)} className="mt-1 bg-white/5 border-white/10" /></div>
                                        <div><Label>Calories Burned</Label><Input type="number" value={form.calories_burned} onChange={e => setForm(f => ({ ...f, calories_burned: e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" className="border-white/10" onClick={() => setStep('select')}>Back</Button>
                                        <Button className="flex-1 bg-purple-500 hover:bg-purple-600 font-semibold"
                                            disabled={!form.name || addWorkout.isPending}
                                            onClick={() => addWorkout.mutate({ ...form, duration_min: Number(form.duration_min) || 0, calories_burned: Number(form.calories_burned) || 0 })}>
                                            {addWorkout.isPending ? 'Logging…' : 'Log Workout'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { icon: Dumbbell, label: 'Today', value: todayWorkouts.length, color: 'text-purple-400' },
                    { icon: Clock, label: 'Duration', value: `${todayWorkouts.reduce((s, w) => s + (w.duration_min || 0), 0)}m`, color: 'text-blue-400' },
                    { icon: Flame, label: 'Burned', value: `${todayWorkouts.reduce((s, w) => s + (w.calories_burned || 0), 0)} cal`, color: 'text-red-400' },
                ].map(s => (
                    <GlassCard key={s.label} className="text-center">
                        <s.icon className={`w-6 h-6 ${s.color} mx-auto mb-2`} />
                        <div className="text-xl font-bold font-space">{s.value}</div>
                        <div className="text-xs text-muted-foreground">{s.label}</div>
                    </GlassCard>
                ))}
            </div>

            {/* ── Duration Bar Chart ── */}
            <GlassCard animate={false}>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Dumbbell className="w-4 h-4 text-purple-400" /> Workout History
                    </h3>
                    <span className="text-xs text-muted-foreground">{activeDays} active days in period</span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} barSize={chartData.length > 15 ? 8 : 20}
                        onClick={(e) => { if (e?.activePayload?.[0]) setDetailDate(e.activePayload[0].payload.date); }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                        <Bar dataKey="duration" radius={[4, 4, 0, 0]} name="Duration (min)">
                            {chartData.map((entry, i) => (
                                <Cell key={i}
                                    fill={entry.date === detailDate ? '#60a5fa' : entry.count > 0 ? '#a855f7' : 'rgba(255,255,255,0.05)'}
                                    fillOpacity={0.85}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
                <p className="text-center text-xs text-muted-foreground mt-2 opacity-60">Click a bar to inspect that day ↑</p>
            </GlassCard>

            {/* ── SmartFit Banner ── */}
            <Link to="/dashboard/smart-fit">
                <div className="glass rounded-2xl p-4 border border-purple-500/20 hover:border-purple-500/40 transition-all flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <div className="font-semibold text-sm">SmartFit AI Workout Generator</div>
                            <div className="text-xs text-muted-foreground">Get a personalized AI workout plan</div>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-purple-400 transition-colors" />
                </div>
            </Link>

            {/* ── Day Detail ── */}
            <GlassCard animate={false}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">
                        {detailDate
                            ? <>Workouts on <span className="text-purple-400">{format(parseISO(detailDate), 'EEEE, MMM d')}</span></>
                            : <>Today's Workouts <span className="text-muted-foreground font-normal text-sm">({format(parseISO(todayStr), 'MMM d')})</span></>
                        }
                    </h3>
                    <div className="flex items-center gap-2">
                        {detailDate && (
                            <>
                                <button disabled={!canNavPrev} onClick={() => setDetailDate(dateFilter.dateRange[detailIdx - 1])}
                                    className="p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-30 text-white/50 hover:text-white">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button disabled={!canNavNext} onClick={() => setDetailDate(dateFilter.dateRange[detailIdx + 1])}
                                    className="p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-30 text-white/50 hover:text-white">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                                <button onClick={() => setDetailDate(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/30">
                                    <X className="w-4 h-4" />
                                </button>
                            </>
                        )}
                        {detailWorkouts.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                                {detailDuration}min · {detailCalories} cal
                            </span>
                        )}
                    </div>
                </div>

                {detailWorkouts.length === 0 ? (
                    <div className="text-center py-10">
                        <Dumbbell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground text-sm">
                            {detailDate
                                ? `No workouts on ${format(parseISO(detailDate), 'MMM d')}`
                                : 'No workouts today. Time to hit the gym! 💪'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence>
                            {detailWorkouts.map(w => (
                                <motion.div key={w.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                    <div className="glass rounded-2xl p-4 flex items-center justify-between border border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                                                style={{ backgroundColor: `${typeColors[w.workout_type] || '#6b7280'}20` }}>
                                                <Dumbbell className="w-6 h-6" style={{ color: typeColors[w.workout_type] || '#6b7280' }} />
                                            </div>
                                            <div>
                                                <div className="font-semibold">{w.name}</div>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap mt-0.5">
                                                    <span className="capitalize">{workoutTypes[w.workout_type]}</span>
                                                    <span>•</span><span>{w.duration_min}min</span>
                                                    <span>•</span><span className={intensityColors[w.intensity]}>{w.intensity}</span>
                                                    <span>•</span><span className="text-red-400">{w.calories_burned} cal</span>
                                                </div>
                                            </div>
                                        </div>
                                        {w.date === todayStr && (
                                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-400"
                                                onClick={() => deleteWorkout.mutate(w.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </GlassCard>
        </div>
    );
}