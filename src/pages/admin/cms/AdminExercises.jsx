import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entities } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Pencil, Trash2, Dumbbell, Loader2, Upload, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const MUSCLE_COLORS = {
    chest: 'text-red-400', back: 'text-blue-400', shoulders: 'text-yellow-400',
    arms: 'text-orange-400', core: 'text-purple-400', legs: 'text-green-400',
    glutes: 'text-pink-400', full_body: 'text-emerald-400', cardio: 'text-cyan-400',
};

const EMPTY = {
    name: '', muscle_group: 'chest', difficulty: 'beginner', equipment: 'bodyweight',
    category: 'strength', instructions: '', common_mistakes: '', tips: '', image_url: '', video_url: '',
};

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=200&fit=crop&auto=format';

function ExerciseDrawer({ open, onClose, exercise }) {
    const [form, setForm] = useState(EMPTY);
    const [uploading, setUploading] = useState(false);
    const [errors, setErrors] = useState({});
    const qc = useQueryClient();

    React.useEffect(() => {
        setForm(exercise ? { ...EMPTY, ...exercise } : EMPTY);
        setErrors({});
    }, [exercise, open]);

    const set = (k, v) => {
        setForm(p => ({ ...p, [k]: v }));
        if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
    };

    const save = useMutation({
        mutationFn: (d) => exercise ? entities.Exercise.update(exercise.id, d) : entities.Exercise.create(d),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['exercises'] }); onClose(); },
        onError: (e) => {
            if (e?.code === '42501') {
                setErrors({ submit: 'Permission denied. Check Supabase RLS policy for exercises table.' });
            } else {
                setErrors({ submit: e?.message || 'Failed to save exercise' });
            }
        },
    });

    const handleSubmit = () => {
        if (!form.name?.trim()) { setErrors({ name: 'Exercise name is required' }); return; }
        save.mutate(form);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { setErrors(err => ({ ...err, image: 'Please upload an image file' })); return; }
        if (file.size > 5 * 1024 * 1024) { setErrors(err => ({ ...err, image: 'Image must be under 5MB' })); return; }
        setUploading(true);
        setErrors(err => ({ ...err, image: null }));
        try {
            const { file_url } = await entities.Exercise.uploadFile(file);
            set('image_url', file_url);
        } catch (err) {
            setErrors(e => ({ ...e, image: 'Upload failed: ' + (err?.message || 'Unknown error') }));
        } finally {
            setUploading(false);
        }
    };

    const SELECT_FIELDS = [
        ['muscle_group', 'Muscle Group', ['chest', 'back', 'shoulders', 'arms', 'core', 'legs', 'glutes', 'full_body', 'cardio']],
        ['difficulty', 'Difficulty', ['beginner', 'intermediate', 'advanced']],
        ['equipment', 'Equipment', ['none', 'dumbbells', 'barbell', 'machine', 'cables', 'resistance_bands', 'kettlebell', 'bodyweight']],
        ['category', 'Category', ['strength', 'cardio', 'hiit', 'mobility', 'olympic']],
    ];

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div className="fixed inset-0 bg-black/60 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
                    <motion.div className="fixed right-0 top-0 h-full w-full max-w-xl z-50 flex flex-col"
                        style={{ background: 'hsl(220 20% 5%)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30 }}>

                        <div className="flex items-center justify-between p-5 border-b border-white/5">
                            <h2 className="font-bold font-space">{exercise ? 'Edit Exercise' : 'New Exercise'}</h2>
                            <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground hover:text-white" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {errors.submit && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">{errors.submit}</div>
                            )}

                            <div>
                                <Input value={form.name} onChange={e => set('name', e.target.value)}
                                    placeholder="Exercise Name *"
                                    className={`bg-white/5 border-white/10 ${errors.name ? 'border-red-500/50' : ''}`} />
                                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {SELECT_FIELDS.map(([k, label, opts]) => (
                                    <div key={k}>
                                        <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                                        <Select value={form[k]} onValueChange={v => set(k, v)}>
                                            <SelectTrigger className="bg-white/5 border-white/10">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {opts.map(o => (
                                                    <SelectItem key={o} value={o}>{o.replace(/_/g, ' ')}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}
                            </div>

                            {[['instructions', 'Instructions'], ['common_mistakes', 'Common Mistakes'], ['tips', 'Tips']].map(([k, label]) => (
                                <div key={k}>
                                    <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                                    <textarea value={form[k]} onChange={e => set(k, e.target.value)} placeholder={label}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none h-20" />
                                </div>
                            ))}

                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Demo Image</label>
                                {errors.image && <p className="text-xs text-red-400 mb-1">{errors.image}</p>}
                                {form.image_url ? (
                                    <div className="relative w-full h-32 rounded-xl overflow-hidden">
                                        <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => set('image_url', '')}
                                            className="absolute top-2 right-2 bg-black/60 rounded-full p-1 hover:bg-black/80 transition-colors">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative w-full h-32 rounded-xl overflow-hidden border-2 border-dashed border-white/10 hover:border-blue-500/40 transition-colors group">
                                        <img src={PLACEHOLDER_IMAGE} alt="placeholder" className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity" />
                                        <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                                            {uploading ? <Loader2 className="w-6 h-6 animate-spin text-blue-400" /> : (
                                                <>
                                                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center mb-2"><Upload className="w-4 h-4 text-white" /></div>
                                                    <span className="text-sm text-white font-medium">Upload Image</span>
                                                    <span className="text-xs text-muted-foreground mt-0.5">PNG, JPG up to 5MB</span>
                                                </>
                                            )}
                                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                                        </label>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Video URL</label>
                                <Input value={form.video_url} onChange={e => set('video_url', e.target.value)}
                                    placeholder="https://youtube.com/..." className="bg-white/5 border-white/10" />
                            </div>
                        </div>

                        <div className="p-5 border-t border-white/5 flex gap-3">
                            <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
                            <Button onClick={handleSubmit} disabled={save.isPending}
                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold">
                                {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : exercise ? 'Update' : 'Create'}
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default function AdminExercises() {
    const [search, setSearch] = useState('');
    const [filterMuscle, setFilterMuscle] = useState('all');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const qc = useQueryClient();

    const { data: exercises = [], isLoading } = useQuery({
        queryKey: ['exercises'],
        queryFn: () => entities.Exercise.list('created_at', false),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => entities.Exercise.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises'] }),
    });

    const filtered = exercises.filter(e =>
        e.name?.toLowerCase().includes(search.toLowerCase()) &&
        (filterMuscle === 'all' || e.muscle_group === filterMuscle)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-space flex items-center gap-2">
                        <Dumbbell className="w-6 h-6 text-blue-400" /> Exercise Library
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">{exercises.length} exercises in library</p>
                </div>
                <Button onClick={() => { setEditing(null); setDrawerOpen(true); }}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold">
                    <Plus className="w-4 h-4 mr-2" /> Add Exercise
                </Button>
            </div>

            <div className="glass rounded-xl p-4 flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search exercises..." className="pl-9 bg-white/5 border-white/10" />
                </div>
                <Select value={filterMuscle} onValueChange={setFilterMuscle}>
                    <SelectTrigger className="w-48 bg-white/5 border-white/10">
                        <SelectValue placeholder="All Muscle Groups" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Muscle Groups</SelectItem>
                        {['chest', 'back', 'shoulders', 'arms', 'core', 'legs', 'glutes', 'full_body', 'cardio'].map(m => (
                            <SelectItem key={m} value={m}>{m.replace('_', ' ')}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                    Array(6).fill(0).map((_, i) => <div key={i} className="glass rounded-xl p-4 h-40 animate-pulse" />)
                ) : filtered.map(ex => (
                    <div key={ex.id} className="glass rounded-xl p-4 hover:bg-white/5 transition-all group">
                        {ex.image_url ? (
                            <img src={ex.image_url} alt={ex.name} className="w-full h-28 object-cover rounded-lg mb-3" />
                        ) : (
                            <div className="w-full h-28 rounded-lg mb-3 overflow-hidden">
                                <img src={PLACEHOLDER_IMAGE} alt="exercise" className="w-full h-full object-cover opacity-30" />
                            </div>
                        )}
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="font-semibold text-sm">{ex.name}</div>
                                <div className={`text-xs mt-1 capitalize ${MUSCLE_COLORS[ex.muscle_group] || 'text-muted-foreground'}`}>
                                    {ex.muscle_group?.replace('_', ' ')}
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <span className="text-xs bg-white/5 px-2 py-0.5 rounded-full capitalize">{ex.difficulty}</span>
                                    <span className="text-xs bg-white/5 px-2 py-0.5 rounded-full capitalize">{ex.equipment?.replace('_', ' ')}</span>
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="icon" variant="ghost" onClick={() => { setEditing(ex); setDrawerOpen(true); }}
                                    className="h-7 w-7 hover:bg-blue-500/10 hover:text-blue-400">
                                    <Pencil className="w-3 h-3" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(ex.id)}
                                    className="h-7 w-7 hover:bg-red-500/10 hover:text-red-400">
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {!isLoading && filtered.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                    <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>{search || filterMuscle !== 'all' ? 'No exercises match your filters.' : 'No exercises yet. Add your first exercise!'}</p>
                </div>
            )}

            <ExerciseDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} exercise={editing} />
        </div>
    );
}