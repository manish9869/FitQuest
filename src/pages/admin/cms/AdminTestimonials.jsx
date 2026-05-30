import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entities } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, Star, MessageSquare, Loader2, X, Upload, Eye, EyeOff } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const EMPTY = { client_name: '', testimonial_text: '', before_image_url: '', after_image_url: '', weight_change_kg: '', duration_weeks: '', program_name: '', video_url: '', rating: 5, is_featured: false, is_published: true };

function TestimonialDrawer({ open, onClose, item }) {
    const [form, setForm] = useState(EMPTY);
    const [uploadingBefore, setUploadingBefore] = useState(false);
    const [uploadingAfter, setUploadingAfter] = useState(false);
    const qc = useQueryClient();
    React.useEffect(() => { setForm(item ? { ...EMPTY, ...item } : EMPTY); }, [item, open]);
    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const save = useMutation({
        mutationFn: (d) => {
            const clean = { ...d, weight_change_kg: Number(d.weight_change_kg) || undefined, duration_weeks: Number(d.duration_weeks) || undefined, rating: Number(d.rating) || 5 };
            return item ? entities.Testimonial.update(item.id, clean) : entities.Testimonial.create(clean);
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['testimonials'] }); onClose(); },
    });

    const upload = async (e, key, setLoading) => {
        const file = e.target.files[0]; if (!file) return;
        setLoading(true);
        const { file_url } = await entities.Testimonial.uploadFile({ file });
        set(key, file_url); setLoading(false);
    };

    const ImageUpload = ({ field, loading, setLoading, label }) => (
        <div>
            <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
            {form[field] ? (
                <div className="relative w-full h-32 rounded-xl overflow-hidden">
                    <img src={form[field]} alt={label} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => set(field, '')} className="absolute top-2 right-2 bg-black/60 rounded-full p-1"><X className="w-3 h-3" /></button>
                </div>
            ) : (
                <label className="flex flex-col items-center justify-center w-full h-24 rounded-xl border-2 border-dashed border-white/10 hover:border-white/20 cursor-pointer transition-colors">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : <Upload className="w-5 h-5 text-muted-foreground mb-1" />}
                    <span className="text-xs text-muted-foreground">{loading ? 'Uploading...' : `Upload ${label}`}</span>
                    <input type="file" accept="image/*" onChange={e => upload(e, field, setLoading)} className="hidden" />
                </label>
            )}
        </div>
    );

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div className="fixed inset-0 bg-black/60 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
                    <motion.div className="fixed right-0 top-0 h-full w-full max-w-lg z-50 flex flex-col"
                        style={{ background: 'hsl(220 20% 5%)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30 }}>
                        <div className="flex items-center justify-between p-5 border-b border-white/5">
                            <h2 className="font-bold font-space">{item ? 'Edit Testimonial' : 'New Testimonial'}</h2>
                            <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            <Input value={form.client_name} onChange={e => set('client_name', e.target.value)} placeholder="Client Name *" className="bg-white/5 border-white/10" />
                            <textarea value={form.testimonial_text} onChange={e => set('testimonial_text', e.target.value)} placeholder="Their transformation story..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none h-24" />
                            <div className="grid grid-cols-2 gap-3">
                                <ImageUpload field="before_image_url" loading={uploadingBefore} setLoading={setUploadingBefore} label="Before Photo" />
                                <ImageUpload field="after_image_url" loading={uploadingAfter} setLoading={setUploadingAfter} label="After Photo" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Weight Change (kg)</label>
                                    <Input type="number" value={form.weight_change_kg} onChange={e => set('weight_change_kg', e.target.value)} placeholder="-10" className="bg-white/5 border-white/10" />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Duration (weeks)</label>
                                    <Input type="number" value={form.duration_weeks} onChange={e => set('duration_weeks', e.target.value)} placeholder="12" className="bg-white/5 border-white/10" />
                                </div>
                            </div>
                            <Input value={form.program_name} onChange={e => set('program_name', e.target.value)} placeholder="Program Name" className="bg-white/5 border-white/10" />
                            <Input value={form.video_url} onChange={e => set('video_url', e.target.value)} placeholder="Video URL (optional)" className="bg-white/5 border-white/10" />
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Rating (1-5)</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <button key={n} type="button" onClick={() => set('rating', n)}>
                                            <Star className={`w-6 h-6 ${form.rating >= n ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_featured} onChange={e => set('is_featured', e.target.checked)} /><span className="text-sm text-yellow-400">Featured</span></label>
                                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_published} onChange={e => set('is_published', e.target.checked)} /><span className="text-sm text-emerald-400">Published</span></label>
                            </div>
                        </div>
                        <div className="p-5 border-t border-white/5 flex gap-3">
                            <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
                            <Button onClick={() => save.mutate(form)} disabled={save.isPending} className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-semibold">
                                {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : item ? 'Update' : 'Add Testimonial'}
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default function AdminTestimonials() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const qc = useQueryClient();

    const { data: items = [], isLoading } = useQuery({
        queryKey: ['testimonials'],
        queryFn: () => entities.Testimonial.list('created_at', false),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => entities.Testimonial.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['testimonials'] }),
    });

    const togglePublish = useMutation({
        mutationFn: ({ id, val }) => entities.Testimonial.update(id, { is_published: val }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['testimonials'] }),
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-space flex items-center gap-2"><MessageSquare className="w-6 h-6 text-pink-400" /> Testimonials</h1>
                    <p className="text-sm text-muted-foreground mt-1">{items.length} transformation stories</p>
                </div>
                <Button onClick={() => { setEditing(null); setDrawerOpen(true); }} className="bg-pink-500 hover:bg-pink-600 text-white font-semibold">
                    <Plus className="w-4 h-4" /> Add Testimonial
                </Button>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array(6).fill(0).map((_, i) => <div key={i} className="glass rounded-xl h-64 animate-pulse" />)}
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground"><MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>No testimonials yet.</p></div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map(t => (
                        <div key={t.id} className="glass rounded-xl p-4 flex flex-col gap-3 group hover:bg-white/5 transition-all">
                            {/* Before/After */}
                            {(t.before_image_url || t.after_image_url) && (
                                <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden h-28">
                                    {t.before_image_url && <img src={t.before_image_url} alt="before" className="w-full h-full object-cover" />}
                                    {t.after_image_url && <img src={t.after_image_url} alt="after" className="w-full h-full object-cover" />}
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-semibold text-sm">{t.client_name}</div>
                                    {t.program_name && <div className="text-xs text-muted-foreground">{t.program_name}</div>}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" variant="ghost" onClick={() => { setEditing(t); setDrawerOpen(true); }} className="h-7 w-7 hover:bg-blue-500/10 hover:text-blue-400"><Pencil className="w-3 h-3" /></Button>
                                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(t.id)} className="h-7 w-7 hover:bg-red-500/10 hover:text-red-400"><Trash2 className="w-3 h-3" /></Button>
                                </div>
                            </div>
                            <div className="flex">{[1, 2, 3, 4, 5].map(n => <Star key={n} className={`w-3 h-3 ${(t.rating || 5) >= n ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />)}</div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{t.testimonial_text}</p>
                            <div className="flex items-center gap-3 mt-auto">
                                {t.weight_change_kg && <span className="text-xs text-emerald-400 font-semibold">{t.weight_change_kg > 0 ? '+' : ''}{t.weight_change_kg}kg</span>}
                                {t.duration_weeks && <span className="text-xs text-muted-foreground">{t.duration_weeks}w</span>}
                                {t.is_featured && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 ml-auto" />}
                                <button onClick={() => togglePublish.mutate({ id: t.id, val: !t.is_published })} className={`ml-auto flex items-center gap-1 text-xs ${t.is_published ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                                    {t.is_published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <TestimonialDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} item={editing} />
        </div>
    );
}


