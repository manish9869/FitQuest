import React, { useMemo, useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { today } from '@/lib/fitnessUtils';
import { Zap, Droplets, Footprints, Dumbbell, Moon, Utensils, CheckCircle, Star, Trophy, Flame, Target, Crown, Clock } from 'lucide-react';
import { differenceInDays } from 'date-fns';

const ICON_MAP = { Droplets, Utensils, Footprints, Dumbbell, Moon, Flame, Trophy, Target, Star, Zap };

const CHALLENGE_XP = {
    steps: 200,
    water: 150,
    streak: 300,
    workout: 250,
    weightloss: 400,
};

const XP_PERFECT_DAY = 50;

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
                    {mission.metric === 'water_ml' && <div className="text-[10px] text-muted-foreground/60 mt-0.5">Target: {mission.target_value?.toLocaleString()} ml</div>}
                    {mission.metric === 'steps' && <div className="text-[10px] text-muted-foreground/60 mt-0.5">Target: {mission.target_value?.toLocaleString()} steps</div>}
                    {mission.metric === 'sleep_hours' && <div className="text-[10px] text-muted-foreground/60 mt-0.5">Target: {mission.target_value}h</div>}
                    {mission.metric === 'protein_g' && <div className="text-[10px] text-muted-foreground/60 mt-0.5">Target: {mission.target_pct_of_goal ? `${Math.round(mission.target_pct_of_goal * 100)}% of goal` : `${mission.target_value}g`}</div>}
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
                : (mission.target_value || 0);
            if (!target) return false;
            return data.protein > 0 && data.protein >= target;
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

function checkChallenge(challenge, historyData, profile) {
    const { type, duration_days } = challenge;
    const required = Number(duration_days) || 7;

    switch (type) {
        case 'steps': {
            const qualifyingDays = historyData.stepsByDate.filter(d => d.steps >= 10000).length;
            return qualifyingDays >= required;
        }
        case 'water': {
            const qualifyingDays = historyData.waterByDate.filter(d => d.total >= 2000).length;
            return qualifyingDays >= required;
        }
        case 'streak':
            return (profile?.login_streak || 0) >= required;
        case 'workout':
            return historyData.workoutDays >= required;
        case 'weightloss': {
            const logs = historyData.weightLogs;
            if (logs.length < 2) return false;
            return (logs[0].weight_kg - logs[logs.length - 1].weight_kg) >= 1;
        }
        default:
            return false;
    }
}

function checkBonus(bonus, data, allDone, profile) {
    if (bonus.metric && bonus.metric !== 'workout_done') {
        return checkMission(bonus, data);
    }
    switch (bonus.mission_id) {
        case 'streak_bonus':
            return (profile?.login_streak || 0) >= (bonus.target_value || 7);
        case 'perfect_day':
            return allDone;
        case 'hydration_hero':
            return data.water >= (bonus.target_value || 3000);
        case 'step_legend':
            return data.steps >= (bonus.target_value || 15000);
        default:
            if (bonus.metric) return checkMission(bonus, data);
            if (bonus.category === 'streak') return (profile?.login_streak || 0) >= (bonus.target_value || 7);
            return false;
    }
}

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

    // Challenge XP for display only — actual DB award is in the useEffect below
    const completedChallengeXP = useMemo(() =>
        completedChallengeIds.reduce((sum, id) => {
            const ch = challenges.find(c => c.id === id);
            return sum + (CHALLENGE_XP[ch?.type] || 0);
        }, 0),
        [completedChallengeIds, challenges]);

    // Award challenge XP to DB once per session using sessionStorage guard
    useEffect(() => {
        if (!profile || completedChallengeIds.length === 0) return;

        // Use profile.achievements array to permanently track awarded challenge IDs
        // Store them as "challenge_{id}" strings so they don't clash with real achievement IDs
        const currentAwarded = profile.achievements || [];
        const newlyCompleted = completedChallengeIds.filter(
            id => !currentAwarded.includes(`challenge_${id}`)
        );

        if (newlyCompleted.length === 0) return;

        const xpToAdd = newlyCompleted.reduce((sum, id) => {
            const ch = challenges.find(c => c.id === id);
            return sum + (CHALLENGE_XP[ch?.type] || 0);
        }, 0);

        const updatedAchievements = [
            ...currentAwarded,
            ...newlyCompleted.map(id => `challenge_${id}`)
        ];

        entities.UserProfile.update(profile.id, {
            total_xp: (profile.total_xp || 0) + xpToAdd,
            achievements: updatedAchievements,
        }).then(() => {
            qc.invalidateQueries({ queryKey: ['userProfile'] });
            qc.invalidateQueries({ queryKey: ['all-profiles-lb'] });
        });

    }, [completedChallengeIds.join(','), profile?.id]);

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

    // syncXP: only missions + bonuses — watermark tracks these, challenges have own guard
    const syncXP = totalMissionXP + bonusXP;

    // displayXP: everything earned today shown in the UI counter
    const displayXP = syncXP + completedChallengeXP;

    const pct = regularMissions.length > 0
        ? Math.round((completedMissions.length / regularMissions.length) * 100)
        : 0;

    // Watermark sync — only for missions+bonuses, writes only the diff
    useEffect(() => {
        if (!profile?.id || syncXP === 0) return;

        const savedDate = profile.mission_xp_date
            ? String(profile.mission_xp_date).slice(0, 10)
            : null;

        const alreadyAwarded = savedDate === todayStr
            ? (profile.mission_xp_today || 0)
            : 0;

        if (syncXP <= alreadyAwarded) return;

        const diff = syncXP - alreadyAwarded;

        entities.UserProfile.update(profile.id, {
            total_xp: (profile.total_xp || 0) + diff,
            mission_xp_today: syncXP,
            mission_xp_date: todayStr,
        }).then(() => {
            qc.invalidateQueries({ queryKey: ['userProfile'] });
        });

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

    const TYPE_CONFIG = {
        steps: { icon: Footprints, color: 'text-orange-400', bg: 'bg-orange-500/10' },
        water: { icon: Droplets, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        streak: { icon: Flame, color: 'text-red-400', bg: 'bg-red-500/10' },
        workout: { icon: Dumbbell, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        weightloss: { icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    };

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

            {/* Header summary card */}
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
                            <span className="text-2xl font-bold font-space">{displayXP}</span>
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

            {/* Total XP pill */}
            {profile && (
                <div className="glass rounded-xl px-4 py-3 border border-yellow-500/15 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Your Total XP</span>
                    <div className="flex items-center gap-1.5 text-yellow-400 font-bold">
                        <Zap className="w-4 h-4" />
                        <span>{(profile.total_xp || 0).toLocaleString()} XP</span>
                    </div>
                </div>
            )}

            {/* Daily missions */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Today's Missions</h3>
                {regularMissions.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center py-8">No missions configured yet. Add them in Admin → Gamification.</p>
                ) : regularMissions.map((m, i) => (
                    <MissionCard key={m.id} mission={m} completed={checkMission(m, data)} delay={i * 0.07} />
                ))}
            </div>

            {/* Active challenges */}
            {challenges.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-400" /> Active Challenges
                    </h3>
                    {challenges.map((ch, i) => {
                        const conf = TYPE_CONFIG[ch.type] || TYPE_CONFIG.streak;
                        const CIcon = conf.icon;
                        const daysLeft = ch.end_date ? Math.max(0, differenceInDays(new Date(ch.end_date), new Date())) : null;
                        const isCompleted = completedChallengeIds.includes(ch.id);
                        const xpReward = CHALLENGE_XP[ch.type] || 100;

                        return (
                            <motion.div key={ch.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                                className={`glass rounded-2xl p-4 border transition-all duration-500 ${isCompleted ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-yellow-500/20'}`}
                                style={isCompleted ? { boxShadow: '0 0 20px rgba(16,185,129,0.15)' } : {}}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl ${conf.bg} flex items-center justify-center flex-shrink-0 relative`}>
                                        <CIcon className={`w-6 h-6 ${conf.color}`} />
                                        {isCompleted && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                                <CheckCircle className="w-3.5 h-3.5 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-sm flex items-center gap-2">
                                            {ch.name}
                                            {isCompleted && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold">COMPLETED</span>}
                                        </div>
                                        {ch.description && <div className="text-xs text-muted-foreground mt-0.5">{ch.description}</div>}
                                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {daysLeft !== null ? `${daysLeft} days left` : `${ch.duration_days} days`}
                                            </span>
                                            {ch.prize && <span className="text-yellow-400">{ch.prize}</span>}
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        {isCompleted ? (
                                            <div className="flex flex-col items-end gap-0.5">
                                                <div className="flex items-center gap-1 text-emerald-400">
                                                    <Star className="w-3.5 h-3.5" />
                                                    <span className="font-bold text-sm">+{xpReward}</span>
                                                </div>
                                                <div className="text-[10px] text-emerald-400/70">XP awarded!</div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-muted-foreground/50">
                                                <Star className="w-3.5 h-3.5" />
                                                <span className="font-bold text-sm">{xpReward}</span>
                                            </div>
                                        )}
                                        {!isCompleted && <div className="text-[10px] text-muted-foreground">XP</div>}
                                        {ch.reward_badge && <div className="text-xl mt-1">{ch.reward_badge.split(' ')[0]}</div>}
                                    </div>
                                </div>
                                {isCompleted && (
                                    <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.2 }}
                                        className="mt-3 h-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-transparent" />
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Leaderboard */}
            {allProfiles.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Crown className="w-4 h-4 text-yellow-400" /> Leaderboard
                        {myRank && <span className="text-xs font-normal text-yellow-400 ml-1">· You're #{myRank}</span>}
                    </h3>
                    <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                        {leaderboard.map((u, i) => (
                            <div key={u.rank}
                                className={`flex items-center gap-4 px-4 py-3 ${u.name === user?.email?.split('@')[0] ? 'bg-yellow-500/5 border-l-2 border-yellow-500' : 'border-b border-white/5'}`}>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' : i === 1 ? 'bg-gray-500/20 text-gray-300' : i === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-muted-foreground'}`}>
                                    {u.rank}
                                </div>
                                <div className="flex-1">
                                    <span className="text-sm font-medium capitalize">{u.name}</span>
                                    <span className="text-xs text-muted-foreground ml-2">🔥 {u.streak}d</span>
                                </div>
                                <div className="text-sm font-bold text-yellow-400">{u.xp.toLocaleString()} XP</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Bonus missions */}
            {bonusMissions.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Bonus Challenges</h3>
                    {bonusMissions.map((b, i) => {
                        const completed = checkBonus(b, data, allDone, profile);
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
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                                                    <CheckCircle className="w-3.5 h-3.5" /> UNLOCKED!
                                                </div>
                                                <div className="text-yellow-400 text-xs font-bold flex items-center gap-1">
                                                    <Star className="w-3 h-3" /> +{b.xp_reward} XP
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-yellow-400">
                                                <Star className="w-3.5 h-3.5" />
                                                <span className="font-bold text-sm">{b.xp_reward} XP</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                    {allDone && (
                        <div className="glass rounded-2xl p-4 border border-orange-500/30 bg-orange-500/5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                                    <Trophy className="w-6 h-6 text-orange-400" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-sm">Perfect Day Bonus</div>
                                    <div className="text-xs text-muted-foreground">Completed all daily missions!</div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                                        <CheckCircle className="w-3.5 h-3.5" /> UNLOCKED!
                                    </div>
                                    <div className="text-yellow-400 text-xs font-bold flex items-center gap-1">
                                        <Star className="w-3 h-3" /> +{XP_PERFECT_DAY} XP
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}