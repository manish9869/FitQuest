import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ShieldCheck } from 'lucide-react';
import { useLocation } from 'react-router-dom';

/**
 * Runs silently in the background (no UI rendered).
 * Polls for new admin messages and fires a toast notification when they arrive,
 * unless the user is already on the messages page.
 */
export default function MessageNotifier() {
    const { user } = useAuth();
    const location = useLocation();
    const seenIds = useRef(new Set());
    const initialized = useRef(false);

    const { data: messages = [] } = useQuery({
        queryKey: ['chat-messages-notify', user?.email],
        queryFn: () => entities.ChatMessage.filter({ user_email: user?.email }),
        enabled: !!user?.email && user?.role !== 'admin',
        refetchInterval: 6000,
    });

    useEffect(() => {
        if (!messages.length) return;

        // On first load, mark all existing as seen (don't notify for old messages)
        if (!initialized.current) {
            messages.forEach(m => seenIds.current.add(m.id));
            initialized.current = true;
            return;
        }

        // Find new admin messages not yet seen
        const newAdminMsgs = messages.filter(
            m => m.sender === 'admin' && !seenIds.current.has(m.id)
        );

        newAdminMsgs.forEach(m => {
            seenIds.current.add(m.id);
            // Don't notify if already on messages page
            if (location.pathname === '/dashboard/messages') return;
            toast(m.text, {
                duration: 6000,
                icon: '💬',
                description: 'FitElite Coach',
                action: {
                    label: 'View',
                    onClick: () => { window.location.href = '/dashboard/messages'; },
                },
            });
        });
    }, [messages, location.pathname]);

    return null;
}


