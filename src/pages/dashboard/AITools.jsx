import React, { useState } from 'react';
import { entities } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Utensils, Dumbbell, Calculator, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { invokeLLM } from '@/api/llm';

export default function AITools() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('meal-planner');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const { data: profiles } = useQuery({
        queryKey: ['userProfile', user?.email],
        queryFn: () => entities.UserProfile.filter({ user_email: user?.email }),
        enabled: !!user?.email,
    });
    const profile = profiles?.[0];

    const [mealGoal, setMealGoal] = useState('fat_loss');
    const [mealCals, setMealCals] = useState('');

    const [wGoal, setWGoal] = useState('fat_loss');
    const [wLevel, setWLevel] = useState('intermediate');
    const [wDuration, setWDuration] = useState('45');
    const [wEquipment, setWEquipment] = useState('gym');

    const [calcWeight, setCalcWeight] = useState('');
    const [calcHeight, setCalcHeight] = useState('');
    const [calcAge, setCalcAge] = useState('');

    const generateMealPlan = async () => {
        setLoading(true);
        setResult(null);
        try {
            const cals = mealCals || profile?.daily_calorie_target || 2000;
            const res = await invokeLLM({
                prompt: `Generate a detailed daily meal plan for ${mealGoal.replace('_', ' ')} with approximately ${cals} calories. Include breakfast, lunch, dinner, and 2 snacks. For each meal include: name, calories, protein, carbs, fat, and ingredients. Format as a structured plan.`,
                response_json_schema: {
                    type: 'object',
                    properties: {
                        meals: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    meal_type: { type: 'string' },
                                    name: { type: 'string' },
                                    calories: { type: 'number' },
                                    protein: { type: 'number' },
                                    carbs: { type: 'number' },
                                    fat: { type: 'number' },
                                    ingredients: { type: 'array', items: { type: 'string' } },
                                },
                            },
                        },
                        total_calories: { type: 'number' },
                        total_protein: { type: 'number' },
                    },
                },
            });
            setResult({ type: 'meal', data: res });
        } catch (e) {
            toast.error('Failed to generate meal plan. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const generateWorkout = async () => {
        setLoading(true);
        setResult(null);
        try {
            const res = await invokeLLM({
                prompt: `Generate a detailed ${wDuration}-minute ${wGoal.replace('_', ' ')} workout for a ${wLevel} level person at the ${wEquipment}. Include exercise name, sets, reps, rest time, and notes. Make it effective and well-structured.`,
                response_json_schema: {
                    type: 'object',
                    properties: {
                        workout_name: { type: 'string' },
                        duration: { type: 'string' },
                        warmup: { type: 'array', items: { type: 'string' } },
                        exercises: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    sets: { type: 'number' },
                                    reps: { type: 'string' },
                                    rest: { type: 'string' },
                                    notes: { type: 'string' },
                                },
                            },
                        },
                        cooldown: { type: 'array', items: { type: 'string' } },
                    },
                },
            });
            setResult({ type: 'workout', data: res });
        } catch (e) {
            toast.error('Failed to generate workout. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const bmi = calcWeight && calcHeight
        ? (Number(calcWeight) / Math.pow(Number(calcHeight) / 100, 2)).toFixed(1)
        : null;
    const bmr = calcWeight && calcHeight && calcAge
        ? Math.round(10 * Number(calcWeight) + 6.25 * Number(calcHeight) - 5 * Number(calcAge) + 5)
        : null;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-space font-bold">AI Fitness Tools</h1>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="glass border-white/10 mb-6">
                    <TabsTrigger value="meal-planner" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                        <Utensils className="w-4 h-4 mr-2" /> Meal Planner
                    </TabsTrigger>
                    <TabsTrigger value="workout-gen" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
                        <Dumbbell className="w-4 h-4 mr-2" /> Workout Gen
                    </TabsTrigger>
                    <TabsTrigger value="calculators" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
                        <Calculator className="w-4 h-4 mr-2" /> Calculators
                    </TabsTrigger>
                </TabsList>

                {/* MEAL PLANNER TAB */}
                <TabsContent value="meal-planner">
                    <div className="grid lg:grid-cols-2 gap-6">
                        <GlassCard>
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <Brain className="w-5 h-5 text-emerald-400" /> AI Meal Planner
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <Label>Goal</Label>
                                    <Select value={mealGoal} onValueChange={setMealGoal}>
                                        <SelectTrigger className="mt-1 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="fat_loss">Fat Loss</SelectItem>
                                            <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                                            <SelectItem value="maintenance">Maintenance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Calories Target</Label>
                                    <Input type="number" value={mealCals} onChange={e => setMealCals(e.target.value)}
                                        placeholder={`${profile?.daily_calorie_target || 2000}`}
                                        className="mt-1 bg-white/5 border-white/10" />
                                </div>
                                <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold" disabled={loading} onClick={generateMealPlan}>
                                    {loading
                                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                                        : 'Generate Meal Plan'}
                                </Button>
                            </div>
                        </GlassCard>

                        <AnimatePresence>
                            {result?.type === 'meal' && result.data?.meals && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                    <GlassCard>
                                        <h3 className="font-semibold mb-4">Your Meal Plan</h3>
                                        <div className="space-y-4">
                                            {result.data.meals.map((meal, i) => (
                                                <div key={i} className="glass rounded-xl p-4">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <span className="text-xs text-emerald-400 uppercase">{meal.meal_type}</span>
                                                            <h4 className="font-medium">{meal.name}</h4>
                                                        </div>
                                                        <span className="text-sm font-bold">{meal.calories} kcal</span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fat}g
                                                    </div>
                                                    {meal.ingredients && (
                                                        <p className="text-xs text-muted-foreground mt-2">{meal.ingredients.join(', ')}</p>
                                                    )}
                                                </div>
                                            ))}
                                            <div className="text-center text-sm font-semibold text-emerald-400 pt-2">
                                                Total: {result.data.total_calories} kcal • {result.data.total_protein}g protein
                                            </div>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </TabsContent>

                {/* WORKOUT GEN TAB */}
                <TabsContent value="workout-gen">
                    <div className="grid lg:grid-cols-2 gap-6">
                        <GlassCard>
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <Dumbbell className="w-5 h-5 text-purple-400" /> AI Workout Generator
                            </h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label>Goal</Label>
                                        <Select value={wGoal} onValueChange={setWGoal}>
                                            <SelectTrigger className="mt-1 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="fat_loss">Fat Loss</SelectItem>
                                                <SelectItem value="muscle_gain">Muscle Building</SelectItem>
                                                <SelectItem value="strength">Strength</SelectItem>
                                                <SelectItem value="mobility">Mobility</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Level</Label>
                                        <Select value={wLevel} onValueChange={setWLevel}>
                                            <SelectTrigger className="mt-1 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="beginner">Beginner</SelectItem>
                                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                                <SelectItem value="advanced">Advanced</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label>Duration (min)</Label>
                                        <Input type="number" value={wDuration} onChange={e => setWDuration(e.target.value)} className="mt-1 bg-white/5 border-white/10" />
                                    </div>
                                    <div>
                                        <Label>Equipment</Label>
                                        <Select value={wEquipment} onValueChange={setWEquipment}>
                                            <SelectTrigger className="mt-1 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="gym">Full Gym</SelectItem>
                                                <SelectItem value="home">Home</SelectItem>
                                                <SelectItem value="bodyweight">Bodyweight Only</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold" disabled={loading} onClick={generateWorkout}>
                                    {loading
                                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                                        : 'Generate Workout'}
                                </Button>
                            </div>
                        </GlassCard>

                        <AnimatePresence>
                            {result?.type === 'workout' && result.data && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                    <GlassCard>
                                        <h3 className="font-semibold mb-1">{result.data.workout_name}</h3>
                                        <p className="text-xs text-muted-foreground mb-4">{result.data.duration}</p>
                                        {result.data.warmup?.length > 0 && (
                                            <div className="mb-4">
                                                <h4 className="text-xs text-yellow-400 uppercase mb-2">Warm-up</h4>
                                                <ul className="text-sm text-muted-foreground space-y-1">
                                                    {result.data.warmup.map((w, i) => <li key={i}>• {w}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        <div className="space-y-3">
                                            {result.data.exercises?.map((ex, i) => (
                                                <div key={i} className="glass rounded-xl p-3">
                                                    <div className="font-medium text-sm">{ex.name}</div>
                                                    <div className="text-xs text-muted-foreground">{ex.sets} sets × {ex.reps} • Rest: {ex.rest}</div>
                                                    {ex.notes && <div className="text-xs text-emerald-400 mt-1">{ex.notes}</div>}
                                                </div>
                                            ))}
                                        </div>
                                        {result.data.cooldown?.length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="text-xs text-blue-400 uppercase mb-2">Cool-down</h4>
                                                <ul className="text-sm text-muted-foreground space-y-1">
                                                    {result.data.cooldown.map((c, i) => <li key={i}>• {c}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </GlassCard>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </TabsContent>

                {/* CALCULATORS TAB */}
                <TabsContent value="calculators">
                    <GlassCard className="max-w-xl">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-blue-400" /> Health Calculators
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <Label>Weight (kg)</Label>
                                    <Input type="number" value={calcWeight} onChange={e => setCalcWeight(e.target.value)} className="mt-1 bg-white/5 border-white/10" />
                                </div>
                                <div>
                                    <Label>Height (cm)</Label>
                                    <Input type="number" value={calcHeight} onChange={e => setCalcHeight(e.target.value)} className="mt-1 bg-white/5 border-white/10" />
                                </div>
                                <div>
                                    <Label>Age</Label>
                                    <Input type="number" value={calcAge} onChange={e => setCalcAge(e.target.value)} className="mt-1 bg-white/5 border-white/10" />
                                </div>
                            </div>
                            {(bmi || bmr) && (
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    {bmi && (
                                        <div className="glass rounded-xl p-4 text-center">
                                            <div className="text-xs text-muted-foreground mb-1">BMI</div>
                                            <div className="text-3xl font-bold font-space text-blue-400">{bmi}</div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese'}
                                            </div>
                                        </div>
                                    )}
                                    {bmr && (
                                        <div className="glass rounded-xl p-4 text-center">
                                            <div className="text-xs text-muted-foreground mb-1">BMR</div>
                                            <div className="text-3xl font-bold font-space text-emerald-400">{bmr}</div>
                                            <div className="text-xs text-muted-foreground mt-1">cal/day</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </TabsContent>
            </Tabs>
        </div>
    );
}