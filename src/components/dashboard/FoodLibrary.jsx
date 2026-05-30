import React, { useState } from 'react';
import { entities } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { Search, Check, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_COLORS = {
    protein: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    carbs: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    fats: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    vegetables: 'bg-lime-500/10 text-lime-400 border-lime-500/20',
    fruits: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    dairy: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    grains: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    beverages: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    supplements: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const CATEGORIES = ['all', 'protein', 'carbs', 'fats', 'vegetables', 'fruits', 'dairy', 'grains', 'supplements'];

// Lightweight fallback list shown while DB loads
const FALLBACK = [
    { id: 'f1', name: 'Grilled Chicken Breast (100g)', category: 'protein', calories_per_100g: 165, protein_per_100g: 31, carbs_per_100g: 0, fats_per_100g: 3.6, serving_size_g: 100 },
    { id: 'f2', name: 'Salmon Fillet (100g)', category: 'protein', calories_per_100g: 208, protein_per_100g: 20, carbs_per_100g: 0, fats_per_100g: 13, serving_size_g: 100 },
    { id: 'f3', name: 'Brown Rice (1 cup)', category: 'grains', calories_per_100g: 111, protein_per_100g: 2.6, carbs_per_100g: 23, fats_per_100g: 0.9, serving_size_g: 185 },
    { id: 'f4', name: 'Oatmeal (1 cup)', category: 'grains', calories_per_100g: 68, protein_per_100g: 2.4, carbs_per_100g: 12, fats_per_100g: 1.4, serving_size_g: 240 },
    { id: 'f5', name: 'Avocado (half)', category: 'fats', calories_per_100g: 160, protein_per_100g: 2, carbs_per_100g: 9, fats_per_100g: 15, serving_size_g: 75 },
    { id: 'f6', name: 'Greek Yogurt (200g)', category: 'dairy', calories_per_100g: 59, protein_per_100g: 10, carbs_per_100g: 3.6, fats_per_100g: 0.4, serving_size_g: 200 },
    { id: 'f7', name: 'Banana (1 large)', category: 'fruits', calories_per_100g: 89, protein_per_100g: 1.1, carbs_per_100g: 23, fats_per_100g: 0.3, serving_size_g: 118 },
    { id: 'f8', name: 'Almonds (30g)', category: 'fats', calories_per_100g: 579, protein_per_100g: 21, carbs_per_100g: 22, fats_per_100g: 50, serving_size_g: 30 },
];

function toMealLogEntry(item) {
    const servingFactor = (item.serving_size_g || 100) / 100;
    return {
        food_name: item.name,
        calories: Math.round((item.calories_per_100g || 0) * servingFactor),
        protein: Math.round((item.protein_per_100g || 0) * servingFactor),
        carbs: Math.round((item.carbs_per_100g || 0) * servingFactor),
        fats: Math.round((item.fats_per_100g || 0) * servingFactor),
    };
}

// Multi-select food library — onSelect(items[]) is called with array of entries
export default function FoodLibrary({ onSelect }) {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [selected, setSelected] = useState(new Set());

    const { data: dbItems = [], isLoading } = useQuery({
        queryKey: ['foodItems'],
        queryFn: () => entities.FoodItem.list(),
    });

    const source = dbItems.length > 0 ? dbItems : FALLBACK;

    const filtered = source.filter(f => {
        const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase());
        const matchCat = activeCategory === 'all' || f.category === activeCategory;
        return matchSearch && matchCat;
    });

    const toggleItem = (item) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(item.id)) {
                next.delete(item.id);
            } else {
                next.add(item.id);
            }
            return next;
        });
    };

    const selectedItems = source.filter(f => selected.has(f.id));

    const handleAddSelected = () => {
        if (selectedItems.length === 0) return;
        onSelect(selectedItems.map(toMealLogEntry));
        setSelected(new Set());
    };

    return (
        <div className="space-y-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search foods..." className="pl-10 bg-white/5 border-white/10" />
            </div>

            <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(cat)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all capitalize ${activeCategory === cat ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'border-white/10 text-muted-foreground hover:border-white/20'}`}>
                        {cat}
                    </button>
                ))}
            </div>

            {isLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading food database...
                </div>
            )}

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                <AnimatePresence>
                    {filtered.map(item => {
                        const servingFactor = (item.serving_size_g || 100) / 100;
                        const cal = Math.round((item.calories_per_100g || 0) * servingFactor);
                        const pro = Math.round((item.protein_per_100g || 0) * servingFactor);
                        const carbs = Math.round((item.carbs_per_100g || 0) * servingFactor);
                        const fats = Math.round((item.fats_per_100g || 0) * servingFactor);
                        const isSelected = selected.has(item.id);
                        return (
                            <motion.button key={item.id} onClick={() => toggleItem(item)}
                                className={`w-full text-left p-3 rounded-xl border transition-all ${isSelected ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/5 bg-white/3 hover:bg-white/5 hover:border-white/10'}`}
                                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="text-sm font-medium">{item.name}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border capitalize ${CATEGORY_COLORS[item.category] || 'bg-white/5 text-muted-foreground border-white/10'}`}>
                                                {item.category}
                                            </span>
                                        </div>
                                        <div className="flex gap-3 text-xs text-muted-foreground">
                                            <span className="text-emerald-400 font-medium">{cal} kcal</span>
                                            <span>P: {pro}g</span>
                                            <span>C: {carbs}g</span>
                                            <span>F: {fats}g</span>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border transition-all ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 bg-white/5'}`}>
                                        {isSelected && <Check className="w-3 h-3 text-black" />}
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                </AnimatePresence>
                {filtered.length === 0 && !isLoading && (
                    <p className="text-center text-sm text-muted-foreground py-6">No foods found</p>
                )}
            </div>

            {/* Sticky add bar */}
            {selected.size > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="sticky bottom-0 glass border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="text-sm">
                        <span className="text-emerald-400 font-semibold">{selected.size} item{selected.size > 1 ? 's' : ''}</span>
                        <span className="text-muted-foreground ml-1">selected</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setSelected(new Set())} className="text-xs text-muted-foreground hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all">
                            Clear
                        </button>
                        <button onClick={handleAddSelected} className="text-xs bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" /> Add {selected.size} to Log
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}


