import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useLocation, useNavigate } from 'react-router-dom';
import { checkAchievements, awardXP } from '@/lib/xpEngine';

/**
 * Invisible background component mounted inside DashboardLayout.
 * 1. Polls for new admin chat messages → toast notification
 * 2. Polls for user-sent messages getting replies → toast notification
 * 3. Polls for automation messages relevant to user → toast
 * 4. Checks achievements on profile change → toast + award XP
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

    // ─────────────────────────────────────────────
    // 1. Admin → User chat messages (poll every 5s)
    // ─────────────────────────────────────────────
    const { data: adminMessages = [] } = useQuery({
        queryKey: ['chat-messages-notify', user?.email],
        queryFn: async () => {
            const result = await entities.ChatMessage.filter({ user_email: user?.email, sender: 'admin' }, 'sent_at', 50);

            return result;
        },
        enabled: !!user?.email,
        refetchInterval: 5000,
    });

    useEffect(() => {
        if (!adminMessages.length) return;

        if (!msgInitialized.current) {
            // Mark all existing messages as seen on first load
            adminMessages.forEach(m => seenMsgIds.current.add(m.id));
            msgInitialized.current = true;
            return;
        }

        const newMsgs = adminMessages.filter(m => !seenMsgIds.current.has(m.id));
        newMsgs.forEach(m => {
            seenMsgIds.current.add(m.id);

            // Don't show notification if already on messages page
            if (location.pathname === '/dashboard/messages') return;

            toast('New message from your coach! 💬', {
                duration: 7000,
                description: m.text.length > 80 ? m.text.slice(0, 80) + '...' : m.text,
                action: {
                    label: 'View',
                    onClick: () => navigate('/dashboard/messages'),
                },
            });
        });
    }, [adminMessages, location.pathname]);

    // ─────────────────────────────────────────────
    // 2. User Profile (for automations + achievements)
    // ─────────────────────────────────────────────
    const { data: profiles = [] } = useQuery({
        queryKey: ['userProfile', user?.email],
        queryFn: () => entities.UserProfile.filter({ user_email: user?.email }),
        enabled: !!user?.email,
        refetchInterval: 60000,
    });
    const profile = profiles[0];

    // ─────────────────────────────────────────────
    // 3. Automation notifications (poll every 30s)
    // ─────────────────────────────────────────────
    const { data: automations = [] } = useQuery({
        queryKey: ['automations-notify'],
        queryFn: () => entities.Automation.filter({ is_active: true }),
        enabled: !!user?.email,
        refetchInterval: 30000,
    });

    useEffect(() => {
        if (!profile || !automations.length) return;

        if (!autoInitialized.current) {
            automations.forEach(a => seenAutoIds.current.add(a.id + '_seen'));
            autoInitialized.current = true;
            return;
        }

        const todayStr = new Date().toISOString().split('T')[0];
        const sessionKey = `auto_notified_${todayStr}`;
        const notifiedToday = JSON.parse(localStorage.getItem(sessionKey) || '{}');

        for (const rule of automations) {
            if (notifiedToday[rule.id]) continue;
            if (rule.action !== 'send_reminder' && rule.action !== 'send_message') continue;

            let shouldFire = false;
            const val = rule.trigger_value || 0;

            switch (rule.trigger) {
                case 'streak_milestone':
                    shouldFire = (profile.login_streak || 0) >= val;
                    break;
                case 'inactivity':
                    if (profile.last_login_date) {
                        const daysSince = Math.floor((Date.now() - new Date(profile.last_login_date)) / 86400000);
                        shouldFire = daysSince >= val;
                    }
                    break;
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

    // ─────────────────────────────────────────────
    // 4. Achievement unlock detection
    // ─────────────────────────────────────────────
    const { data: allAchievements = [] } = useQuery({
        queryKey: ['achievements-notify'],
        queryFn: () => entities.Achievement.filter({ is_active: true }),
        enabled: !!user?.email,
    });

    useEffect(() => {
        if (!profile || !allAchievements.length) return;

        if (!achInitialized.current) {
            (profile.achievements || []).forEach(id => seenAchIds.current.add(id));
            achInitialized.current = true;
            return;
        }

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

            const totalXP = newOnes.reduce((s, id) => {
                const ach = allAchievements.find(a => a.achievement_id === id);
                return s + (ach?.xp_reward || 0);
            }, 0);

            awardXP(profile, totalXP, newOnes);
        }
    }, [profile?.total_xp, profile?.login_streak, allAchievements]);

    return null;
}