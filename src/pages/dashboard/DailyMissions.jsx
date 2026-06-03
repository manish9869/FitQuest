import React, { useMemo, useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { today } from '@/lib/fitnessUtils';
import { Zap, Droplets, Footprints, Dumbbell, Moon, Utensils, CheckCircle2, Star, Trophy, Flame, Target, Crown, Clock, Sparkles } from 'lucide-react';
import { differenceInDays } from 'date-fns';

const ICON_MAP = { Droplets, Utensils, Footprints, Dumbbell, Moon, Flame, Trophy, Target, Star, Zap };

const XP_PERFECT_DAY = 50;

// ── Circular SVG ring ──────────────────────────────────────────────────────────
function RingProgress({ pct, color, size = 56, stroke = 5, children }) {
    const r = (size - stroke * 2) / 2;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    return (
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
                <motion.circle
                    cx={size / 2} cy={size / 2} r={r} fill="none"
                    stroke={color} strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    initial={{ strokeDashoffset: circ }}
                    animate={{ strokeDashoffset: circ - dash }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                {children}
            </div>
        </div>
    );
}

// ── Progress helpers ───────────────────────────────────────────────────────────
function getMissionProgress(mission, data) {
    switch (mission.metric) {
        case 'water_ml': {
            const target = mission.target_value || 2000;
            return { current: data.water, target, unit: 'ml', pct: Math.min(100, Math.round((data.water / target) * 100)) };
        }
        case 'protein_g': {
            const target = mission.target_pct_of_goal
                ? Math.round(data.proteinTarget * mission.target_pct_of_goal)
                : (mission.target_value || 0);
            return { current: Math.round(data.protein), target, unit: 'g', pct: Math.min(100, target > 0 ? Math.round((data.protein / target) * 100) : 0) };
        }
        case 'steps': {
            const target = mission.target_value || 10000;
            return { current: data.steps, target, unit: 'steps', pct: Math.min(100, Math.round((data.steps / target) * 100)) };
        }
        case 'workout_done':
            return { current: data.worked_out ? 1 : 0, target: 1, unit: '', pct: data.worked_out ? 100 : 0 };
        case 'sleep_hours': {
            const target = mission.target_value || 7;
            return { current: data.sleep, target, unit: 'h', pct: Math.min(100, Math.round((data.sleep / target) * 100)) };
        }
        case 'calories_logged':
            return { current: data.calories, target: data.calories || 1, unit: 'kcal', pct: data.calories > 0 ? 100 : 0 };
        default:
            return { current: 0, target: 1, unit: '', pct: 0 };
    }
}

function checkMission(mission, data) {
    switch (mission.metric) {
        case 'water_ml': return data.water >= (mission.target_value || 2000);
        case 'protein_g': {
            const target = mission.target_pct_of_goal
                ? data.proteinTarget * mission.target_pct_of_goal
                : (mission.target_value || 0);
            if (!target) return false;
            return data.protein > 0 && data.protein >= target;
        }
        case 'steps': return data.steps >= (mission.target_value || 10000);
        case 'workout_done': return data.worked_out;
        case 'sleep_hours': return data.sleep >= (mission.target_value || 7);
        case 'calories_logged': return data.calories > 0;
        default: return false;
    }
}

function checkChallenge(challenge, historyData, profile) {
    const { type, duration_days } = challenge;
    const required = Number(duration_days) || 7;
    switch (type) {
        case 'steps': return historyData.stepsByDate.filter(d => d.steps >= 10000).length >= required;
        case 'water': return historyData.waterByDate.filter(d => d.total >= 2000).length >= required;
        case 'streak': return (profile?.login_streak || 0) >= required;
        case 'workout': return historyData.workoutDays >= required;
        case 'weightloss': {
            const logs = historyData.weightLogs;
            if (logs.length < 2) return false;
            return (logs[0].weight_kg - logs[logs.length - 1].weight_kg) >= 1;
        }
        default: return false;
    }
}

function checkBonus(bonus, data, allDone, profile) {
    if (bonus.metric && bonus.metric !== 'workout_done') return checkMission(bonus, data);
    switch (bonus.mission_id) {
        case 'streak_bonus': return (profile?.login_streak || 0) >= (bonus.target_value || 7);
        case 'perfect_day': return allDone;
        case 'hydration_hero': return data.water >= (bonus.target_value || 3000);
        case 'step_legend': return data.steps >= (bonus.target_value || 15000);
        default:
            if (bonus.metric) return checkMission(bonus, data);
            if (bonus.category === 'streak') return (profile?.login_streak || 0) >= (bonus.target_value || 7);
            return false;
    }
}

// ── Mission Card (new UI) ──────────────────────────────────────────────────────
function MissionCard({ mission, completed, delay, data }) {
    const IconComp = ICON_MAP[mission.icon] || Target;
    const color = mission.color_hex || '#22c55e';
    const prog = getMissionProgress(mission, data);

    const progressLabel = mission.metric === 'workout_done'
        ? (completed ? 'Done!' : 'Not logged')
        : `${prog.current?.toLocaleString()} / ${prog.target?.toLocaleString()} ${prog.unit}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className="relative overflow-hidden rounded-2xl border transition-all duration-300"
            style={{
                background: `linear-gradient(135deg, ${color}${completed ? '18' : '0e'} 0%, rgba(255,255,255,0.02) 100%)`,
                borderColor: completed ? `${color}55` : `${color}30`,
            }}
        >
            {completed && (
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}88, transparent)` }} />
            )}
            <div className="flex items-center gap-4 p-4">
                <RingProgress pct={prog.pct} color={color} size={58} stroke={4}>
                    <IconComp className="w-5 h-5" style={{ color: completed ? color : `${color}cc` }} />
                </RingProgress>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{mission.label}</span>
                        {completed && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            </motion.div>
                        )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">{mission.description}</div>
                    <div className="mt-2.5">
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                            <motion.div
                                className="h-full rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${prog.pct}%` }}
                                transition={{ duration: 1.2, ease: 'easeOut', delay: delay + 0.15 }}
                                style={{ background: `linear-gradient(90deg, ${color}, ${color}bb)` }}
                            />
                        </div>
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-[10px] text-muted-foreground">{progressLabel}</span>
                            <span className="text-[10px] font-bold" style={{ color: `${color}cc` }}>{prog.pct}%</span>
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-xl"
                    style={{ background: `${color}18`, border: `1px solid ${color}${completed ? '55' : '33'}` }}>
                    <Star className="w-3 h-3 mb-0.5" style={{ color: completed ? '#f59e0b' : `${color}cc` }} />
                    <span className="text-xs font-bold leading-none" style={{ color: completed ? '#f59e0b' : `${color}cc` }}>{mission.xp_reward}</span>
                    <span className="text-[8px]" style={{ color: `${color}88` }}>XP</span>
                </div>
            </div>
        </motion.div>
    );
}

// ── Challenge Card (new UI) ────────────────────────────────────────────────────
const CHALLENGE_XP = { steps: 200, water: 150, streak: 300, workout: 250, weightloss: 400 };
const CHALLENGE_COLOR_MAP = { steps: '#f97316', water: '#3b82f6', streak: '#ef4444', workout: '#a855f7', weightloss: '#f59e0b' };
const CHALLENGE_ICON_MAP = { steps: Footprints, water: Droplets, streak: Flame, workout: Dumbbell, weightloss: Trophy };

function ChallengeCard({ ch, index, isCompleted, alreadyClaimed }) {
    const CIcon = CHALLENGE_ICON_MAP[ch.type] || Trophy;
    const color = CHALLENGE_COLOR_MAP[ch.type] || '#f59e0b';
    const xpReward = CHALLENGE_XP[ch.type] || 100;
    const daysLeft = ch.end_date ? Math.max(0, differenceInDays(new Date(ch.end_date), new Date())) : null;
    const totalDays = ch.duration_days || 1;
    const elapsed = daysLeft !== null ? Math.max(0, totalDays - daysLeft) : 0;
    const timePct = Math.min(100, Math.round((elapsed / totalDays) * 100));

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="relative overflow-hidden rounded-2xl border p-4 transition-all duration-500"
            style={{
                background: `linear-gradient(135deg, ${color}${isCompleted ? '18' : '12'} 0%, rgba(255,255,255,0.02) 100%)`,
                borderColor: isCompleted ? `${color}55` : `${color}40`,
            }}
        >
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}66, transparent)` }} />

            <div className="flex items-start gap-4">
                <RingProgress pct={timePct} color={color} size={56} stroke={4}>
                    <CIcon className="w-5 h-5" style={{ color }} />
                </RingProgress>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm">{ch.name}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {isCompleted && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: `${color}20`, color }}>COMPLETED</span>}
                            {ch.reward_badge && <span className="text-xl leading-none">{ch.reward_badge.split(' ')[0]}</span>}
                        </div>
                    </div>
                    {ch.description && <div className="text-xs text-muted-foreground mt-0.5">{ch.description}</div>}

                    <div className="mt-2.5">
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                            <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${timePct}%` }}
                                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 + index * 0.08 }}
                                style={{ background: `linear-gradient(90deg, ${color}, ${color}99)` }} />
                        </div>
                        <div className="flex justify-between items-center mt-1">
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Clock className="w-2.5 h-2.5" />
                                {daysLeft !== null ? `${daysLeft}d left of ${totalDays}d` : `${totalDays}-day challenge`}
                                {ch.prize && <span className="ml-2" style={{ color }}>{ch.prize}</span>}
                            </span>
                            <div className={`flex items-center gap-1 ${isCompleted ? (alreadyClaimed ? 'text-emerald-400' : 'text-yellow-400') : ''}`} style={!isCompleted ? { color: `${color}cc` } : {}}>
                                <Star className="w-3 h-3" />
                                <span className="text-[10px] font-bold">+{xpReward} XP{isCompleted && alreadyClaimed ? ' ✓' : ''}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {isCompleted && (
                <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.2 }}
                    className="mt-3 h-0.5 rounded-full" style={{ background: `linear-gradient(to right, ${color}, transparent)` }} />
            )}
        </motion.div>
    );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function DailyMissions() {
    const { user } = useAuth();
    const qc = useQueryClient();
    const todayStr = today();

    const { data: meals = [] } = useQuery({ queryKey: ['meals', todayStr, user?.email], queryFn: () => entities.MealLog.filter({ user_email: user?.email, date: todayStr }), enabled: !!user?.email });
    const { data: waterLogs = [] } = useQuery({ queryKey: ['water', todayStr, user?.email], queryFn: () => entities.WaterLog.filter({ user_email: user?.email, date: todayStr }), enabled: !!user?.email });
    const { data: stepLogs = [] } = useQuery({ queryKey: ['steps', todayStr, user?.email], queryFn: () => entities.StepLog.filter({ user_email: user?.email, date: todayStr }), enabled: !!user?.email });
    const { data: workouts = [] } = useQuery({ queryKey: ['workouts', todayStr, user?.email], queryFn: () => entities.WorkoutLog.filter({ user_email: user?.email, date: todayStr }), enabled: !!user?.email });
    const { data: sleepLogs = [] } = useQuery({ queryKey: ['sleep', todayStr, user?.email], queryFn: () => entities.SleepLog.filter({ user_email: user?.email, date: todayStr }), enabled: !!user?.email });
    const { data: profiles = [] } = useQuery({ queryKey: ['userProfile', user?.email], queryFn: () => entities.UserProfile.filter({ user_email: user?.email }), enabled: !!user?.email });
    const { data: allMissions = [] } = useQuery({ queryKey: ['missions'], queryFn: () => entities.Mission.filter({ is_active: true }, 'sort_order') });
    const { data: challenges = [] } = useQuery({ queryKey: ['challenges-active'], queryFn: () => entities.Challenge.filter({ is_active: true }, 'created_at') });
    const { data: allProfiles = [] } = useQuery({ queryKey: ['all-profiles-lb'], queryFn: () => entities.UserProfile.list() });
    const { data: allStepLogs = [] } = useQuery({ queryKey: ['all-steps', user?.email], queryFn: () => entities.StepLog.filter({ user_email: user?.email }), enabled: !!user?.email });
    const { data: allWaterLogs = [] } = useQuery({ queryKey: ['all-water', user?.email], queryFn: () => entities.WaterLog.filter({ user_email: user?.email }), enabled: !!user?.email });
    const { data: allWorkouts = [] } = useQuery({ queryKey: ['all-workouts', user?.email], queryFn: () => entities.WorkoutLog.filter({ user_email: user?.email }), enabled: !!user?.email });
    const { data: allWeightLogs = [] } = useQuery({ queryKey: ['all-weight', user?.email], queryFn: () => entities.WeightLog.filter({ user_email: user?.email }), enabled: !!user?.email });

    const profile = profiles[0];

    const data = useMemo(() => ({
        calories: meals.reduce((s, m) => s + (m.calories || 0), 0),
        protein: meals.reduce((s, m) => s + (m.protein || 0), 0),
        proteinTarget: profile?.protein_target || 150,
        water: waterLogs.reduce((s, w) => s + (w.amount_ml || 0), 0),
        steps: stepLogs.reduce((s, s2) => s + (s2.steps || 0), 0),
        worked_out: workouts.length > 0,
        sleep: sleepLogs.reduce((s, sl) => s + (sl.hours || 0), 0),
    }), [meals, waterLogs, stepLogs, workouts, sleepLogs, profile]);

    const historyData = useMemo(() => {
        const stepMap = {};
        allStepLogs.forEach(s => { stepMap[s.date] = (stepMap[s.date] || 0) + s.steps; });
        const stepsByDate = Object.entries(stepMap).map(([date, steps]) => ({ date, steps }));

        const waterMap = {};
        allWaterLogs.forEach(w => { waterMap[w.date] = (waterMap[w.date] || 0) + w.amount_ml; });
        const waterByDate = Object.entries(waterMap).map(([date, total]) => ({ date, total }));

        const workoutDaySet = new Set(allWorkouts.map(w => w.date));
        const weightLogs = [...allWeightLogs].sort((a, b) => new Date(a.date) - new Date(b.date));

        return { stepsByDate, waterByDate, workoutDays: workoutDaySet.size, weightLogs };
    }, [allStepLogs, allWaterLogs, allWorkouts, allWeightLogs]);

    const completedChallengeIds = useMemo(() =>
        challenges.filter(ch => checkChallenge(ch, historyData, profile)).map(ch => ch.id),
        [challenges, historyData, profile]);

    // Award challenge XP once, using profile.achievements as permanent guard
    useEffect(() => {
        if (!profile?.id || completedChallengeIds.length === 0) return;
        if (challenges.length === 0) return;

        const currentAwarded = profile.achievements || [];
        const newlyCompleted = completedChallengeIds.filter(id => !currentAwarded.includes(`challenge_${id}`));
        if (newlyCompleted.length === 0) return;

        const xpToAdd = newlyCompleted.reduce((sum, id) => {
            const ch = challenges.find(c => c.id === id);
            return sum + (CHALLENGE_XP[ch?.type] || 0);
        }, 0);

        const updatedAchievements = [...currentAwarded, ...newlyCompleted.map(id => `challenge_${id}`)];

        entities.UserProfile.update(profile.id, {
            total_xp: (profile.total_xp || 0) + xpToAdd,
            achievements: updatedAchievements,
        }).then(() => {
            qc.invalidateQueries({ queryKey: ['userProfile'] });
            qc.invalidateQueries({ queryKey: ['all-profiles-lb'] });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [completedChallengeIds.join(','), profile?.id, challenges.length]);

    const regularMissions = useMemo(() => allMissions.filter(m => !m.is_bonus), [allMissions]);
    const bonusMissions = useMemo(() => allMissions.filter(m => m.is_bonus), [allMissions]);

    const completedMissions = useMemo(() => regularMissions.filter(m => checkMission(m, data)), [regularMissions, data]);
    const allDone = completedMissions.length === regularMissions.length && regularMissions.length > 0;

    const totalMissionXP = useMemo(() =>
        completedMissions.reduce((s, m) => s + (m.xp_reward || 0), 0),
        [completedMissions]);

    const completedBonuses = useMemo(() =>
        bonusMissions.filter(b => checkBonus(b, data, allDone, profile)),
        [bonusMissions, data, allDone, profile]);

    const bonusXP = useMemo(() =>
        completedBonuses.reduce((s, b) => s + (b.xp_reward || 0), 0) + (allDone ? XP_PERFECT_DAY : 0),
        [completedBonuses, allDone]);

    const syncXP = totalMissionXP + bonusXP;

    const loginStreakXPToday = useMemo(() => {
        if (!profile) return 0;
        const lastLogin = profile.last_login_date ? String(profile.last_login_date).slice(0, 10) : null;
        return lastLogin === todayStr ? 15 : 0;
    }, [profile, todayStr]);

    const displayXP = syncXP + loginStreakXPToday;

    const pct = regularMissions.length > 0
        ? Math.round((completedMissions.length / regularMissions.length) * 100)
        : 0;

    // Sync mission XP watermark
    useEffect(() => {
        if (!profile?.id || syncXP === 0) return;

        const savedDate = profile.mission_xp_date ? String(profile.mission_xp_date).slice(0, 10) : null;
        const alreadyAwarded = savedDate === todayStr ? (profile.mission_xp_today || 0) : 0;

        if (syncXP <= alreadyAwarded) return;

        const diff = syncXP - alreadyAwarded;

        entities.UserProfile.update(profile.id, {
            total_xp: (profile.total_xp || 0) + diff,
            mission_xp_today: syncXP,
            mission_xp_date: todayStr,
        }).then(() => {
            qc.invalidateQueries({ queryKey: ['userProfile'] });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [syncXP, profile?.id, profile?.mission_xp_date, profile?.mission_xp_today]);

    const leaderboard = useMemo(() =>
        [...allProfiles]
            .sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0))
            .slice(0, 5)
            .map((p, i) => ({ rank: i + 1, name: p.user_email?.split('@')[0] || 'User', xp: p.total_xp || 0, streak: p.login_streak || 0 })),
        [allProfiles]);

    const myRank = useMemo(() => {
        const sorted = [...allProfiles].sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0));
        const idx = sorted.findIndex(p => p.user_email === user?.email);
        return idx >= 0 ? idx + 1 : null;
    }, [allProfiles, user?.email]);

    const rankColors = ['#f59e0b', '#94a3b8', '#f97316'];

    return (
        <div className="space-y-6 max-w-2xl mx-auto pb-8">

            {/* ── Header ── */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-space font-bold flex items-center gap-2">
                        <Target className="w-6 h-6 text-yellow-400" /> Daily Missions
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>
                {profile && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                        <Zap className="w-3.5 h-3.5" />
                        <span className="text-sm font-bold">{(profile.total_xp || 0).toLocaleString()}</span>
                        <span className="text-xs text-yellow-500/70">total XP</span>
                    </div>
                )}
            </div>

            {/* ── Hero Progress Card ── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl border"
                style={{
                    background: allDone
                        ? 'linear-gradient(135deg, rgba(245,158,11,0.14) 0%, rgba(15,15,20,1) 70%)'
                        : 'linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(10,12,18,1) 70%)',
                    borderColor: allDone ? 'rgba(245,158,11,0.25)' : 'rgba(34,197,94,0.18)',
                }}
            >
                <div className="absolute -top-10 -left-10 w-56 h-56 rounded-full blur-3xl pointer-events-none"
                    style={{ background: allDone ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.12)' }} />

                <div className="relative p-5">
                    <div className="flex items-center gap-5 flex-wrap">
                        <RingProgress pct={pct} color={allDone ? '#f59e0b' : '#22c55e'} size={92} stroke={7}>
                            <div className="text-center">
                                <div className="text-lg font-black font-space leading-none" style={{ color: allDone ? '#f59e0b' : '#22c55e' }}>{pct}%</div>
                                <div className="text-[8px] text-muted-foreground leading-none mt-0.5">{completedMissions.length}/{regularMissions.length}</div>
                            </div>
                        </RingProgress>

                        <div className="flex-1 min-w-0">
                            <div className="text-xl font-black font-space leading-tight">
                                {allDone ? '🏆 Perfect Day!' : `${completedMissions.length} of ${regularMissions.length} done`}
                            </div>
                            <div className="text-sm mt-1" style={{ color: allDone ? 'rgba(245,158,11,0.65)' : 'rgba(255,255,255,0.4)' }}>
                                {allDone ? 'All missions complete — incredible work!' : `${regularMissions.length - completedMissions.length} mission${regularMissions.length - completedMissions.length !== 1 ? 's' : ''} left today`}
                            </div>
                        </div>

                        <div className="flex flex-row items-center gap-2 flex-shrink-0 flex-wrap">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                                style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.22)' }}>
                                <Flame className="w-3.5 h-3.5 text-orange-400" />
                                <span className="text-sm font-black text-orange-300">{profile?.login_streak || 0}d</span>
                                <span className="text-[10px] text-orange-400/60">streak</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.22)' }}>
                                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                                <span className="text-sm font-black text-yellow-300">+{displayXP} XP</span>
                                <span className="text-[10px] text-yellow-400/60">today</span>
                            </div>
                            {allDone && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                                    style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)' }}>
                                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                                    <span className="text-sm font-black text-violet-300">+50 Bonus!</span>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* XP breakdown */}
                    {displayXP > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                            {loginStreakXPToday > 0 && (
                                <span className="flex items-center gap-1">
                                    <Flame className="w-3 h-3 text-orange-400" />
                                    Login streak <span className="text-orange-400 font-semibold">+{loginStreakXPToday}</span>
                                </span>
                            )}
                            {totalMissionXP > 0 && (
                                <span className="flex items-center gap-1">
                                    <Target className="w-3 h-3 text-yellow-400" />
                                    Missions <span className="text-yellow-400 font-semibold">+{totalMissionXP}</span>
                                </span>
                            )}
                            {bonusXP > 0 && (
                                <span className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-emerald-400" />
                                    Bonus <span className="text-emerald-400 font-semibold">+{bonusXP}</span>
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* ── Today's Missions ── */}
            <section className="space-y-2.5">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Today's Missions</h3>
                    <span className="text-xs text-muted-foreground">{completedMissions.length}/{regularMissions.length} complete</span>
                </div>
                {regularMissions.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center py-10">No missions configured yet. Add them in Admin → Gamification.</p>
                ) : regularMissions.map((m, i) => (
                    <MissionCard key={m.id} mission={m} completed={checkMission(m, data)} delay={i * 0.07} data={data} />
                ))}
            </section>

            {/* ── Active Challenges ── */}
            {challenges.length > 0 && (
                <section className="space-y-2.5">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Active Challenges</h3>
                        <span className="text-xs text-muted-foreground/60 ml-1">(one-time rewards)</span>
                    </div>
                    {challenges.map((ch, i) => {
                        const isCompleted = completedChallengeIds.includes(ch.id);
                        const alreadyClaimed = (profile?.achievements || []).includes(`challenge_${ch.id}`);
                        return (
                            <ChallengeCard key={ch.id} ch={ch} index={i} isCompleted={isCompleted} alreadyClaimed={alreadyClaimed} />
                        );
                    })}
                </section>
            )}

            {/* ── Bonus Missions ── */}
            {bonusMissions.length > 0 && (
                <section className="space-y-2.5">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Bonus Challenges</h3>
                    </div>
                    {bonusMissions.map((b, i) => {
                        const completed = checkBonus(b, data, allDone, profile);
                        const IconComp = ICON_MAP[b.icon] || Trophy;
                        const color = b.color_hex || '#f59e0b';
                        const prog = getMissionProgress(b, data);
                        const showProg = b.metric && b.metric !== 'workout_done' && b.mission_id !== 'perfect_day';
                        const perfectPct = b.mission_id === 'perfect_day' ? pct : null;
                        const ringPct = perfectPct !== null ? perfectPct : (showProg ? prog.pct : (completed ? 100 : 0));

                        return (
                            <motion.div key={b.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.08 }}
                                className="relative overflow-hidden rounded-2xl border p-4 transition-all"
                                style={{
                                    background: `linear-gradient(135deg, ${color}${completed ? '18' : '0d'}, rgba(255,255,255,0.02))`,
                                    borderColor: completed ? `${color}55` : `${color}30`,
                                }}>
                                {completed && <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}88, transparent)` }} />}

                                <div className="flex items-center gap-4">
                                    <RingProgress pct={ringPct} color={color} size={56} stroke={4}>
                                        <IconComp className="w-4 h-4" style={{ color: `${color}${completed ? 'ff' : 'cc'}` }} />
                                    </RingProgress>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm">{b.label}</span>
                                            {completed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-0.5">{b.description}</div>
                                        <div className="mt-2">
                                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                                                <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${ringPct}%` }}
                                                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 + i * 0.08 }}
                                                    style={{ background: `linear-gradient(90deg, ${color}, ${color}bb)` }} />
                                            </div>
                                            <div className="flex justify-between mt-0.5">
                                                <span className="text-[10px] text-muted-foreground">
                                                    {perfectPct !== null ? `${completedMissions.length}/${regularMissions.length} missions`
                                                        : showProg ? `${prog.current?.toLocaleString()} / ${prog.target?.toLocaleString()} ${prog.unit}`
                                                            : (completed ? 'Completed!' : 'In progress')}
                                                </span>
                                                <span className="text-[10px] font-bold" style={{ color: `${color}cc` }}>{ringPct}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-shrink-0">
                                        {completed ? (
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> UNLOCKED!
                                                </div>
                                                <div className="text-yellow-400 text-xs font-bold flex items-center gap-1">
                                                    <Star className="w-3 h-3" /> +{b.xp_reward} XP
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center w-10 h-10 rounded-xl"
                                                style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
                                                <Star className="w-3 h-3 mb-0.5" style={{ color: `${color}cc` }} />
                                                <span className="text-xs font-bold" style={{ color: `${color}cc` }}>{b.xp_reward}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}

                    {/* Perfect Day Bonus */}
                    {allDone && (
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                            className="rounded-2xl p-4 border border-orange-500/40 flex items-center gap-4"
                            style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.1), rgba(245,158,11,0.06))' }}>
                            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                                <Trophy className="w-6 h-6 text-orange-400" />
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold text-sm">Perfect Day Bonus 🎉</div>
                                <div className="text-xs text-muted-foreground">Completed all daily missions!</div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <div className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> UNLOCKED!
                                </div>
                                <div className="text-yellow-400 text-xs font-bold flex items-center gap-1">
                                    <Star className="w-3 h-3" /> +{XP_PERFECT_DAY} XP
                                </div>
                            </div>
                        </motion.div>
                    )}
                </section>
            )}

            {/* ── Leaderboard ── */}
            {allProfiles.length > 0 && (
                <section className="space-y-2.5">
                    <div className="flex items-center gap-2">
                        <Crown className="w-3.5 h-3.5 text-yellow-400" />
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Leaderboard</h3>
                        {myRank && <span className="text-xs text-yellow-400 ml-1">· You're #{myRank}</span>}
                    </div>
                    <div className="rounded-2xl overflow-hidden border border-white/6"
                        style={{ background: 'rgba(255,255,255,0.025)' }}>
                        {leaderboard.map((u, i) => {
                            const isMe = u.name === user?.email?.split('@')[0];
                            const rankColor = rankColors[i] || 'rgba(255,255,255,0.3)';
                            const maxXP = leaderboard[0]?.xp || 1;
                            const xpPct = Math.round((u.xp / maxXP) * 100);
                            return (
                                <div key={u.rank}
                                    className={`flex items-center gap-3 px-4 py-3 border-b border-white/4 last:border-0 transition-all ${isMe ? 'bg-yellow-500/6' : ''}`}
                                    style={isMe ? { borderLeft: `2px solid ${rankColors[0]}` } : {}}>
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                                        style={{ background: `${rankColor}22`, color: rankColor }}>
                                        {i < 3 ? ['🥇', '🥈', '🥉'][i] : u.rank}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-sm font-medium capitalize truncate ${isMe ? 'text-yellow-300' : ''}`}>
                                                {u.name}{isMe ? ' (you)' : ''}
                                            </span>
                                            <span className="text-xs font-bold text-yellow-400 ml-2 flex-shrink-0">{u.xp.toLocaleString()} XP</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                                                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${xpPct}%`, background: `linear-gradient(90deg, ${rankColor}, ${rankColor}88)` }} />
                                            </div>
                                            <span className="text-[10px] text-muted-foreground flex-shrink-0">🔥 {u.streak}d</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
}