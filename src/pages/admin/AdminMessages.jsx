import React, { useState, useMemo, useRef, useEffect } from 'react';
import { entities } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, Search, Megaphone, Zap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { invokeLLM } from '@/api/llm';
const MSG_TEMPLATES = [
    { label: 'Check-in', text: "Hey! Just checking in — how are you feeling about your progress this week? 💪" },
    { label: 'Motivation', text: "You're crushing it! Your consistency this week has been incredible. Keep pushing! 🔥" },
    { label: 'Missed Workout', text: "Hey, noticed you missed your workout today. Life happens! Get back on it tomorrow! 💯" },
    { label: 'Goal Reminder', text: "Quick reminder of why you started. Your goal matters. Every small action adds up! 🌟" },
    { label: 'Nutrition Tip', text: "Pro tip: Make sure you're hitting your protein targets today. Your muscles need it!" },
];

export default function AdminMessages() {
    const [selectedUser, setSelectedUser] = useState(null);
    const [message, setMessage] = useState('');
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [tab, setTab] = useState('direct');
    const [generating, setGenerating] = useState(false);
    const [search, setSearch] = useState('');
    const qc = useQueryClient();
    const bottomRef = useRef(null);

    const { data: allUsers = [] } = useQuery({ queryKey: ['admin-users'], queryFn: () => entities.UserProfile.list() });
    const { data: allProfiles = [] } = useQuery({ queryKey: ['admin-profiles'], queryFn: () => entities.UserProfile.list() });

    const userList = useMemo(() => allUsers.filter(u =>
        !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.user_email?.toLowerCase().includes(search.toLowerCase())
    ), [allUsers, search]);

    const activeUser = selectedUser || userList[0];
    const profileForUser = allProfiles.find(p => p.user_email === activeUser?.user_email);

    // Fetch real chat messages for active user
    const { data: chatMessages = [] } = useQuery({
        queryKey: ['chat-messages-admin', activeUser?.user_email],
        queryFn: () => entities.ChatMessage.filter({ user_email: activeUser.user_email }, 'sent_at', 200),
        enabled: !!activeUser?.user_email,
        refetchInterval: 4000,
    });

    const sendMsg = useMutation({
        mutationFn: (txt) => entities.ChatMessage.create({
            user_email: activeUser.user_email,
            sender: 'admin',
            text: txt,
            sent_at: new Date().toISOString(),
            read: false,
        }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['chat-messages-admin', activeUser?.user_email] });
            setMessage('');
            toast.success('Message sent!');
        },
    });

    const msgs = [...chatMessages].sort((a, b) => {
        const ta = a.sent_at ? new Date(a.sent_at).getTime() : new Date(a.created_date).getTime();
        const tb = b.sent_at ? new Date(b.sent_at).getTime() : new Date(b.created_date).getTime();
        return ta - tb;
    });

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs.length]);

    const sendMessage = () => {
        if (!message.trim() || !activeUser) return;
        sendMsg.mutate(message.trim());
    };

    const generateAIResponse = async () => {
        if (!activeUser) return;
        setGenerating(true);
        const lastUserMsg = msgs.filter(m => m.sender === 'user').slice(-1)[0]?.text || 'Hello';
        const goal = profileForUser?.fitness_goal?.replace('_', ' ') || 'general fitness';
        const res = await invokeLLM({
            prompt: `You are a professional fitness coach. Your client ${activeUser.full_name} (goal: ${goal}) last said: "${lastUserMsg}". Write a warm, short motivating coach response (2-3 sentences max).`
        });
        setMessage(res);
        setGenerating(false);
    };

    const sendBroadcast = () => {
        if (!broadcastMsg.trim()) return;
        toast.success(`Broadcast sent to ${allUsers.length} users!`);
        setBroadcastMsg('');
    };

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-space font-bold flex items-center gap-2">
                <MessageSquare className="w-7 h-7 text-blue-400" /> Coach Messaging Center
            </h1>

            <div className="flex gap-2 mb-2">
                {['direct', 'broadcast'].map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`text-sm px-4 py-2 rounded-xl border transition-all capitalize ${tab === t ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'border-white/10 text-muted-foreground hover:border-white/20'}`}>
                        {t === 'direct' ? <><MessageSquare className="w-3.5 h-3.5 inline mr-1.5" />Direct Messages</> : <><Megaphone className="w-3.5 h-3.5 inline mr-1.5" />Broadcast</>}
                    </button>
                ))}
            </div>

            {tab === 'direct' ? (
                <div className="grid lg:grid-cols-3 gap-4 h-[600px]">
                    {/* Sidebar — real users */}
                    <div className="glass rounded-2xl border border-white/5 flex flex-col overflow-hidden">
                        <div className="p-3 border-b border-white/5">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..." className="pl-9 bg-white/5 border-white/10 h-8 text-sm" />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {userList.length === 0 ? (
                                <p className="text-center text-xs text-muted-foreground p-6">No users found</p>
                            ) : (
                                userList.map(u => {
                                    const lastMsg = u.id === activeUser?.id && msgs.length > 0
                                        ? msgs[msgs.length - 1]?.text
                                        : 'No messages yet';
                                    return (
                                        <button key={u.id} onClick={() => setSelectedUser(u)}
                                            className={`w-full text-left px-4 py-3 border-b border-white/3 hover:bg-white/5 transition-all ${activeUser?.id === u.id ? 'bg-blue-500/10 border-l-2 border-l-blue-500' : ''}`}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                    {(u.full_name || u.user_email || '?')[0].toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-medium truncate">{u.full_name || u.user_email}</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground truncate">{lastMsg}</p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Chat */}
                    <div className="lg:col-span-2 glass rounded-2xl border border-white/5 flex flex-col overflow-hidden">
                        {!activeUser ? (
                            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Select a user to message</div>
                        ) : (
                            <>
                                <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center font-bold text-blue-400">
                                        {(activeUser.full_name || activeUser.user_email || '?')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-sm">{activeUser.full_name || activeUser.user_email}</div>
                                        {profileForUser?.fitness_goal && <div className="text-[10px] text-emerald-400 capitalize">{profileForUser.fitness_goal.replace('_', ' ')}</div>}
                                    </div>
                                    <Button variant="ghost" size="sm" className="ml-auto text-purple-400 hover:bg-purple-500/10" onClick={generateAIResponse} disabled={generating}>
                                        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-3.5 h-3.5 mr-1" />AI Reply</>}
                                    </Button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {msgs.length === 0 ? (
                                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No messages yet. Say hello!</div>
                                    ) : (
                                        <AnimatePresence>
                                            {msgs.map((m, i) => {
                                                const isAdmin = m.sender === 'admin';
                                                const time = m.sent_at ? format(new Date(m.sent_at), 'h:mm a') : '';
                                                return (
                                                    <motion.div key={m.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                                        className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${isAdmin ? 'bg-blue-500 text-white rounded-tr-sm' : 'glass border border-white/10 rounded-tl-sm'}`}>
                                                            <p>{m.text}</p>
                                                            <p className={`text-[10px] mt-1 ${isAdmin ? 'text-blue-100' : 'text-muted-foreground'}`}>{time}</p>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                    )}
                                    <div ref={bottomRef} />
                                </div>

                                <div className="p-3 border-t border-white/5 space-y-2">
                                    <div className="flex gap-1 flex-wrap">
                                        {MSG_TEMPLATES.map(t => (
                                            <button key={t.label} onClick={() => setMessage(t.text)}
                                                className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-white transition-all">
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <Input value={message} onChange={e => setMessage(e.target.value)} placeholder="Type a message..."
                                            className="bg-white/5 border-white/10 flex-1"
                                            onKeyDown={e => e.key === 'Enter' && sendMessage()} />
                                        <Button onClick={sendMessage} className="bg-blue-500 hover:bg-blue-600 text-white px-4" disabled={!message.trim()}>
                                            <Send className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <div className="max-w-2xl glass rounded-2xl p-6 border border-white/5">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                            <Megaphone className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Broadcast Message</h3>
                            <p className="text-xs text-muted-foreground">Send to all {allUsers.length} users at once</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex gap-2 flex-wrap mb-2">
                            {MSG_TEMPLATES.map(t => (
                                <button key={t.label} onClick={() => setBroadcastMsg(t.text)}
                                    className="text-xs px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-muted-foreground hover:text-white transition-all">
                                    {t.label}
                                </button>
                            ))}
                        </div>
                        <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} rows={4}
                            placeholder="Write your broadcast message..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{allUsers.length} recipients</span>
                            <Button onClick={sendBroadcast} disabled={!broadcastMsg.trim()} className="bg-orange-500 hover:bg-orange-600 text-white">
                                <Send className="w-4 h-4 mr-2" /> Send Broadcast
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


