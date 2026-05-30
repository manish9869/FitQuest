import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, ShieldCheck, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function Messages() {
    const { user } = useAuth();
    const qc = useQueryClient();
    const [text, setText] = useState('');
    const bottomRef = useRef(null);

    const { data: messages = [], isLoading } = useQuery({
        queryKey: ['chat-messages', user?.email],
        queryFn: () => entities.ChatMessage.filter({ user_email: user?.email }, 'sent_at', 200),
        enabled: !!user?.email,
        refetchInterval: 4000, // Poll every 4s for new messages
    });

    const sendMsg = useMutation({
        mutationFn: (txt) => entities.ChatMessage.create({
            user_email: user.email,
            sender: 'user',
            text: txt,
            sent_at: new Date().toISOString(),
            read: false,
        }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['chat-messages', user?.email] });
            setText('');
        },
    });

    // Mark admin messages as read
    useEffect(() => {
        const unread = messages.filter(m => m.sender === 'admin' && !m.read);
        unread.forEach(m => entities.ChatMessage.update(m.id, { read: true }));
    }, [messages]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!text.trim()) return;
        sendMsg.mutate(text.trim());
    };

    const sorted = [...messages].sort((a, b) => {
        const ta = a.sent_at ? new Date(a.sent_at).getTime() : new Date(a.created_date).getTime();
        const tb = b.sent_at ? new Date(b.sent_at).getTime() : new Date(b.created_date).getTime();
        return ta - tb;
    });

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            <div>
                <h1 className="text-2xl font-space font-bold flex items-center gap-2">
                    <MessageSquare className="w-7 h-7 text-blue-400" /> Coach Messages
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Chat directly with your FitElite coach</p>
            </div>

            <div className="glass rounded-2xl border border-white/5 flex flex-col overflow-hidden" style={{ height: '65vh' }}>
                {/* Header */}
                <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <div className="font-semibold text-sm">FitElite Coach</div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                            <span className="text-[11px] text-emerald-400">Online</span>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : sorted.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                            <MessageSquare className="w-12 h-12 opacity-20" />
                            <div className="text-center">
                                <p className="text-sm font-medium">No messages yet</p>
                                <p className="text-xs mt-1">Send a message to start chatting with your coach!</p>
                            </div>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {sorted.map((m) => {
                                const isMe = m.sender === 'user';
                                const time = m.sent_at
                                    ? format(new Date(m.sent_at), 'h:mm a')
                                    : m.created_date ? format(new Date(m.created_date), 'h:mm a') : '';
                                return (
                                    <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        {!isMe && (
                                            <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center mr-2 flex-shrink-0 self-end">
                                                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                                            </div>
                                        )}
                                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-emerald-500 text-white rounded-tr-sm' : 'glass border border-white/10 rounded-tl-sm'}`}>
                                            <p>{m.text}</p>
                                            <p className={`text-[10px] mt-1 ${isMe ? 'text-emerald-100' : 'text-muted-foreground'}`}>{time}</p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t border-white/5">
                    <div className="flex gap-2">
                        <Input
                            value={text}
                            onChange={e => setText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            placeholder="Message your coach..."
                            className="bg-white/5 border-white/10 flex-1"
                            disabled={sendMsg.isPending}
                        />
                        <Button
                            onClick={handleSend}
                            disabled={!text.trim() || sendMsg.isPending}
                            className="bg-emerald-500 hover:bg-emerald-600 text-black px-4"
                        >
                            {sendMsg.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}


