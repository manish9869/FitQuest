import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entities } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Pill, Flame, X, Loader2, ChevronRight, Star, Zap, Shield } from 'lucide-react';
import { format } from 'date-fns';

const TODAY = format(new Date(), 'yyyy-MM-dd');

const TIMING_CONFIG = {
    morning: { label: 'Morning', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    pre_workout: { label: 'Pre-Workout', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    post_workout: { label: 'Post-Workout', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    before_sleep: { label: 'Before Sleep', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    with_meals: { label: 'With Meals', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    afternoon: { label: 'Afternoon', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
};

const CAT_ICONS = { protein: Flame, creatine: Zap, vitamins: Star, pre_workout: Zap, recovery: Shield, fat_burner: Flame, other: Pill };

const PRESET_STACKS = [
    { name: 'Fat Loss Stack', supplements: [{ name: 'Whey Protein', dosage: '30g', timing: 'post_workout', category: 'protein' }, { name: 'L-Carnitine', dosage: '2g', timing: 'pre_workout', category: 'fat_burner' }, { name: 'Multivitamin', dosage: '1 tablet', timing: 'morning', category: 'vitamins' }] },
    { name: 'Muscle Gain Stack', supplements: [{ name: 'Whey Protein', dosage: '40g', timing: 'post_workout', category: 'protein' }, { name: 'Creatine Monohydrate', dosage: '5g', timing: 'post_workout', category: 'creatine' }, { name: 'Pre-Workout', dosage: '1 scoop', timing: 'pre_workout', category: 'pre_workout' }] },
    { name: 'Recovery Stack', supplements: [{ name: 'Magnesium', dosage: '400mg', timing: 'before_sleep', category: 'recovery' }, { name: 'Fish Oil', dosage: '2g', timing: 'with_meals', category: 'recovery' }, { name: 'Vitamin D3', dosage: '2000IU', timing: 'morning', category: 'vitamins' }] },
];

export default function SupplementTracker() {
    const { user } = useAuth();
    const qc = useQueryClient();
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ name: '', brand: '', dosage: '', timing: 'morning', category: 'protein', instructions: '' });

    const { data: supplements = [] } = useQuery({
        queryKey: ['user-supplements', user?.email],
        queryFn: () => entities.UserSupplement.filter({ user_email: user.email, is_active: true }),
        enabled: !!user?.email,
    });

    const { data: todayLogs = [] } = useQuery({
        queryKey: ['supplement-logs', user?.email, TODAY],
        queryFn: () => entities.SupplementLog.filter({ user_email: user.email, date: TODAY }),
        enabled: !!user?.email,
    });

    const addSupplement = useMutation({
        mutationFn: (d) => entities.UserSupplement.create({ ...d, user_email: user.email }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['user-supplements'] }); setShowAdd(false); setForm({ name: '', brand: '', dosage: '', timing: 'morning', category: 'protein', instructions: '' }); },
    });

    const deleteSupplement = useMutation({
        mutationFn: (id) => entities.UserSupplement.update(id, { is_active: false }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['user-supplements'] }),
    });

    const toggleTaken = useMutation({
        mutationFn: async ({ supplement, taken }) => {
            const existing = todayLogs.find(l => l.supplement_name === supplement.name);
            if (existing && taken === false) {
                // Un-mark: delete the log entry
                return entities.SupplementLog.delete(existing.id);
            }
            if (!existing) {
                // Mark taken: create a log entry
                return entities.SupplementLog.create({
                    user_email: user.email,
                    date: TODAY,
                    supplement_name: supplement.name,
                    dose: supplement.dosage,
                    taken_at: new Date().toISOString(),
                });
            }
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['supplement-logs'] }),
    });
    const addStack = async (stack) => {
        for (const s of stack.supplements) {
            await entities.UserSupplement.create({ ...s, user_email: user.email, is_active: true });
        }
        qc.invalidateQueries({ queryKey: ['user-supplements'] });
    };

    const grouped = supplements.reduce((acc, s) => {
        const g = s.timing || 'morning';
        if (!acc[g]) acc[g] = [];
        acc[g].push(s);
        return acc;
    }, {});

    const takenCount = supplements.filter(s => todayLogs.find(l => l.supplement_name === s.name && l.taken)).length;
    const compliance = supplements.length > 0 ? Math.round((takenCount / supplements.length) * 100) : 0;

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-space flex items-center gap-2">
                        <Pill className="w-6 h-6 text-purple-400" /> Supplement Tracker
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Daily compliance & stack management</p>
                </div>
                <Button onClick={() => setShowAdd(true)} className="bg-purple-500 hover:bg-purple-600 text-white font-semibold">
                    <Plus className="w-4 h-4" /> Add Supplement
                </Button>
            </div>

            {/* Compliance Ring */}
            <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-6">
                    <div className="relative w-20 h-20 flex-shrink-0">
                        <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
                            <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                            <circle cx="40" cy="40" r="30" fill="none" stroke="hsl(270 70% 60%)"
                                strokeWidth="8" strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 30 * compliance / 100} ${2 * Math.PI * 30 * (1 - compliance / 100)}`} />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-bold text-purple-400">{compliance}%</span>
                        </div>
                    </div>
                    <div>
                        <div className="text-xl font-bold">{takenCount}/{supplements.length} taken today</div>
                        <div className="text-sm text-muted-foreground mt-1">Daily compliance</div>
                        <div className="flex gap-2 mt-3">
                            {supplements.slice(0, 5).map(s => {
                                const taken = todayLogs.find(l => l.supplement_name === s.name && l.taken);
                                return (
                                    <div key={s.id} className={`w-2 h-2 rounded-full ${taken ? 'bg-emerald-400' : 'bg-white/10'}`} title={s.name} />
                                );
                            })}
                        </div>
                    </div>
                    <div className="ml-auto text-right hidden sm:block">
                        <div className={`text-3xl font-bold font-space ${compliance === 100 ? 'text-gradient-green' : compliance >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {compliance === 100 ? '🔥' : compliance >= 70 ? '💪' : '⚡'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{compliance === 100 ? 'Perfect!' : compliance >= 70 ? 'Good job' : 'Keep going'}</div>
                    </div>
                </div>
            </div>

            {/* Supplement Groups by Timing */}
            {Object.keys(grouped).length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                    <Pill className="w-16 h-16 text-purple-400/30 mx-auto mb-4" />
                    <div className="text-lg font-semibold mb-2">No supplements yet</div>
                    <p className="text-muted-foreground text-sm mb-6">Add supplements manually or choose a preset stack below.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
                        {PRESET_STACKS.map(stack => (
                            <button key={stack.name} onClick={() => addStack(stack)}
                                className="glass rounded-xl p-3 text-left hover:bg-white/5 transition-all border border-white/5 hover:border-purple-500/30">
                                <div className="text-xs font-semibold text-purple-400 mb-1">{stack.name}</div>
                                <div className="text-xs text-muted-foreground">{stack.supplements.length} supplements</div>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(TIMING_CONFIG).map(([timing, cfg]) => {
                        const items = grouped[timing];
                        if (!items?.length) return null;
                        return (
                            <div key={timing}>
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg w-fit mb-2 border text-xs font-bold ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                                    {cfg.label}
                                </div>
                                <div className="space-y-2">
                                    {items.map(s => {
                                        const taken = todayLogs.find(l => l.supplement_name === s.name && l.taken);
                                        const Icon = CAT_ICONS[s.category] || Pill;
                                        return (
                                            <motion.div key={s.id} layout
                                                className={`glass rounded-xl p-4 flex items-center gap-4 transition-all ${taken ? 'opacity-60' : ''}`}>
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${taken ? 'bg-emerald-500/20' : 'bg-purple-500/10'}`}>
                                                    {taken ? <Check className="w-5 h-5 text-emerald-400" /> : <Icon className="w-5 h-5 text-purple-400" />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className={`font-semibold text-sm ${taken ? 'line-through text-muted-foreground' : ''}`}>{s.name}</div>
                                                    <div className="text-xs text-muted-foreground flex gap-2 mt-0.5">
                                                        {s.dosage && <span>{s.dosage}</span>}
                                                        {s.brand && <span>· {s.brand}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => toggleTaken.mutate({ supplement: s, taken: !taken })}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${taken ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10' : 'bg-white/5 text-muted-foreground hover:bg-emerald-500/20 hover:text-emerald-400'}`}>
                                                        {taken ? '✓ Taken' : 'Mark Taken'}
                                                    </button>
                                                    <button onClick={() => deleteSupplement.mutate(s.id)} className="text-muted-foreground hover:text-red-400 transition-colors">
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Preset Stacks */}
            {supplements.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">Quick-add Preset Stacks</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {PRESET_STACKS.map(stack => (
                            <button key={stack.name} onClick={() => addStack(stack)}
                                className="glass rounded-xl p-4 text-left hover:bg-white/5 transition-all border border-white/5 hover:border-purple-500/30 group">
                                <div className="text-sm font-semibold text-purple-400 group-hover:text-purple-300 mb-1 flex items-center justify-between">
                                    {stack.name} <ChevronRight className="w-3.5 h-3.5" />
                                </div>
                                <div className="text-xs text-muted-foreground">{stack.supplements.map(s => s.name).join(', ')}</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Add Supplement Drawer */}
            <AnimatePresence>
                {showAdd && (
                    <>
                        <motion.div className="fixed inset-0 bg-black/60 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdd(false)} />
                        <motion.div className="fixed right-0 top-0 h-full w-full max-w-md z-50 flex flex-col"
                            style={{ background: 'hsl(220 20% 5%)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30 }}>
                            <div className="flex items-center justify-between p-5 border-b border-white/5">
                                <h2 className="font-bold">Add Supplement</h2>
                                <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Supplement Name *" className="bg-white/5 border-white/10" />
                                <Input value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))} placeholder="Brand (optional)" className="bg-white/5 border-white/10" />
                                <Input value={form.dosage} onChange={e => setForm(p => ({ ...p, dosage: e.target.value }))} placeholder="Dosage (e.g. 5g, 1 tablet)" className="bg-white/5 border-white/10" />
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">Timing</label>
                                        <select value={form.timing} onChange={e => setForm(p => ({ ...p, timing: e.target.value }))}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground">
                                            {Object.entries(TIMING_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                                        <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground">
                                            {['protein', 'creatine', 'vitamins', 'pre_workout', 'recovery', 'fat_burner', 'other'].map(c =>
                                                <option key={c} value={c}>{c.replace('_', ' ')}</option>
                                            )}
                                        </select>
                                    </div>
                                </div>
                                <textarea value={form.instructions} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))}
                                    placeholder="Instructions (optional)" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none h-20" />
                            </div>
                            <div className="p-5 border-t border-white/5 flex gap-3">
                                <Button variant="ghost" onClick={() => setShowAdd(false)} className="flex-1">Cancel</Button>
                                <Button onClick={() => addSupplement.mutate(form)} disabled={!form.name || addSupplement.isPending}
                                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold">
                                    {addSupplement.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Supplement'}
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}


