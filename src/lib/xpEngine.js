/**
 * XP Engine — central place for calculating and awarding XP.
 * All XP updates go through here so the logic is consistent everywhere.
 */
import { entities } from '@/api/entities';
import { today } from './fitnessUtils';

/** XP per action type */
export const XP_VALUES = {
    log_meal: 10,
    log_water: 5,
    log_steps: 8,
    log_workout: 20,
    log_sleep: 8,
    log_weight: 5,
    mission_complete: 0,  // handled per-mission from DB
    streak_day: 15,       // per login streak day increment
    perfect_day: 50,      // bonus when all missions complete
};

/**
 * Update XP on the profile.
 * @param {object} profile — full UserProfile record
 * @param {number} xpToAdd
 * @param {string[]} [newAchievements] — achievement_ids to add
 * @returns Promise
 */
export async function awardXP(profile, xpToAdd, newAchievements = []) {
    if (!profile?.id || xpToAdd <= 0) return;
    const currentXP = profile.total_xp || 0;
    const currentAch = profile.achievements || [];
    const updatedAch = [...new Set([...currentAch, ...newAchievements])];
    return entities.UserProfile.update(profile.id, {
        total_xp: currentXP + xpToAdd,
        ...(newAchievements.length > 0 ? { achievements: updatedAch } : {}),
    });
}

/**
 * Check and update login streak.
 * Should be called once per session on dashboard mount.
 * @param {object} profile
 * @returns Promise<{streakUpdated: boolean, newStreak: number, xpAwarded: number}>
 */
export async function updateLoginStreak(profile) {
    if (!profile?.id) return { streakUpdated: false, newStreak: 0, xpAwarded: 0 };
    const todayStr = today();
    const lastLogin = profile.last_login_date || '';

    if (lastLogin === todayStr) {
        // Already updated today
        return { streakUpdated: false, newStreak: profile.login_streak || 0, xpAwarded: 0 };
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const currentStreak = profile.login_streak || 0;
    const newStreak = lastLogin === yesterdayStr ? currentStreak + 1 : 1;
    const longestStreak = Math.max(profile.longest_streak || 0, newStreak);
    const xpAwarded = XP_VALUES.streak_day;

    await entities.UserProfile.update(profile.id, {
        login_streak: newStreak,
        longest_streak: longestStreak,
        last_login_date: todayStr,
        total_xp: (profile.total_xp || 0) + xpAwarded,
    });

    return { streakUpdated: true, newStreak, xpAwarded };
}

/**
 * Award XP for completing daily missions.
 * Computes what the user SHOULD have for today and syncs once.
 * Uses a localStorage key to avoid double-awarding per day.
 * @param {object} profile
 * @param {number} missionXP — total XP from completed missions today
 * @param {boolean} perfectDay
 * @returns Promise
 */
export async function syncMissionXP(profile, missionXP, perfectDay) {
    if (!profile?.id) return;
    const todayStr = today();
    const bonusXP = perfectDay ? XP_VALUES.perfect_day : 0;
    const totalToday = missionXP + bonusXP;

    // Use DB columns instead of localStorage — more reliable
    const alreadyAwarded = profile.mission_xp_date === todayStr
        ? (profile.mission_xp_today || 0)
        : 0;

    if (totalToday <= alreadyAwarded) return;

    const diff = totalToday - alreadyAwarded;

    return entities.UserProfile.update(profile.id, {
        total_xp: (profile.total_xp || 0) + diff,
        mission_xp_today: totalToday,
        mission_xp_date: todayStr,
    });
}

/**
 * Check which achievements should be unlocked based on current profile state.
 * Returns array of achievement_ids to unlock.
 */
export function checkAchievements(profile, allAchievements) {
    if (!profile || !allAchievements?.length) return [];
    const earned = profile.achievements || [];
    const toUnlock = [];

    for (const ach of allAchievements) {
        if (earned.includes(ach.achievement_id)) continue;

        const streak = profile.login_streak || 0;
        const xp = profile.total_xp || 0;

        let unlocked = false;
        switch (ach.category) {
            case 'streak':
                if (ach.achievement_id.includes('3') && streak >= 3) unlocked = true;
                else if (ach.achievement_id.includes('7') && streak >= 7) unlocked = true;
                else if (ach.achievement_id.includes('14') && streak >= 14) unlocked = true;
                else if (ach.achievement_id.includes('30') && streak >= 30) unlocked = true;
                else if (ach.achievement_id === 'first_login' && streak >= 1) unlocked = true;
                break;
            case 'consistency':
                if (xp >= 500 && ach.achievement_id.includes('500')) unlocked = true;
                else if (xp >= 1000 && ach.achievement_id.includes('1000')) unlocked = true;
                break;
            default:
                break;
        }
        if (unlocked) toUnlock.push(ach.achievement_id);
    }
    return toUnlock;
}