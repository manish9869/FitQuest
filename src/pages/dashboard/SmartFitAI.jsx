import React, { useState } from 'react';
import { entities } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
    Brain, Dumbbell, Loader2, Zap, Flame, Clock, Target, Droplets,
    Utensils, Calendar, CheckCircle, Star, ChevronRight, Play, RotateCcw,
    TrendingUp, Shield, Activity, User
} from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { invokeLLM } from '@/api/llm';

const EQUIPMENT_OPTIONS = ['Full Gym', 'Dumbbells Only', 'Resistance Bands', 'Bodyweight Only', 'Home Gym', 'Kettlebells', 'Pull-up Bar'];
const FOCUS_OPTIONS = ['Full Body', 'Upper Body', 'Lower Body', 'Core & Abs', 'Push', 'Pull', 'Legs', 'Chest', 'Back', 'Shoulders'];

const DIFFICULTY_COLORS = {
    beginner: 'text-green-400 bg-green-500/10',
    intermediate: 'text-yellow-400 bg-yellow-500/10',
    advanced: 'text-orange-400 bg-orange-500/10',
    elite: 'text-red-400 bg-red-500/10',
};

const EXERCISE_GIF_MAP = {
    'push-up': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&q=80',
    'squat': 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=300&q=80',
    'deadlift': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&q=80',
    'plank': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&q=80',
    'burpee': 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=300&q=80',
    'default': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300&q=80',
};

function getExerciseImg(name) {
    const n = (name || '').toLowerCase();
    for (const key of Object.keys(EXERCISE_GIF_MAP)) {
        if (n.includes(key)) return EXERCISE_GIF_MAP[key];
    }
    return EXERCISE_GIF_MAP.default;
}

export default function SmartFitAI() {
    const { user } = useAuth();
    const qc = useQueryClient();

    const { data: profiles = [] } = useQuery({
        queryKey: ['userProfile', user?.email],
        queryFn: () => entities.UserProfile.filter({ user_email: user?.email }),
        enabled: !!user?.email,
    });
    const profile = profiles[0];

    const [tab, setTab] = useState('generator');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [weekPlan, setWeekPlan] = useState(null);
    const [savingToCalendar, setSavingToCalendar] = useState(false);

    const [form, setForm] = useState({
        goal: profile?.fitness_goal || 'fat_loss',
        duration: 45,
        difficulty: 'intermediate',
        equipment: ['Full Gym'],
        focus: 'Full Body',
        age: profile?.age || '',
        weight: profile?.weight_kg || '',
        daysPerWeek: 4,
    });

    const toggleEquipment = (eq) => {
        setForm(f => ({
            ...f,
            equipment: f.equipment.includes(eq)
                ? f.equipment.filter(e => e !== eq)
                : [...f.equipment, eq],
        }));
    };

    const generate = async () => {
        setLoading(true);
        setResult(null);
        try {
            const res = await invokeLLM({
                prompt: `You are SmartFitAI. Create a personalized ${form.duration}-minute ${form.focus} workout.
User: Goal=${form.goal.replace('_', ' ')}, Level=${form.difficulty}, Age=${form.age || 'unspecified'}, Weight=${form.weight || 'unspecified'}kg
Equipment: ${form.equipment.join(', ')}

For EACH exercise include realistic sets/reps, rest time, estimated calories burned, muscle groups targeted, and beginner modification tips.
Also provide:
- estimated total calories burned for the session
- top 3 nutrition tips for this goal
- hydration recommendation
- weekly progression plan (what to increase each week over 4 weeks)
- daily motivation tip`,
                response_json_schema: {
                    type: 'object',
                    properties: {
                        workout_name: { type: 'string' },
                        total_estimated_calories: { type: 'number' },
                        warmup: { type: 'array', items: { type: 'object', properties: { exercise: { type: 'string' }, duration: { type: 'string' } } } },
                        exercises: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    sets: { type: 'number' },
                                    reps: { type: 'string' },
                                    rest_seconds: { type: 'number' },
                                    estimated_calories: { type: 'number' },
                                    muscles: { type: 'array', items: { type: 'string' } },
                                    notes: { type: 'string' },
                                    modification: { type: 'string' },
                                },
                            },
                        },
                        cooldown: { type: 'array', items: { type: 'string' } },
                        nutrition_tips: { type: 'array', items: { type: 'string' } },
                        hydration_tip: { type: 'string' },
                        weekly_progression: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    week: { type: 'number' },
                                    focus: { type: 'string' },
                                    changes: { type: 'string' },
                                },
                            },
                        },
                        motivation_tip: { type: 'string' },
                    },
                },
            });
            setResult(res);
            setTab('result');
        } catch (e) {
            toast.error('Failed to generate workout. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const generateWeekPlan = async () => {
        setLoading(true);
        setWeekPlan(null);
        try {
            const res = await invokeLLM({
                prompt: `Create a ${form.daysPerWeek}-day/week workout calendar plan for ${form.goal.replace('_', ' ')} goal.
Level: ${form.difficulty}, Equipment: ${form.equipment.join(', ')}.
Plan 7 days with appropriate rest days. For workout days include type, focus area, duration, and intensity.`,
                response_json_schema: {
                    type: 'object',
                    properties: {
                        plan_name: { type: 'string' },
                        days: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    day: { type: 'string' },
                                    type: { type: 'string' },
                                    focus: { type: 'string' },
                                    duration_min: { type: 'number' },
                                    intensity: { type: 'string' },
                                    description: { type: 'string' },
                                    is_rest: { type: 'boolean' },
                                },
                            },
                        },
                    },
                },
            });
            setWeekPlan(res);
            setTab('calendar');
        } catch (e) {
            toast.error('Failed to generate weekly plan. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const saveWorkoutToLog = async () => {
        if (!result) return;
        setSavingToCalendar(true);
        try {
            await entities.WorkoutLog.create({
                user_email: user.email,
                date: format(new Date(), 'yyyy-MM-dd'),
                workout_type: 'strength',
                name: result.workout_name,
                duration_min: form.duration,
                calories_burned: result.total_estimated_calories || 0,
                intensity: form.difficulty === 'elite' ? 'extreme' : form.difficulty === 'advanced' ? 'high' : form.difficulty === 'beginner' ? 'low' : 'moderate',
                notes: `AI Generated - ${form.focus} | ${form.equipment.join(', ')}`,
            });
            qc.invalidateQueries({ queryKey: ['workouts'] });
            toast.success('Workout saved to today\'s log!');
        } catch (e) {
            toast.error('Failed to save workout.');
        } finally {
            setSavingToCalendar(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-space font-bold flex items-center gap-2">
                        <Brain className="w-7 h-7 text-purple-400" /> SmartFit<span className="text-purple-400">AI</span>
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Personalized workout generator with weekly plans & nutrition guidance</p>
                </div>
                {result && (
                    <div className="flex gap-2">
                        <Button onClick={() => { setResult(null); setTab('generator'); }} variant="outline" size="sm" className="border-white/10">
                            <RotateCcw className="w-4 h-4 mr-1" /> New Plan
                        </Button>
                        <Button onClick={saveWorkoutToLog} disabled={savingToCalendar} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
                            {savingToCalendar ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                            Save to Log
                        </Button>
                    </div>
                )}
            </div>

            <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="glass border-white/10">
                    <TabsTrigger value="generator" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
                        <Zap className="w-4 h-4 mr-1.5" /> Generator
                    </TabsTrigger>
                    <TabsTrigger value="result" disabled={!result} className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                        <Dumbbell className="w-4 h-4 mr-1.5" /> Workout
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
                        <Calendar className="w-4 h-4 mr-1.5" /> Week Plan
                    </TabsTrigger>
                    <TabsTrigger value="nutrition" disabled={!result} className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
                        <Utensils className="w-4 h-4 mr-1.5" /> Nutrition
                    </TabsTrigger>
                </TabsList>

                {/* GENERATOR TAB */}
                <TabsContent value="generator">
                    <div className="grid lg:grid-cols-2 gap-6">
                        <GlassCard>
                            <h3 className="font-semibold mb-5 flex items-center gap-2"><Target className="w-5 h-5 text-purple-400" /> Your Fitness Profile</h3>
                            <div className="space-y-5">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs">Fitness Goal</Label>
                                        <Select value={form.goal} onValueChange={v => setForm(f => ({ ...f, goal: v }))}>
                                            <SelectTrigger className="mt-1 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="fat_loss">🔥 Fat Loss</SelectItem>
                                                <SelectItem value="muscle_gain">💪 Muscle Gain</SelectItem>
                                                <SelectItem value="strength">⚡ Strength</SelectItem>
                                                <SelectItem value="athletic_performance">🏃 Athletic Performance</SelectItem>
                                                <SelectItem value="general_fitness">🌟 General Fitness</SelectItem>
                                                <SelectItem value="mobility">🧘 Mobility & Flexibility</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-xs">Difficulty</Label>
                                        <Select value={form.difficulty} onValueChange={v => setForm(f => ({ ...f, difficulty: v }))}>
                                            <SelectTrigger className="mt-1 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="beginner">🟢 Beginner</SelectItem>
                                                <SelectItem value="intermediate">🟡 Intermediate</SelectItem>
                                                <SelectItem value="advanced">🟠 Advanced</SelectItem>
                                                <SelectItem value="elite">🔴 Elite</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-xs">Duration: <span className="text-purple-400 font-bold">{form.duration} mins</span></Label>
                                    <Slider className="mt-3" min={15} max={90} step={5} value={[form.duration]} onValueChange={([v]) => setForm(f => ({ ...f, duration: v }))} />
                                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>15 min</span><span>90 min</span></div>
                                </div>

                                <div>
                                    <Label className="text-xs">Focus Area</Label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {FOCUS_OPTIONS.map(f => (
                                            <button key={f} onClick={() => setForm(fo => ({ ...fo, focus: f }))}
                                                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${form.focus === f ? 'bg-purple-500/20 border-purple-500/40 text-purple-400' : 'border-white/10 text-muted-foreground hover:border-white/20'}`}>
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs">Age</Label>
                                        <Input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} placeholder="years" className="mt-1 bg-white/5 border-white/10 h-8 text-sm" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Weight (kg)</Label>
                                        <Input type="number" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} placeholder="kg" className="mt-1 bg-white/5 border-white/10 h-8 text-sm" />
                                    </div>
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard>
                            <h3 className="font-semibold mb-5 flex items-center gap-2"><Dumbbell className="w-5 h-5 text-blue-400" /> Available Equipment</h3>
                            <div className="flex flex-wrap gap-2 mb-6">
                                {EQUIPMENT_OPTIONS.map(eq => (
                                    <button key={eq} onClick={() => toggleEquipment(eq)}
                                        className={`text-xs px-3 py-2 rounded-xl border transition-all ${form.equipment.includes(eq) ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'border-white/10 text-muted-foreground hover:border-white/20'}`}>
                                        {eq}
                                    </button>
                                ))}
                            </div>

                            <div className="mb-6">
                                <Label className="text-xs">Days per Week: <span className="text-blue-400 font-bold">{form.daysPerWeek} days</span></Label>
                                <Slider className="mt-3" min={1} max={7} step={1} value={[form.daysPerWeek]} onValueChange={([v]) => setForm(f => ({ ...f, daysPerWeek: v }))} />
                            </div>

                            <div className="glass rounded-xl p-4 mb-5 border border-purple-500/20">
                                <div className="grid grid-cols-3 gap-3 text-center">
                                    <div>
                                        <div className="text-xs text-muted-foreground">Duration</div>
                                        <div className="font-bold text-purple-400">{form.duration}m</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Level</div>
                                        <div className={`font-bold capitalize text-xs px-2 py-1 rounded-full ${DIFFICULTY_COLORS[form.difficulty]}`}>{form.difficulty}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Days/Week</div>
                                        <div className="font-bold text-blue-400">{form.daysPerWeek}x</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white font-bold py-3 text-base shadow-lg shadow-purple-500/20" disabled={loading} onClick={generate}>
                                    {loading && tab !== 'calendar'
                                        ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> AI is crafting your workout...</>
                                        : <><Zap className="w-5 h-5 mr-2" /> Generate My Workout</>}
                                </Button>
                                <Button variant="outline" className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10" disabled={loading} onClick={generateWeekPlan}>
                                    {loading && tab === 'calendar'
                                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Building calendar...</>
                                        : <><Calendar className="w-4 h-4 mr-2" /> Build Weekly Plan</>}
                                </Button>
                            </div>
                        </GlassCard>
                    </div>
                </TabsContent>

                {/* RESULT TAB */}
                <TabsContent value="result">
                    {result && (
                        <div className="space-y-6">
                            <div className="glass rounded-2xl p-5 border border-purple-500/20">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <h2 className="text-xl font-bold font-space">{result.workout_name}</h2>
                                        {result.motivation_tip && <p className="text-sm text-purple-300 mt-1 italic">"{result.motivation_tip}"</p>}
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-red-400">{result.total_estimated_calories}</div>
                                            <div className="text-[10px] text-muted-foreground">est. cal burned</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-purple-400">{form.duration}m</div>
                                            <div className="text-[10px] text-muted-foreground">duration</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-400">{result.exercises?.length}</div>
                                            <div className="text-[10px] text-muted-foreground">exercises</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {result.warmup?.length > 0 && (
                                <GlassCard animate={false}>
                                    <h4 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2"><Activity className="w-4 h-4" /> Warm-Up</h4>
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {result.warmup.map((w, i) => (
                                            <div key={i} className="glass rounded-lg px-3 py-2 text-sm flex justify-between">
                                                <span>{w.exercise || w}</span>
                                                {w.duration && <span className="text-muted-foreground text-xs">{w.duration}</span>}
                                            </div>
                                        ))}
                                    </div>
                                </GlassCard>
                            )}

                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {result.exercises?.map((ex, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                        <div className="glass rounded-2xl overflow-hidden border border-white/10 hover:border-purple-500/30 transition-all">
                                            <div className="relative h-32">
                                                <img src={getExerciseImg(ex.name)} alt={ex.name} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                                <div className="absolute bottom-2 left-3">
                                                    <span className="text-white font-semibold text-sm">{ex.name}</span>
                                                </div>
                                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5">
                                                    <span className="text-xs text-red-400">~{ex.estimated_calories} cal</span>
                                                </div>
                                            </div>
                                            <div className="p-3 space-y-2">
                                                <div className="flex gap-2 flex-wrap">
                                                    <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full">{ex.sets} sets</span>
                                                    <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">{ex.reps} reps</span>
                                                    <span className="text-xs bg-white/5 text-muted-foreground px-2 py-0.5 rounded-full">{ex.rest_seconds}s rest</span>
                                                </div>
                                                {ex.muscles?.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {ex.muscles.map((m, mi) => (
                                                            <span key={mi} className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{m}</span>
                                                        ))}
                                                    </div>
                                                )}
                                                {ex.notes && <p className="text-xs text-muted-foreground">{ex.notes}</p>}
                                                {ex.modification && <p className="text-[10px] text-yellow-400">💡 {ex.modification}</p>}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {result.cooldown?.length > 0 && (
                                <GlassCard animate={false}>
                                    <h4 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2"><Shield className="w-4 h-4" /> Cool-Down</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {result.cooldown.map((c, i) => (
                                            <span key={i} className="text-xs glass px-3 py-1.5 rounded-full">{c}</span>
                                        ))}
                                    </div>
                                </GlassCard>
                            )}

                            {result.weekly_progression?.length > 0 && (
                                <GlassCard animate={false}>
                                    <h4 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-400" /> 4-Week Progression Plan</h4>
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        {result.weekly_progression.map((w, i) => (
                                            <div key={i} className="glass rounded-xl p-3 border border-white/5">
                                                <div className="text-xs text-emerald-400 font-bold mb-1">Week {w.week}</div>
                                                <div className="text-xs font-medium mb-1">{w.focus}</div>
                                                <div className="text-xs text-muted-foreground">{w.changes}</div>
                                            </div>
                                        ))}
                                    </div>
                                </GlassCard>
                            )}
                        </div>
                    )}
                </TabsContent>

                {/* CALENDAR TAB */}
                <TabsContent value="calendar">
                    {weekPlan ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="font-bold text-lg">{weekPlan.plan_name}</h2>
                                <Button variant="outline" size="sm" className="border-white/10" onClick={generateWeekPlan} disabled={loading}>
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-1" />} Regenerate
                                </Button>
                            </div>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-7 gap-3">
                                {weekPlan.days?.map((day, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                                        <div className={`rounded-2xl p-4 border transition-all h-full ${day.is_rest ? 'glass border-white/5 opacity-60' : 'glass border-emerald-500/20 hover:border-emerald-500/40'}`}>
                                            <div className="text-xs font-bold text-muted-foreground mb-2">{day.day}</div>
                                            {day.is_rest ? (
                                                <div className="text-center py-3">
                                                    <div className="text-2xl mb-1">😴</div>
                                                    <div className="text-xs text-muted-foreground">Rest Day</div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="text-sm font-semibold mb-1">{day.focus}</div>
                                                    <div className="text-xs text-muted-foreground mb-2">{day.type}</div>
                                                    <div className="flex flex-col gap-1.5">
                                                        {day.duration_min && <span className="text-[10px] flex items-center gap-1 text-blue-400"><Clock className="w-3 h-3" />{day.duration_min}m</span>}
                                                        {day.intensity && <span className={`text-[10px] capitalize ${day.intensity === 'high' ? 'text-orange-400' : day.intensity === 'low' ? 'text-green-400' : 'text-yellow-400'}`}>● {day.intensity}</span>}
                                                    </div>
                                                    {day.description && <p className="text-[10px] text-muted-foreground mt-2 line-clamp-2">{day.description}</p>}
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <GlassCard className="text-center py-16">
                            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-semibold mb-2">No Weekly Plan Yet</h3>
                            <p className="text-sm text-muted-foreground mb-6">Generate a personalized weekly workout calendar based on your goals</p>
                            <Button className="bg-blue-500 hover:bg-blue-600 text-white" disabled={loading} onClick={generateWeekPlan}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Calendar className="w-4 h-4 mr-2" />}
                                Build My Week Plan
                            </Button>
                        </GlassCard>
                    )}
                </TabsContent>

                {/* NUTRITION TAB */}
                <TabsContent value="nutrition">
                    {result && (
                        <div className="space-y-4">
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {result.nutrition_tips?.map((tip, i) => (
                                    <GlassCard key={i} animate={false} className="border border-orange-500/20">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                                                <Utensils className="w-4 h-4 text-orange-400" />
                                            </div>
                                            <div>
                                                <div className="text-xs text-orange-400 font-bold mb-1">Nutrition Tip {i + 1}</div>
                                                <p className="text-sm text-muted-foreground">{tip}</p>
                                            </div>
                                        </div>
                                    </GlassCard>
                                ))}
                                {result.hydration_tip && (
                                    <GlassCard animate={false} className="border border-blue-500/20">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                                <Droplets className="w-4 h-4 text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="text-xs text-blue-400 font-bold mb-1">Hydration</div>
                                                <p className="text-sm text-muted-foreground">{result.hydration_tip}</p>
                                            </div>
                                        </div>
                                    </GlassCard>
                                )}
                            </div>

                            <GlassCard animate={false} className="border border-emerald-500/20">
                                <h4 className="font-semibold mb-4 flex items-center gap-2"><Flame className="w-5 h-5 text-emerald-400" /> Post-Workout Calorie Summary</h4>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="glass rounded-xl py-4">
                                        <div className="text-2xl font-bold text-emerald-400">{result.total_estimated_calories}</div>
                                        <div className="text-xs text-muted-foreground">Calories Burned</div>
                                    </div>
                                    <div className="glass rounded-xl py-4">
                                        <div className="text-2xl font-bold text-blue-400">{form.duration}</div>
                                        <div className="text-xs text-muted-foreground">Minutes</div>
                                    </div>
                                    <div className="glass rounded-xl py-4">
                                        <div className="text-2xl font-bold text-purple-400">{result.exercises?.length}</div>
                                        <div className="text-xs text-muted-foreground">Exercises</div>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}