// ─────────────────────────────────────────────
// AdminFoodDatabase.jsx
// ─────────────────────────────────────────────
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entities } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Pencil, Trash2, Apple, Loader2, X, CheckCircle, Star } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const CAT_COLORS = {
    protein: 'text-red-400', carbs: 'text-yellow-400', fats: 'text-orange-400',
    vegetables: 'text-green-400', fruits: 'text-pink-400', dairy: 'text-blue-400',
    grains: 'text-amber-400', beverages: 'text-cyan-400', supplements: 'text-purple-400',
};

const FOOD_CATS = ['protein', 'carbs', 'fats', 'vegetables', 'fruits', 'dairy', 'grains', 'beverages', 'supplements'];

const EMPTY = { name: '', category: 'protein', calories_per_100g: '', protein_per_100g: '', carbs_per_100g: '', fats_per_100g: '', fiber_per_100g: '', serving_size_g: '', serving_label: '', barcode: '', is_verified: false, is_popular: false };

function FoodDrawer({ open, onClose, food }) {
    const [form, setForm] = useState(EMPTY);
    const qc = useQueryClient();
    React.useEffect(() => { setForm(food ? { ...EMPTY, ...food } : EMPTY); }, [food, open]);
    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const save = useMutation({
        mutationFn: (d) => {
            const clean = { ...d, calories_per_100g: Number(d.calories_per_100g) || 0, protein_per_100g: Number(d.protein_per_100g) || 0, carbs_per_100g: Number(d.carbs_per_100g) || 0, fats_per_100g: Number(d.fats_per_100g) || 0, fiber_per_100g: Number(d.fiber_per_100g) || 0, serving_size_g: Number(d.serving_size_g) || undefined };
            return food ? entities.FoodItem.update(food.id, clean) : entities.FoodItem.create(clean);
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['food-items'] }); onClose(); },
    });

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div className="fixed inset-0 bg-black/60 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
                    <motion.div className="fixed right-0 top-0 h-full w-full max-w-lg z-50 flex flex-col"
                        style={{ background: 'hsl(220 20% 5%)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30 }}>
                        <div className="flex items-center justify-between p-5 border-b border-white/5">
                            <h2 className="font-bold font-space">{food ? 'Edit Food Item' : 'New Food Item'}</h2>
                            <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Food Name *" className="bg-white/5 border-white/10" />
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                                <Select value={form.category} onValueChange={v => set('category', v)}>
                                    <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {FOOD_CATS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Nutrition per 100g</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {[['calories_per_100g', 'Calories'], ['protein_per_100g', 'Protein (g)'], ['carbs_per_100g', 'Carbs (g)'], ['fats_per_100g', 'Fats (g)'], ['fiber_per_100g', 'Fiber (g)']].map(([k, label]) => (
                                        <div key={k}>
                                            <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                                            <Input type="number" value={form[k]} onChange={e => set(k, e.target.value)} placeholder="0" className="bg-white/5 border-white/10" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Serving Size (g)</label>
                                    <Input type="number" value={form.serving_size_g} onChange={e => set('serving_size_g', e.target.value)} placeholder="100" className="bg-white/5 border-white/10" />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Serving Label</label>
                                    <Input value={form.serving_label} onChange={e => set('serving_label', e.target.value)} placeholder="e.g. 1 cup" className="bg-white/5 border-white/10" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Barcode</label>
                                <Input value={form.barcode} onChange={e => set('barcode', e.target.value)} placeholder="012345678901" className="bg-white/5 border-white/10" />
                            </div>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.is_verified} onChange={e => set('is_verified', e.target.checked)} />
                                    <span className="text-sm text-emerald-400">Verified</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.is_popular} onChange={e => set('is_popular', e.target.checked)} />
                                    <span className="text-sm text-yellow-400">Popular</span>
                                </label>
                            </div>
                        </div>
                        <div className="p-5 border-t border-white/5 flex gap-3">
                            <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
                            <Button onClick={() => save.mutate(form)} disabled={save.isPending} className="flex-1 bg-green-500 hover:bg-green-600 text-black font-semibold">
                                {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : food ? 'Update' : 'Create'}
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default function AdminFoodDatabase() {
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState('all');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const qc = useQueryClient();

    const { data: foods = [], isLoading } = useQuery({
        queryKey: ['food-items'],
        queryFn: () => entities.FoodItem.list('created_at', false),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => entities.FoodItem.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['food-items'] }),
    });

    const filtered = foods.filter(f =>
        f.name?.toLowerCase().includes(search.toLowerCase()) &&
        (filterCat === 'all' || f.category === filterCat)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-space flex items-center gap-2"><Apple className="w-6 h-6 text-green-400" /> Food Database</h1>
                    <p className="text-sm text-muted-foreground mt-1">{foods.length} food items</p>
                </div>
                <Button onClick={() => { setEditing(null); setDrawerOpen(true); }} className="bg-green-500 hover:bg-green-600 text-black font-semibold">
                    <Plus className="w-4 h-4" /> Add Food
                </Button>
            </div>

            <div className="glass rounded-xl p-4 flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search foods..." className="pl-9 bg-white/5 border-white/10" />
                </div>
                <Select value={filterCat} onValueChange={setFilterCat}>
                    <SelectTrigger className="w-44 bg-white/5 border-white/10">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {FOOD_CATS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="glass rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-muted-foreground">Loading...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <Apple className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                        <p className="text-muted-foreground">No food items. Add your first food!</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/5 text-muted-foreground text-xs uppercase tracking-wider">
                                    <th className="text-left px-4 py-3">Food</th>
                                    <th className="text-left px-4 py-3">Category</th>
                                    <th className="text-right px-4 py-3">Cal/100g</th>
                                    <th className="text-right px-4 py-3">Protein</th>
                                    <th className="text-right px-4 py-3">Carbs</th>
                                    <th className="text-right px-4 py-3">Fats</th>
                                    <th className="text-left px-4 py-3">Flags</th>
                                    <th className="text-right px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((f, i) => (
                                    <tr key={f.id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${i % 2 === 0 ? '' : 'bg-white/2'}`}>
                                        <td className="px-4 py-3 font-medium">{f.name}</td>
                                        <td className="px-4 py-3"><span className={`text-xs capitalize ${CAT_COLORS[f.category]}`}>{f.category}</span></td>
                                        <td className="px-4 py-3 text-right font-mono">{f.calories_per_100g ?? '—'}</td>
                                        <td className="px-4 py-3 text-right font-mono text-blue-400">{f.protein_per_100g ? `${f.protein_per_100g}g` : '—'}</td>
                                        <td className="px-4 py-3 text-right font-mono text-yellow-400">{f.carbs_per_100g ? `${f.carbs_per_100g}g` : '—'}</td>
                                        <td className="px-4 py-3 text-right font-mono text-orange-400">{f.fats_per_100g ? `${f.fats_per_100g}g` : '—'}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1">
                                                {f.is_verified && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                                                {f.is_popular && <Star className="w-3.5 h-3.5 text-yellow-400" />}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="icon" variant="ghost" onClick={() => { setEditing(f); setDrawerOpen(true); }} className="h-7 w-7 hover:bg-blue-500/10 hover:text-blue-400"><Pencil className="w-3.5 h-3.5" /></Button>
                                                <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(f.id)} className="h-7 w-7 hover:bg-red-500/10 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <FoodDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} food={editing} />
        </div>
    );
}