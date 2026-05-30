import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useLocation, useNavigate } from 'react-router-dom';
import { checkAchievements } from '@/lib/xpEngine';
import { awardXP } from '@/lib/xpEngine';

/**
 * Invisible background component mounted inside DashboardLayout.
 * 1. Polls for new admin chat messages → toast notification
 * 2. Polls for automation messages (send_reminder / send_message) relevant to user → toast
 * 3. Checks achievements on profile change → toast + award XP
 */
export default function MessageNotifier() {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const seenMsgIds = useRef(new Set());
    const seenAutoIds = useRef(new Set());
    const seenAchIds = useRef(new Set());
    const msgInitialized = useRef(false);
    const autoInitialized = useRef(false);
    const achInitialized = useRef(false);

    // --- 1. Admin chat messages ---
    const { data: messages = [] } = useQuery({
        queryKey: ['chat-messages-notify', user?.email],
        queryFn: () => entities.ChatMessage.filter({ user_email: user?.email, sender: 'admin' }, 'sent_at', 50),
        enabled: !!user?.email && user?.role !== 'admin',
        refetchInterval: 7000,
    });

    useEffect(() => {
        if (!messages.length) return;
        if (!msgInitialized.current) {
            messages.forEach(m => seenMsgIds.current.add(m.id));
            msgInitialized.current = true;
            return;
        }
        const newMsgs = messages.filter(m => !seenMsgIds.current.has(m.id));
        newMsgs.forEach(m => {
            seenMsgIds.current.add(m.id);
            if (location.pathname === '/dashboard/messages') return;
            toast(m.text, {
                duration: 6000,
                icon: '💬',
                description: 'FitElite Coach',
                action: { label: 'View', onClick: () => navigate('/dashboard/messages') },
            });
        });
    }, [messages, location.pathname]);

    // --- 2. Automation app notifications (send_reminder & send_message) ---
    const { data: automations = [] } = useQuery({
        queryKey: ['automations-notify'],
        queryFn: () => entities.Automation.filter({ is_active: true }),
        enabled: !!user?.email && user?.role !== 'admin',
        refetchInterval: 30000, // check every 30s
    });

    const { data: profiles = [] } = useQuery({
        queryKey: ['userProfile', user?.email],
        queryFn: () => entities.UserProfile.filter({ user_email: user?.email }),
        enabled: !!user?.email,
        refetchInterval: 60000,
    });
    const profile = profiles[0];

    // Check automation triggers against user profile data
    useEffect(() => {
        if (!profile || !automations.length) return;
        if (!autoInitialized.current) {
            // Mark all as seen on first load so we don't spam on page load
            automations.forEach(a => seenAutoIds.current.add(a.id + '_seen'));
            autoInitialized.current = true;
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const sessionKey = `auto_notified_${today}`;
        const notifiedToday = JSON.parse(localStorage.getItem(sessionKey) || '{}');

        for (const rule of automations) {
            if (notifiedToday[rule.id]) continue; // already notified today for this rule
            if (rule.action !== 'send_reminder' && rule.action !== 'send_message') continue;

            let shouldFire = false;
            const val = rule.trigger_value || 0;
            switch (rule.trigger) {
                case 'streak_milestone':
                    shouldFire = (profile.login_streak || 0) >= val;
                    break;
                case 'inactivity':
                    // Fire if last login was more than `val` days ago
                    if (profile.last_login_date) {
                        const daysSince = Math.floor((Date.now() - new Date(profile.last_login_date)) / 86400000);
                        shouldFire = daysSince >= val;
                    }
                    break;
                // missed_workouts and low_water require log data — skip here (admin triggers manually)
                default:
                    break;
            }

            if (shouldFire) {
                notifiedToday[rule.id] = true;
                toast(rule.action_value || 'You have a new notification from your coach!', {
                    duration: 5000,
                    icon: rule.trigger === 'streak_milestone' ? '🔥' : '🔔',
                    description: 'FitElite Automation',
                });
            }
        }
        localStorage.setItem(sessionKey, JSON.stringify(notifiedToday));
    }, [automations, profile]);

    // --- 3. Achievement unlock detection ---
    const { data: allAchievements = [] } = useQuery({
        queryKey: ['achievements-notify'],
        queryFn: () => entities.Achievement.filter({ is_active: true }),
        enabled: !!user?.email && user?.role !== 'admin',
    });

    useEffect(() => {
        if (!profile || !allAchievements.length) return;

        // On first load, mark all currently earned as already seen
        if (!achInitialized.current) {
            (profile.achievements || []).forEach(id => seenAchIds.current.add(id));
            achInitialized.current = true;
            return;
        }

        // Check which achievements should now be unlocked
        const toUnlock = checkAchievements(profile, allAchievements);
        const newOnes = toUnlock.filter(id => !seenAchIds.current.has(id));

        if (newOnes.length > 0) {
            newOnes.forEach(id => {
                seenAchIds.current.add(id);
                const ach = allAchievements.find(a => a.achievement_id === id);
                if (!ach) return;
                toast(`🏆 Achievement Unlocked: ${ach.name}`, {
                    duration: 8000,
                    description: `${ach.description} · +${ach.xp_reward} XP`,
                    icon: '🎖️',
                });
            });

            // Award XP + save achievement IDs to profile
            const totalXP = newOnes.reduce((s, id) => {
                const ach = allAchievements.find(a => a.achievement_id === id);
                return s + (ach?.xp_reward || 0);
            }, 0);
            awardXP(profile, totalXP, newOnes);
        }
    }, [profile?.total_xp, profile?.login_streak, allAchievements]);

    return null;
}