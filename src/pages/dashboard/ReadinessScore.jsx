import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { today } from '@/lib/fitnessUtils';
import { Activity, Droplets, Moon, Zap, Heart, TrendingUp, ChevronRight } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

function GlowRing({ score, size = 220 }) {
    const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
    const glow = score >= 75 ? '0 0 40px rgba(34,197,94,0.4), 0 0 80px rgba(34,197,94,0.15)' : score >= 50 ? '0 0 40px rgba(245,158,11,0.4)' : '0 0 40px rgba(239,68,68,0.4)';
    const label = score >= 75 ? 'PEAK' : score >= 50 ? 'GOOD' : 'REST';
    const circumference = 2 * Math.PI * 85;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="absolute">
                <circle cx={size / 2} cy={size / 2} r={85} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={14} />
                <motion.circle cx={size / 2} cy={size / 2} r={85} fill="none" stroke={color} strokeWidth={14}
                    strokeLinecap="round" strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 2, ease: 'easeOut' }}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{ filter: `drop-shadow(${glow})` }} />
            </svg>
            <motion.div className="relative z-10 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                <motion.div className="font-space font-bold" style={{ fontSize: 52, color, textShadow: glow }}
                    initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }}>
                    {score}
                </motion.div>
                <div className="text-xs tracking-[0.3em] font-bold mt-1" style={{ color }}>{label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Readiness</div>
            </motion.div>
            {/* Pulse */}
            {score >= 75 && (
                <motion.div className="absolute rounded-full border border-emerald-500/30"
                    style={{ width: size + 20, height: size + 20 }}
                    animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.1, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }} />
            )}
        </div>
    );
}

function MetricPill({ icon: Icon, label, value, color, delay }) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
            className="glass rounded-2xl p-4 border border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
                <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div className="flex-1">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="font-bold text-sm mt-0.5">{value}</div>
            </div>
        </motion.div>
    );
}

export default function ReadinessScore() {
    const { user } = useAuth();
    const todayStr = today();

    const { data: sleepLogs = [] } = useQuery({ queryKey: ['sleep', todayStr, user?.email], queryFn: () => entities.SleepLog.filter({ user_email: user?.email, date: todayStr }), enabled: !!user?.email });
    const { data: waterLogs = [] } = useQuery({ queryKey: ['water', todayStr, user?.email], queryFn: () => entities.WaterLog.filter({ user_email: user?.email, date: todayStr }), enabled: !!user?.email });
    const { data: workouts = [] } = useQuery({ queryKey: ['workouts', todayStr, user?.email], queryFn: () => entities.WorkoutLog.filter({ user_email: user?.email, date: todayStr }), enabled: !!user?.email });
    const { data: profiles = [] } = useQuery({ queryKey: ['userProfile', user?.email], queryFn: () => entities.UserProfile.filter({ user_email: user?.email }), enabled: !!user?.email });
    const profile = profiles[0];

    const sleep = sleepLogs.reduce((s, l) => s + (l.hours || 0), 0);
    const water = waterLogs.reduce((s, l) => s + (l.amount_ml || 0), 0);
    const waterGoal = profile?.water_goal_ml || 2500;

    const sleepScore = Math.min(sleep / 8, 1) * 100;
    const waterScore = Math.min(water / waterGoal, 1) * 100;
    const workoutScore = workouts.length > 0 ? 80 : 60;
    const streakScore = Math.min((profile?.login_streak || 0) * 5, 100);
    const readiness = Math.round((sleepScore * 0.35 + waterScore * 0.25 + workoutScore * 0.2 + streakScore * 0.2));

    const statusText = readiness >= 75
        ? "You're primed for peak performance. Hit that strength session! 💪"
        : readiness >= 50
            ? "Moderate readiness. A light workout or cardio is ideal today."
            : "Your body needs recovery. Prioritize sleep and hydration today.";

    const statusColor = readiness >= 75 ? '#22c55e' : readiness >= 50 ? '#f59e0b' : '#ef4444';

    const metrics = [
        { icon: Moon, label: 'Sleep Quality', value: sleep > 0 ? `${sleep}h logged` : 'Not logged', color: '#a855f7', delay: 0.1 },
        { icon: Droplets, label: 'Hydration', value: water > 0 ? `${Math.round(waterScore)}%` : 'Not logged', color: '#3b82f6', delay: 0.15 },
        { icon: Zap, label: 'Streak Energy', value: `${profile?.login_streak || 0} days`, color: '#f97316', delay: 0.2 },
        { icon: Activity, label: 'Activity', value: workouts.length > 0 ? 'Worked out ✓' : 'Rest day', color: '#22c55e', delay: 0.25 },
    ];

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h1 className="text-2xl font-space font-bold flex items-center gap-2">
                    <Heart className="w-7 h-7 text-emerald-400" /> Daily Readiness
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Your body's recovery & performance capacity</p>
            </div>

            {/* Main Ring */}
            <div className="glass rounded-3xl p-8 border border-white/5 flex flex-col items-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full opacity-10"
                    style={{ background: `radial-gradient(circle, ${statusColor}, transparent)` }} />
                <GlowRing score={readiness} />
                <motion.p className="text-center mt-6 text-sm max-w-xs leading-relaxed relative z-10"
                    style={{ color: statusColor }}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
                    {statusText}
                </motion.p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3">
                {metrics.map(m => <MetricPill key={m.label} {...m} />)}
            </div>

            {/* Breakdown */}
            <div className="glass rounded-2xl p-5 border border-white/5 space-y-4">
                <h3 className="font-semibold text-sm">Score Breakdown</h3>
                {[
                    { label: 'Sleep Impact', val: sleepScore, color: '#a855f7' },
                    { label: 'Hydration', val: waterScore, color: '#3b82f6' },
                    { label: 'Activity', val: workoutScore, color: '#22c55e' },
                    { label: 'Streak Momentum', val: streakScore, color: '#f97316' },
                ].map((item, i) => (
                    <div key={item.label}>
                        <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="font-semibold" style={{ color: item.color }}>{Math.round(item.val)}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                            <motion.div className="h-full rounded-full" style={{ backgroundColor: item.color }}
                                initial={{ width: 0 }} animate={{ width: `${item.val}%` }} transition={{ duration: 1, delay: i * 0.1 }} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <Link to="/dashboard/sleep">
                    <button className="w-full glass rounded-2xl p-4 border border-purple-500/20 text-left hover:border-purple-500/40 transition-all">
                        <Moon className="w-5 h-5 text-purple-400 mb-2" />
                        <div className="text-sm font-semibold">Log Sleep</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Improve your score</div>
                    </button>
                </Link>
                <Link to="/dashboard/water">
                    <button className="w-full glass rounded-2xl p-4 border border-blue-500/20 text-left hover:border-blue-500/40 transition-all">
                        <Droplets className="w-5 h-5 text-blue-400 mb-2" />
                        <div className="text-sm font-semibold">Log Water</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Boost hydration score</div>
                    </button>
                </Link>
            </div>
        </div>
    );
}


