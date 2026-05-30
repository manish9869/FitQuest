import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
    ArrowRight, ArrowLeft, Flame, Check, Target, Dumbbell,
    Zap, Heart, Activity, ChevronRight, Sparkles
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { useNavigate } from 'react-router-dom';
import {
    calculateBMR, calculateTDEE, calculateCalorieTarget,
    calculateMacros, goalLabels, activityLabels
} from '@/lib/fitnessUtils';
import AuthVisualPanel from '@/components/auth/AuthVisualPanel';

const STEPS = ['Welcome', 'Body Stats', 'Your Goals', 'Lifestyle', 'Your Plan'];

const GOAL_OPTIONS = [
    { key: 'fat_loss', label: 'Fat Loss', desc: 'Burn fat & get lean', icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30' },
    { key: 'muscle_gain', label: 'Muscle Gain', desc: 'Build size & strength', icon: Dumbbell, color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30' },
    { key: 'strength', label: 'Strength', desc: 'Maximize power output', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30' },
    { key: 'general_fitness', label: 'General Fitness', desc: 'Stay healthy & active', icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/15', border: 'border-pink-500/30' },
    { key: 'athletic_performance', label: 'Athletic Performance', desc: 'Elite sport training', icon: Activity, color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/30' },
];

const ACTIVITY_OPTIONS = [
    { key: 'sedentary', label: 'Sedentary', desc: 'Desk job, little movement' },
    { key: 'lightly_active', label: 'Lightly Active', desc: '1–2 days/week exercise' },
    { key: 'moderately_active', label: 'Moderately Active', desc: '3–5 days/week exercise' },
    { key: 'very_active', label: 'Very Active', desc: '6–7 days/week exercise' },
    { key: 'extremely_active', label: 'Extremely Active', desc: 'Athlete level training' },
];

export default function Onboarding() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState({
        age: 25, height_cm: 175, weight_kg: 80, target_weight_kg: 70,
        fitness_goal: 'fat_loss', activity_level: 'moderately_active',
        sleep_hours: 7, workout_frequency: 4, phone: '',
    });

    const update = (key, val) => setData(prev => ({ ...prev, [key]: val }));
    const bmr = calculateBMR(data.weight_kg, data.height_cm, data.age);
    const tdee = calculateTDEE(bmr, data.activity_level);
    const calorieTarget = calculateCalorieTarget(tdee, data.fitness_goal);
    const macros = calculateMacros(calorieTarget, data.fitness_goal);

    const handleComplete = async () => {
        setSaving(true);
        await entities.UserProfile.create({
            user_email: user.email,
            ...data,
            daily_calorie_target: calorieTarget,
            protein_target: macros.protein,
            carb_target: macros.carbs,
            fat_target: macros.fat,
            water_goal_ml: Math.round(data.weight_kg * 35),
            step_goal: 10000,
            onboarding_complete: true,
            login_streak: 1,
            total_xp: 100,
            achievements: ['first_login'],
            last_login_date: new Date().toISOString().split('T')[0],
        });
        setSaving(false);
        navigate('/dashboard');
    };

    const stepContent = [
        // Step 0 — Welcome
        <div className="space-y-6">
            <div className="text-center">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-emerald-500/30"
                >
                    <Flame className="w-10 h-10 text-black" />
                </motion.div>
                <h2 className="text-3xl font-space font-bold text-white">
                    Welcome, <span className="text-gradient-green">{user?.full_name?.split(' ')[0] || 'Athlete'}</span>!
                </h2>
                <p className="text-muted-foreground mt-2 leading-relaxed">
                    Let's build your personalized transformation plan.<br />
                    Takes just <span className="text-emerald-400 font-semibold">2 minutes</span>.
                </p>
            </div>
            <div className="space-y-3">
                <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">Your Age</Label>
                    <div className="flex items-center gap-4">
                        <Slider value={[data.age]} onValueChange={([v]) => update('age', v)} min={16} max={80} className="flex-1" />
                        <div className="w-16 h-10 glass rounded-xl flex items-center justify-center font-bold text-emerald-400 text-lg">{data.age}</div>
                    </div>
                </div>
                <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">Phone (optional)</Label>
                    <Input value={data.phone} onChange={e => update('phone', e.target.value)} placeholder="+1 234 567 890"
                        className="bg-white/5 border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all" />
                </div>
            </div>
        </div>,

        // Step 1 — Body Stats
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-space font-bold">Body Stats</h2>
                <p className="text-sm text-muted-foreground mt-1">Used to calculate your precise calorie & macro targets</p>
            </div>
            {[
                { key: 'height_cm', label: 'Height', min: 140, max: 220, suffix: 'cm', step: 1 },
                { key: 'weight_kg', label: 'Current Weight', min: 40, max: 200, suffix: 'kg', step: 0.5 },
                { key: 'target_weight_kg', label: 'Target Weight', min: 40, max: 200, suffix: 'kg', step: 0.5 },
            ].map(({ key, label, min, max, suffix, step: s }) => (
                <div key={key}>
                    <div className="flex justify-between items-center mb-2">
                        <Label className="text-sm text-muted-foreground">{label}</Label>
                        <span className="text-lg font-bold text-emerald-400 font-space">{data[key]}{suffix}</span>
                    </div>
                    <Slider value={[data[key]]} onValueChange={([v]) => update(key, v)} min={min} max={max} step={s} />
                </div>
            ))}
        </div>,

        // Step 2 — Goals
        <div className="space-y-4">
            <div className="text-center">
                <h2 className="text-2xl font-space font-bold">Primary Goal</h2>
                <p className="text-sm text-muted-foreground mt-1">What are you working towards?</p>
            </div>
            <div className="space-y-2.5">
                {GOAL_OPTIONS.map(({ key, label, desc, icon: Icon, color, bg, border }) => {
                    const sel = data.fitness_goal === key;
                    return (
                        <motion.button
                            key={key}
                            onClick={() => update('fitness_goal', key)}
                            whileTap={{ scale: 0.98 }}
                            className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all flex items-center gap-4 ${sel ? `${bg} ${border} ring-1 ring-inset ${border}` : 'glass border-white/10 hover:border-white/20 hover:bg-white/5'
                                }`}
                        >
                            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                                <Icon className={`w-4.5 h-4.5 ${color}`} />
                            </div>
                            <div className="flex-1">
                                <div className={`font-semibold text-sm ${sel ? 'text-white' : ''}`}>{label}</div>
                                <div className="text-xs text-muted-foreground">{desc}</div>
                            </div>
                            {sel && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                        </motion.button>
                    );
                })}
            </div>
        </div>,

        // Step 3 — Lifestyle
        <div className="space-y-5">
            <div className="text-center">
                <h2 className="text-2xl font-space font-bold">Lifestyle</h2>
                <p className="text-sm text-muted-foreground mt-1">Fine-tune your plan to match your life</p>
            </div>
            <div>
                <Label className="text-sm text-muted-foreground mb-3 block">Activity Level</Label>
                <div className="space-y-2">
                    {ACTIVITY_OPTIONS.map(({ key, label, desc }) => (
                        <button
                            key={key}
                            onClick={() => update('activity_level', key)}
                            className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between ${data.activity_level === key ? 'bg-emerald-500/10 border-emerald-500/40 text-white' : 'glass border-white/10 hover:bg-white/5'
                                }`}
                        >
                            <div>
                                <div className="text-sm font-semibold">{label}</div>
                                <div className="text-xs text-muted-foreground">{desc}</div>
                            </div>
                            {data.activity_level === key && <Check className="w-4 h-4 text-emerald-400" />}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <div className="flex justify-between mb-2">
                    <Label className="text-sm text-muted-foreground">Workouts / Week</Label>
                    <span className="text-emerald-400 font-bold">{data.workout_frequency}x</span>
                </div>
                <Slider value={[data.workout_frequency]} onValueChange={([v]) => update('workout_frequency', v)} min={0} max={7} />
            </div>
            <div>
                <div className="flex justify-between mb-2">
                    <Label className="text-sm text-muted-foreground">Sleep Goal</Label>
                    <span className="text-emerald-400 font-bold">{data.sleep_hours}h</span>
                </div>
                <Slider value={[data.sleep_hours]} onValueChange={([v]) => update('sleep_hours', v)} min={4} max={12} step={0.5} />
            </div>
        </div>,

        // Step 4 — Plan reveal
        <div className="space-y-5">
            <div className="text-center">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                    <Sparkles className="w-8 h-8 text-black" />
                </motion.div>
                <h2 className="text-2xl font-space font-bold">Your Custom Plan</h2>
                <p className="text-sm text-muted-foreground mt-1">Calculated from your data — ready to go</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
                {[
                    { label: 'Daily Calories', value: `${calorieTarget}`, unit: 'kcal', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                    { label: 'Protein', value: `${macros.protein}`, unit: 'g / day', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                    { label: 'Carbs', value: `${macros.carbs}`, unit: 'g / day', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
                    { label: 'Fat', value: `${macros.fat}`, unit: 'g / day', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
                    { label: 'Daily Water', value: `${Math.round(data.weight_kg * 35 / 100) / 10}`, unit: 'litres', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
                    { label: 'Step Goal', value: '10,000', unit: 'steps', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
                ].map((item, i) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className={`${item.bg} border ${item.border} rounded-xl p-4 text-center`}
                    >
                        <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                        <div className={`text-2xl font-bold font-space ${item.color}`}>{item.value}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{item.unit}</div>
                    </motion.div>
                ))}
            </div>
            <div className="glass rounded-xl px-4 py-3 border border-emerald-500/20 text-sm text-center text-emerald-300">
                🎯 Estimated transformation: <span className="font-bold">{Math.abs(data.weight_kg - data.target_weight_kg) > 0 ? `${Math.ceil(Math.abs(data.weight_kg - data.target_weight_kg) / 0.5)} weeks` : 'You\'re at your goal!'}</span>
            </div>
        </div>,
    ];

    return (
        <div className="min-h-screen bg-background flex">
            {/* Visual Panel — hidden on mobile */}
            <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative">
                <AuthVisualPanel quoteIndex={step} />
            </div>

            {/* Form Panel */}
            <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
                <div className="flex-1 flex flex-col justify-center px-6 py-10 max-w-lg mx-auto w-full">

                    {/* Mobile logo */}
                    <div className="flex items-center gap-3 mb-8 lg:hidden">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center">
                            <Flame className="w-4.5 h-4.5 text-black" />
                        </div>
                        <span className="font-space font-bold text-white">FitElite</span>
                    </div>

                    {/* Progress stepper */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-muted-foreground font-medium">{STEPS[step]}</span>
                            <span className="text-xs text-muted-foreground">{step + 1} / {STEPS.length}</span>
                        </div>
                        <div className="flex gap-1.5">
                            {STEPS.map((_, i) => (
                                <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-white/10">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: i <= step ? '100%' : '0%' }}
                                        transition={{ duration: 0.4, delay: i < step ? 0 : 0.1 }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Step content */}
                    <div className="flex-1">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, x: 24 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -24 }}
                                transition={{ duration: 0.25 }}
                            >
                                {stepContent[step]}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Navigation */}
                    <div className="flex gap-3 mt-8">
                        {step > 0 && (
                            <Button variant="ghost" onClick={() => setStep(s => s - 1)}
                                className="flex-1 border border-white/10 hover:bg-white/5 text-muted-foreground">
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back
                            </Button>
                        )}
                        {step < STEPS.length - 1 ? (
                            <Button onClick={() => setStep(s => s + 1)}
                                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-bold shadow-lg shadow-emerald-500/25 transition-all">
                                Continue <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button onClick={handleComplete} disabled={saving}
                                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-bold shadow-lg shadow-emerald-500/30 transition-all">
                                {saving ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                        Setting up...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Flame className="w-4 h-4" /> Start My Transformation
                                    </span>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}


