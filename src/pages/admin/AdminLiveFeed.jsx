import React, { useState, useMemo } from 'react';
import { entities } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday } from 'date-fns';
import { Activity, Dumbbell, Utensils, Droplets, Footprints, Moon, AlertTriangle, Flame, Trophy } from 'lucide-react';

const TYPE_CONFIG = {
    workout: { icon: Dumbbell, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    meal: { icon: Utensils, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    water: { icon: Droplets, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    steps: { icon: Footprints, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    sleep: { icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    streak: { icon: Flame, color: 'text-red-400', bg: 'bg-red-500/10' },
    alert: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
};

function getName(email, profiles) {
    const p = profiles.find(p => p.user_email === email);
    return p?.full_name || email?.split('@')[0] || 'User';
}

function timeSince(dateStr) {
    const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return format(new Date(dateStr), 'MMM d');
}

export default function AdminLiveFeed() {
    const [filter, setFilter] = useState('all');

    const refetchOpts = { refetchInterval: 15000 };

    const { data: profiles = [] } = useQuery({
        queryKey: ['admin-profiles'],
        queryFn: () => entities.UserProfile.list(),
        ...refetchOpts,
    });

    const { data: workouts = [] } = useQuery({
        queryKey: ['feed-workouts'],
        queryFn: () => entities.WorkoutLog.list('created_at', false),
        ...refetchOpts,
    });

    const { data: meals = [] } = useQuery({
        queryKey: ['feed-meals'],
        queryFn: () => entities.MealLog.list('created_at', false),
        ...refetchOpts,
    });

    const { data: water = [] } = useQuery({
        queryKey: ['feed-water'],
        queryFn: () => entities.WaterLog.list('created_at', false),
        ...refetchOpts,
    });

    const { data: steps = [] } = useQuery({
        queryKey: ['feed-steps'],
        queryFn: () => entities.StepLog.list('created_at', false),
        ...refetchOpts,
    });

    const { data: sleep = [] } = useQuery({
        queryKey: ['feed-sleep'],
        queryFn: () => entities.SleepLog.list('created_at', false),
        ...refetchOpts,
    });

    // Build unified event list from all tables
    const events = useMemo(() => {
        const all = [
            ...workouts.slice(0, 50).map(w => ({
                id: `workout-${w.id}`,
                type: 'workout',
                user_email: w.user_email,
                text: `logged a ${w.duration_min}min ${w.workout_type} workout${w.calories_burned ? ` — ${w.calories_burned} cal burned` : ''} 💪`,
                time: w.created_at,
            })),
            ...meals.slice(0, 50).map(m => ({
                id: `meal-${m.id}`,
                type: 'meal',
                user_email: m.user_email,
                text: `logged ${m.meal_type} — ${m.food_name}${m.calories ? ` (${m.calories} kcal)` : ''}`,
                time: m.created_at,
            })),
            ...water.slice(0, 50).map(w => ({
                id: `water-${w.id}`,
                type: 'water',
                user_email: w.user_email,
                text: `logged ${w.amount_ml}ml water intake 💧`,
                time: w.created_at,
            })),
            ...steps.slice(0, 50).map(s => ({
                id: `steps-${s.id}`,
                type: 'steps',
                user_email: s.user_email,
                text: `logged ${s.steps?.toLocaleString()} steps today 🏃`,
                time: s.created_at,
            })),
            ...sleep.slice(0, 50).map(s => ({
                id: `sleep-${s.id}`,
                type: 'sleep',
                user_email: s.user_email,
                text: `logged ${s.hours}h sleep — ${s.quality || 'good'} quality 😴`,
                time: s.created_at,
            })),
            // Alert events — users with no streak
            ...profiles.filter(p => (p.login_streak || 0) === 0).slice(0, 10).map(p => ({
                id: `alert-${p.id}`,
                type: 'alert',
                user_email: p.user_email,
                text: `hasn't logged in recently — may need check-in`,
                time: p.created_at,
            })),
            // Streak events — users with active streaks
            ...profiles.filter(p => (p.login_streak || 0) >= 7).slice(0, 10).map(p => ({
                id: `streak-${p.id}`,
                type: 'streak',
                user_email: p.user_email,
                text: `on a ${p.login_streak}-day streak! 🔥`,
                time: p.last_login_date || p.created_at,
            })),
        ];

        return all
            .sort((a, b) => new Date(b.time) - new Date(a.time))
            .slice(0, 100);
    }, [workouts, meals, water, steps, sleep, profiles]);

    // Stats from real data
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const stats = useMemo(() => ({
        workouts: workouts.filter(w => w.date === todayStr).length,
        meals: meals.filter(m => m.date === todayStr).length,
        steps: steps.filter(s => s.date === todayStr && s.steps >= 10000).length,
        streaks: profiles.filter(p => (p.login_streak || 0) > 0).length,
    }), [workouts, meals, steps, profiles, todayStr]);

    const filtered = filter === 'all' ? events : events.filter(e => e.type === filter);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-space font-bold flex items-center gap-2">
                        <Activity className="w-7 h-7 text-emerald-400" /> Live Activity Feed
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Real-time platform event stream · refreshes every 15s</p>
                </div>
                <div className="flex items-center gap-2 glass px-3 py-2 rounded-xl border border-emerald-500/20">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-xs text-emerald-400 font-medium">Live</span>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Workouts Today', value: stats.workouts, icon: Dumbbell, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                    { label: 'Meals Logged', value: stats.meals, icon: Utensils, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: '10K Steps Hit', value: stats.steps, icon: Footprints, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                    { label: 'Active Streaks', value: stats.streaks, icon: Flame, color: 'text-red-400', bg: 'bg-red-500/10' },
                ].map(s => (
                    <div key={s.label} className="glass rounded-xl p-3 border border-white/5 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}>
                            <s.icon className={`w-4 h-4 ${s.color}`} />
                        </div>
                        <div>
                            <div className={`text-xl font-bold font-space ${s.color}`}>{s.value}</div>
                            <div className="text-[10px] text-muted-foreground">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2 flex-wrap">
                {['all', 'workout', 'meal', 'water', 'steps', 'sleep', 'streak', 'alert'].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`text-xs px-3 py-1.5 rounded-full border capitalize transition-all ${filter === f ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'border-white/10 text-muted-foreground hover:border-white/20'}`}>
                        {f}
                    </button>
                ))}
            </div>

            {/* Feed */}
            <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto">
                    {filtered.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground text-sm">
                            No activity yet. Data will appear as users log their workouts, meals, and more.
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {filtered.map(evt => {
                                const cfg = TYPE_CONFIG[evt.type] || TYPE_CONFIG.workout;
                                const Icon = cfg.icon;
                                const name = getName(evt.user_email, profiles);
                                return (
                                    <motion.div key={evt.id}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="flex items-center gap-4 px-5 py-3.5 border-b border-white/3 hover:bg-white/3 transition-all">
                                        <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                                            <Icon className={`w-4 h-4 ${cfg.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium text-sm">{name}</span>
                                                <span className="text-sm text-muted-foreground">{evt.text}</span>
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground flex-shrink-0">{timeSince(evt.time)}</div>
                                        {evt.type === 'alert' && <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 animate-pulse" />}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
}