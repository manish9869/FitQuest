import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { today } from '@/lib/fitnessUtils';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import ProgressRing from '@/components/ui/ProgressRing';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import FoodLibrary from '@/components/dashboard/FoodLibrary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Utensils, Coffee, UtensilsCrossed, Cookie, BookOpen, Pencil, Camera, X } from 'lucide-react';
import { toast } from 'sonner';
import { useRef } from 'react';

const mealIcons = { breakfast: Coffee, lunch: Utensils, dinner: UtensilsCrossed, snack: Cookie };
const mealLabels = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snacks' };

const mealTypeColors = {
    breakfast: 'text-yellow-400 bg-yellow-500/10',
    lunch: 'text-emerald-400 bg-emerald-500/10',
    dinner: 'text-blue-400 bg-blue-500/10',
    snack: 'text-orange-400 bg-orange-500/10',
};

const emptyForm = { meal_type: 'breakfast', food_name: '', calories: '', protein: '', carbs: '', fats: '', photo_url: '' };

export default function MealTracker() {
    const { user } = useAuth();
    const qc = useQueryClient();
    const todayStr = today();
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [photoUploading, setPhotoUploading] = useState(false);
    const fileInputRef = useRef(null);

    const { data: profiles } = useQuery({ queryKey: ['userProfile', user?.email], queryFn: () => entities.UserProfile.filter({ user_email: user?.email }), enabled: !!user?.email });
    const profile = profiles?.[0];

    const { data: meals = [] } = useQuery({ queryKey: ['meals', todayStr, user?.email], queryFn: () => entities.MealLog.filter({ user_email: user?.email, date: todayStr }), enabled: !!user?.email });

    const addMeal = useMutation({
        mutationFn: (data) => entities.MealLog.create({ ...data, user_email: user.email, date: todayStr }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['meals'] });
            toast.success('Meal logged!');
        },
    });

    const addMeals = useMutation({
        mutationFn: async (items) => {
            for (const item of items) {
                await entities.MealLog.create({ ...item, user_email: user.email, date: todayStr });
            }
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['meals'] });
            setOpen(false);
            toast.success('Meals logged!');
        },
    });

    const deleteMeal = useMutation({
        mutationFn: (id) => entities.MealLog.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['meals'] }),
    });

    const totals = useMemo(() => ({
        cal: meals.reduce((s, m) => s + (m.calories || 0), 0),
        pro: meals.reduce((s, m) => s + (m.protein || 0), 0),
        carbs: meals.reduce((s, m) => s + (m.carbs || 0), 0),
        fats: meals.reduce((s, m) => s + (m.fats || 0), 0),
    }), [meals]);

    const calTarget = profile?.daily_calorie_target || 2000;
    const remaining = Math.max(calTarget - totals.cal, 0);

    // Handle food library multi-select → array of meal entries
    const handleFoodSelect = (foodOrFoods) => {
        const items = Array.isArray(foodOrFoods) ? foodOrFoods : [foodOrFoods];
        if (items.length > 1) {
            addMeals.mutate(items.map(f => ({ ...f, meal_type: form.meal_type })));
        } else if (items.length === 1) {
            const food = items[0];
            setForm(f => ({
                ...f,
                food_name: food.food_name,
                calories: String(food.calories),
                protein: String(food.protein),
                carbs: String(food.carbs),
                fats: String(food.fats),
            }));
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
        addMeal.mutate({
            ...form,
            calories: Number(form.calories) || 0,
            protein: Number(form.protein) || 0,
            carbs: Number(form.carbs) || 0,
            fats: Number(form.fats) || 0,
        });
        setOpen(false);
        setForm(emptyForm);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-space font-bold">Meal Tracker</h1>
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
                                <TabsTrigger value="library" className="flex-1 gap-2">
                                    <BookOpen className="w-4 h-4" /> Food Library
                                </TabsTrigger>
                                <TabsTrigger value="manual" className="flex-1 gap-2">
                                    <Pencil className="w-4 h-4" /> Manual Entry
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="library" className="space-y-4 mt-0">
                                {/* Meal type selector always visible so multi-select knows which meal */}
                                <div className="flex items-center gap-3">
                                    <Label className="text-xs text-muted-foreground flex-shrink-0">Meal Type:</Label>
                                    <Select value={form.meal_type} onValueChange={v => setForm(f => ({ ...f, meal_type: v }))}>
                                        <SelectTrigger className="h-8 bg-white/5 border-white/10 text-sm flex-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>{Object.entries(mealLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>

                                <FoodLibrary onSelect={handleFoodSelect} />

                                {/* Show single-selected food preview for manual confirm */}
                                {form.food_name && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        className="glass rounded-xl p-4 border border-emerald-500/20">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-emerald-400">{form.food_name}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {form.calories} kcal • P:{form.protein}g C:{form.carbs}g F:{form.fats}g
                                                </p>
                                            </div>
                                            <Button className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold flex-shrink-0"
                                                disabled={addMeal.isPending} onClick={handleSubmit}>
                                                {addMeal.isPending ? 'Adding...' : 'Add to Log'}
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </TabsContent>

                            <TabsContent value="manual" className="space-y-4 mt-0">
                                <div>
                                    <Label>Meal Type</Label>
                                    <Select value={form.meal_type} onValueChange={v => setForm(f => ({ ...f, meal_type: v }))}>
                                        <SelectTrigger className="mt-1 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                        <SelectContent>{Object.entries(mealLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Food Name</Label>
                                    <Input value={form.food_name} onChange={e => setForm(f => ({ ...f, food_name: e.target.value }))} placeholder="e.g. Grilled Chicken Breast" className="mt-1 bg-white/5 border-white/10" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><Label>Calories</Label><Input type="number" value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
                                    <div><Label>Protein (g)</Label><Input type="number" value={form.protein} onChange={e => setForm(f => ({ ...f, protein: e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
                                    <div><Label>Carbs (g)</Label><Input type="number" value={form.carbs} onChange={e => setForm(f => ({ ...f, carbs: e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
                                    <div><Label>Fat (g)</Label><Input type="number" value={form.fats} onChange={e => setForm(f => ({ ...f, fats: e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
                                </div>
                                {/* Photo upload */}
                                <div>
                                    <Label>Meal Photo <span className="text-muted-foreground font-normal">(optional)</span></Label>
                                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                    {form.photo_url ? (
                                        <div className="relative mt-1 rounded-xl overflow-hidden w-full h-36">
                                            <img src={form.photo_url} alt="meal" className="w-full h-full object-cover" />
                                            <button onClick={() => setForm(f => ({ ...f, photo_url: '' }))}
                                                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors">
                                                <X className="w-3.5 h-3.5 text-white" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => fileInputRef.current?.click()}
                                            className="mt-1 w-full h-24 rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors text-muted-foreground">
                                            {photoUploading ? <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /> : <><Camera className="w-5 h-5" /><span className="text-xs">Upload photo</span></>}
                                        </button>
                                    )}
                                </div>
                                <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold"
                                    disabled={!form.food_name || addMeal.isPending} onClick={handleSubmit}>
                                    {addMeal.isPending ? 'Adding...' : 'Add Meal'}
                                </Button>
                            </TabsContent>
                        </Tabs>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Calorie Summary Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Consumed', value: totals.cal, unit: 'kcal', color: '#22c55e', pct: (totals.cal / calTarget) * 100 },
                    { label: 'Remaining', value: remaining, unit: 'kcal', color: '#3b82f6', pct: (remaining / calTarget) * 100 },
                    { label: 'Target', value: calTarget, unit: 'kcal', color: '#a855f7', pct: 100 },
                    { label: 'Meals', value: meals.length, unit: 'logged', color: '#f97316', pct: (meals.length / 4) * 100 },
                ].map(s => (
                    <GlassCard key={s.label} className="text-center py-4">
                        <div className="text-2xl font-bold font-space" style={{ color: s.color }}>
                            <AnimatedCounter value={s.value} />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{s.unit}</div>
                        <div className="text-xs font-medium mt-1">{s.label}</div>
                        <div className="h-1 rounded-full bg-white/10 mt-2 overflow-hidden">
                            <motion.div className="h-full rounded-full" style={{ backgroundColor: s.color }}
                                initial={{ width: 0 }} animate={{ width: `${Math.min(s.pct, 100)}%` }} transition={{ duration: 1 }} />
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Macros */}
            <GlassCard animate={false}>
                <h3 className="font-semibold mb-4">Macronutrient Breakdown</h3>
                <div className="flex flex-wrap justify-around gap-4">
                    {[
                        { label: 'Protein', value: totals.pro, target: profile?.protein_target || 150, color: '#22c55e', size: 90 },
                        { label: 'Carbs', value: totals.carbs, target: profile?.carb_target || 200, color: '#3b82f6', size: 90 },
                        { label: 'Fat', value: totals.fats, target: profile?.fat_target || 70, color: '#a855f7', size: 90 },
                    ].map(macro => (
                        <div key={macro.label} className="flex flex-col items-center gap-2">
                            <ProgressRing value={macro.value} max={macro.target} size={macro.size} strokeWidth={7} color={macro.color}>
                                <div className="text-center">
                                    <div className="text-sm font-bold">{macro.value}g</div>
                                </div>
                            </ProgressRing>
                            <div className="text-center">
                                <div className="text-xs font-medium">{macro.label}</div>
                                <div className="text-[10px] text-muted-foreground">/ {macro.target}g</div>
                            </div>
                        </div>
                    ))}
                </div>
            </GlassCard>

            {/* Meals by type */}
            <div className="grid sm:grid-cols-2 gap-4">
                {Object.entries(mealLabels).map(([type, label]) => {
                    const typeMeals = meals.filter(m => m.meal_type === type);
                    const Icon = mealIcons[type];
                    const typeCalories = typeMeals.reduce((s, m) => s + (m.calories || 0), 0);
                    return (
                        <GlassCard key={type} animate={false}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${mealTypeColors[type]}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-sm">{label}</h3>
                                    <p className="text-xs text-muted-foreground">{typeCalories} kcal</p>
                                </div>
                                <span className="text-xs text-muted-foreground">{typeMeals.length} items</span>
                            </div>
                            {typeMeals.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic py-2">Nothing logged yet</p>
                            ) : (
                                <div className="space-y-2">
                                    <AnimatePresence>
                                        {typeMeals.map(meal => (
                                            <motion.div key={meal.id} className="glass rounded-xl overflow-hidden"
                                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                                {meal.photo_url && (
                                                    <img src={meal.photo_url} alt={meal.food_name} className="w-full h-28 object-cover" />
                                                )}
                                                <div className="flex items-center justify-between p-2.5">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-xs truncate">{meal.food_name}</div>
                                                        <div className="text-[10px] text-muted-foreground">{meal.calories} kcal • P:{meal.protein}g C:{meal.carbs}g F:{meal.fats}g</div>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-red-400 flex-shrink-0"
                                                        onClick={() => deleteMeal.mutate(meal.id)}>
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </GlassCard>
                    );
                })}
            </div>
        </div>
    );
}


