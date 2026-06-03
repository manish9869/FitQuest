import React, { useState } from 'react';
import { entities } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Clock, Flame, ChevronRight, LayoutGrid, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const difficultyColor = { beginner: 'text-emerald-400 bg-emerald-500/10', intermediate: 'text-yellow-400 bg-yellow-500/10', advanced: 'text-red-400 bg-red-500/10' };
const categoryColor = { fat_loss: 'bg-orange-500/10 text-orange-400', strength: 'bg-red-500/10 text-red-400', muscle_building: 'bg-purple-500/10 text-purple-400', hiit: 'bg-pink-500/10 text-pink-400', home_workout: 'bg-blue-500/10 text-blue-400', mobility: 'bg-teal-500/10 text-teal-400', cardio: 'bg-cyan-500/10 text-cyan-400' };

export default function WorkoutPlans() {
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('all');
    const [diffFilter, setDiffFilter] = useState('all');
    const [selected, setSelected] = useState(null);

    const { data: plans = [], isLoading } = useQuery({
        queryKey: ['workout-plans'],
        queryFn: () => entities.WorkoutPlan.filter({ is_published: true }, 'difficulty'),
    });

    const filtered = plans.filter(p => {
        const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
        const matchCat = catFilter === 'all' || p.category === catFilter;
        const matchDiff = diffFilter === 'all' || p.difficulty === diffFilter;
        return matchSearch && matchCat && matchDiff;
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-space font-bold flex items-center gap-2">
                    <LayoutGrid className="w-7 h-7 text-purple-400" /> Workout Plans
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Expert-designed training programs for every goal</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search plans..." className="pl-9 bg-white/5 border-white/10" />
                </div>
                <Select value={catFilter} onValueChange={setCatFilter}>
                    <SelectTrigger className="w-40 bg-white/5 border-white/10"><Filter className="w-3.5 h-3.5 mr-2" /><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {['fat_loss', 'strength', 'muscle_building', 'hiit', 'home_workout', 'mobility', 'cardio'].map(c => (
                            <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={diffFilter} onValueChange={setDiffFilter}>
                    <SelectTrigger className="w-36 bg-white/5 border-white/10"><SelectValue placeholder="Level" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {isLoading ? (
                <div className="text-center py-16 text-muted-foreground">Loading plans...</div>
            ) : filtered.length === 0 ? (
                <GlassCard animate={false} className="text-center py-16">
                    <Dumbbell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" />
                    <p className="text-muted-foreground">No workout plans found. Try adjusting filters.</p>
                </GlassCard>
            ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((plan, i) => (
                        <motion.div key={plan.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                            <button onClick={() => setSelected(plan)} className="w-full text-left glass rounded-2xl overflow-hidden border border-white/5 hover:border-purple-500/30 transition-all group">
                                {plan.image_url ? (
                                    <div className="h-36 overflow-hidden">
                                        <img src={plan.image_url} alt={plan.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                ) : (
                                    <div className="h-36 bg-gradient-to-br from-purple-500/20 to-blue-500/10 flex items-center justify-center">
                                        <Dumbbell className="w-10 h-10 text-purple-400 opacity-50" />
                                    </div>
                                )}
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h3 className="font-semibold text-sm group-hover:text-purple-400 transition-colors">{plan.name}</h3>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColor[plan.difficulty]}`}>{plan.difficulty}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor[plan.category] || 'bg-white/5 text-muted-foreground'}`}>{plan.category?.replace('_', ' ')}</span>
                                        {plan.is_premium && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 font-medium">Premium</span>}
                                    </div>
                                    {plan.description && <p className="text-xs text-muted-foreground line-clamp-2">{plan.description}</p>}
                                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                        {plan.duration_weeks && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{plan.duration_weeks}w</span>}
                                        {plan.days_per_week && <span className="flex items-center gap-1"><Dumbbell className="w-3 h-3" />{plan.days_per_week}d/wk</span>}
                                        {plan.estimated_calories && <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{plan.estimated_calories} cal</span>}
                                    </div>
                                </div>
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Plan Detail Dialog */}
            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent className="glass border-white/10 max-w-2xl max-h-[85vh] overflow-y-auto">
                    {selected && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-lg font-bold">{selected.name}</DialogTitle>
                            </DialogHeader>
                            {selected.image_url && (
                                <img src={selected.image_url} alt={selected.name} className="w-full h-48 object-cover rounded-xl" />
                            )}
                            <div className="flex flex-wrap gap-2">
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${difficultyColor[selected.difficulty]}`}>{selected.difficulty}</span>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${categoryColor[selected.category] || 'bg-white/5 text-muted-foreground'}`}>{selected.category?.replace('_', ' ')}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{selected.description}</p>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { label: 'Duration', value: selected.duration_weeks ? `${selected.duration_weeks} weeks` : '—' },
                                    { label: 'Frequency', value: selected.days_per_week ? `${selected.days_per_week} days/wk` : '—' },
                                    { label: 'Est. Calories', value: selected.estimated_calories ? `${selected.estimated_calories}/session` : '—' },
                                ].map(s => (
                                    <div key={s.label} className="glass rounded-xl p-3 text-center">
                                        <div className="font-semibold text-sm">{s.value}</div>
                                        <div className="text-xs text-muted-foreground">{s.label}</div>
                                    </div>
                                ))}
                            </div>
                            {selected.exercises?.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-3 text-sm">Exercises</h4>
                                    <div className="space-y-2">
                                        {selected.exercises.map((ex, i) => (
                                            <div key={i} className="flex items-center gap-3 glass rounded-xl p-3">
                                                <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-xs font-bold text-purple-400">{ex.order || i + 1}</div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium">{ex.exercise_name}</div>
                                                    <div className="text-xs text-muted-foreground">{ex.sets} sets × {ex.reps} reps{ex.rest_sec ? ` · ${ex.rest_sec}s rest` : ''}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}