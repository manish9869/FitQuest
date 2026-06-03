import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, startOfWeek } from 'date-fns';
import { Flame, Droplets, Footprints, Dumbbell, TrendingUp, Star, Trophy, ChevronRight, ChevronLeft, Zap, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import PDFReportGenerator from '@/components/reports/PDFReportGenerator';

const SLIDES = ['hero', 'workouts', 'nutrition', 'steps', 'summary'];

const bg_gradients = [
    'from-emerald-900/80 to-background',
    'from-purple-900/80 to-background',
    'from-orange-900/80 to-background',
    'from-blue-900/80 to-background',
    'from-yellow-900/80 to-background',
];

export default function WeeklyReport() {
    const [slide, setSlide] = useState(0);
    const { user } = useAuth();

    const last7 = useMemo(() => Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')), []);

    const { data: allMeals = [] } = useQuery({ queryKey: ['meals-week', user?.email], queryFn: () => entities.MealLog.filter({ user_email: user?.email }), enabled: !!user?.email });
    const { data: allSteps = [] } = useQuery({ queryKey: ['steps-week', user?.email], queryFn: () => entities.StepLog.filter({ user_email: user?.email }), enabled: !!user?.email });
    const { data: allWorkouts = [] } = useQuery({ queryKey: ['workouts-all', user?.email], queryFn: () => entities.WorkoutLog.filter({ user_email: user?.email }), enabled: !!user?.email });
    const { data: allWater = [] } = useQuery({ queryKey: ['water-all', user?.email], queryFn: () => entities.WaterLog.filter({ user_email: user?.email }), enabled: !!user?.email });
    const { data: profiles = [] } = useQuery({ queryKey: ['userProfile', user?.email], queryFn: () => entities.UserProfile.filter({ user_email: user?.email }), enabled: !!user?.email });
    const profile = profiles[0];

    const weekData = useMemo(() => last7.map(date => ({
        day: format(new Date(date + 'T00:00:00'), 'EEE'),
        calories: allMeals.filter(m => m.date === date).reduce((s, m) => s + (m.calories || 0), 0),
        steps: allSteps.filter(s => s.date === date).reduce((s, st) => s + (st.steps || 0), 0),
        water: allWater.filter(w => w.date === date).reduce((s, w) => s + (w.amount_ml || 0), 0),
        worked_out: allWorkouts.some(w => w.date === date),
    })), [last7, allMeals, allSteps, allWorkouts, allWater]);

    const weekWorkouts = allWorkouts.filter(w => last7.includes(w.date)).length;
    const weekCalories = weekData.reduce((s, d) => s + d.calories, 0);
    const weekSteps = weekData.reduce((s, d) => s + d.steps, 0);
    const weekWater = weekData.reduce((s, d) => s + d.water, 0);
    const avgCal = Math.round(weekCalories / 7);
    const activeDays = weekData.filter(d => d.worked_out || d.steps > 5000).length;

    const next = () => setSlide(s => Math.min(s + 1, SLIDES.length - 1));
    const prev = () => setSlide(s => Math.max(s - 1, 0));

    const slides = [
        // Hero
        <div key="hero" className="flex flex-col items-center justify-center text-center py-12 space-y-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/40 mb-4">
                    <Star className="w-12 h-12 text-white" />
                </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <div className="text-xs tracking-widest text-emerald-400 uppercase mb-2">Weekly Recap</div>
                <h2 className="text-3xl font-space font-bold mb-3">
                    {user?.full_name?.split(' ')[0] || 'Athlete'}'s Week
                </h2>
                <p className="text-muted-foreground text-sm max-w-xs">
                    {format(subDays(new Date(), 6), 'MMM d')} — {format(new Date(), 'MMM d, yyyy')}
                </p>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="grid grid-cols-2 gap-4 mt-4 w-full max-w-xs">
                {[
                    { label: 'Active Days', value: activeDays, color: '#22c55e', icon: Flame },
                    { label: 'Workouts', value: weekWorkouts, color: '#a855f7', icon: Dumbbell },
                ].map(s => (
                    <div key={s.label} className="glass rounded-2xl p-4 border border-white/10">
                        <s.icon className="w-5 h-5 mb-2" style={{ color: s.color }} />
                        <div className="text-2xl font-bold font-space" style={{ color: s.color }}>{s.value}</div>
                        <div className="text-xs text-muted-foreground">{s.label}</div>
                    </div>
                ))}
            </motion.div>
        </div>,

        // Workouts
        <div key="workouts" className="py-6 space-y-5">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="text-xs tracking-widest text-purple-400 uppercase mb-1">This Week</div>
                <h2 className="text-2xl font-space font-bold">Workout Activity</h2>
            </motion.div>
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Sessions', value: weekWorkouts, color: '#a855f7' },
                    { label: 'Active Days', value: activeDays, color: '#22c55e' },
                    { label: 'Streak', value: `${profile?.login_streak || 0}d`, color: '#ef4444' },
                ].map(s => (
                    <div key={s.label} className="glass rounded-xl p-3 border border-white/5 text-center">
                        <div className="text-xl font-bold font-space" style={{ color: s.color }}>{s.value}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
                    </div>
                ))}
            </div>
            <div className="glass rounded-2xl p-4 border border-white/5">
                <div className="text-xs text-muted-foreground mb-3">Daily Activity</div>
                <div className="flex gap-2">
                    {weekData.map((d, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                            <div className={`w-full rounded-lg ${d.worked_out ? 'bg-purple-500' : d.steps > 5000 ? 'bg-emerald-500/40' : 'bg-white/5'}`}
                                style={{ height: 60 * (d.worked_out ? 1 : d.steps > 5000 ? 0.6 : 0.2) + 12 }} />
                            <span className="text-[10px] text-muted-foreground">{d.day}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>,

        // Nutrition
        <div key="nutrition" className="py-6 space-y-5">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="text-xs tracking-widest text-orange-400 uppercase mb-1">This Week</div>
                <h2 className="text-2xl font-space font-bold">Nutrition Breakdown</h2>
            </motion.div>
            <div className="glass rounded-2xl p-5 border border-orange-500/20 text-center">
                <div className="text-5xl font-bold font-space text-orange-400">{weekCalories.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground mt-1">Total calories logged this week</div>
                <div className="mt-3 text-xs text-muted-foreground">Daily average: <span className="text-white font-bold">{avgCal.toLocaleString()} kcal</span></div>
            </div>
            <ResponsiveContainer width="100%" height={150}>
                <BarChart data={weekData} barSize={28}>
                    <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'hsl(220 18% 7%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="calories" fill="hsl(25 95% 60%)" radius={[6, 6, 0, 0]} opacity={0.85} />
                </BarChart>
            </ResponsiveContainer>
        </div>,

        // Steps
        <div key="steps" className="py-6 space-y-5">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="text-xs tracking-widest text-blue-400 uppercase mb-1">This Week</div>
                <h2 className="text-2xl font-space font-bold">Step Count</h2>
            </motion.div>
            <div className="glass rounded-2xl p-5 border border-blue-500/20 text-center">
                <div className="text-5xl font-bold font-space text-blue-400">{weekSteps.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground mt-1">Total steps this week</div>
                <div className="text-xs text-muted-foreground mt-2">That's approx. <span className="text-white font-bold">{Math.round(weekSteps * 0.0008)} km</span> walked!</div>
            </div>
            <div className="glass rounded-2xl p-4 border border-white/5">
                <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={weekData} barSize={28}>
                        <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Bar dataKey="steps" fill="#3b82f6" radius={[6, 6, 0, 0]} opacity={0.85} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>,

        // Summary
        <div key="summary" className="py-6 space-y-5">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="text-xs tracking-widest text-yellow-400 uppercase mb-1">Weekly Summary</div>
                <h2 className="text-2xl font-space font-bold">Your Score</h2>
            </motion.div>
            <div className="glass rounded-2xl p-6 border border-yellow-500/20 text-center">
                <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                <div className="text-4xl font-bold font-space text-yellow-400">{Math.round((activeDays / 7) * 100)}%</div>
                <div className="text-sm text-muted-foreground mt-1">Weekly consistency score</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                {[
                    { label: 'Workouts Done', value: weekWorkouts, color: '#a855f7', icon: Dumbbell },
                    { label: 'Total Steps', value: weekSteps.toLocaleString(), color: '#3b82f6', icon: Footprints },
                    { label: 'Cal Tracked', value: `${Math.round(weekCalories / 1000)}k`, color: '#f97316', icon: Flame },
                    { label: 'XP Earned', value: `+${(profile?.total_xp || 0)}`, color: '#f59e0b', icon: Star },
                ].map(s => (
                    <div key={s.label} className="glass rounded-xl p-3 border border-white/5">
                        <s.icon className="w-4 h-4 mb-1.5" style={{ color: s.color }} />
                        <div className="font-bold" style={{ color: s.color }}>{s.value}</div>
                        <div className="text-[10px] text-muted-foreground">{s.label}</div>
                    </div>
                ))}
            </div>
            <div className="glass rounded-2xl p-4 border border-emerald-500/20 text-center">
                <div className="text-emerald-400 font-semibold text-sm">Keep building momentum! 🚀</div>
                <div className="text-xs text-muted-foreground mt-1">Consistency is the key to transformation.</div>
            </div>
        </div>,
    ];

    return (
        <div className="max-w-lg mx-auto">
            <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
                <h1 className="text-2xl font-space font-bold flex items-center gap-2">
                    <TrendingUp className="w-7 h-7 text-emerald-400" /> Weekly Report
                </h1>
                {user?.email && <PDFReportGenerator userEmail={user.email} buttonLabel="Download PDF Report" />}
            </div>

            {/* Story-style Card */}
            <div className={`glass rounded-3xl overflow-hidden border border-white/5 relative bg-gradient-to-b ${bg_gradients[slide]}`}>
                {/* Progress bar */}
                <div className="flex gap-1 p-3">
                    {SLIDES.map((_, i) => (
                        <div key={i} className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
                            <motion.div className="h-full bg-white rounded-full"
                                animate={{ width: i < slide ? '100%' : i === slide ? '60%' : '0%' }} />
                        </div>
                    ))}
                </div>

                <div className="px-6 pb-6 min-h-96">
                    <AnimatePresence mode="wait">
                        <motion.div key={slide} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
                            {slides[slide]}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Nav */}
                <div className="flex items-center justify-between p-4 border-t border-white/5">
                    <button onClick={prev} disabled={slide === 0}
                        className="flex items-center gap-1 text-sm text-muted-foreground disabled:opacity-30 hover:text-white transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Prev
                    </button>
                    <div className="flex gap-1.5">
                        {SLIDES.map((_, i) => (
                            <button key={i} onClick={() => setSlide(i)}
                                className={`w-2 h-2 rounded-full transition-all ${i === slide ? 'bg-white w-4' : 'bg-white/30'}`} />
                        ))}
                    </div>
                    {slide < SLIDES.length - 1 ? (
                        <button onClick={next} className="flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                            Next <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button onClick={() => setSlide(0)} className="text-sm text-yellow-400 font-semibold">Restart</button>
                    )}
                </div>
            </div>
        </div>
    );
}