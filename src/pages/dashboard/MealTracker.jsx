// pages/MealTracker.jsx  ─  Full fixed version
// Key fixes:
//   1. DateRangePicker replaces DateFilter (same prop API)
//   2. Chart data correctly reads from ALL meals filtered to the date range
//   3. "Day Detail" panel shows meals logged on any clicked bar / selected day
//   4. Real data from DB always visible on chart

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import ProgressRing from '@/components/ui/ProgressRing';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import FoodLibrary from '@/components/dashboard/FoodLibrary';
import DateRangePicker from '@/components/ui/DateRangePicker';   // ← new
import { useDateFilter } from '@/lib/useDateFilter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Utensils, Coffee, UtensilsCrossed, Cookie, BookOpen, Pencil, Camera, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useRef } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';

const mealIcons = { breakfast: Coffee, lunch: Utensils, dinner: UtensilsCrossed, snack: Cookie };
const mealLabels = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snacks' };
const mealTypeColors = {
    breakfast: 'text-yellow-400 bg-yellow-500/10',
    lunch: 'text-emerald-400 bg-emerald-500/10',
    dinner: 'text-blue-400 bg-blue-500/10',
    snack: 'text-orange-400 bg-orange-500/10',
};
const emptyForm = { meal_type: 'breakfast', food_name: '', calories: '', protein: '', carbs: '', fats: '', photo_url: '' };

/* ─── Custom Tooltip ─── */
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.[0]) return null;
    return (
        <div className="glass rounded-xl p-3 text-xs border border-white/10 shadow-xl">
            <p className="text-muted-foreground mb-1">{label}</p>
            <p className="font-bold text-emerald-400">{payload[0].value?.toLocaleString()} kcal</p>
        </div>
    );
};

export default function MealTracker() {
    const { user } = useAuth();
    const qc = useQueryClient();
    const dateFilter = useDateFilter(7);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [photoUploading, setPhotoUploading] = useState(false);
    const [detailDate, setDetailDate] = useState(null); // clicked bar date
    const fileInputRef = useRef(null);

    /* ── Profile ── */
    const { data: profiles } = useQuery({
        queryKey: ['userProfile', user?.email],
        queryFn: () => entities.UserProfile.filter({ user_email: user?.email }),
        enabled: !!user?.email,
    });
    const profile = profiles?.[0];
    const calTarget = profile?.daily_calorie_target || 2000;

    /* ── ALL meals (no date filter in query — let React do the filtering for cache efficiency) ── */
    const { data: allMeals = [] } = useQuery({
        queryKey: ['meals-all', user?.email],
        queryFn: () => entities.MealLog.filter({ user_email: user?.email }),
        enabled: !!user?.email,
        staleTime: 1000 * 60 * 2,
    });

    /* ── Derived sets ── */
    const todayStr = dateFilter.todayStr;

    // Today's meals (for the summary rings)
    const todayMeals = useMemo(() =>
        allMeals.filter(m => m.date === todayStr),
        [allMeals, todayStr]
    );

    // Meals in the selected range (for the chart)
    const mealsInRange = useMemo(() =>
        allMeals.filter(m => m.date >= dateFilter.startDate && m.date <= dateFilter.endDate),
        [allMeals, dateFilter.startDate, dateFilter.endDate]
    );

    // What to show in the meal-by-type grid: detail date OR today
    const activeDateForGrid = detailDate ?? todayStr;
    const gridMeals = useMemo(() =>
        allMeals.filter(m => m.date === activeDateForGrid),
        [allMeals, activeDateForGrid]
    );

    /* ── Chart data: one bar per day in range ── */
    const chartData = useMemo(() =>
        dateFilter.dateRange.map(date => {
            const dayMeals = allMeals.filter(m => m.date === date);
            const calories = dayMeals.reduce((s, m) => s + (m.calories || 0), 0);
            return {
                date,
                label: format(parseISO(date), dateFilter.dateRange.length <= 7 ? 'EEE' : dateFilter.dateRange.length <= 31 ? 'MMM d' : 'MMM'),
                calories,
                goalMet: calories >= calTarget * 0.8,
                mealCount: dayMeals.length,
            };
        }),
        [dateFilter.dateRange, allMeals, calTarget]
    );

    const avgCalories = useMemo(() => {
        const activeDays = chartData.filter(d => d.calories > 0);
        return activeDays.length
            ? Math.round(activeDays.reduce((s, d) => s + d.calories, 0) / activeDays.length)
            : 0;
    }, [chartData]);

    /* ── Totals (always today) ── */
    const totals = useMemo(() => ({
        cal: todayMeals.reduce((s, m) => s + (m.calories || 0), 0),
        pro: todayMeals.reduce((s, m) => s + (m.protein || 0), 0),
        carbs: todayMeals.reduce((s, m) => s + (m.carbs || 0), 0),
        fats: todayMeals.reduce((s, m) => s + (m.fats || 0), 0),
    }), [todayMeals]);

    /* ── Mutations ── */
    const addMeal = useMutation({
        mutationFn: (data) => entities.MealLog.create({ ...data, user_email: user.email, date: todayStr }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['meals-all'] }); toast.success('Meal logged!'); },
    });

    const addMeals = useMutation({
        mutationFn: async (items) => {
            for (const item of items) await entities.MealLog.create({ ...item, user_email: user.email, date: todayStr });
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['meals-all'] }); setOpen(false); toast.success('Meals logged!'); },
    });

    const deleteMeal = useMutation({
        mutationFn: (id) => entities.MealLog.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['meals-all'] }),
    });

    /* ── Handlers ── */
    const handleFoodSelect = (foodOrFoods) => {
        const items = Array.isArray(foodOrFoods) ? foodOrFoods : [foodOrFoods];
        if (items.length > 1) {
            addMeals.mutate(items.map(f => ({ ...f, meal_type: form.meal_type })));
        } else if (items.length === 1) {
            const food = items[0];
            setForm(f => ({ ...f, food_name: food.food_name, calories: String(food.calories), protein: String(food.protein), carbs: String(food.carbs), fats: String(food.fats) }));
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoUploading(true);
        const { file_url } = await entities.MealLog.uploadFile({ file });
        setForm(f => ({ ...f, photo_url: file_url }));
        setPhotoUploading(false);
    };

    const handleSubmit = () => {
        if (!form.food_name) return;
        addMeal.mutate({ ...form, calories: Number(form.calories) || 0, protein: Number(form.protein) || 0, carbs: Number(form.carbs) || 0, fats: Number(form.fats) || 0 });
        setOpen(false);
        setForm(emptyForm);
    };

    /* ── Detail date nav ── */
    const detailIdx = detailDate ? dateFilter.dateRange.indexOf(detailDate) : -1;
    const canNavPrev = detailIdx > 0;
    const canNavNext = detailIdx < dateFilter.dateRange.length - 1;
    const navigateDetail = (dir) => {
        const next = dateFilter.dateRange[detailIdx + dir];
        if (next) setDetailDate(next);
    };

    /* ─────────────────────────────────────────────── */
    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h1 className="text-2xl font-space font-bold">Meal Tracker</h1>
                <div className="flex items-center gap-2">
                    <DateRangePicker
                        preset={dateFilter.preset}
                        startDate={dateFilter.startDate}
                        endDate={dateFilter.endDate}
                        isCustom={dateFilter.isCustom}
                        onSelectPreset={dateFilter.selectPreset}
                        onSelectCustom={dateFilter.selectCustom}
                    />
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-xl">
                                <Plus className="w-4 h-4 mr-2" /> Log Meal
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="glass border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader><DialogTitle>Log a Meal</DialogTitle></DialogHeader>
                            <Tabs defaultValue="library">
                                <TabsList className="w-full bg-white/5 mb-4">
                                    <TabsTrigger value="library" className="flex-1 gap-2"><BookOpen className="w-4 h-4" /> Food Library</TabsTrigger>
                                    <TabsTrigger value="manual" className="flex-1 gap-2"><Pencil className="w-4 h-4" /> Manual Entry</TabsTrigger>
                                </TabsList>

                                <TabsContent value="library" className="space-y-4 mt-0">
                                    <div className="flex items-center gap-3">
                                        <Label className="text-xs text-muted-foreground flex-shrink-0">Meal Type:</Label>
                                        <Select value={form.meal_type} onValueChange={v => setForm(f => ({ ...f, meal_type: v }))}>
                                            <SelectTrigger className="h-8 bg-white/5 border-white/10 text-sm flex-1"><SelectValue /></SelectTrigger>
                                            <SelectContent>{Object.entries(mealLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <FoodLibrary onSelect={handleFoodSelect} />
                                    {form.food_name && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                            className="glass rounded-xl p-4 border border-emerald-500/20">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-emerald-400">{form.food_name}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{form.calories} kcal • P:{form.protein}g C:{form.carbs}g F:{form.fats}g</p>
                                                </div>
                                                <Button className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold flex-shrink-0"
                                                    disabled={addMeal.isPending} onClick={handleSubmit}>
                                                    {addMeal.isPending ? 'Adding…' : 'Add to Log'}
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}
                                </TabsContent>

                                <TabsContent value="manual" className="space-y-4 mt-0">
                                    <div><Label>Meal Type</Label>
                                        <Select value={form.meal_type} onValueChange={v => setForm(f => ({ ...f, meal_type: v }))}>
                                            <SelectTrigger className="mt-1 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                            <SelectContent>{Object.entries(mealLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div><Label>Food Name</Label><Input value={form.food_name} onChange={e => setForm(f => ({ ...f, food_name: e.target.value }))} placeholder="e.g. Grilled Chicken Breast" className="mt-1 bg-white/5 border-white/10" /></div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><Label>Calories</Label><Input type="number" value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
                                        <div><Label>Protein (g)</Label><Input type="number" value={form.protein} onChange={e => setForm(f => ({ ...f, protein: e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
                                        <div><Label>Carbs (g)</Label><Input type="number" value={form.carbs} onChange={e => setForm(f => ({ ...f, carbs: e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
                                        <div><Label>Fat (g)</Label><Input type="number" value={form.fats} onChange={e => setForm(f => ({ ...f, fats: e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
                                    </div>
                                    <div>
                                        <Label>Meal Photo <span className="text-muted-foreground font-normal">(optional)</span></Label>
                                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                        {form.photo_url ? (
                                            <div className="relative mt-1 rounded-xl overflow-hidden w-full h-36">
                                                <img src={form.photo_url} alt="meal" className="w-full h-full object-cover" />
                                                <button onClick={() => setForm(f => ({ ...f, photo_url: '' }))}
                                                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80">
                                                    <X className="w-3.5 h-3.5 text-white" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={() => fileInputRef.current?.click()}
                                                className="mt-1 w-full h-24 rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center gap-2 hover:bg-white/5 text-muted-foreground">
                                                {photoUploading
                                                    ? <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                                                    : <><Camera className="w-5 h-5" /><span className="text-xs">Upload photo</span></>}
                                            </button>
                                        )}
                                    </div>
                                    <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold"
                                        disabled={!form.food_name || addMeal.isPending} onClick={handleSubmit}>
                                        {addMeal.isPending ? 'Adding…' : 'Add Meal'}
                                    </Button>
                                </TabsContent>
                            </Tabs>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* ── Today Summary ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Consumed', value: totals.cal, unit: 'kcal', color: '#22c55e', pct: (totals.cal / calTarget) * 100 },
                    { label: 'Remaining', value: Math.max(calTarget - totals.cal, 0), unit: 'kcal', color: '#3b82f6', pct: (Math.max(calTarget - totals.cal, 0) / calTarget) * 100 },
                    { label: 'Target', value: calTarget, unit: 'kcal', color: '#a855f7', pct: 100 },
                    { label: 'Meals', value: todayMeals.length, unit: 'logged', color: '#f97316', pct: (todayMeals.length / 4) * 100 },
                ].map(s => (
                    <GlassCard key={s.label} className="text-center py-4">
                        <div className="text-2xl font-bold font-space" style={{ color: s.color }}><AnimatedCounter value={s.value} /></div>
                        <div className="text-xs text-muted-foreground mt-1">{s.unit}</div>
                        <div className="text-xs font-medium mt-1">{s.label}</div>
                        <div className="h-1 rounded-full bg-white/10 mt-2 overflow-hidden">
                            <motion.div className="h-full rounded-full" style={{ backgroundColor: s.color }}
                                initial={{ width: 0 }} animate={{ width: `${Math.min(s.pct, 100)}%` }} transition={{ duration: 1 }} />
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* ── Calorie Bar Chart ── */}
            <GlassCard animate={false}>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-emerald-400" /> Calorie History
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Avg: <span className="text-emerald-400 font-semibold">{avgCalories.toLocaleString()} kcal/day</span></span>
                        {detailDate && (
                            <button onClick={() => setDetailDate(null)}
                                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                <X className="w-3 h-3" /> Clear selection
                            </button>
                        )}
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} barSize={chartData.length > 15 ? 8 : 20}
                        onClick={(e) => { if (e?.activePayload?.[0]) setDetailDate(e.activePayload[0].payload.date); }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                        <ReferenceLine y={calTarget} stroke="#22c55e" strokeDasharray="5 5" strokeOpacity={0.5}
                            label={{ value: 'Target', fill: '#22c55e', fontSize: 10, position: 'insideTopRight' }} />
                        <Bar dataKey="calories" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, i) => (
                                <Cell key={i}
                                    fill={entry.date === detailDate ? '#60a5fa' : entry.goalMet ? '#22c55e' : '#f97316'}
                                    fillOpacity={0.85}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
                <p className="text-center text-xs text-muted-foreground mt-2 opacity-60">Click a bar to inspect that day ↑</p>
            </GlassCard>

            {/* ── Macros ── */}
            <GlassCard animate={false}>
                <h3 className="font-semibold mb-4">Today's Macronutrients</h3>
                <div className="flex flex-wrap justify-around gap-4">
                    {[
                        { label: 'Protein', value: totals.pro, target: profile?.protein_target || 150, color: '#22c55e' },
                        { label: 'Carbs', value: totals.carbs, target: profile?.carb_target || 200, color: '#3b82f6' },
                        { label: 'Fat', value: totals.fats, target: profile?.fat_target || 70, color: '#a855f7' },
                    ].map(macro => (
                        <div key={macro.label} className="flex flex-col items-center gap-2">
                            <ProgressRing value={macro.value} max={macro.target} size={90} strokeWidth={7} color={macro.color}>
                                <div className="text-center"><div className="text-sm font-bold">{macro.value}g</div></div>
                            </ProgressRing>
                            <div className="text-center">
                                <div className="text-xs font-medium">{macro.label}</div>
                                <div className="text-[10px] text-muted-foreground">/ {macro.target}g</div>
                            </div>
                        </div>
                    ))}
                </div>
            </GlassCard>

            {/* ── Day Detail Panel ── */}
            <GlassCard animate={false}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <h3 className="font-semibold">
                            {detailDate
                                ? <>Meals on <span className="text-emerald-400">{format(parseISO(detailDate), 'EEEE, MMM d')}</span></>
                                : <>Today's Meals <span className="text-muted-foreground font-normal text-sm">({format(parseISO(todayStr), 'MMM d')})</span></>
                            }
                        </h3>
                    </div>
                    {detailDate && (
                        <div className="flex items-center gap-1">
                            <button disabled={!canNavPrev} onClick={() => navigateDetail(-1)}
                                className="p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed text-white/50 hover:text-white transition-all">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button disabled={!canNavNext} onClick={() => navigateDetail(1)}
                                className="p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed text-white/50 hover:text-white transition-all">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDetailDate(null)}
                                className="ml-1 p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-all">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Per-meal-type breakdown */}
                <div className="grid sm:grid-cols-2 gap-4">
                    {Object.entries(mealLabels).map(([type, label]) => {
                        const typeMeals = gridMeals.filter(m => m.meal_type === type);
                        const Icon = mealIcons[type];
                        const typeCalories = typeMeals.reduce((s, m) => s + (m.calories || 0), 0);
                        return (
                            <div key={type} className="glass rounded-2xl p-4 border border-white/5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${mealTypeColors[type]}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-sm">{label}</h4>
                                        <p className="text-xs text-muted-foreground">{typeCalories} kcal</p>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{typeMeals.length} items</span>
                                </div>
                                {typeMeals.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic py-1">Nothing logged</p>
                                ) : (
                                    <div className="space-y-2">
                                        {typeMeals.map(meal => (
                                            <div key={meal.id} className="glass rounded-xl overflow-hidden">
                                                {meal.photo_url && <img src={meal.photo_url} alt={meal.food_name} className="w-full h-28 object-cover" />}
                                                <div className="flex items-center justify-between p-2.5">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-xs truncate">{meal.food_name}</div>
                                                        <div className="text-[10px] text-muted-foreground">{meal.calories} kcal • P:{meal.protein}g C:{meal.carbs}g F:{meal.fats}g</div>
                                                    </div>
                                                    {/* Only allow delete on today's meals */}
                                                    {meal.date === todayStr && (
                                                        <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-red-400 flex-shrink-0"
                                                            onClick={() => deleteMeal.mutate(meal.id)}>
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </GlassCard>

        </div>
    );
}