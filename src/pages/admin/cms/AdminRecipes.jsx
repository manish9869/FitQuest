import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entities } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Pencil, Trash2, ChefHat, Clock, Star, Eye, EyeOff } from 'lucide-react';
import RecipeFormDrawer from '@/components/admin/cms/RecipeFormDrawer';

const CATEGORY_COLORS = {
    breakfast: 'bg-yellow-500/20 text-yellow-400',
    lunch: 'bg-green-500/20 text-green-400',
    dinner: 'bg-blue-500/20 text-blue-400',
    snack: 'bg-pink-500/20 text-pink-400',
    pre_workout: 'bg-orange-500/20 text-orange-400',
    post_workout: 'bg-purple-500/20 text-purple-400',
};

const DIFFICULTY_COLORS = {
    easy: 'bg-emerald-500/20 text-emerald-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    hard: 'bg-red-500/20 text-red-400',
};

export default function AdminRecipes() {
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterPremium, setFilterPremium] = useState('all');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const qc = useQueryClient();

    const { data: recipes = [], isLoading } = useQuery({
        queryKey: ['recipes'],
        queryFn: () => entities.Recipe.list('created_at', false),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => entities.Recipe.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
    });

    const togglePublish = useMutation({
        mutationFn: ({ id, val }) => entities.Recipe.update(id, { is_published: val }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
    });

    const filtered = recipes.filter(r => {
        const matchSearch = r.name?.toLowerCase().includes(search.toLowerCase());
        const matchCat = filterCategory === 'all' || r.meal_category === filterCategory;
        const matchPremium = filterPremium === 'all' || (filterPremium === 'premium' ? r.is_premium : !r.is_premium);
        return matchSearch && matchCat && matchPremium;
    });

    const openNew = () => { setEditing(null); setDrawerOpen(true); };
    const openEdit = (r) => { setEditing(r); setDrawerOpen(true); };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-space flex items-center gap-2">
                        <ChefHat className="w-6 h-6 text-emerald-400" /> Recipe Master
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">{recipes.length} recipes in database</p>
                </div>
                <Button onClick={openNew} className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
                    <Plus className="w-4 h-4" /> Add Recipe
                </Button>
            </div>

            {/* Filters */}
            <div className="glass rounded-xl p-4 flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search recipes..."
                        className="pl-9 bg-white/5 border-white/10"
                    />
                </div>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-48 bg-white/5 border-white/10">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'].map(c => (
                            <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filterPremium} onValueChange={setFilterPremium}>
                    <SelectTrigger className="w-36 bg-white/5 border-white/10">
                        <SelectValue placeholder="All Access" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Access</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="glass rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-muted-foreground">Loading recipes...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <ChefHat className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                        <p className="text-muted-foreground">No recipes found. Add your first recipe!</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/5 text-muted-foreground text-xs uppercase tracking-wider">
                                    <th className="text-left px-4 py-3">Recipe</th>
                                    <th className="text-left px-4 py-3">Category</th>
                                    <th className="text-left px-4 py-3">Difficulty</th>
                                    <th className="text-right px-4 py-3">Calories</th>
                                    <th className="text-right px-4 py-3">Protein</th>
                                    <th className="text-left px-4 py-3">Access</th>
                                    <th className="text-left px-4 py-3">Status</th>
                                    <th className="text-right px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((r, i) => (
                                    <tr key={r.id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${i % 2 === 0 ? '' : 'bg-white/2'}`}>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {r.image_url ? (
                                                    <img src={r.image_url} alt={r.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                                        <ChefHat className="w-4 h-4 text-emerald-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium text-white">{r.name}</div>
                                                    {r.cooking_time_min && (
                                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />{r.cooking_time_min} min
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${CATEGORY_COLORS[r.meal_category] || 'bg-white/10 text-white'}`}>
                                                {r.meal_category?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {r.difficulty && (
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${DIFFICULTY_COLORS[r.difficulty]}`}>
                                                    {r.difficulty}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono">{r.calories ?? '—'}</td>
                                        <td className="px-4 py-3 text-right font-mono text-blue-400">{r.protein ? `${r.protein}g` : '—'}</td>
                                        <td className="px-4 py-3">
                                            {r.is_premium
                                                ? <span className="flex items-center gap-1 text-xs text-yellow-400"><Star className="w-3 h-3" />Premium</span>
                                                : <span className="text-xs text-muted-foreground">Free</span>
                                            }
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => togglePublish.mutate({ id: r.id, val: !r.is_published })}
                                                className={`flex items-center gap-1 text-xs ${r.is_published ? 'text-emerald-400' : 'text-muted-foreground'}`}
                                            >
                                                {r.is_published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                                {r.is_published ? 'Live' : 'Hidden'}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="icon" variant="ghost" onClick={() => openEdit(r)} className="h-7 w-7 hover:bg-blue-500/10 hover:text-blue-400">
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(r.id)} className="h-7 w-7 hover:bg-red-500/10 hover:text-red-400">
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

            <RecipeFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} recipe={editing} />
        </div>
    );
}