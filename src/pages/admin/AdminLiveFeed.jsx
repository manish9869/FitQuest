import React, { useState, useEffect, useMemo } from 'react';
import { entities } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { Activity, Dumbbell, Utensils, Droplets, Footprints, Moon, Star, AlertTriangle, Flame, Trophy, Target } from 'lucide-react';

const EVENT_TYPES = [
    { type: 'workout', icon: Dumbbell, color: 'text-purple-400', bg: 'bg-purple-500/10', templates: ['completed a {dur}-minute {wtype} workout', 'logged {wtype} session — {cal} calories burned', 'finished morning {wtype} session 💪'] },
    { type: 'meal', icon: Utensils, color: 'text-emerald-400', bg: 'bg-emerald-500/10', templates: ['logged {meal} ({cal} kcal)', 'hit daily protein goal 🎯', 'logged breakfast — on track for today'] },
    { type: 'water', icon: Droplets, color: 'text-blue-400', bg: 'bg-blue-500/10', templates: ['reached daily water goal 💧', 'logged {ml}ml water intake', 'hit 2L hydration target!'] },
    { type: 'steps', icon: Footprints, color: 'text-orange-400', bg: 'bg-orange-500/10', templates: ['reached {steps} steps today! 🏃', 'hit the 10K steps milestone!', 'logged {steps} steps — great pace'] },
    { type: 'streak', icon: Flame, color: 'text-red-400', bg: 'bg-red-500/10', templates: ['hit a {n}-day login streak! 🔥', 'extended streak to {n} days', 'just unlocked Streak Warrior badge 🏅'] },
    { type: 'milestone', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10', templates: ['reached {xp} total XP!', 'unlocked new achievement badge', 'leveled up — new rank unlocked! 🎉'] },
    { type: 'alert', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', templates: ['missed meal logging today', 'hasn\'t logged in for {n} days', 'below daily step target'] },
];

const FALLBACK_NAMES = ['Sarah K.', 'Mike R.', 'Priya S.', 'James T.', 'Ana L.', 'John D.', 'Tom W.', 'Lisa M.'];

function generateEvent(names) {
    const eType = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
    const tmpl = eType.templates[Math.floor(Math.random() * eType.templates.length)];
    const NAMES = names.length > 0 ? names : FALLBACK_NAMES;
    const name = NAMES[Math.floor(Math.random() * NAMES.length)];
    const text = tmpl
        .replace('{dur}', [20, 30, 45, 60][Math.floor(Math.random() * 4)])
        .replace('{wtype}', ['strength', 'cardio', 'HIIT', 'yoga'][Math.floor(Math.random() * 4)])
        .replace('{cal}', Math.floor(Math.random() * 300 + 150))
        .replace('{meal}', ['breakfast', 'lunch', 'dinner', 'snack'][Math.floor(Math.random() * 4)])
        .replace('{ml}', [250, 500, 750][Math.floor(Math.random() * 3)])
        .replace('{steps}', (Math.floor(Math.random() * 8000 + 3000)).toLocaleString())
        .replace('{n}', Math.floor(Math.random() * 25 + 5))
        .replace('{xp}', (Math.floor(Math.random() * 5000 + 500)).toLocaleString());
    return { id: Date.now() + Math.random(), name, text, type: eType.type, icon: eType.icon, color: eType.color, bg: eType.bg, timeMs: Date.now() };
}

export default function AdminLiveFeed() {
    const { data: allUsers = [] } = useQuery({ queryKey: ['admin-users'], queryFn: () => entities.User.list() });
    const { data: allProfiles = [] } = useQuery({ queryKey: ['admin-profiles'], queryFn: () => entities.UserProfile.list() });

    const names = useMemo(() => allUsers.map(u => u.full_name?.split(' ')[0] || u.email?.split('@')[0] || 'User').filter(Boolean), [allUsers]);
    const activeStreaks = allProfiles.filter(p => (p.login_streak || 0) > 0).length;

    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const tick = setInterval(() => setNow(Date.now()), 10000);
        return () => clearInterval(tick);
    }, []);

    const [events, setEvents] = useState(() => Array.from({ length: 10 }, () => generateEvent([])));
    const [filter, setFilter] = useState('all');
    const [paused, setPaused] = useState(false);
    const [stats, setStats] = useState({ workouts: 0, meals: 0, steps: 0, streaks: 0 });

    useEffect(() => {
        if (activeStreaks > 0) setStats(s => ({ ...s, streaks: activeStreaks }));
    }, [activeStreaks]);

    useEffect(() => {
        if (paused) return;
        const interval = setInterval(() => {
            const evt = generateEvent(names);
            setEvents(prev => [evt, ...prev].slice(0, 50));
            setStats(s => ({
                ...s,
                workouts: evt.type === 'workout' ? s.workouts + 1 : s.workouts,
                meals: evt.type === 'meal' ? s.meals + 1 : s.meals,
            }));
        }, 3500);
        return () => clearInterval(interval);
    }, [paused]);

    const filtered = filter === 'all' ? events : events.filter(e => e.type === filter);
    const timeSince = (timeMs) => {
        const s = Math.floor((now - timeMs) / 1000);
        if (s < 60) return `${s}s ago`;
        if (s < 3600) return `${Math.floor(s / 60)}m ago`;
        return `${Math.floor(s / 3600)}h ago`;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-space font-bold flex items-center gap-2">
                        <Activity className="w-7 h-7 text-emerald-400" /> Live Activity Feed
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Real-time platform event stream</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 glass px-3 py-2 rounded-xl border border-emerald-500/20">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-xs text-emerald-400 font-medium">Live</span>
                    </div>
                    <button onClick={() => setPaused(p => !p)}
                        className={`text-xs px-3 py-2 rounded-xl border transition-all ${paused ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' : 'border-white/10 text-muted-foreground hover:border-white/20'}`}>
                        {paused ? '▶ Resume' : '⏸ Pause'}
                    </button>
                </div>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Workouts Today', value: stats.workouts, icon: Dumbbell, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                    { label: 'Meals Logged', value: stats.meals, icon: Utensils, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: 'Step Goals Hit', value: stats.steps, icon: Footprints, color: 'text-orange-400', bg: 'bg-orange-500/10' },
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
                {['all', 'workout', 'meal', 'water', 'steps', 'streak', 'milestone', 'alert'].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`text-xs px-3 py-1.5 rounded-full border capitalize transition-all ${filter === f ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'border-white/10 text-muted-foreground hover:border-white/20'}`}>
                        {f}
                    </button>
                ))}
            </div>

            {/* Feed */}
            <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto">
                    <AnimatePresence initial={false}>
                        {filtered.map((evt, i) => {
                            const Icon = evt.icon;
                            return (
                                <motion.div key={evt.id}
                                    initial={{ opacity: 0, y: -20, backgroundColor: 'rgba(255,255,255,0.05)' }}
                                    animate={{ opacity: 1, y: 0, backgroundColor: 'rgba(255,255,255,0)' }}
                                    transition={{ duration: 0.4 }}
                                    className="flex items-center gap-4 px-5 py-3.5 border-b border-white/3 hover:bg-white/3 transition-all">
                                    <div className={`w-8 h-8 rounded-lg ${evt.bg} flex items-center justify-center flex-shrink-0`}>
                                        <Icon className={`w-4 h-4 ${evt.color}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-sm">{evt.name}</span>
                                            <span className="text-sm text-muted-foreground">{evt.text}</span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground flex-shrink-0">{timeSince(evt.timeMs)}</div>
                                    {evt.type === 'alert' && <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 animate-pulse" />}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}