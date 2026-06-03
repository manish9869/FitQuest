/**
 * Automation Engine
 * Evaluates all active automation rules against user data and executes actions.
 * Call runAutomations(user, dataSnapshot) once per session on dashboard load.
 */
import { entities } from '@/api/entities';
import { today } from './fitnessUtils';
import { format, subDays } from 'date-fns';

/**
 * Evaluate a single rule against the user data snapshot.
 * Returns true if the trigger condition is met.
 */
function evaluateTrigger(rule, snapshot) {
    const val = Number(rule.trigger_value) || 0;

    switch (rule.trigger) {
        case 'missed_workouts': {
            // Count days in last `val` days with no workout
            const days = val || 3;
            let missed = 0;
            for (let i = 1; i <= days; i++) {
                const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
                const hadWorkout = snapshot.recentWorkouts.some(w => w.date === d);
                if (!hadWorkout) missed++;
            }
            return missed >= days;
        }

        case 'low_water': {
            // Today's water total < trigger_value ml
            const todayWater = snapshot.todayWater;
            return todayWater < val;
        }

        case 'streak_milestone': {
            // Login streak exactly equals milestone
            return snapshot.loginStreak === val;
        }

        case 'inactivity': {
            // No workout logs in last `val` days
            const days = val || 3;
            const cutoff = format(subDays(new Date(), days), 'yyyy-MM-dd');
            const recentActivity = snapshot.recentWorkouts.some(w => w.date >= cutoff);
            return !recentActivity;
        }

        case 'low_calories': {
            // Today's calories < trigger_value
            return snapshot.todayCalories < val;
        }

        default:
            return false;
    }
}

/**
 * Execute a rule's action for a specific user.
 */
async function executeAction(rule, userEmail, userName) {
    switch (rule.action) {
        case 'send_reminder':
        case 'send_message': {
            // Send a chat message from admin
            const existing = await entities.ChatMessage.filter({ user_email: userEmail });
            // Avoid duplicate messages (same automation same day)
            const todayStr = today();
            const alreadySent = existing.some(
                m => m.sender === 'admin' && m.text === rule.action_value && m.sent_at?.startsWith(todayStr)
            );
            if (!alreadySent) {
                await entities.ChatMessage.create({
                    user_email: userEmail,
                    sender: 'admin',
                    text: rule.action_value,
                    read: false,
                    sent_at: new Date().toISOString(),
                });
            }
            break;
        }

        case 'unlock_badge': {
            // Add achievement to user profile
            const profiles = await entities.UserProfile.filter({ user_email: userEmail });
            const profile = profiles[0];
            if (profile) {
                const current = profile.achievements || [];
                if (!current.includes(rule.action_value)) {
                    await entities.UserProfile.update(profile.id, {
                        achievements: [...current, rule.action_value],
                    });
                }
            }
            break;
        }

        case 'notify_trainer': {
            // Send a chat message to admin inbox (from system) — log as admin note
            await entities.ChatMessage.create({
                user_email: userEmail,
                sender: 'admin',
                text: `⚠️ Trainer Alert for ${userName}: ${rule.action_value}`,
                read: false,
                sent_at: new Date().toISOString(),
            });
            break;
        }

        default:
            break;
    }
}

/**
 * Main runner — call this once on dashboard load.
 * @param {object} user — current user object { email, full_name }
 * @param {object} snapshot — { recentWorkouts, todayWater, todayCalories, loginStreak }
 */
export async function runAutomations(user, snapshot) {
    if (!user?.email) return;

    try {
        const rules = await entities.Automation.filter({ is_active: true });
        if (!rules.length) return;

        const cacheKey = `automations_run_${user.email}_${today()}`;
        const alreadyRunIds = JSON.parse(localStorage.getItem(cacheKey) || '[]');

        for (const rule of rules) {
            // Skip rules already run today
            if (alreadyRunIds.includes(rule.id)) continue;

            const triggered = evaluateTrigger(rule, snapshot);
            if (triggered) {
                await executeAction(rule, user.email, user.full_name || user.email);
                // Increment run_count
                await entities.Automation.update(rule.id, {
                    run_count: (rule.run_count || 0) + 1,
                });
                // Mark this rule as run today for this user
                alreadyRunIds.push(rule.id);
            }
        }

        localStorage.setItem(cacheKey, JSON.stringify(alreadyRunIds));
    } catch (err) {
        console.error('Automation engine error:', err);
    }
}