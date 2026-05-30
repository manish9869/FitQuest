import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { entities } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Trash2, Upload, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const EMPTY = {
    name: '', slug: '', description: '', meal_category: 'breakfast', difficulty: 'easy',
    cooking_time_min: '', servings: '', calories: '', protein: '', carbs: '', fats: '',
    fiber: '', sugar: '', ingredients: [''], instructions: [''], tips: '',
    tags: [], image_url: '', is_premium: false, is_published: true,
};

const ALL_TAGS = ['weight_loss', 'high_protein', 'keto', 'vegan', 'muscle_gain', 'low_carb'];

export default function RecipeFormDrawer({ open, onClose, recipe }) {
    const [form, setForm] = useState(EMPTY);
    const [uploading, setUploading] = useState(false);
    const qc = useQueryClient();

    useEffect(() => {
        if (recipe) {
            setForm({
                ...EMPTY, ...recipe,
                ingredients: recipe.ingredients?.length ? recipe.ingredients : [''],
                instructions: recipe.instructions?.length ? recipe.instructions : [''],
            });
        } else {
            setForm(EMPTY);
        }
    }, [recipe, open]);

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const saveMutation = useMutation({
        mutationFn: (data) => recipe
            ? entities.Recipe.update(recipe.id, data)
            : entities.Recipe.create(data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['recipes'] }); onClose(); },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = {
            ...form,
            ingredients: form.ingredients.filter(Boolean),
            instructions: form.instructions.filter(Boolean),
            cooking_time_min: Number(form.cooking_time_min) || undefined,
            servings: Number(form.servings) || undefined,
            calories: Number(form.calories) || undefined,
            protein: Number(form.protein) || undefined,
            carbs: Number(form.carbs) || undefined,
            fats: Number(form.fats) || undefined,
            fiber: Number(form.fiber) || undefined,
            sugar: Number(form.sugar) || undefined,
        };
        saveMutation.mutate(data);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const { file_url } = await entities.Recipe.uploadFile({ file });
        set('image_url', file_url);
        setUploading(false);
    };

    const updateList = (key, idx, val) => {
        const arr = [...form[key]];
        arr[idx] = val;
        set(key, arr);
    };
    const addListItem = (key) => set(key, [...form[key], '']);
    const removeListItem = (key, idx) => set(key, form[key].filter((_, i) => i !== idx));

    const toggleTag = (tag) => {
        const tags = form.tags.includes(tag) ? form.tags.filter(t => t !== tag) : [...form.tags, tag];
        set('tags', tags);
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div className="fixed inset-0 bg-black/60 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
                    <motion.div className="fixed right-0 top-0 h-full w-full max-w-2xl z-50 flex flex-col overflow-hidden"
                        style={{ background: 'hsl(220 20% 5%)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30 }}>
                        <div className="flex items-center justify-between p-5 border-b border-white/5">
                            <h2 className="font-bold font-space">{recipe ? 'Edit Recipe' : 'New Recipe'}</h2>
                            <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground hover:text-white" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
                            {/* Image Upload */}
                            <div>
                                <label className="text-xs text-muted-foreground mb-2 block">Cover Image</label>
                                <div className="relative">
                                    {form.image_url ? (
                                        <div className="relative w-full h-40 rounded-xl overflow-hidden">
                                            <img src={form.image_url} alt="recipe" className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => set('image_url', '')} className="absolute top-2 right-2 bg-black/60 rounded-full p-1">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-white/10 hover:border-emerald-500/40 cursor-pointer transition-colors">
                                            {uploading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : <Upload className="w-5 h-5 text-muted-foreground mb-2" />}
                                            <span className="text-xs text-muted-foreground">{uploading ? 'Uploading...' : 'Click to upload image'}</span>
                                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Basic Info */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Basic Info</h3>
                                <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Recipe Name *" className="bg-white/5 border-white/10" required />
                                <Input value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="slug-url" className="bg-white/5 border-white/10" />
                                <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Description..."
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none h-20" />
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                                        <select value={form.meal_category} onChange={e => set('meal_category', e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground">
                                            {['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'].map(c =>
                                                <option key={c} value={c}>{c.replace('_', ' ')}</option>
                                            )}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">Difficulty</label>
                                        <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground">
                                            {['easy', 'medium', 'hard'].map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">Cook Time (min)</label>
                                        <Input type="number" value={form.cooking_time_min} onChange={e => set('cooking_time_min', e.target.value)} placeholder="30" className="bg-white/5 border-white/10" />
                                    </div>
                                </div>
                            </div>

                            {/* Nutrition */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nutrition (per serving)</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {[['calories', 'Calories'], ['protein', 'Protein (g)'], ['carbs', 'Carbs (g)'], ['fats', 'Fats (g)'], ['fiber', 'Fiber (g)'], ['sugar', 'Sugar (g)']].map(([k, label]) => (
                                        <div key={k}>
                                            <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                                            <Input type="number" value={form[k]} onChange={e => set(k, e.target.value)} placeholder="0" className="bg-white/5 border-white/10" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Ingredients */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ingredients</h3>
                                {form.ingredients.map((ing, i) => (
                                    <div key={i} className="flex gap-2">
                                        <Input value={ing} onChange={e => updateList('ingredients', i, e.target.value)} placeholder={`Ingredient ${i + 1}`} className="bg-white/5 border-white/10" />
                                        <Button type="button" size="icon" variant="ghost" onClick={() => removeListItem('ingredients', i)} className="h-9 w-9 text-red-400 hover:bg-red-500/10 flex-shrink-0">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                ))}
                                <Button type="button" variant="ghost" size="sm" onClick={() => addListItem('ingredients')} className="text-emerald-400 hover:bg-emerald-500/10">
                                    <Plus className="w-3.5 h-3.5" /> Add Ingredient
                                </Button>
                            </div>

                            {/* Instructions */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Steps</h3>
                                {form.instructions.map((step, i) => (
                                    <div key={i} className="flex gap-2 items-start">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center flex-shrink-0 mt-2">{i + 1}</div>
                                        <textarea value={step} onChange={e => updateList('instructions', i, e.target.value)} placeholder={`Step ${i + 1}`}
                                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none h-16" />
                                        <Button type="button" size="icon" variant="ghost" onClick={() => removeListItem('instructions', i)} className="h-9 w-9 text-red-400 hover:bg-red-500/10 flex-shrink-0">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                ))}
                                <Button type="button" variant="ghost" size="sm" onClick={() => addListItem('instructions')} className="text-emerald-400 hover:bg-emerald-500/10">
                                    <Plus className="w-3.5 h-3.5" /> Add Step
                                </Button>
                            </div>

                            {/* Tags */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {ALL_TAGS.map(tag => (
                                        <button key={tag} type="button" onClick={() => toggleTag(tag)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${form.tags.includes(tag) ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/10 text-muted-foreground hover:border-white/20'}`}>
                                            {tag.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Settings */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Settings</h3>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={form.is_premium} onChange={e => set('is_premium', e.target.checked)} className="rounded" />
                                        <span className="text-sm text-yellow-400">Premium Only</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={form.is_published} onChange={e => set('is_published', e.target.checked)} className="rounded" />
                                        <span className="text-sm text-emerald-400">Published</span>
                                    </label>
                                </div>
                            </div>
                        </form>

                        <div className="p-5 border-t border-white/5 flex gap-3">
                            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
                            <Button onClick={handleSubmit} disabled={saveMutation.isPending} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
                                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : recipe ? 'Update Recipe' : 'Create Recipe'}
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}


