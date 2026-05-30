import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entities } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, Check, X, Loader2, Wand2, ChevronDown, ChevronUp, Trash2, RefreshCw } from 'lucide-react';
import { format, startOfWeek } from 'date-fns';
import { invokeLLM } from '@/api/llm';

const CATEGORY_COLORS = {
    proteins: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    vegetables: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    fruits: { color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
    dairy: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    grains: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    fats: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    snacks: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    supplements: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    other: { color: 'text-muted-foreground', bg: 'bg-white/5', border: 'border-white/10' },
};

const CATEGORY_MAP = {
    protein: 'proteins',
    proteins: 'proteins',
    carbohydrate: 'grains',
    carbohydrates: 'grains',
    carbs: 'grains',
    grain: 'grains',
    grains: 'grains',
    vegetable: 'vegetables',
    vegetables: 'vegetables',
    'healthy fat': 'fats',
    'healthy fats': 'fats',
    fat: 'fats',
    fats: 'fats',
    fruit: 'fruits',
    fruits: 'fruits',
    dairy: 'dairy',
    supplement: 'supplements',
    supplements: 'supplements',
    snack: 'snacks',
    snacks: 'snacks',
    other: 'other',
};

const WEEK_START = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

const GOAL_PRESETS = [
    { key: 'fat_loss', label: 'Fat Loss', desc: 'High protein, low carb essentials' },
    { key: 'muscle_gain', label: 'Muscle Gain', desc: 'Calorie-dense, protein-rich basics' },
    { key: 'general_fitness', label: 'General Fitness', desc: 'Balanced whole-food staples' },
];

export default function GroceryListPage() {
    const { user } = useAuth();
    const qc = useQueryClient();
    const [showAddItem, setShowAddItem] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', quantity: '', category: 'proteins', substitute: '' });
    const [generating, setGenerating] = useState(false);
    const [expandedCats, setExpandedCats] = useState({});
    const [activeListId, setActiveListId] = useState(null);

    const { data: lists = [], isLoading } = useQuery({
        queryKey: ['grocery-lists', user?.email],
        queryFn: () => entities.GroceryList.filter({ user_email: user.email }, 'created_at', false),
        enabled: !!user?.email,
    });

    const { data: userProfile } = useQuery({
        queryKey: ['user-profile', user?.email],
        queryFn: () => entities.UserProfile.filter({ user_email: user.email }),
        enabled: !!user?.email,
        select: (data) => data[0],
    });

    const activeList = lists.find(l => l.id === activeListId) || lists[0] || null;
    const items = activeList?.items || [];

    const updateList = useMutation({
        mutationFn: ({ id, items }) => entities.GroceryList.update(id, { items }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['grocery-lists'] }),
    });

    const createList = useMutation({
        mutationFn: (data) => entities.GroceryList.create({ ...data, user_email: user.email, week_start: WEEK_START }),
        onSuccess: (res) => { qc.invalidateQueries({ queryKey: ['grocery-lists'] }); setActiveListId(res.id); },
    });

    const deleteList = useMutation({
        mutationFn: (id) => entities.GroceryList.delete(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['grocery-lists'] }); setActiveListId(null); },
    });

    const toggleItem = (idx) => {
        if (!activeList) return;
        const updated = items.map((item, i) => i === idx ? { ...item, checked: !item.checked } : item);
        updateList.mutate({ id: activeList.id, items: updated });
    };

    const addItem = () => {
        if (!newItem.name || !activeList) return;
        const updated = [...items, { ...newItem, checked: false }];
        updateList.mutate({ id: activeList.id, items: updated });
        setNewItem({ name: '', quantity: '', category: 'proteins', substitute: '' });
        setShowAddItem(false);
    };

    const removeItem = (idx) => {
        if (!activeList) return;
        const updated = items.filter((_, i) => i !== idx);
        updateList.mutate({ id: activeList.id, items: updated });
    };

    const generateWithAI = async () => {
        setGenerating(true);
        try {
            const goal = userProfile?.fitness_goal || 'fat_loss';
            const calories = userProfile?.daily_calorie_target || 2000;
            const protein = userProfile?.protein_target || 150;

            const res = await invokeLLM({
                prompt: `Generate a weekly grocery list for someone with fitness goal: ${goal}, calorie target: ${calories} kcal/day, protein target: ${protein}g/day. Return 12-16 practical grocery items. category MUST be exactly one of: proteins, vegetables, fruits, dairy, grains, fats, snacks, supplements, other — no other values allowed.`,
                response_json_schema: {
                    type: 'object',
                    properties: {
                        items: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    quantity: { type: 'string' },
                                    category: { type: 'string' },
                                    substitute: { type: 'string' },
                                },
                            },
                        },
                    },
                },
            });

            const aiItems = (res.items || []).map(i => ({ ...i, checked: false }));
            await createList.mutateAsync({
                name: `AI Generated — Week of ${format(new Date(), 'MMM d')}`,
                items: aiItems,
                generated_from: 'ai',
            });
        } finally {
            setGenerating(false);
        }
    };

    const loadPreset = async (goal) => {
        setGenerating(true);
        try {
            const calories = userProfile?.daily_calorie_target || 2000;
            const protein = userProfile?.protein_target || 150;
            const res = await invokeLLM({
                prompt: `Generate a concise weekly grocery list for fitness goal: ${goal}, calorie target: ${calories} kcal/day, protein target: ${protein}g/day. Return 12-16 practical grocery items. category MUST be exactly one of: proteins, vegetables, fruits, dairy, grains, fats, snacks, supplements, other — no other values allowed.`,
                response_json_schema: {
                    type: 'object',
                    properties: {
                        items: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    quantity: { type: 'string' },
                                    category: { type: 'string' },
                                    substitute: { type: 'string' },
                                },
                            },
                        },
                    },
                },
            });
            const aiItems = (res.items || []).map(i => ({ ...i, checked: false }));
            await createList.mutateAsync({
                name: `${goal.replace(/_/g, ' ')} list — Week of ${format(new Date(), 'MMM d')}`,
                items: aiItems,
                generated_from: 'preset',
            });
        } finally {
            setGenerating(false);
        }
    };

    const grouped = items.reduce((acc, item, idx) => {
        const raw = (item.category || 'other').toLowerCase().trim();
        const cat = CATEGORY_MAP[raw] || 'other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push({ ...item, _idx: idx });
        return acc;
    }, {});

    const checkedCount = items.filter(i => i.checked).length;
    const progress = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0;

    const toggleCat = (cat) => setExpandedCats(p => ({ ...p, [cat]: !p[cat] }));

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold font-space flex items-center gap-2">
                        <ShoppingCart className="w-6 h-6 text-emerald-400" /> Smart Grocery
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">AI-powered weekly shopping lists</p>
                </div>
                <Button onClick={generateWithAI} disabled={generating} className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
                    {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                    {generating ? 'Generating...' : 'AI Generate'}
                </Button>
            </div>

            {/* Preset Quick Start — shown when no lists */}
            {!isLoading && lists.length === 0 && (
                <div className="glass rounded-2xl p-8 text-center">
                    <ShoppingCart className="w-16 h-16 text-emerald-400/30 mx-auto mb-4" />
                    <div className="text-lg font-semibold mb-2">No grocery lists yet</div>
                    <p className="text-muted-foreground text-sm mb-6">Generate one with AI or pick a preset to get started.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto mb-4">
                        {GOAL_PRESETS.map((p) => (
                            <button key={p.key} onClick={() => loadPreset(p.key)} disabled={generating}
                                className="glass rounded-xl p-4 text-left hover:bg-white/5 transition-all border border-white/5 hover:border-emerald-500/30 disabled:opacity-50">
                                <div className="text-sm font-semibold text-emerald-400 mb-1">{p.label}</div>
                                <div className="text-xs text-muted-foreground">{p.desc}</div>
                            </button>
                        ))}
                    </div>
                    {generating && (
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-4">
                            <Loader2 className="w-4 h-4 animate-spin" /> Generating your list...
                        </div>
                    )}
                </div>
            )}

            {/* List Selector */}
            {lists.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                    {lists.map(list => (
                        <button key={list.id} onClick={() => setActiveListId(list.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${list.id === activeList?.id ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/10 text-muted-foreground hover:border-white/20'}`}>
                            {list.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Active List */}
            {activeList && (
                <>
                    {/* Progress Bar */}
                    <div className="glass rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-sm font-semibold">{checkedCount}/{items.length} items collected</div>
                            <div className="flex items-center gap-2">
                                {progress === 100 && <span className="text-xs text-emerald-400 font-semibold">🎉 All done!</span>}
                                <Button size="sm" variant="ghost" onClick={() => setShowAddItem(v => !v)} className="text-xs text-muted-foreground hover:text-white">
                                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => deleteList.mutate(activeList.id)} className="text-xs text-red-400 hover:bg-red-500/10">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-2">
                            <motion.div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-400"
                                animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
                        </div>
                    </div>

                    {/* Add Item Form */}
                    <AnimatePresence>
                        {showAddItem && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                className="glass rounded-xl p-4 overflow-hidden">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <Input value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
                                        placeholder="Item name" className="bg-white/5 border-white/10" />
                                    <Input value={newItem.quantity} onChange={e => setNewItem(p => ({ ...p, quantity: e.target.value }))}
                                        placeholder="Quantity" className="bg-white/5 border-white/10" />
                                    <select value={newItem.category} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}
                                        className="bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-foreground">
                                        {Object.keys(CATEGORY_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <Button onClick={addItem} disabled={!newItem.name} className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
                                        Add
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Grouped Items */}
                    <div className="space-y-3">
                        {Object.entries(CATEGORY_COLORS).map(([cat, cfg]) => {
                            const catItems = grouped[cat];
                            if (!catItems?.length) return null;
                            const isExpanded = expandedCats[cat] !== false;
                            const allChecked = catItems.every(i => i.checked);
                            return (
                                <div key={cat} className="glass rounded-xl overflow-hidden">
                                    <button onClick={() => toggleCat(cat)}
                                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                                                {cat}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {catItems.filter(i => i.checked).length}/{catItems.length}
                                            </span>
                                            {allChecked && <span className="text-xs text-emerald-400">✓ Done</span>}
                                        </div>
                                        {isExpanded
                                            ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                            : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                    </button>
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                                                className="overflow-hidden border-t border-white/5">
                                                {catItems.map(item => (
                                                    <div key={item._idx}
                                                        className={`flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors border-b border-white/3 last:border-0 group ${item.checked ? 'opacity-50' : ''}`}>
                                                        <button onClick={() => toggleItem(item._idx)}
                                                            className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-all ${item.checked ? 'bg-emerald-500 border-emerald-500' : 'bg-transparent border-white/20 hover:border-emerald-500/60'}`}>
                                                            {item.checked && <Check className="w-3 h-3 text-black" />}
                                                        </button>
                                                        <div className="flex-1">
                                                            <span className={`text-sm font-medium ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
                                                                {item.name}
                                                            </span>
                                                            {item.quantity && (
                                                                <span className="text-xs text-muted-foreground ml-2">{item.quantity}</span>
                                                            )}
                                                            {item.substitute && !item.checked && (
                                                                <div className="flex items-center gap-1 mt-0.5">
                                                                    <RefreshCw className="w-2.5 h-2.5 text-muted-foreground" />
                                                                    <span className="text-xs text-muted-foreground/70">Alt: {item.substitute}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <button onClick={() => removeItem(item._idx)}
                                                            className="text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>

                    {/* Quick-add Presets when list exists */}
                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Generate Another List</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {GOAL_PRESETS.map(p => (
                                <button key={p.key} onClick={() => loadPreset(p.key)} disabled={generating}
                                    className="glass rounded-xl p-4 text-left hover:bg-white/5 transition-all border border-white/5 hover:border-emerald-500/30 disabled:opacity-50 group">
                                    <div className="text-sm font-semibold text-emerald-400 group-hover:text-emerald-300 mb-1 flex items-center justify-between">
                                        {p.label}
                                        {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{p.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}