import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useLocation, useNavigate } from 'react-router-dom';

export default function AdminMessageNotifier() {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const seenIds = useRef(new Set());
    const initialized = useRef(false);

    // ── Debug: log what role we see ──────────────────────────────
    useEffect(() => {

    }, [user]);

    const { data: userMessages = [], error } = useQuery({
        queryKey: ['admin-user-messages-notify'],
        queryFn: async () => {

            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('sender', 'user')
                .order('created_at', { ascending: false })
                .limit(100);
            if (error) {

                throw error;
            }

            return data || [];
        },
        // ── Removed role check — run for any logged-in admin ──────
        enabled: !!user?.email,
        refetchInterval: 5000,
    });

    useEffect(() => {
        if (!userMessages.length) return;

        if (!initialized.current) {
            userMessages.forEach(m => seenIds.current.add(m.id));
            initialized.current = true;

            return;
        }

        const newMsgs = userMessages.filter(m => !seenIds.current.has(m.id));

        newMsgs.forEach(m => {
            seenIds.current.add(m.id);

            if (location.pathname === '/admin/messages') {

                return;
            }

            const sender = m.user_email?.split('@')[0] || 'A client';
            const preview = m.text?.length > 70 ? m.text.slice(0, 70) + '…' : m.text;



            toast(`💬 ${sender} sent a message`, {
                duration: 3000,
                description: preview,
                action: {
                    label: 'Reply',
                    onClick: () => navigate('/admin/messages'),
                },
            });
        });
    }, [userMessages, location.pathname]);

    return null;
}