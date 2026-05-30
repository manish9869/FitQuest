import React, { useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Trophy, Flame, Dumbbell, Scale, Star, Award, TrendingDown, Zap, CheckCircle, Camera } from 'lucide-react';

const EVENT_TYPES = {
    weight: { icon: Scale, color: '#22c55e', glow: 'rgba(34,197,94,0.3)', label: 'Weight Log' },
    workout: { icon: Dumbbell, color: '#a855f7', glow: 'rgba(168,85,247,0.3)', label: 'Workout' },
    streak: { icon: Flame, color: '#ef4444', glow: 'rgba(239,68,68,0.3)', label: 'Streak' },
    achievement: { icon: Trophy, color: '#f59e0b', glow: 'rgba(245,158,11,0.3)', label: 'Achievement' },
};

function TimelineItem({ event, index, isLeft }) {
    const cfg = EVENT_TYPES[event.type] || EVENT_TYPES.workout;
    const Icon = cfg.icon;

    return (
        <motion.div className={`flex items-center gap-4 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
            initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}>
            <div className="flex-1">
                <div className={`glass rounded-2xl p-4 border border-white/5 hover:border-white/15 transition-all ${isLeft ? 'text-left' : 'text-right'}`}
                    style={{ boxShadow: `0 0 20px ${cfg.glow}` }}>
                    <div className="text-xs text-muted-foreground mb-1">{event.date}</div>
                    <div className="font-semibold text-sm">{event.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{event.desc}</div>
                    {event.value && (
                        <div className="mt-2 text-lg font-bold font-space" style={{ color: cfg.color }}>{event.value}</div>
                    )}
                </div>
            </div>

            {/* Center Icon */}
            <div className="relative flex-shrink-0 z-10">
                <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: cfg.color, background: `${cfg.color}15`, boxShadow: `0 0 20px ${cfg.glow}` }}>
                    <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                </div>
            </div>

            <div className="flex-1" />
        </motion.div>
    );
}

export default function TransformationJourney() {
    const { user } = useAuth();
    const { data: weightLogs = [] } = useQuery({ queryKey: ['weight-all', user?.email], queryFn: () => entities.WeightLog.filter({ user_email: user?.email }), enabled: !!user?.email });
    const { data: workouts = [] } = useQuery({ queryKey: ['workouts-all', user?.email], queryFn: () => entities.WorkoutLog.filter({ user_email: user?.email }), enabled: !!user?.email });
    const { data: profiles = [] } = useQuery({ queryKey: ['userProfile', user?.email], queryFn: () => entities.UserProfile.filter({ user_email: user?.email }), enabled: !!user?.email });
    const profile = profiles[0];

    const events = useMemo(() => {
        const evts = [];

        if (profile) {
            evts.push({ type: 'streak', date: 'Today', title: 'Active Streak', desc: 'Keep going!', value: `${profile.login_streak || 0} days 🔥`, sort: new Date() });
        }

        weightLogs.slice(-10).forEach(w => {
            evts.push({ type: 'weight', date: format(parseISO(w.date), 'MMM d'), title: 'Weight Check-in', desc: 'Progress tracking', value: `${w.weight_kg} kg`, sort: new Date(w.date) });
        });

        workouts.slice(-10).forEach(w => {
            evts.push({ type: 'workout', date: format(parseISO(w.date), 'MMM d'), title: w.name || w.workout_type, desc: `${w.duration_min || 0} min • ${w.calories_burned || 0} kcal burned`, value: null, sort: new Date(w.date) });
        });

        if ((profile?.total_xp || 0) >= 1000) {
            evts.push({ type: 'achievement', date: 'Milestone', title: 'XP Milestone Reached', desc: 'Elite dedication!', value: `${(profile?.total_xp || 0).toLocaleString()} XP`, sort: new Date() });
        }

        return evts.sort((a, b) => b.sort - a.sort).slice(0, 20);
    }, [weightLogs, workouts, profile]);

    const stats = [
        { label: 'Total Workouts', value: workouts.length, icon: Dumbbell, color: '#a855f7' },
        { label: 'Weight Logs', value: weightLogs.length, icon: Scale, color: '#22c55e' },
        { label: 'Current Streak', value: `${profile?.login_streak || 0}d`, icon: Flame, color: '#ef4444' },
        { label: 'Total XP', value: `${(profile?.total_xp || 0).toLocaleString()}`, icon: Star, color: '#f59e0b' },
    ];

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h1 className="text-2xl font-space font-bold flex items-center gap-2">
                    <Trophy className="w-7 h-7 text-yellow-400" /> Transformation Journey
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Your fitness story, milestone by milestone</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                        className="glass rounded-2xl p-4 border border-white/5 text-center">
                        <s.icon className="w-5 h-5 mx-auto mb-2" style={{ color: s.color }} />
                        <div className="text-xl font-bold font-space" style={{ color: s.color }}>{s.value}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Timeline */}
            {events.length === 0 ? (
                <div className="glass rounded-2xl p-12 border border-white/5 text-center">
                    <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                    <p className="text-muted-foreground">Start logging to build your transformation timeline!</p>
                </div>
            ) : (
                <div className="relative">
                    {/* Center line */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-gradient-to-b from-emerald-500/30 via-white/10 to-transparent" />
                    <div className="space-y-6 py-2">
                        {events.map((evt, i) => (
                            <TimelineItem key={i} event={evt} index={i} isLeft={i % 2 === 0} />
                        ))}
                    </div>
                </div>
            )}

            {events.length > 0 && (
                <div className="glass rounded-2xl p-4 border border-emerald-500/20 flex items-center gap-3 text-sm">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span className="text-muted-foreground">Every log builds your story. Keep going — your future self will thank you.</span>
                </div>
            )}
        </div>
    );
}


