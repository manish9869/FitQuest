import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entities } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Pencil, Trash2, Zap, Star, Eye, EyeOff, Loader2, X, GripVertical } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const CATEGORY_COLORS = {
    fat_loss: 'text-orange-400', strength: 'text-red-400', muscle_building: 'text-blue-400',
    hiit: 'text-yellow-400', home_workout: 'text-green-400', mobility: 'text-purple-400', cardio: 'text-cyan-400',
};

const EMPTY = {
    name: '', description: '', category: 'fat_loss', difficulty: 'beginner',
    duration_weeks: '', days_per_week: '', estimated_calories: '', exercises: [],
    image_url: '', is_premium: false, is_published: true,
};

function WorkoutFormDrawer({ open, onClose, plan }) {
    const [form, setForm] = useState(EMPTY);
    const [exerciseSearch, setExerciseSearch] = useState('');
    const [showExLib, setShowExLib] = useState(false);
    const qc = useQueryClient();

    const { data: allExercises = [] } = useQuery({
        queryKey: ['exercises'],
        queryFn: () => entities.Exercise.list('-name', 200),
    });

    React.useEffect(() => {
        setForm(plan ? { ...EMPTY, ...plan, exercises: plan.exercises || [] } : EMPTY);
    }, [plan, open]);

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const save = useMutation({
        mutationFn: (d) => plan ? entities.WorkoutPlan.update(plan.id, d) : entities.WorkoutPlan.create(d),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['workout-plans'] }); onClose(); },
    });

    const addExercise = (ex) => {
        const next = [...form.exercises, { exercise_id: ex.id, exercise_name: ex.name, sets: 3, reps: '10', rest_sec: 60, order: form.exercises.length }];
        set('exercises', next);
        setShowExLib(false);
    };

    const updateEx = (idx, k, v) => {
        const arr = [...form.exercises];
        arr[idx] = { ...arr[idx], [k]: v };
        set('exercises', arr);
    };

    const removeEx = (idx) => set('exercises', form.exercises.filter((_, i) => i !== idx));

    const filteredEx = allExercises.filter(e => e.name?.toLowerCase().includes(exerciseSearch.toLowerCase()));

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div className="fixed inset-0 bg-black/60 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
                    <motion.div className="fixed right-0 top-0 h-full w-full max-w-2xl z-50 flex flex-col"
                        style={{ background: 'hsl(220 20% 5%)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30 }}>
                        <div className="flex items-center justify-between p-5 border-b border-white/5">
                            <h2 className="font-bold font-space">{plan ? 'Edit Workout Plan' : 'New Workout Plan'}</h2>
                            <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-5">
                            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Plan Name *" className="bg-white/5 border-white/10" />
                            <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Description..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none h-20" />
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                                    <select value={form.category} onChange={e => set('category', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground">
                                        {['fat_loss', 'strength', 'muscle_building', 'hiit', 'home_workout', 'mobility', 'cardio'].map(c =>
                                            <option key={c} value={c}>{c.replace('_', ' ')}</option>
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Difficulty</label>
                                    <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground">
                                        {['beginner', 'intermediate', 'advanced'].map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Duration (weeks)</label>
                                    <Input type="number" value={form.duration_weeks} onChange={e => set('duration_weeks', e.target.value)} placeholder="12" className="bg-white/5 border-white/10" />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Days / week</label>
                                    <Input type="number" value={form.days_per_week} onChange={e => set('days_per_week', e.target.value)} placeholder="4" className="bg-white/5 border-white/10" />
                                </div>
                            </div>

                            {/* Exercise Builder */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Exercises ({form.exercises.length})</h3>
                                    <Button type="button" size="sm" variant="ghost" onClick={() => setShowExLib(true)} className="text-blue-400 hover:bg-blue-500/10">
                                        <Plus className="w-3.5 h-3.5" /> Add from Library
                                    </Button>
                                </div>
                                {form.exercises.length === 0 ? (
                                    <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center text-muted-foreground text-sm">
                                        No exercises added yet. Click "Add from Library" to begin.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {form.exercises.map((ex, i) => (
                                            <div key={i} className="glass rounded-lg p-3 flex items-center gap-3">
                                                <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                <div className="flex-1 grid grid-cols-4 gap-2 items-center">
                                                    <div className="text-sm font-medium col-span-2">{ex.exercise_name}</div>
                                                    <Input type="number" value={ex.sets} onChange={e => updateEx(i, 'sets', e.target.value)} placeholder="Sets" className="bg-white/5 border-white/10 h-7 text-xs text-center" />
                                                    <Input value={ex.reps} onChange={e => updateEx(i, 'reps', e.target.value)} placeholder="Reps" className="bg-white/5 border-white/10 h-7 text-xs text-center" />
                                                </div>
                                                <Button size="icon" variant="ghost" onClick={() => removeEx(i)} className="h-7 w-7 text-red-400 hover:bg-red-500/10 flex-shrink-0">
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Settings */}
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.is_premium} onChange={e => set('is_premium', e.target.checked)} />
                                    <span className="text-sm text-yellow-400">Premium</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.is_published} onChange={e => set('is_published', e.target.checked)} />
                                    <span className="text-sm text-emerald-400">Published</span>
                                </label>
                            </div>
                        </div>
                        <div className="p-5 border-t border-white/5 flex gap-3">
                            <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
                            <Button onClick={() => save.mutate({ ...form, duration_weeks: Number(form.duration_weeks) || undefined, days_per_week: Number(form.days_per_week) || undefined })}
                                disabled={save.isPending} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                                {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : plan ? 'Update Plan' : 'Create Plan'}
                            </Button>
                        </div>
                    </motion.div>

                    {/* Exercise Library Modal */}
                    <AnimatePresence>
                        {showExLib && (
                            <motion.div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="absolute inset-0 bg-black/70" onClick={() => setShowExLib(false)} />
                                <motion.div className="relative glass rounded-2xl p-5 w-full max-w-md max-h-[70vh] flex flex-col z-10"
                                    initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold">Exercise Library</h3>
                                        <button onClick={() => setShowExLib(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
                                    </div>
                                    <Input value={exerciseSearch} onChange={e => setExerciseSearch(e.target.value)} placeholder="Search exercises..." className="bg-white/5 border-white/10 mb-3" />
                                    <div className="flex-1 overflow-y-auto space-y-1">
                                        {filteredEx.map(ex => (
                                            <button key={ex.id} onClick={() => addExercise(ex)}
                                                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                                    <Zap className="w-3.5 h-3.5 text-blue-400" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium">{ex.name}</div>
                                                    <div className="text-xs text-muted-foreground capitalize">{ex.muscle_group?.replace('_', ' ')} · {ex.difficulty}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </AnimatePresence>
    );
}

export default function AdminWorkoutPlans() {
    const [search, setSearch] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const qc = useQueryClient();

    const { data: plans = [], isLoading } = useQuery({
        queryKey: ['workout-plans'],
        queryFn: () => entities.WorkoutPlan.list('created_at', false),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => entities.WorkoutPlan.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['workout-plans'] }),
    });

    const filtered = plans.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-space flex items-center gap-2">
                        <Zap className="w-6 h-6 text-orange-400" /> Workout Plans
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">{plans.length} plans created</p>
                </div>
                <Button onClick={() => { setEditing(null); setDrawerOpen(true); }} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                    <Plus className="w-4 h-4" /> New Plan
                </Button>
            </div>

            <div className="glass rounded-xl p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search plans..." className="pl-9 bg-white/5 border-white/10" />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? Array(6).fill(0).map((_, i) => <div key={i} className="glass rounded-xl p-5 h-40 animate-pulse" />) :
                    filtered.map(plan => (
                        <div key={plan.id} className="glass rounded-xl p-5 hover:bg-white/5 transition-all group flex flex-col gap-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="font-semibold">{plan.name}</div>
                                    <div className={`text-xs capitalize mt-0.5 ${CATEGORY_COLORS[plan.category] || 'text-muted-foreground'}`}>{plan.category?.replace('_', ' ')}</div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" variant="ghost" onClick={() => { setEditing(plan); setDrawerOpen(true); }} className="h-7 w-7 hover:bg-blue-500/10 hover:text-blue-400">
                                        <Pencil className="w-3 h-3" />
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(plan.id)} className="h-7 w-7 hover:bg-red-500/10 hover:text-red-400">
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {plan.duration_weeks && <span className="text-xs bg-white/5 px-2 py-0.5 rounded-full">{plan.duration_weeks}w</span>}
                                {plan.days_per_week && <span className="text-xs bg-white/5 px-2 py-0.5 rounded-full">{plan.days_per_week}d/wk</span>}
                                <span className={`text-xs px-2 py-0.5 rounded-full capitalize bg-white/5`}>{plan.difficulty}</span>
                                {plan.is_premium && <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full flex items-center gap-1"><Star className="w-3 h-3" />Premium</span>}
                            </div>
                            <div className="text-xs text-muted-foreground">{plan.exercises?.length || 0} exercises</div>
                            <div className={`text-xs flex items-center gap-1 ${plan.is_published ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                                {plan.is_published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                {plan.is_published ? 'Published' : 'Hidden'}
                            </div>
                        </div>
                    ))}
            </div>

            {!isLoading && filtered.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                    <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No workout plans yet. Create your first plan!</p>
                </div>
            )}

            <WorkoutFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} plan={editing} />
        </div>
    );
}


