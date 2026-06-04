import React, { useMemo, useEffect, useState } from 'react';
import PersistentResizable from '@/components/ui/PersistentResizable';
import { useWidgetSizes } from '@/lib/useWidgetSizes';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { today, calculateFitnessScore, getScoreEmoji, getSmartInsights } from '@/lib/fitnessUtils';
import { updateLoginStreak } from '@/lib/xpEngine';
import { runAutomations } from '@/lib/automationEngine';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { format, subDays, parseISO } from 'date-fns';
import ProgressRing from '@/components/ui/ProgressRing';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import GlassCard from '@/components/ui/GlassCard';
import WeightChart from '@/components/dashboard/WeightChart';
import WorkoutConsistency from '@/components/dashboard/WorkoutConsistency';
import HabitStreakGrid from '@/components/dashboard/HabitStreakGrid';
import DailyTip from '@/components/dashboard/DailyTip';
import BMIWidget from '@/components/dashboard/BMIWidget';
import DashboardCustomizer, { parseLayout, ALL_WIDGETS } from '@/components/dashboard/DashboardCustomizer';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
    Flame, Droplets, Footprints, Dumbbell, Moon, Utensils,
    AlertCircle, CheckCircle, Info, TrendingUp, Target, Zap,
    Award, ChefHat, Heart, Camera, Scale
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ResizableWidget from '@/components/ui/ResizableWidget';

const MiniTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.[0]) return null;
    return (
        <div className="bg-card border border-border rounded-lg p-2 text-xs shadow-lg">
            <p className="font-semibold">{label}</p>
            <p style={{ color: payload[0].color }}>{payload[0].value?.toLocaleString()}</p>
        </div>
    );
};

// Widgets that need a companion to fill a row — rendered as pairs
const PAIRED_GROUPS = [
    ['score', 'stats'],          // 1/3 + 2/3
    ['macros', 'calorie_trend'], // 1/2 + 1/2
    ['bmi', 'weight', 'workout_consistency'], // 1/3 + 1/3 + 1/3
];

export default function DashboardHome() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const todayStr = today();

    const { data: profiles } = useQuery({
        queryKey: ['userProfile', user?.email],
        queryFn: () => entities.UserProfile.filter({ user_email: user?.email }),
        enabled: !!user?.email,
    });
    const profile = profiles?.[0];

    const { data: meals = [] } = useQuery({ queryKey: ['meals', todayStr, user?.email], queryFn: () => entities.MealLog.filter({ user_email: user?.email, date: todayStr }), enabled: !!user?.email });
    const { data: waterLogs = [] } = useQuery({ queryKey: ['water', todayStr, user?.email], queryFn: () => entities.WaterLog.filter({ user_email: user?.email, date: todayStr }), enabled: !!user?.email });
    const { data: stepLogs = [] } = useQuery({ queryKey: ['steps', todayStr, user?.email], queryFn: () => entities.StepLog.filter({ user_email: user?.email, date: todayStr }), enabled: !!user?.email });
    const { data: workouts = [] } = useQuery({ queryKey: ['workouts', todayStr, user?.email], queryFn: () => entities.WorkoutLog.filter({ user_email: user?.email, date: todayStr }), enabled: !!user?.email });
    const { data: sleepLogs = [] } = useQuery({ queryKey: ['sleep', todayStr, user?.email], queryFn: () => entities.SleepLog.filter({ user_email: user?.email, date: todayStr }), enabled: !!user?.email });
    const { data: allMeals = [] } = useQuery({ queryKey: ['meals-week', user?.email], queryFn: () => entities.MealLog.filter({ user_email: user?.email }), enabled: !!user?.email });
    const { data: allCoachPlans = [] } = useQuery({ queryKey: ['coach-plans', user?.email], queryFn: () => entities.CoachPlan.filter({ user_email: user?.email, status: 'active' }), enabled: !!user?.email });
    const { data: weightLogs = [] } = useQuery({ queryKey: ['weight-logs', user?.email], queryFn: () => entities.WeightLog.filter({ user_email: user?.email }), enabled: !!user?.email });

    useEffect(() => { if (profiles && profiles.length === 0) navigate('/onboarding'); }, [profiles]);

    // Update login streak once per session when profile is loaded
    useEffect(() => {
        if (profile?.id) {
            updateLoginStreak(profile).then(({ streakUpdated }) => {
                if (streakUpdated) qc.invalidateQueries({ queryKey: ['userProfile'] });
            });
        }
    }, [profile?.id]);

    // Run automation engine once per session when data is ready
    useEffect(() => {
        if (!user?.email || !profile) return;
        runAutomations(user, {
            recentWorkouts: workouts,
            todayWater: waterLogs.reduce((s, w) => s + (w.amount_ml || 0), 0),
            todayCalories: meals.reduce((s, m) => s + (m.calories || 0), 0),
            loginStreak: profile.login_streak || 0,
        });
    }, [user?.email, profile?.id]);

    const saveLayout = useMutation({
        mutationFn: (layout) => entities.UserProfile.update(profile.id, { dashboard_layout: layout }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['userProfile'] }),
    });

    const updateProfile = useMutation({
        mutationFn: (data) => entities.UserProfile.update(profile.id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['userProfile'] }),
    });

    const { getSavedSize, handleSizeChange } = useWidgetSizes(profile, (data) => {
        if (profile?.id) updateProfile.mutate(data);
    });

    const layout = parseLayout(profile?.dashboard_layout, ALL_WIDGETS);

    const totals = useMemo(() => ({
        cal: meals.reduce((s, m) => s + (m.calories || 0), 0),
        pro: meals.reduce((s, m) => s + (m.protein || 0), 0),
        carbs: meals.reduce((s, m) => s + (m.carbs || 0), 0),
        fats: meals.reduce((s, m) => s + (m.fats || 0), 0),
        water: waterLogs.reduce((s, w) => s + (w.amount_ml || 0), 0),
        steps: stepLogs.reduce((s, st) => s + (st.steps || 0), 0),
        sleep: sleepLogs.reduce((s, sl) => s + (sl.hours || 0), 0),
    }), [meals, waterLogs, stepLogs, sleepLogs]);

    const targets = {
        calories: profile?.daily_calorie_target || 2000,
        protein: profile?.protein_target || 150,
        water: profile?.water_goal_ml || 2500,
        steps: profile?.step_goal || 10000,
    };

    const last7 = useMemo(() => Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')), []);
    const calorieTrend = useMemo(() => last7.map(date => ({
        date: format(new Date(date), 'EEE'),
        calories: allMeals.filter(m => m.date === date).reduce((s, m) => s + (m.calories || 0), 0),
    })), [last7, allMeals]);

    const weightTrend = useMemo(() =>
        [...weightLogs].sort((a, b) => a.date.localeCompare(b.date)).slice(-14)
            .map(l => ({ date: format(parseISO(l.date), 'MMM d'), weight: l.weight_kg })),
        [weightLogs]);

    const latestWeight = [...weightLogs].sort((a, b) => b.date.localeCompare(a.date))[0];

    const fitnessScore = calculateFitnessScore({
        caloriesPct: (totals.cal / targets.calories) * 100,
        proteinPct: (totals.pro / targets.protein) * 100,
        waterPct: (totals.water / targets.water) * 100,
        stepsPct: (totals.steps / targets.steps) * 100,
        workoutDone: workouts.length > 0,
        sleepHours: totals.sleep,
    });

    const scoreInfo = getScoreEmoji(fitnessScore);
    const insights = getSmartInsights({
        calories: totals.cal, calorieTarget: targets.calories,
        protein: totals.pro, proteinTarget: targets.protein,
        water: totals.water, waterGoal: targets.water,
        steps: totals.steps, stepGoal: targets.steps,
    });

    const insightIcons = { warning: AlertCircle, success: CheckCircle, info: Info };
    const insightColors = {
        warning: 'text-yellow-400 bg-yellow-500/5 border-yellow-500/20',
        success: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20',
        info: 'text-blue-400 bg-blue-500/5 border-blue-500/20',
    };

    if (!profile) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>;

    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';

    // --- Widget Renderers ---
    const WIDGET_RENDERERS = {
        score: () => (
            <GlassCard className="flex flex-col items-center justify-center py-6">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">Daily Score</p>
                <ProgressRing value={fitnessScore} size={160} strokeWidth={12}
                    color={fitnessScore >= 80 ? '#22c55e' : fitnessScore >= 50 ? '#3b82f6' : '#ef4444'}>
                    <div className="text-center">
                        <div className="text-4xl font-bold font-space"><AnimatedCounter value={fitnessScore} /></div>
                        <div className={`text-sm mt-0.5 ${scoreInfo.color}`}>{scoreInfo.emoji} {scoreInfo.label}</div>
                    </div>
                </ProgressRing>
                <p className="text-xs text-muted-foreground text-center mt-4 px-4">Nutrition, hydration, activity & rest</p>
            </GlassCard>
        ),

        stats: () => (
            <div className="grid grid-cols-2 gap-3">
                {[
                    { icon: Flame, label: 'Calories', value: totals.cal, target: targets.calories, unit: 'kcal', color: '#22c55e', path: '/dashboard/meals' },
                    { icon: Droplets, label: 'Water', value: totals.water, target: targets.water, unit: 'ml', color: '#3b82f6', path: '/dashboard/water' },
                    { icon: Footprints, label: 'Steps', value: totals.steps, target: targets.steps, unit: '', color: '#f97316', path: '/dashboard/steps' },
                    { icon: Moon, label: 'Sleep', value: totals.sleep, target: profile?.sleep_hours || 8, unit: 'hrs', color: '#a855f7', path: '/dashboard/sleep' },
                ].map(stat => {
                    const pct = Math.min((stat.value / stat.target) * 100, 100);
                    return (
                        <Link key={stat.label} to={stat.path}>
                            <GlassCard animate={false} className="hover:border-white/20 cursor-pointer transition-all h-full">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                                            <span className="text-xs text-muted-foreground">{stat.label}</span>
                                        </div>
                                        <div className="text-xl font-bold font-space"><AnimatedCounter value={stat.value} /></div>
                                        <div className="text-xs text-muted-foreground">/ {stat.target.toLocaleString()} {stat.unit}</div>
                                    </div>
                                    <div className="text-sm font-bold" style={{ color: stat.color }}>{Math.round(pct)}%</div>
                                </div>
                                <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 mt-3 overflow-hidden">
                                    <motion.div className="h-full rounded-full" style={{ backgroundColor: stat.color }}
                                        initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, ease: 'easeOut' }} />
                                </div>
                            </GlassCard>
                        </Link>
                    );
                })}
            </div>
        ),

        macros: () => (
            <GlassCard animate={false}>
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-emerald-400" /> Today's Macros</h3>
                <div className="space-y-3">
                    {[
                        { label: 'Protein', value: totals.pro, target: targets.protein, color: '#22c55e' },
                        { label: 'Carbs', value: totals.carbs, target: profile?.carb_target || 200, color: '#3b82f6' },
                        { label: 'Fat', value: totals.fats, target: profile?.fat_target || 70, color: '#a855f7' },
                    ].map(macro => {
                        const pct = Math.min((macro.value / macro.target) * 100, 100);
                        return (
                            <div key={macro.label}>
                                <div className="flex justify-between text-sm mb-1.5">
                                    <span className="text-muted-foreground">{macro.label}</span>
                                    <span className="font-medium">{macro.value}g <span className="text-muted-foreground">/ {macro.target}g</span></span>
                                </div>
                                <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                                    <motion.div className="h-full rounded-full" style={{ backgroundColor: macro.color }}
                                        initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </GlassCard>
        ),

        quick_actions: () => (
            <GlassCard animate={false}>
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /> Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { icon: Utensils, label: 'Log Meal', path: '/dashboard/meals', color: 'bg-emerald-500/10 text-emerald-400' },
                        { icon: Droplets, label: 'Log Water', path: '/dashboard/water', color: 'bg-blue-500/10 text-blue-400' },
                        { icon: Footprints, label: 'Log Steps', path: '/dashboard/steps', color: 'bg-orange-500/10 text-orange-400' },
                        { icon: Dumbbell, label: 'Log Workout', path: '/dashboard/workouts', color: 'bg-purple-500/10 text-purple-400' },
                        { icon: Scale, label: 'Log Weight', path: '/dashboard/weight', color: 'bg-pink-500/10 text-pink-400' },
                        { icon: ChefHat, label: 'Recipes', path: '/dashboard/recipes', color: 'bg-orange-500/10 text-orange-400' },
                    ].map(a => (
                        <Link key={a.label} to={a.path}>
                            <Button variant="ghost" className={`w-full h-auto py-2 gap-2 rounded-xl text-xs ${a.color}`}>
                                <a.icon className="w-3.5 h-3.5" />{a.label}
                            </Button>
                        </Link>
                    ))}
                </div>
            </GlassCard>
        ),

        calorie_trend: () => (
            <GlassCard animate={false} className="p-0 overflow-hidden">
                <div className="px-5 pt-4 pb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-semibold text-sm">7-Day Calorie Trend</h3>
                </div>
                <ResizableWidget defaultHeight={220} className="px-4 pb-4">
                    {(h) => (
                        <>
                            <ResponsiveContainer width="100%" height={Math.max(120, h - 40)}>
                                <AreaChart data={calorieTrend}>
                                    <defs>
                                        <linearGradient id="dashCalGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                                    <XAxis dataKey="date" stroke="transparent" fontSize={11} tick={{ fill: 'currentColor', opacity: 0.5 }} />
                                    <YAxis stroke="transparent" fontSize={11} tick={{ fill: 'currentColor', opacity: 0.5 }} />
                                    <Tooltip content={<MiniTooltip />} />
                                    <Area type="monotone" dataKey="calories" stroke="#22c55e" fill="url(#dashCalGrad)" strokeWidth={2} dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                            <div className="flex justify-between mt-1 text-xs text-muted-foreground px-1">
                                <span>Target: {targets.calories.toLocaleString()} kcal/day</span>
                                <span className="text-emerald-400 font-medium">Avg: {Math.round(calorieTrend.reduce((s, d) => s + d.calories, 0) / 7).toLocaleString()} kcal</span>
                            </div>
                        </>
                    )}
                </ResizableWidget>
            </GlassCard>
        ),

        weight: () => (
            <GlassCard animate={false}>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold flex items-center gap-2"><Scale className="w-4 h-4 text-emerald-400" /> Weight Trend</h3>
                    {latestWeight && <span className="text-sm font-bold text-emerald-400">{latestWeight.weight_kg} kg</span>}
                </div>
                {weightTrend.length < 2 ? (
                    <div className="h-36 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                        <Scale className="w-8 h-8 opacity-20" />
                        <Link to="/dashboard/weight" className="text-emerald-400 hover:underline text-xs">Start logging your weight →</Link>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={140}>
                        <AreaChart data={weightTrend}>
                            <defs>
                                <linearGradient id="wdash" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" stroke="transparent" fontSize={10} tick={{ fill: 'currentColor', opacity: 0.5 }} />
                            <YAxis stroke="transparent" fontSize={10} tick={{ fill: 'currentColor', opacity: 0.5 }} domain={['auto', 'auto']} />
                            <Tooltip content={<MiniTooltip />} />
                            <Area type="monotone" dataKey="weight" stroke="#22c55e" fill="url(#wdash)" strokeWidth={2} dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
                {profile?.target_weight_kg && latestWeight && (
                    <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                        <span>Goal: <span className="text-yellow-400 font-medium">{profile.target_weight_kg} kg</span></span>
                        <span>Left: <span className="font-medium">{Math.abs(latestWeight.weight_kg - profile.target_weight_kg).toFixed(1)} kg</span></span>
                    </div>
                )}
            </GlassCard>
        ),

        bmi: () => <BMIWidget />,
        workout_consistency: () => <WorkoutConsistency />,
        habit_grid: () => <HabitStreakGrid />,
        daily_tip: () => <DailyTip />,

        insights: () => insights.length === 0 ? null : (
            <GlassCard animate={false}>
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /> Smart Insights</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                    {insights.map((insight, i) => {
                        const Icon = insightIcons[insight.type];
                        return (
                            <motion.div key={i} className={`flex items-start gap-3 rounded-xl p-4 border ${insightColors[insight.type]}`}
                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                                <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{insight.message}</span>
                            </motion.div>
                        );
                    })}
                </div>
            </GlassCard>
        ),

        premium_cards: () => (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { path: '/dashboard/readiness', icon: Heart, label: 'Readiness Score', desc: 'WHOOP-style recovery', color: '#22c55e', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                    { path: '/dashboard/missions', icon: Target, label: 'Daily Missions', desc: 'Earn XP & badges', color: '#f59e0b', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
                    { path: '/dashboard/food-camera', icon: Camera, label: 'AI Food Scan', desc: 'Snap & log instantly', color: '#a855f7', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
                    { path: '/dashboard/weekly-report', icon: TrendingUp, label: 'Weekly Report', desc: 'Spotify Wrapped style', color: '#3b82f6', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                ].map((f, i) => (
                    <Link key={f.path} to={f.path}>
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                            className={`glass rounded-2xl p-4 border ${f.border} hover:scale-105 transition-all cursor-pointer`}>
                            <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-3`}>
                                <f.icon className="w-5 h-5" style={{ color: f.color }} />
                            </div>
                            <div className="font-semibold text-sm">{f.label}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{f.desc}</div>
                        </motion.div>
                    </Link>
                ))}
            </div>
        ),

        coach_banner: () => allCoachPlans.length === 0 ? null : (
            <GlassCard animate={false} className="border border-purple-500/20 bg-purple-500/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <Award className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-purple-400">Active Coach Plan</p>
                            <p className="text-xs text-muted-foreground">{allCoachPlans[0].title}</p>
                        </div>
                    </div>
                    <Link to="/dashboard/coach-plan">
                        <Button size="sm" className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border-0 rounded-xl">View Plan</Button>
                    </Link>
                </div>
            </GlassCard>
        ),
    };

    // --- Layout-driven rendering ---
    const PAIR_MAP = {
        score: { group: 'top', cols: 'lg:col-span-1', rowCols: 'lg:grid-cols-3' },
        stats: { group: 'top', cols: 'lg:col-span-2', rowCols: 'lg:grid-cols-3' },
        macros: { group: 'mid', cols: '', rowCols: 'lg:grid-cols-2' },
        quick_actions: { group: 'mid', cols: '', rowCols: 'lg:grid-cols-2' },
        calorie_trend: { group: 'mid', cols: '', rowCols: 'lg:grid-cols-2' },
        bmi: { group: 'bot', cols: '', rowCols: 'lg:grid-cols-3' },
        weight: { group: 'bot', cols: '', rowCols: 'lg:grid-cols-3' },
        workout_consistency: { group: 'bot', cols: '', rowCols: 'lg:grid-cols-3' },
    };

    const visibleLayout = layout.filter(w => w.visible);

    const rows = [];
    const seen = new Set();

    for (const widget of visibleLayout) {
        if (seen.has(widget.id)) continue;
        const pm = PAIR_MAP[widget.id];
        if (pm) {
            const siblings = visibleLayout.filter(w => PAIR_MAP[w.id]?.group === pm.group && !seen.has(w.id));
            if (siblings.length > 1) {
                siblings.forEach(s => seen.add(s.id));
                rows.push({ type: 'group', widgets: siblings, rowCols: pm.rowCols });
            } else {
                seen.add(widget.id);
                rows.push({ type: 'single', widget });
            }
        } else {
            seen.add(widget.id);
            rows.push({ type: 'single', widget });
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-space font-bold">
                        Good {timeOfDay}, <span className="text-gradient-green">{user?.full_name?.split(' ')[0] || 'Athlete'}</span> 👋
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{format(new Date(), 'EEEE')} · Let's crush your goals today</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 glass px-3 py-2 rounded-xl">
                        <Flame className="w-4 h-4 text-orange-400" />
                        <span className="text-sm font-bold">{profile.login_streak || 0} day streak</span>
                    </div>
                    <div className="flex items-center gap-2 glass px-3 py-2 rounded-xl">
                        <Award className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-bold">{(profile.total_xp || 0).toLocaleString()} XP</span>
                    </div>
                    <DashboardCustomizer
                        layout={layout}
                        onSave={(l) => saveLayout.mutate(l)}
                        isSaving={saveLayout.isPending}
                    />
                </div>
            </div>

            {/* Dynamic layout driven entirely by saved order */}
            {rows.map((row, i) => {
                if (row.type === 'group') {
                    return (
                        <div key={i} className="flex flex-wrap gap-6">
                            {row.widgets.map(w => {
                                const renderer = WIDGET_RENDERERS[w.id];
                                if (!renderer) return null;
                                const content = renderer();
                                if (!content) return null;
                                return (
                                    <div key={w.id} className="flex-1 min-w-[280px]">
                                        {content}
                                    </div>
                                );
                            })}
                        </div>
                    );
                }
                const renderer = WIDGET_RENDERERS[row.widget.id];
                if (!renderer) return null;
                const content = renderer();
                if (!content) return null;
                return <div key={i}>{content}</div>;
            })}
        </div>
    );
}