import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { entities } from '@/api/entities';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Clock, Flame, Users, ChefHat, Leaf, BookOpen } from 'lucide-react';

const TAG_COLORS = {
    weight_loss: 'bg-blue-500/10 text-blue-400',
    high_protein: 'bg-emerald-500/10 text-emerald-400',
    keto: 'bg-purple-500/10 text-purple-400',
    vegan: 'bg-lime-500/10 text-lime-400',
    muscle_gain: 'bg-orange-500/10 text-orange-400',
    low_carb: 'bg-red-500/10 text-red-400',
    default: 'bg-white/10 text-muted-foreground',
};

function RecipeCard({ recipe, onClick }) {
    return (
        <motion.div whileHover={{ y: -4 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl overflow-hidden border border-white/10 hover:border-emerald-500/30 transition-all cursor-pointer"
            onClick={() => onClick(recipe)}>
            <div className="relative h-40 overflow-hidden">
                {recipe.image_url ? (
                    <img src={recipe.image_url} alt={recipe.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-emerald-500/10 flex items-center justify-center">
                        <ChefHat className="w-12 h-12 text-emerald-400/30" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute top-3 left-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm capitalize border border-white/20">{recipe.meal_category}</span>
                </div>
                {recipe.cooking_time_min && (
                    <div className="absolute bottom-3 right-3">
                        <span className="flex items-center gap-1 text-xs text-white bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                            <Clock className="w-3 h-3" /> {recipe.cooking_time_min}m
                        </span>
                    </div>
                )}
            </div>
            <div className="p-4">
                <h3 className="font-semibold mb-1">{recipe.name}</h3>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{recipe.description}</p>
                <div className="grid grid-cols-4 gap-1 mb-3 text-center">
                    {[
                        { label: 'Cal', value: recipe.calories, color: 'text-emerald-400' },
                        { label: 'P', value: `${recipe.protein}g`, color: 'text-blue-400' },
                        { label: 'C', value: `${recipe.carbs}g`, color: 'text-orange-400' },
                        { label: 'F', value: `${recipe.fats}g`, color: 'text-purple-400' },
                    ].map(s => (
                        <div key={s.label} className="bg-white/5 rounded-lg py-1.5">
                            <div className={`text-xs font-bold ${s.color}`}>{s.value}</div>
                            <div className="text-[9px] text-muted-foreground">{s.label}</div>
                        </div>
                    ))}
                </div>
                <div className="flex flex-wrap gap-1">
                    {(recipe.tags || []).slice(0, 3).map(tag => (
                        <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded-full ${TAG_COLORS[tag] || TAG_COLORS.default}`}>
                            {tag.replace('_', ' ')}
                        </span>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

function RecipeModal({ recipe, onClose }) {
    if (!recipe) return null;
    return (
        <Dialog open={!!recipe} onOpenChange={onClose}>
            <DialogContent className="glass border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ChefHat className="w-5 h-5 text-emerald-400" /> {recipe.name}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-5">
                    {recipe.image_url && <img src={recipe.image_url} alt={recipe.name} className="w-full h-48 object-cover rounded-xl" />}
                    <div className="grid grid-cols-4 gap-3 text-center">
                        {[
                            { label: 'Calories', value: recipe.calories, unit: 'kcal', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                            { label: 'Protein', value: `${recipe.protein}g`, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                            { label: 'Carbs', value: `${recipe.carbs}g`, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                            { label: 'Fat', value: `${recipe.fats}g`, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                        ].map(s => (
                            <div key={s.label} className={`${s.bg} rounded-xl py-3`}>
                                <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                                <div className="text-xs text-muted-foreground">{s.label}</div>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        {recipe.cooking_time_min && <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {recipe.cooking_time_min} mins</span>}
                        {recipe.servings && <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {recipe.servings} serving{recipe.servings > 1 ? 's' : ''}</span>}
                        {recipe.difficulty && <span className="flex items-center gap-1"><Leaf className="w-4 h-4 text-emerald-400" /> {recipe.difficulty}</span>}
                    </div>
                    {recipe.description && <p className="text-sm text-muted-foreground">{recipe.description}</p>}
                    <div className="flex flex-wrap gap-1.5">
                        {(recipe.tags || []).map(tag => (
                            <span key={tag} className={`text-xs px-2.5 py-1 rounded-full ${TAG_COLORS[tag] || TAG_COLORS.default}`}>{tag.replace('_', ' ')}</span>
                        ))}
                    </div>
                    {recipe.ingredients?.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-400" /> Ingredients</h4>
                            <ul className="grid sm:grid-cols-2 gap-2">
                                {recipe.ingredients.map((ing, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />{ing}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {recipe.instructions?.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2"><ChefHat className="w-4 h-4 text-orange-400" /> Instructions</h4>
                            <ol className="space-y-2.5">
                                {recipe.instructions.map((step, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm">
                                        <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                                        <span className="text-muted-foreground">{step}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}
                    {recipe.tips && <div className="glass rounded-xl p-3 border border-yellow-500/20"><p className="text-sm text-yellow-400">💡 Tip: {recipe.tips}</p></div>}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function HealthyRecipes() {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [selectedRecipe, setSelectedRecipe] = useState(null);

    const { data: recipes = [], isLoading } = useQuery({
        queryKey: ['recipes-published'],
        queryFn: () => entities.Recipe.filter({ is_published: true }),
    });

    const categories = useMemo(() => {
        const cats = [...new Set(recipes.map(r => r.meal_category).filter(Boolean))];
        return ['all', ...cats];
    }, [recipes]);

    const filtered = useMemo(() => recipes.filter(r => {
        const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) ||
            (r.tags || []).some(t => t.includes(search.toLowerCase()));
        const matchCat = category === 'all' || r.meal_category === category;
        return matchSearch && matchCat;
    }), [recipes, search, category]);

    const avgCal = recipes.length ? Math.round(recipes.reduce((s, r) => s + (r.calories || 0), 0) / recipes.length) : 0;
    const avgProtein = recipes.length ? Math.round(recipes.reduce((s, r) => s + (r.protein || 0), 0) / recipes.length) : 0;
    const fastestTime = recipes.length ? Math.min(...recipes.map(r => r.cooking_time_min || 999)) : 0;
    const vegCount = recipes.filter(r => (r.tags || []).some(t => t === 'vegan')).length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-space font-bold flex items-center gap-2">
                        <ChefHat className="w-7 h-7 text-orange-400" /> Healthy Recipes
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Nutritious meals crafted for fitness goals</p>
                </div>
                <div className="flex items-center gap-2 glass px-4 py-2 rounded-xl">
                    <Leaf className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-emerald-400 font-medium">{recipes.length} Recipes</span>
                </div>
            </div>

            <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search recipes or tags..." className="pl-10 bg-white/5 border-white/10" />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setCategory(cat)}
                            className={`text-sm px-4 py-2 rounded-xl border transition-all capitalize ${category === cat ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'border-white/10 text-muted-foreground hover:border-white/20'}`}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Avg Calories', value: avgCal, icon: Flame, color: 'text-emerald-400', unit: 'kcal' },
                    { label: 'Avg Protein', value: avgProtein, icon: Leaf, color: 'text-blue-400', unit: 'g' },
                    { label: 'Fastest Recipe', value: fastestTime, icon: Clock, color: 'text-orange-400', unit: 'min' },
                    { label: 'Vegan Recipes', value: vegCount, icon: Leaf, color: 'text-green-400', unit: '' },
                ].map(s => (
                    <GlassCard key={s.label} animate={false} className="text-center py-3">
                        <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-1`} />
                        <div className={`text-xl font-bold font-space ${s.color}`}>{s.value}{s.unit && <span className="text-xs ml-0.5">{s.unit}</span>}</div>
                        <div className="text-xs text-muted-foreground">{s.label}</div>
                    </GlassCard>
                ))}
            </div>

            {isLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {[...Array(8)].map((_, i) => <div key={i} className="h-64 glass rounded-2xl animate-pulse" />)}
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    <AnimatePresence>
                        {filtered.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} onClick={setSelectedRecipe} />)}
                    </AnimatePresence>
                    {filtered.length === 0 && (
                        <div className="col-span-full text-center py-16 text-muted-foreground">
                            <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No recipes found{search ? ` for "${search}"` : ''}.</p>
                        </div>
                    )}
                </div>
            )}

            <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
        </div>
    );
}


