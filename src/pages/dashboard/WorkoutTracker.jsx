import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { today } from '@/lib/fitnessUtils';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Dumbbell, Plus, Trash2, Clock, Flame, Zap, ChevronRight, Search, Check, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import DatePicker from '@/components/ui/DatePicker';
import TrackerHistoryChart from '@/components/dashboard/TrackerHistoryChart';

const workoutTypes = { strength: 'Strength', cardio: 'Cardio', hiit: 'HIIT', yoga: 'Yoga', flexibility: 'Flexibility', sports: 'Sports', other: 'Other' };
const intensityColors = { low: 'text-green-400', moderate: 'text-blue-400', high: 'text-orange-400', extreme: 'text-red-400' };

export default function WorkoutTracker() {
    const { user } = useAuth();
    const qc = useQueryClient();
    const [selectedDate, setSelectedDate] = useState(today());
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState('select');
    const [searchQ, setSearchQ] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [selectedWorkout, setSelectedWorkout] = useState(null);
    const [form, setForm] = useState({ workout_type: 'strength', name: '', duration_min: '', calories_burned: '', intensity: 'moderate' });

    const { data: workouts = [] } = useQuery({
        queryKey: ['workouts', selectedDate, user?.email],
        queryFn: () => entities.WorkoutLog.filter({ user_email: user?.email, date: selectedDate }),
        enabled: !!user?.email,
    });
    const { data: allWorkouts = [] } = useQuery({
        queryKey: ['workouts-history', user?.email],
        queryFn: () => entities.WorkoutLog.filter({ user_email: user?.email }),
        enabled: !!user?.email,
    });

    // Workout templates from DB (admin-managed)
    const { data: templates = [] } = useQuery({
        queryKey: ['workout-templates'],
        queryFn: () => entities.WorkoutTemplate.filter({ is_active: true }, 'sort_order'),
    });

    const addWorkout = useMutation({
        mutationFn: (data) => entities.WorkoutLog.create({ ...data, user_email: user.email, date: selectedDate }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['workouts'] });
            setOpen(false); setStep('select'); setSelectedWorkout(null);
            setForm({ workout_type: 'strength', name: '', duration_min: '', calories_burned: '', intensity: 'moderate' });
        },
    });

    const deleteWorkout = useMutation({
        mutationFn: (id) => entities.WorkoutLog.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['workouts'] }),
    });

    const totalDuration = workouts.reduce((s, w) => s + (w.duration_min || 0), 0);
    const totalCalories = workouts.reduce((s, w) => s + (w.calories_burned || 0), 0);

    const totalAllWorkouts = allWorkouts.length;
    const totalAllCals = useMemo(() => allWorkouts.reduce((s, w) => s + (w.calories_burned || 0), 0), [allWorkouts]);
    const totalAllMins = useMemo(() => allWorkouts.reduce((s, w) => s + (w.duration_min || 0), 0), [allWorkouts]);

    const filteredLibrary = useMemo(() => templates.filter(w => {
        const matchSearch = !searchQ || w.name.toLowerCase().includes(searchQ.toLowerCase());
        const matchType = selectedType === 'all' || w.workout_type === selectedType;
        return matchSearch && matchType;
    }), [templates, searchQ, selectedType]);

    const selectWorkout = (w) => {
        setSelectedWorkout(w);
        const dur = w.default_duration_min || 30;
        setForm({
            workout_type: w.workout_type,
            name: w.name,
            duration_min: String(dur),
            calories_burned: String(Math.round((w.cal_per_min || 5) * dur)),
            intensity: w.intensity || 'moderate',
        });
        setStep('confirm');
    };

    const handleDurationChange = (val) => {
        const dur = Number(val) || 0;
        const calPerMin = selectedWorkout?.cal_per_min || 5;
        setForm(f => ({ ...f, duration_min: val, calories_burned: String(Math.round(calPerMin * dur)) }));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-space font-bold">Workout Tracker</h1>
                    <div className="mt-2"><DatePicker date={selectedDate} onChange={setSelectedDate} /></div>
                </div>
                <div className="flex gap-2">
                    <Link to="/dashboard/smart-fit">
                        <Button variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 rounded-xl">
                            <Zap className="w-4 h-4 mr-2" /> SmartFit AI
                        </Button>
                    </Link>
                    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setStep('select'); setSelectedWorkout(null); } }}>
                        <DialogTrigger asChild>
                            <Button className="bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl"><Plus className="w-4 h-4 mr-2" /> Log Workout</Button>
                        </DialogTrigger>
                        <DialogContent className="glass border-white/10 max-w-2xl max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    {step === 'select' ? <><Search className="w-5 h-5 text-purple-400" /> Choose Workout</> : <><Check className="w-5 h-5 text-emerald-400" /> Confirm & Log</>}
                                </DialogTitle>
                            </DialogHeader>

                            {step === 'select' ? (
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search workouts..." className="pl-9 bg-white/5 border-white/10" />
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
                                        {filteredLibrary.map((w) => (
                                            <button key={w.id} onClick={() => selectWorkout(w)}
                                                className="glass rounded-xl p-3 text-left border border-white/5 hover:border-purple-500/40 transition-all group">
                                                {w.emoji && <div className="text-lg mb-1">{w.emoji}</div>}
                                                <div className="text-sm font-medium group-hover:text-purple-400 transition-colors">{w.name}</div>
                                                <div className="text-xs text-muted-foreground mt-1">{w.default_duration_min}m · ~{Math.round((w.cal_per_min || 5) * (w.default_duration_min || 30))} cal</div>
                                                <div className={`text-[10px] capitalize mt-1 ${intensityColors[w.intensity]}`}>{w.intensity}</div>
                                            </button>
                                        ))}
                                        {filteredLibrary.length === 0 && (
                                            <div className="col-span-full text-center py-8 text-muted-foreground text-sm">No templates found. Add via Admin.</div>
                                        )}
                                    </div>
                                    <div className="border-t border-white/5 pt-3">
                                        <button className="text-sm text-muted-foreground hover:text-white transition-colors" onClick={() => setStep('confirm')}>
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
                                                <div className="text-xs text-muted-foreground">Auto-filled · edit below if needed</div>
                                            </div>
                                        </div>
                                    )}
                                    <div><Label>Workout Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Upper Body Strength" className="mt-1 bg-white/5 border-white/10" /></div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><Label>Type</Label>
                                            <Select value={form.workout_type} onValueChange={v => setForm(f => ({ ...f, workout_type: v }))}>
                                                <SelectTrigger className="mt-1 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                                <SelectContent>{Object.entries(workoutTypes).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div><Label>Intensity</Label>
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
                                        <div>
                                            <Label>Duration (min)</Label>
                                            <Input type="number" value={form.duration_min} onChange={e => handleDurationChange(e.target.value)} className="mt-1 bg-white/5 border-white/10" />
                                            {selectedWorkout && <p className="text-[10px] text-emerald-400 mt-1">Calories auto-calculated</p>}
                                        </div>
                                        <div>
                                            <Label>Calories Burned</Label>
                                            <Input type="number" value={form.calories_burned} onChange={e => setForm(f => ({ ...f, calories_burned: e.target.value }))} className="mt-1 bg-white/5 border-white/10" />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" className="border-white/10" onClick={() => setStep('select')}>Back</Button>
                                        <Button className="flex-1 bg-purple-500 hover:bg-purple-600 font-semibold" disabled={!form.name || addWorkout.isPending}
                                            onClick={() => addWorkout.mutate({ ...form, duration_min: Number(form.duration_min) || 0, calories_burned: Number(form.calories_burned) || 0 })}>
                                            {addWorkout.isPending ? 'Logging...' : 'Log Workout'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* All-time stats */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Total Workouts', value: totalAllWorkouts, sub: 'all time', color: 'text-purple-400' },
                    { label: 'Cals Burned', value: totalAllCals.toLocaleString(), sub: 'all time', color: 'text-red-400' },
                    { label: 'Active Time', value: `${Math.round(totalAllMins / 60)}h`, sub: `${totalAllMins} mins`, color: 'text-blue-400' },
                ].map(s => (
                    <GlassCard key={s.label} animate={false} className="text-center py-3">
                        <div className={`text-xl font-bold font-space ${s.color}`}>{s.value}</div>
                        <div className="text-xs text-muted-foreground">{s.label}</div>
                        <div className="text-[10px] text-muted-foreground/60">{s.sub}</div>
                    </GlassCard>
                ))}
            </div>

            {/* History charts */}
            <div className="grid md:grid-cols-2 gap-4">
                <TrackerHistoryChart
                    logs={allWorkouts}
                    dataKey="calories_burned"
                    label="Calories Burned History"
                    color="#a855f7"
                    unit="cal"
                    type="bar"
                />
                <TrackerHistoryChart
                    logs={allWorkouts}
                    dataKey="duration_min"
                    label="Workout Duration History"
                    color="#3b82f6"
                    unit="min"
                    type="area"
                />
            </div>

            <div className="grid grid-cols-3 gap-4">
                {[
                    { icon: Dumbbell, label: 'Workouts', value: workouts.length, color: 'text-purple-400' },
                    { icon: Clock, label: 'Duration', value: `${totalDuration}m`, color: 'text-blue-400' },
                    { icon: Flame, label: 'Burned', value: `${totalCalories} cal`, color: 'text-red-400' },
                ].map(s => (
                    <GlassCard key={s.label} className="text-center">
                        <s.icon className={`w-6 h-6 ${s.color} mx-auto mb-2`} />
                        <div className="text-xl font-bold font-space">{s.value}</div>
                        <div className="text-xs text-muted-foreground">{s.label}</div>
                    </GlassCard>
                ))}
            </div>

            <Link to="/dashboard/smart-fit">
                <div className="glass rounded-2xl p-4 border border-purple-500/20 hover:border-purple-500/40 transition-all flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <div className="font-semibold text-sm">SmartFit AI Workout Generator</div>
                            <div className="text-xs text-muted-foreground">Get a personalized AI workout plan with weekly calendar & nutrition tips</div>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-purple-400 transition-colors" />
                </div>
            </Link>

            {workouts.length === 0 ? (
                <GlassCard className="text-center py-12">
                    <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No workouts logged today. Time to hit the gym! 💪</p>
                </GlassCard>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {workouts.map(w => (
                            <motion.div key={w.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <GlassCard animate={false} className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                            <Dumbbell className="w-6 h-6 text-purple-400" />
                                        </div>
                                        <div>
                                            <div className="font-semibold">{w.name}</div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                                <span className="capitalize">{workoutTypes[w.workout_type] || w.workout_type}</span>
                                                <span>•</span><span>{w.duration_min}min</span>
                                                <span>•</span><span className={intensityColors[w.intensity]}>{w.intensity}</span>
                                                <span>•</span><span className="text-red-400">{w.calories_burned} cal</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-400" onClick={() => deleteWorkout.mutate(w.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}