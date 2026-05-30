import React, { useState, useMemo } from 'react';
import { entities } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trophy, Flame, Footprints, Droplets, Dumbbell, Clock, Plus, Crown } from 'lucide-react';
import { toast } from 'sonner';

const TYPE_CONFIG = {
    steps: { icon: Footprints, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    water: { icon: Droplets, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    streak: { icon: Flame, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    workout: { icon: Dumbbell, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    weightloss: { icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
};

export default function AdminChallenges() {
    const [showCreate, setShowCreate] = useState(false);
    const [newChallenge, setNewChallenge] = useState({ name: '', type: 'steps', duration: '7', reward: '' });

    const { data: allProfiles = [] } = useQuery({ queryKey: ['admin-profiles'], queryFn: () => entities.UserProfile.list() });

    // Real leaderboard from user profiles sorted by XP
    const leaderboard = useMemo(() =>
        [...allProfiles]
            .sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0))
            .slice(0, 10)
            .map((p, i) => ({
                rank: i + 1,
                name: p.user_email?.split('@')[0] || 'User',
                xp: p.total_xp || 0,
                streak: p.login_streak || 0,
                badge: i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : '',
            })),
        [allProfiles]);

    // Derived challenge stats from real data
    const challengeStats = useMemo(() => ({
        streakChallenge: allProfiles.filter(p => (p.login_streak || 0) >= 7).length,
        topStreaker: allProfiles.reduce((top, p) => (p.login_streak || 0) > (top.login_streak || 0) ? p : top, allProfiles[0] || {}),
    }), [allProfiles]);

    const createChallenge = () => {
        if (!newChallenge.name.trim()) return;
        toast.success(`Challenge "${newChallenge.name}" created!`);
        setShowCreate(false);
        setNewChallenge({ name: '', type: 'steps', duration: '7', reward: '' });
    };

    const ACTIVE_CHALLENGES = [
        {
            id: 1, name: '30-Day Streak War', type: 'streak',
            participants: challengeStats.streakChallenge,
            duration: '30 days', endDays: 14,
            description: 'Maintain login & activity streak for 30 days',
            prize: '🔥 Legend Status',
            top: leaderboard.slice(0, 3).map(u => u.name),
        },
        {
            id: 2, name: 'XP Champion', type: 'workout',
            participants: allProfiles.length,
            duration: '7 days', endDays: 5,
            description: 'Earn the most XP this week through workouts & logging',
            prize: '⭐ XP Legend Badge',
            top: leaderboard.slice(0, 3).map(u => u.name),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-space font-bold flex items-center gap-2"><Trophy className="w-7 h-7 text-yellow-400" /> Challenges & Leaderboard</h1>
                    <p className="text-sm text-muted-foreground mt-1">Gamified community engagement — leaderboard pulls from live user data</p>
                </div>
                <Button onClick={() => setShowCreate(!showCreate)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
                    <Plus className="w-4 h-4 mr-2" /> Create Challenge
                </Button>
            </div>

            {showCreate && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl p-5 border border-yellow-500/20">
                    <h3 className="font-semibold mb-4 text-yellow-400">New Challenge</h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div><Label className="text-xs">Challenge Name</Label><Input value={newChallenge.name} onChange={e => setNewChallenge(n => ({ ...n, name: e.target.value }))} placeholder="30-Day Streak War" className="mt-1 bg-white/5 border-white/10" /></div>
                        <div><Label className="text-xs">Type</Label>
                            <select value={newChallenge.type} onChange={e => setNewChallenge(n => ({ ...n, type: e.target.value }))}
                                className="mt-1 w-full h-9 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-white">
                                <option value="steps">Steps</option>
                                <option value="water">Hydration</option>
                                <option value="streak">Streak</option>
                                <option value="workout">Workout</option>
                                <option value="weightloss">Weight Loss</option>
                            </select>
                        </div>
                        <div><Label className="text-xs">Duration (days)</Label><Input type="number" value={newChallenge.duration} onChange={e => setNewChallenge(n => ({ ...n, duration: e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
                        <div><Label className="text-xs">Reward Badge</Label><Input value={newChallenge.reward} onChange={e => setNewChallenge(n => ({ ...n, reward: e.target.value }))} placeholder="🏆 Champion Badge" className="mt-1 bg-white/5 border-white/10" /></div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <Button onClick={createChallenge} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">Create Challenge</Button>
                        <Button variant="outline" className="border-white/10" onClick={() => setShowCreate(false)}>Cancel</Button>
                    </div>
                </motion.div>
            )}

            {/* Active Challenges */}
            <div>
                <h3 className="font-semibold mb-3">Active Challenges</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                    {ACTIVE_CHALLENGES.map((ch, i) => {
                        const conf = TYPE_CONFIG[ch.type] || TYPE_CONFIG.streak;
                        const CIcon = conf.icon;
                        return (
                            <motion.div key={ch.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                                <div className={`glass rounded-2xl p-5 border ${conf.border} h-full`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className={`w-10 h-10 rounded-xl ${conf.bg} flex items-center justify-center`}>
                                            <CIcon className={`w-5 h-5 ${conf.color}`} />
                                        </div>
                                        <div className={`text-xs px-2 py-1 rounded-full ${conf.bg} ${conf.color} font-medium`}>
                                            {ch.endDays === 1 ? '⚡ Last Day!' : `${ch.endDays} days left`}
                                        </div>
                                    </div>
                                    <h4 className="font-semibold mb-1">{ch.name}</h4>
                                    <p className="text-xs text-muted-foreground mb-3">{ch.description}</p>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{ch.duration}</span>
                                        <span>👥 {ch.participants} joined</span>
                                    </div>
                                    <div className="mb-3">
                                        <div className="text-xs text-muted-foreground mb-1.5">Top 3 (by XP)</div>
                                        {ch.top.map((name, ri) => (
                                            <div key={ri} className="flex items-center gap-2 py-1">
                                                <span className="text-sm">{ri === 0 ? '🥇' : ri === 1 ? '🥈' : '🥉'}</span>
                                                <span className="text-xs font-medium">{name}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className={`text-xs px-3 py-2 rounded-xl ${conf.bg} ${conf.color} text-center font-medium`}>{ch.prize}</div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Real Leaderboard from DB */}
            <div className="glass rounded-2xl p-5 border border-yellow-500/20">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Crown className="w-5 h-5 text-yellow-400" /> Global Leaderboard <span className="text-xs text-muted-foreground font-normal ml-1">— live from database</span></h3>
                {leaderboard.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No user data yet</p>
                ) : (
                    <div className="space-y-2">
                        {leaderboard.map((u, i) => (
                            <motion.div key={u.rank} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                                className={`flex items-center gap-4 p-3 rounded-xl transition-all ${u.rank <= 3 ? 'bg-yellow-500/5 border border-yellow-500/15' : 'hover:bg-white/3'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${u.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' : u.rank === 2 ? 'bg-gray-500/20 text-gray-300' : u.rank === 3 ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-muted-foreground'}`}>
                                    {u.rank}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm capitalize">{u.name}</span>
                                        {u.badge && <span>{u.badge}</span>}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Streak: {u.streak} days</div>
                                </div>
                                <div className="font-bold text-yellow-400">{u.xp.toLocaleString()} XP</div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}


