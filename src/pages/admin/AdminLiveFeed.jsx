import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { entities } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Dumbbell, Utensils, Droplets, Footprints, Moon,
    Flame, Trophy, MessageSquare, Scale, Pill, Camera,
    RefreshCw, Pause, Play, Wifi, WifiOff, ChevronDown
} from 'lucide-react';

// ─── Event type config ────────────────────────────────────────────────────────
const TYPE_META = {
    workout: { label: 'Workout', icon: Dumbbell, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
    meal: { label: 'Meal', icon: Utensils, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    water: { label: 'Water', icon: Droplets, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
    steps: { label: 'Steps', icon: Footprints, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    sleep: { label: 'Sleep', icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    weight: { label: 'Weight', icon: Scale, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
    supplement: { label: 'Supplement', icon: Pill, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
    progress: { label: 'Progress', icon: Camera, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    message: { label: 'Message', icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    streak: { label: 'Streak', icon: Flame, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    achievement: { label: 'Achievement', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
};

const FILTERS = ['all', ...Object.keys(TYPE_META)];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function shortEmail(email = '') {
    const [local] = email.split('@');
    return local.length > 14 ? local.slice(0, 13) + '…' : local;
}

function timeSince(isoStr, now) {
    const diff = Math.floor((now - new Date(isoStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

// Build unified event objects from each raw row
function fromWorkout(r) {
    return {
        id: `workout-${r.id}`,
        type: 'workout',
        user: r.user_email,
        text: `logged a ${r.duration_min ? r.duration_min + '-min ' : ''}${r.workout_type} workout${r.calories_burned ? ` — ${r.calories_burned} kcal burned` : ''}`,
        meta: r.intensity ? `Intensity: ${r.intensity}` : null,
        ts: r.created_at,
    };
}
function fromMeal(r) {
    return {
        id: `meal-${r.id}`,
        type: 'meal',
        user: r.user_email,
        text: `logged ${r.meal_type}: ${r.food_name}${r.calories ? ` (${r.calories} kcal)` : ''}`,
        meta: r.protein ? `${r.protein}g protein` : null,
        ts: r.created_at,
    };
}
function fromWater(r) {
    return {
        id: `water-${r.id}`,
        type: 'water',
        user: r.user_email,
        text: `logged ${r.amount_ml}ml water${r.time ? ` at ${r.time}` : ''}`,
        meta: null,
        ts: r.created_at,
    };
}
function fromSteps(r) {
    return {
        id: `steps-${r.id}`,
        type: 'steps',
        user: r.user_email,
        text: `logged ${Number(r.steps).toLocaleString()} steps${r.calories_burned ? ` — ${r.calories_burned} kcal` : ''}`,
        meta: null,
        ts: r.created_at,
    };
}
function fromSleep(r) {
    return {
        id: `sleep-${r.id}`,
        type: 'sleep',
        user: r.user_email,
        text: `logged ${r.hours}h sleep${r.quality ? ` — ${r.quality} quality` : ''}`,
        meta: r.bed_time && r.wake_time ? `${r.bed_time} → ${r.wake_time}` : null,
        ts: r.created_at,
    };
}
function fromWeight(r) {
    return {
        id: `weight-${r.id}`,
        type: 'weight',
        user: r.user_email,
        text: `logged weight: ${r.weight_kg} kg`,
        meta: r.notes || null,
        ts: r.created_at,
    };
}
function fromSupplement(r) {
    return {
        id: `supplement-${r.id}`,
        type: 'supplement',
        user: r.user_email,
        text: `logged ${r.supplement_name}${r.dose ? ` — ${r.dose}` : ''}${r.timing ? ` (${r.timing.replace(/_/g, ' ')})` : ''}`,
        meta: r.brand || null,
        ts: r.created_at,
    };
}
function fromProgress(r) {
    return {
        id: `progress-${r.id}`,
        type: 'progress',
        user: r.user_email,
        text: `submitted ${r.period} body progress check-in${r.weight_kg ? ` — ${r.weight_kg} kg` : ''}`,
        meta: r.mood ? `Mood: ${r.mood}` : null,
        ts: r.created_at,
    };
}
function fromMessage(r) {
    return {
        id: `message-${r.id}`,
        type: 'message',
        user: r.user_email,
        text: `sent a message${r.text ? `: "${r.text.slice(0, 60)}${r.text.length > 60 ? '…' : ''}"` : ''}`,
        meta: r.read ? null : '● Unread',
        urgent: !r.read,
        ts: r.created_at,
    };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminLiveFeed() {
    const [now, setNow] = useState(Date.now());
    const [filter, setFilter] = useState('all');
    const [paused, setPaused] = useState(false);
    const [showCount, setShowCount] = useState(50);

    // Tick clock every 15s
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 15000);
        return () => clearInterval(t);
    }, []);

    const queryOpts = {
        refetchInterval: paused ? false : 30000,
        staleTime: 20000,
    };

    const { data: workouts = [], isFetching: wf } = useQuery({ queryKey: ['feed-workouts'], queryFn: () => entities.WorkoutLog.list(), ...queryOpts });
    const { data: meals = [], isFetching: mf } = useQuery({ queryKey: ['feed-meals'], queryFn: () => entities.MealLog.list(), ...queryOpts });
    const { data: waters = [], isFetching: waf } = useQuery({ queryKey: ['feed-waters'], queryFn: () => entities.WaterLog.list(), ...queryOpts });
    const { data: steps = [], isFetching: sf } = useQuery({ queryKey: ['feed-steps'], queryFn: () => entities.StepLog.list(), ...queryOpts });
    const { data: sleeps = [], isFetching: slf } = useQuery({ queryKey: ['feed-sleeps'], queryFn: () => entities.SleepLog.list(), ...queryOpts });
    const { data: weights = [], isFetching: wlf } = useQuery({ queryKey: ['feed-weights'], queryFn: () => entities.WeightLog.list(), ...queryOpts });
    const { data: supplements = [], isFetching: spf } = useQuery({ queryKey: ['feed-supps'], queryFn: () => entities.SupplementLog.list(), ...queryOpts });
    const { data: progresses = [], isFetching: pf } = useQuery({ queryKey: ['feed-progress'], queryFn: () => entities.BodyProgress.list(), ...queryOpts });
    const { data: messages = [], isFetching: msf } = useQuery({ queryKey: ['feed-messages'], queryFn: () => entities.ChatMessage.list(), ...queryOpts });
    const { data: profiles = [] } = useQuery({ queryKey: ['feed-profiles'], queryFn: () => entities.UserProfile.list(), staleTime: 60000 });

    const isFetching = wf || mf || waf || sf || slf || wlf || spf || pf || msf;

    // Merge & sort all events
    const allEvents = useMemo(() => {
        const raw = [
            ...workouts.map(fromWorkout),
            ...meals.map(fromMeal),
            ...waters.map(fromWater),
            ...steps.map(fromSteps),
            ...sleeps.map(fromSleep),
            ...weights.map(fromWeight),
            ...supplements.map(fromSupplement),
            ...progresses.map(fromProgress),
            ...messages.filter(m => m.sender === 'user').map(fromMessage),
        ];
        raw.sort((a, b) => new Date(b.ts) - new Date(a.ts));
        return raw;
    }, [workouts, meals, waters, steps, sleeps, weights, supplements, progresses, messages]);

    // Stats from real data
    const stats = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10);
        return {
            workouts: workouts.filter(r => r.date === today).length,
            meals: meals.filter(r => r.date === today).length,
            steps: steps.filter(r => r.date === today && r.steps >= 10000).length,
            streaks: profiles.filter(p => (p.login_streak || 0) >= 3).length,
            unread: messages.filter(m => m.sender === 'user' && !m.read).length,
            activeUsers: new Set(allEvents.filter(e => {
                const diff = (Date.now() - new Date(e.ts)) / 3600000;
                return diff <= 24;
            }).map(e => e.user)).size,
        };
    }, [workouts, meals, steps, profiles, messages, allEvents]);

    const filtered = useMemo(() =>
        (filter === 'all' ? allEvents : allEvents.filter(e => e.type === filter)).slice(0, showCount),
        [allEvents, filter, showCount]
    );

    const totalFiltered = filter === 'all' ? allEvents.length : allEvents.filter(e => e.type === filter).length;

    return (
        <div className="space-y-5 font-sans">

            {/* ── Header ── */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 tracking-tight">
                        <Activity className="w-6 h-6 text-emerald-400" />
                        Live Activity Feed
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {allEvents.length.toLocaleString()} total events · {stats.activeUsers} users active in last 24h
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Live indicator */}
                    <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${isFetching
                        ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10'
                        : paused
                            ? 'border-white/10 text-muted-foreground'
                            : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                        }`}>
                        {isFetching
                            ? <RefreshCw className="w-3 h-3 animate-spin" />
                            : paused
                                ? <WifiOff className="w-3 h-3" />
                                : <Wifi className="w-3 h-3" />
                        }
                        {isFetching ? 'Syncing…' : paused ? 'Paused' : 'Live · 30s'}
                    </div>
                    <button
                        onClick={() => setPaused(p => !p)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-white/10 text-muted-foreground hover:border-white/20 hover:text-white transition-all"
                    >
                        {paused ? <><Play className="w-3 h-3" /> Resume</> : <><Pause className="w-3 h-3" /> Pause</>}
                    </button>
                </div>
            </div>

            {/* ── Stats row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                    { label: "Today's Workouts", value: stats.workouts, icon: Dumbbell, color: 'text-violet-400', bg: 'bg-violet-500/10' },
                    { label: "Meals Logged", value: stats.meals, icon: Utensils, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: "10K Step Goals", value: stats.steps, icon: Footprints, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                    { label: "Active Streaks 3+", value: stats.streaks, icon: Flame, color: 'text-red-400', bg: 'bg-red-500/10' },
                    { label: "Unread Messages", value: stats.unread, icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: "Active (24h)", value: stats.activeUsers, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                ].map(s => (
                    <div key={s.label} className="glass rounded-xl p-3 border border-white/5 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>
                            <s.icon className={`w-4 h-4 ${s.color}`} />
                        </div>
                        <div className="min-w-0">
                            <div className={`text-xl font-bold ${s.color} leading-none`}>{s.value}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Filter pills ── */}
            <div className="flex gap-2 flex-wrap">
                {FILTERS.map(f => {
                    const meta = TYPE_META[f];
                    const count = f === 'all' ? allEvents.length : allEvents.filter(e => e.type === f).length;
                    return (
                        <button
                            key={f}
                            onClick={() => { setFilter(f); setShowCount(50); }}
                            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border capitalize transition-all ${filter === f
                                ? `${meta?.bg || 'bg-white/10'} ${meta?.border || 'border-white/20'} ${meta?.color || 'text-white'}`
                                : 'border-white/10 text-muted-foreground hover:border-white/20 hover:text-white'
                                }`}
                        >
                            {meta && <meta.icon className="w-3 h-3" />}
                            {f === 'all' ? 'All' : meta?.label}
                            <span className="opacity-60 text-[10px]">{count}</span>
                        </button>
                    );
                })}
            </div>

            {/* ── Feed ── */}
            <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                        <Activity className="w-8 h-8 opacity-30" />
                        <p className="text-sm">No events yet</p>
                    </div>
                ) : (
                    <div className="max-h-[640px] overflow-y-auto divide-y divide-white/[0.03]">
                        <AnimatePresence initial={false}>
                            {filtered.map((evt) => {
                                const meta = TYPE_META[evt.type] || TYPE_META.workout;
                                const Icon = meta.icon;
                                return (
                                    <motion.div
                                        key={evt.id}
                                        initial={{ opacity: 0, y: -12, backgroundColor: 'rgba(255,255,255,0.04)' }}
                                        animate={{ opacity: 1, y: 0, backgroundColor: 'rgba(255,255,255,0)' }}
                                        transition={{ duration: 0.35, ease: 'easeOut' }}
                                        className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors group"
                                    >
                                        {/* Icon */}
                                        <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0 mt-0.5 border ${meta.border}`}>
                                            <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline gap-1.5 flex-wrap">
                                                <span className="font-semibold text-sm text-white/90 font-mono">
                                                    {shortEmail(evt.user)}
                                                </span>
                                                <span className="text-sm text-muted-foreground leading-snug">
                                                    {evt.text}
                                                </span>
                                            </div>
                                            {evt.meta && (
                                                <div className={`text-[11px] mt-0.5 ${evt.urgent ? 'text-blue-400 font-medium' : 'text-muted-foreground/70'}`}>
                                                    {evt.meta}
                                                </div>
                                            )}
                                        </div>

                                        {/* Time + type badge */}
                                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                            <span className="text-[11px] text-muted-foreground/60">
                                                {timeSince(evt.ts, now)}
                                            </span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${meta.bg} ${meta.color} border ${meta.border} opacity-0 group-hover:opacity-100 transition-opacity capitalize`}>
                                                {meta.label}
                                            </span>
                                        </div>

                                        {/* Unread dot for messages */}
                                        {evt.urgent && (
                                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0 mt-2 animate-pulse" />
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}

                {/* Load more */}
                {totalFiltered > showCount && (
                    <button
                        onClick={() => setShowCount(n => n + 50)}
                        className="w-full flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground hover:text-white hover:bg-white/3 border-t border-white/5 transition-all"
                    >
                        <ChevronDown className="w-3.5 h-3.5" />
                        Load more ({totalFiltered - showCount} remaining)
                    </button>
                )}
            </div>

            <p className="text-[11px] text-muted-foreground/50 text-center">
                Showing {filtered.length} of {totalFiltered} events · Auto-refreshes every 30s
            </p>
        </div>
    );
}