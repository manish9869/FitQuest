import React, { useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { today } from '@/lib/fitnessUtils';
import { Zap, Droplets, Footprints, Dumbbell, Moon, Utensils, CheckCircle, Star, Trophy, Flame, Target } from 'lucide-react';

const ICON_MAP = { Droplets, Utensils, Footprints, Dumbbell, Moon, Flame, Trophy, Target, Star, Zap };

function MissionCard({ mission, completed, delay }) {
    const IconComp = ICON_MAP[mission.icon] || Target;
    const color = mission.color_hex || '#22c55e';
    const glow = color + '4D';
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
            className={`glass rounded-2xl p-4 border transition-all duration-500 ${completed ? 'border-white/20' : 'border-white/5 hover:border-white/10'}`}
            style={completed ? { boxShadow: `0 0 20px ${glow}` } : {}}>
            <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
                        <IconComp className="w-6 h-6" style={{ color }} />
                    </div>
                    <AnimatePresence>
                        {completed && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-3.5 h-3.5 text-white" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{mission.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{mission.description}</div>
                </div>
                <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1" style={{ color: completed ? '#f59e0b' : 'rgba(255,255,255,0.4)' }}>
                        <Star className="w-3.5 h-3.5" />
                        <span className="text-sm font-bold">{mission.xp_reward}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">XP</div>
                </div>
            </div>
            {completed && (
                <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.2 }}
                    className="mt-3 h-0.5 rounded-full" style={{ background: `linear-gradient(to right, ${color}, transparent)` }} />
            )}
        </motion.div>
    );
}

function checkMission(mission, data) {
    switch (mission.metric) {
        case 'water_ml':
            return data.water >= (mission.target_value || 2000);
        case 'protein_g': {
            const target = mission.target_pct_of_goal
                ? data.proteinTarget * mission.target_pct_of_goal
                : mission.target_value || 0;
            return data.protein >= target;
        }
        case 'steps':
            return data.steps >= (mission.target_value || 10000);
        case 'workout_done':
            return data.worked_out;
        case 'sleep_hours':
            return data.sleep >= (mission.target_value || 7);
        case 'calories_logged':
            return data.calories > 0;
        default:
            return false;
    }
}

export default function DailyMissions() {
    const { user } = useAuth();
    const todayStr = today();

    const { data: meals = [] } = useQuery({ queryKey: ['meals', todayStr, user?.email], queryFn: () => entities.MealLog.filter({ user_email: user?.email, date: todayStr }), enabled: !!user?.email });
    const { data: waterLogs = [] } = useQuery({ queryKey: ['water', todayStr, user?.email], queryFn: () => entities.WaterLog.filter({ user_email: user?.email, date: todayStr }), enabled: !!user?.email });
    const { data: stepLogs = [] } = useQuery({ queryKey: ['steps', todayStr, user?.email], queryFn: () => entities.StepLog.filter({ user_email: user?.email, date: todayStr }), enabled: !!user?.email });
    const { data: workouts = [] } = useQuery({ queryKey: ['workouts', todayStr, user?.email], queryFn: () => entities.WorkoutLog.filter({ user_email: user?.email, date: todayStr }), enabled: !!user?.email });
    const { data: sleepLogs = [] } = useQuery({ queryKey: ['sleep', todayStr, user?.email], queryFn: () => entities.SleepLog.filter({ user_email: user?.email, date: todayStr }), enabled: !!user?.email });
    const { data: profiles = [] } = useQuery({ queryKey: ['userProfile', user?.email], queryFn: () => entities.UserProfile.filter({ user_email: user?.email }), enabled: !!user?.email });
    const { data: allMissions = [] } = useQuery({ queryKey: ['missions'], queryFn: () => entities.Mission.filter({ is_active: true }, 'sort_order') });

    const profile = profiles[0];

    const data = {
        calories: meals.reduce((s, m) => s + (m.calories || 0), 0),
        protein: meals.reduce((s, m) => s + (m.protein || 0), 0),
        proteinTarget: profile?.protein_target || 150,
        water: waterLogs.reduce((s, w) => s + (w.amount_ml || 0), 0),
        steps: stepLogs.reduce((s, s2) => s + (s2.steps || 0), 0),
        worked_out: workouts.length > 0,
        sleep: sleepLogs.reduce((s, sl) => s + (sl.hours || 0), 0),
    };

    const regularMissions = allMissions.filter(m => !m.is_bonus);
    const bonusMissions = allMissions.filter(m => m.is_bonus);

    const completedMissions = regularMissions.filter(m => checkMission(m, data));
    const totalXP = completedMissions.reduce((s, m) => s + (m.xp_reward || 0), 0);
    const pct = regularMissions.length > 0 ? Math.round((completedMissions.length / regularMissions.length) * 100) : 0;
    const allDone = completedMissions.length === regularMissions.length && regularMissions.length > 0;

    const statusMsg = allDone ? '🏆 PERFECT DAY! All missions complete!'
        : completedMissions.length === 0 ? "No missions done yet. Let's get moving!"
            : `${completedMissions.length} of ${regularMissions.length} missions done. Keep going!`;

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h1 className="text-2xl font-space font-bold flex items-center gap-2">
                    <Target className="w-7 h-7 text-yellow-400" /> Daily Missions
                </h1>
                <p className="text-sm text-muted-foreground mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>

            <div className="glass rounded-2xl p-5 border border-white/5 relative overflow-hidden">
                {allDone && <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5" />}
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <div className="text-2xl font-bold font-space">{completedMissions.length}/{regularMissions.length} <span className="text-sm text-muted-foreground font-normal">Missions</span></div>
                        <div className="text-xs text-muted-foreground mt-0.5">{statusMsg}</div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-1.5 text-yellow-400">
                            <Star className="w-5 h-5" />
                            <span className="text-2xl font-bold font-space">{totalXP}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">XP earned today</div>
                    </div>
                </div>
                <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-orange-400"
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.5, ease: 'easeOut' }} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Progress</span><span className="text-yellow-400 font-semibold">{pct}%</span>
                </div>
            </div>

            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Today's Missions</h3>
                {regularMissions.map((m, i) => (
                    <MissionCard key={m.id} mission={m} completed={checkMission(m, data)} delay={i * 0.07} />
                ))}
            </div>

            {bonusMissions.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Bonus Challenges</h3>
                    {bonusMissions.map((b, i) => {
                        const completed = b.mission_id === 'streak_bonus' ? (profile?.login_streak || 0) >= 7
                            : b.mission_id === 'perfect_day' ? allDone : false;
                        const IconComp = ICON_MAP[b.icon] || Trophy;
                        const color = b.color_hex || '#f59e0b';
                        return (
                            <motion.div key={b.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}
                                className={`glass rounded-2xl p-4 border ${completed ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-white/5'}`}>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${color}20` }}>
                                        <IconComp className="w-6 h-6" style={{ color }} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-sm">{b.label}</div>
                                        <div className="text-xs text-muted-foreground">{b.description}</div>
                                    </div>
                                    <div className="text-right">
                                        {completed ? (
                                            <div className="text-emerald-400 text-xs font-bold">UNLOCKED!</div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-yellow-400">
                                                <Star className="w-3.5 h-3.5" /><span className="font-bold text-sm">{b.xp_reward}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}


