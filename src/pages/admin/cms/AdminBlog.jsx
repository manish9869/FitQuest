import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entities } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Pencil, Trash2, FileText, Loader2, X, Upload, Eye, EyeOff, Star } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';

const CATEGORIES = ['nutrition', 'fat_loss', 'recovery', 'supplements', 'training_tips', 'mindset'];
const CAT_COLORS = { nutrition: 'text-green-400', fat_loss: 'text-orange-400', recovery: 'text-blue-400', supplements: 'text-purple-400', training_tips: 'text-red-400', mindset: 'text-yellow-400' };
const EMPTY = { title: '', slug: '', excerpt: '', content: '', category: 'nutrition', cover_image_url: '', author_name: '', tags: [], seo_title: '', seo_description: '', is_published: false, is_featured: false, published_at: '', read_time_min: '' };

function BlogDrawer({ open, onClose, post }) {
    const [form, setForm] = useState(EMPTY);
    const [uploading, setUploading] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const qc = useQueryClient();

    React.useEffect(() => { setForm(post ? { ...EMPTY, ...post } : EMPTY); }, [post, open]);

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const save = useMutation({
        mutationFn: (d) => {
            const clean = { ...d, read_time_min: Number(d.read_time_min) || undefined };
            return post ? entities.BlogPost.update(post.id, clean) : entities.BlogPost.create(clean);
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['blog-posts'] }); onClose(); },
    });

    // Fixed: pass raw file not wrapped object
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const { file_url } = await entities.BlogPost.uploadFile(file);
            set('cover_image_url', file_url);
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setUploading(false);
        }
    };

    const addTag = () => {
        if (!tagInput.trim()) return;
        set('tags', [...(form.tags || []), tagInput.trim()]);
        setTagInput('');
    };
    const removeTag = (t) => set('tags', form.tags.filter(x => x !== t));

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div className="fixed inset-0 bg-black/60 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
                    <motion.div
                        className="fixed right-0 top-0 h-full w-full max-w-2xl z-50 flex flex-col"
                        style={{ background: 'hsl(220 20% 5%)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30 }}
                    >
                        <div className="flex items-center justify-between p-5 border-b border-white/5">
                            <h2 className="font-bold font-space">{post ? 'Edit Article' : 'New Article'}</h2>
                            <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {/* Cover image */}
                            {form.cover_image_url ? (
                                <div className="relative w-full h-32 rounded-xl overflow-hidden">
                                    <img src={form.cover_image_url} alt="" className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => set('cover_image_url', '')} className="absolute top-2 right-2 bg-black/60 rounded-full p-1"><X className="w-3 h-3" /></button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-24 rounded-xl border-2 border-dashed border-white/10 hover:border-yellow-500/40 cursor-pointer transition-colors">
                                    {uploading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : <Upload className="w-5 h-5 text-muted-foreground mb-1" />}
                                    <span className="text-xs text-muted-foreground">{uploading ? 'Uploading...' : 'Upload Cover Image'}</span>
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                </label>
                            )}

                            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Article Title *" className="bg-white/5 border-white/10 text-lg font-semibold" />

                            <div className="grid grid-cols-2 gap-3">
                                {/* Fixed: shadcn Select instead of plain <select> */}
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                                    <Select value={form.category} onValueChange={v => set('category', v)}>
                                        <SelectTrigger className="bg-white/5 border-white/10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map(c => (
                                                <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Author</label>
                                    <Input value={form.author_name} onChange={e => set('author_name', e.target.value)} placeholder="Author Name" className="bg-white/5 border-white/10" />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Excerpt</label>
                                <textarea value={form.excerpt} onChange={e => set('excerpt', e.target.value)} placeholder="Short description..."
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none h-16" />
                            </div>

                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Content (Markdown supported)</label>
                                <textarea value={form.content} onChange={e => set('content', e.target.value)} placeholder="Write your article here..."
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none h-48 font-mono" />
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="text-xs text-muted-foreground mb-2 block">Tags</label>
                                <div className="flex gap-2 mb-2 flex-wrap">
                                    {(form.tags || []).map(t => (
                                        <span key={t} className="flex items-center gap-1 text-xs bg-white/10 px-2 py-0.5 rounded-full">
                                            {t}<button onClick={() => removeTag(t)}><X className="w-2.5 h-2.5" /></button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Input value={tagInput} onChange={e => setTagInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                        placeholder="Add tag..." className="bg-white/5 border-white/10" />
                                    <Button type="button" size="sm" onClick={addTag} variant="ghost" className="text-muted-foreground hover:text-white">Add</Button>
                                </div>
                            </div>

                            {/* SEO */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">SEO</h3>
                                <Input value={form.seo_title} onChange={e => set('seo_title', e.target.value)} placeholder="SEO Title" className="bg-white/5 border-white/10" />
                                <textarea value={form.seo_description} onChange={e => set('seo_description', e.target.value)}
                                    placeholder="SEO Description (160 chars)" maxLength={160}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none h-16" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Publish Date</label>
                                    <Input type="date" value={form.published_at} onChange={e => set('published_at', e.target.value)} className="bg-white/5 border-white/10" />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Read Time (min)</label>
                                    <Input type="number" value={form.read_time_min} onChange={e => set('read_time_min', e.target.value)} placeholder="5" className="bg-white/5 border-white/10" />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.is_published} onChange={e => set('is_published', e.target.checked)} />
                                    <span className="text-sm text-emerald-400">Published</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.is_featured} onChange={e => set('is_featured', e.target.checked)} />
                                    <span className="text-sm text-yellow-400">Featured</span>
                                </label>
                            </div>
                        </div>

                        <div className="p-5 border-t border-white/5 flex gap-3">
                            <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
                            <Button onClick={() => save.mutate(form)} disabled={save.isPending} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
                                {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : post ? 'Update Article' : 'Publish Article'}
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default function AdminBlog() {
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const qc = useQueryClient();

    const { data: posts = [], isLoading } = useQuery({
        queryKey: ['blog-posts'],
        queryFn: () => entities.BlogPost.list('created_at', false),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => entities.BlogPost.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['blog-posts'] }),
    });

    const filtered = posts.filter(p =>
        p.title?.toLowerCase().includes(search.toLowerCase()) &&
        (filterCategory === 'all' || p.category === filterCategory)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-space flex items-center gap-2">
                        <FileText className="w-6 h-6 text-yellow-400" /> Blog & Content
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">{posts.length} articles · {posts.filter(p => p.is_published).length} published</p>
                </div>
                <Button onClick={() => { setEditing(null); setDrawerOpen(true); }} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
                    <Plus className="w-4 h-4" /> New Article
                </Button>
            </div>

            {/* Filters */}
            <div className="glass rounded-xl p-4 flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search articles..." className="pl-9 bg-white/5 border-white/10" />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-48 bg-white/5 border-white/10">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {CATEGORIES.map(c => (
                            <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="glass rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-muted-foreground">Loading...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                        <p className="text-muted-foreground">No articles yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/5 text-muted-foreground text-xs uppercase tracking-wider">
                                    <th className="text-left px-4 py-3">Title</th>
                                    <th className="text-left px-4 py-3">Category</th>
                                    <th className="text-left px-4 py-3">Author</th>
                                    <th className="text-left px-4 py-3">Date</th>
                                    <th className="text-left px-4 py-3">Status</th>
                                    <th className="text-right px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((p, i) => (
                                    <tr key={p.id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${i % 2 === 0 ? '' : 'bg-white/2'}`}>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {p.cover_image_url && <img src={p.cover_image_url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />}
                                                <div>
                                                    <div className="font-medium">{p.title}</div>
                                                    {p.is_featured && <span className="text-xs text-yellow-400 flex items-center gap-0.5"><Star className="w-2.5 h-2.5" />Featured</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs capitalize ${CAT_COLORS[p.category]}`}>{p.category?.replace('_', ' ')}</span>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs">{p.author_name || '—'}</td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs">
                                            {p.published_at ? format(new Date(p.published_at), 'MMM d, yyyy') : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`flex items-center gap-1 text-xs ${p.is_published ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                                                {p.is_published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                                {p.is_published ? 'Live' : 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="icon" variant="ghost" onClick={() => { setEditing(p); setDrawerOpen(true); }} className="h-7 w-7 hover:bg-blue-500/10 hover:text-blue-400">
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(p.id)} className="h-7 w-7 hover:bg-red-500/10 hover:text-red-400">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <BlogDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} post={editing} />
        </div>
    );
}