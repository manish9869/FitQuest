import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entities } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Pencil, Trash2, Target, Star, Eye, EyeOff, Loader2, X, Upload } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const CAT_COLORS = { fat_loss: 'text-orange-400', muscle_gain: 'text-blue-400', transformation: 'text-purple-400', home_workout: 'text-green-400', athletic: 'text-red-400', beginner: 'text-emerald-400' };
const EMPTY_FEATURES = ['Personalized workout plan', 'Nutrition guidance', 'Weekly check-ins', 'Progress tracking'];
const EMPTY = { name: '', description: '', target_audience: '', duration_weeks: '', difficulty: 'beginner', category: 'fat_loss', included_features: EMPTY_FEATURES, price: '', original_price: '', banner_image_url: '', is_featured: false, is_published: true, required_plan: 'free' };

function ProgramDrawer({ open, onClose, program }) {
    const [form, setForm] = useState(EMPTY);
    const [uploading, setUploading] = useState(false);
    const qc = useQueryClient();

    React.useEffect(() => {
        setForm(program ? { ...EMPTY, ...program, included_features: program.included_features?.length ? program.included_features : EMPTY_FEATURES } : EMPTY);
    }, [program, open]);

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const save = useMutation({
        mutationFn: (d) => {
            const clean = {
                ...d,
                duration_weeks: Number(d.duration_weeks) || undefined,
                price: Number(d.price) || undefined,
                original_price: Number(d.original_price) || undefined,
                included_features: d.included_features.filter(Boolean),
            };
            return program ? entities.Program.update(program.id, clean) : entities.Program.create(clean);
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['programs'] }); onClose(); },
    });

    // Fixed: pass raw file not wrapped object
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const { file_url } = await entities.Program.uploadFile(file);
            set('banner_image_url', file_url);
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setUploading(false);
        }
    };

    const updateFeature = (i, v) => { const arr = [...form.included_features]; arr[i] = v; set('included_features', arr); };
    const addFeature = () => set('included_features', [...form.included_features, '']);
    const removeFeature = (i) => set('included_features', form.included_features.filter((_, idx) => idx !== i));

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div className="fixed inset-0 bg-black/60 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
                    <motion.div className="fixed right-0 top-0 h-full w-full max-w-xl z-50 flex flex-col"
                        style={{ background: 'hsl(220 20% 5%)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30 }}>
                        <div className="flex items-center justify-between p-5 border-b border-white/5">
                            <h2 className="font-bold font-space">{program ? 'Edit Program' : 'New Program'}</h2>
                            <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {/* Banner image */}
                            {form.banner_image_url ? (
                                <div className="relative w-full h-32 rounded-xl overflow-hidden">
                                    <img src={form.banner_image_url} alt="" className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => set('banner_image_url', '')} className="absolute top-2 right-2 bg-black/60 rounded-full p-1">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-24 rounded-xl border-2 border-dashed border-white/10 hover:border-purple-500/40 cursor-pointer transition-colors">
                                    {uploading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : <Upload className="w-5 h-5 text-muted-foreground mb-1" />}
                                    <span className="text-xs text-muted-foreground">{uploading ? 'Uploading...' : 'Upload Banner Image'}</span>
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                </label>
                            )}

                            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Program Name *" className="bg-white/5 border-white/10" />
                            <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Description..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none h-20" />
                            <Input value={form.target_audience} onChange={e => set('target_audience', e.target.value)} placeholder="Target Audience" className="bg-white/5 border-white/10" />

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                                    <Select value={form.category} onValueChange={v => set('category', v)}>
                                        <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {['fat_loss', 'muscle_gain', 'transformation', 'home_workout', 'athletic', 'beginner'].map(c => (
                                                <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Difficulty</label>
                                    <Select value={form.difficulty} onValueChange={v => set('difficulty', v)}>
                                        <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {['beginner', 'intermediate', 'advanced'].map(d => (
                                                <SelectItem key={d} value={d}>{d}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Duration (weeks)</label>
                                    <Input type="number" value={form.duration_weeks} onChange={e => set('duration_weeks', e.target.value)} placeholder="12" className="bg-white/5 border-white/10" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Price ($)</label>
                                    <Input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="97" className="bg-white/5 border-white/10" />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Original Price ($)</label>
                                    <Input type="number" value={form.original_price} onChange={e => set('original_price', e.target.value)} placeholder="197" className="bg-white/5 border-white/10" />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Required Plan</label>
                                <Select value={form.required_plan} onValueChange={v => set('required_plan', v)}>
                                    <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {['free', 'basic', 'premium', 'elite'].map(p => (
                                            <SelectItem key={p} value={p}>{p}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Included Features</h3>
                                    <Button type="button" size="sm" variant="ghost" onClick={addFeature} className="text-emerald-400 hover:bg-emerald-500/10">
                                        <Plus className="w-3 h-3" />
                                    </Button>
                                </div>
                                {form.included_features.map((f, i) => (
                                    <div key={i} className="flex gap-2">
                                        <Input value={f} onChange={e => updateFeature(i, e.target.value)} placeholder={`Feature ${i + 1}`} className="bg-white/5 border-white/10" />
                                        <Button size="icon" variant="ghost" onClick={() => removeFeature(i)} className="h-9 w-9 text-red-400 hover:bg-red-500/10 flex-shrink-0">
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.is_featured} onChange={e => set('is_featured', e.target.checked)} />
                                    <span className="text-sm text-yellow-400">Featured</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.is_published} onChange={e => set('is_published', e.target.checked)} />
                                    <span className="text-sm text-emerald-400">Published</span>
                                </label>
                            </div>
                        </div>
                        <div className="p-5 border-t border-white/5 flex gap-3">
                            <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
                            <Button onClick={() => save.mutate(form)} disabled={save.isPending} className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold">
                                {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : program ? 'Update Program' : 'Create Program'}
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default function AdminPrograms() {
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const qc = useQueryClient();

    const { data: programs = [], isLoading } = useQuery({
        queryKey: ['programs'],
        queryFn: () => entities.Program.list('created_at', false),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => entities.Program.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['programs'] }),
    });

    const filtered = programs.filter(p => {
        const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase());
        const matchCat = filterCategory === 'all' || p.category === filterCategory;
        const matchStatus = filterStatus === 'all' || (filterStatus === 'published' ? p.is_published : !p.is_published);
        return matchSearch && matchCat && matchStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-space flex items-center gap-2">
                        <Target className="w-6 h-6 text-purple-400" /> Programs
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">{programs.length} programs · {filtered.length} shown</p>
                </div>
                <Button onClick={() => { setEditing(null); setDrawerOpen(true); }} className="bg-purple-500 hover:bg-purple-600 text-white font-semibold">
                    <Plus className="w-4 h-4" /> New Program
                </Button>
            </div>

            {/* Filters */}
            <div className="glass rounded-xl p-4 flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search programs..." className="pl-9 bg-white/5 border-white/10" />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-44 bg-white/5 border-white/10">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {['fat_loss', 'muscle_gain', 'transformation', 'home_workout', 'athletic', 'beginner'].map(c => (
                            <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-36 bg-white/5 border-white/10">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="hidden">Hidden</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? Array(6).fill(0).map((_, i) => <div key={i} className="glass rounded-xl h-52 animate-pulse" />) :
                    filtered.map(p => (
                        <div key={p.id} className="glass rounded-xl overflow-hidden hover:bg-white/5 transition-all group">
                            {p.banner_image_url ? (
                                <img src={p.banner_image_url} alt={p.name} className="w-full h-28 object-cover" />
                            ) : (
                                <div className="w-full h-28 bg-gradient-to-br from-purple-500/20 to-pink-500/10 flex items-center justify-center">
                                    <Target className="w-8 h-8 text-purple-400/40" />
                                </div>
                            )}
                            <div className="p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="font-semibold text-sm">{p.name}</div>
                                        <div className={`text-xs mt-0.5 capitalize ${CAT_COLORS[p.category]}`}>{p.category?.replace('_', ' ')}</div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="icon" variant="ghost" onClick={() => { setEditing(p); setDrawerOpen(true); }} className="h-7 w-7 hover:bg-blue-500/10 hover:text-blue-400">
                                            <Pencil className="w-3 h-3" />
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(p.id)} className="h-7 w-7 hover:bg-red-500/10 hover:text-red-400">
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    {p.duration_weeks && <span className="text-xs bg-white/5 px-2 py-0.5 rounded-full">{p.duration_weeks}w</span>}
                                    {p.is_featured && <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full flex items-center gap-1"><Star className="w-3 h-3" />Featured</span>}
                                    {p.price && <span className="text-xs text-emerald-400 font-semibold">${p.price}</span>}
                                    <span className={`text-xs flex items-center gap-0.5 ${p.is_published ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                                        {p.is_published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
            </div>

            {!isLoading && filtered.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                    <Target className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>{search || filterCategory !== 'all' || filterStatus !== 'all' ? 'No programs match your filters.' : 'No programs yet.'}</p>
                </div>
            )}

            <ProgramDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} program={editing} />
        </div>
    );
}