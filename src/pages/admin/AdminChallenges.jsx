import React, { useState, useMemo } from 'react';
import { entities } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trophy, Flame, Footprints, Droplets, Dumbbell, Clock, Plus, Crown, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, differenceInDays } from 'date-fns';
import { today } from '@/lib/fitnessUtils';

const TYPE_CONFIG = {
    steps: { icon: Footprints, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    water: { icon: Droplets, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    streak: { icon: Flame, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    workout: { icon: Dumbbell, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    weightloss: { icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
};

const emptyChallenge = { name: '', type: 'steps', duration_days: '7', description: '', reward_badge: '', prize: '' };

export default function AdminChallenges() {
    const qc = useQueryClient();
    const [showCreate, setShowCreate] = useState(false);
    const [newChallenge, setNewChallenge] = useState(emptyChallenge);

    const { data: challenges = [], isLoading } = useQuery({
        queryKey: ['challenges'],
        queryFn: () => entities.Challenge.filter({ is_active: true }, '-created_date'),
    });

    const { data: allProfiles = [] } = useQuery({
        queryKey: ['admin-profiles'],
        queryFn: () => entities.UserProfile.list(),
    });

    const createChallenge = useMutation({
        mutationFn: (data) => {
            const startDate = today();
            const endDate = format(addDays(new Date(), Number(data.duration_days) || 7), 'yyyy-MM-dd');
            return entities.Challenge.create({
                ...data,
                duration_days: Number(data.duration_days) || 7,
                start_date: startDate,
                end_date: endDate,
                is_active: true,
            });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['challenges'] });
            setShowCreate(false);
            setNewChallenge(emptyChallenge);
            toast.success('Challenge created!');
        },
    });

    const deleteChallenge = useMutation({
        mutationFn: (id) => entities.Challenge.update(id, { is_active: false }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['challenges'] }); toast.success('Challenge removed'); },
    });

    // Leaderboard from real user profiles sorted by XP
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

    const topNames = leaderboard.slice(0, 3).map(u => u.name);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-space font-bold flex items-center gap-2"><Trophy className="w-7 h-7 text-yellow-400" /> Challenges & Leaderboard</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage active challenges — leaderboard pulls from live user data</p>
                </div>
                <Button onClick={() => setShowCreate(!showCreate)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
                    <Plus className="w-4 h-4 mr-2" /> Create Challenge
                </Button>
            </div>

            {showCreate && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl p-5 border border-yellow-500/20">
                    <h3 className="font-semibold mb-4 text-yellow-400">New Challenge</h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="sm:col-span-2 lg:col-span-3">
                            <Label className="text-xs">Challenge Name</Label>
                            <Input value={newChallenge.name} onChange={e => setNewChallenge(n => ({ ...n, name: e.target.value }))} placeholder="30-Day Streak War" className="mt-1 bg-white/5 border-white/10" />
                        </div>
                        <div>
                            <Label className="text-xs">Type</Label>
                            <select value={newChallenge.type} onChange={e => setNewChallenge(n => ({ ...n, type: e.target.value }))}
                                className="mt-1 w-full h-9 px-3 rounded-md bg-secondary border border-white/10 text-sm text-foreground">
                                <option value="steps">Steps</option>
                                <option value="water">Hydration</option>
                                <option value="streak">Streak</option>
                                <option value="workout">Workout</option>
                                <option value="weightloss">Weight Loss</option>
                            </select>
                        </div>
                        <div>
                            <Label className="text-xs">Duration (days)</Label>
                            <Input type="number" value={newChallenge.duration_days} onChange={e => setNewChallenge(n => ({ ...n, duration_days: e.target.value }))} className="mt-1 bg-white/5 border-white/10" />
                        </div>
                        <div>
                            <Label className="text-xs">Reward Badge</Label>
                            <Input value={newChallenge.reward_badge} onChange={e => setNewChallenge(n => ({ ...n, reward_badge: e.target.value }))} placeholder="🏆 Champion Badge" className="mt-1 bg-white/5 border-white/10" />
                        </div>
                        <div className="sm:col-span-2 lg:col-span-3">
                            <Label className="text-xs">Description</Label>
                            <Input value={newChallenge.description} onChange={e => setNewChallenge(n => ({ ...n, description: e.target.value }))} placeholder="Challenge description..." className="mt-1 bg-white/5 border-white/10" />
                        </div>
                        <div>
                            <Label className="text-xs">Prize / Trophy Text</Label>
                            <Input value={newChallenge.prize} onChange={e => setNewChallenge(n => ({ ...n, prize: e.target.value }))} placeholder="🔥 Legend Status" className="mt-1 bg-white/5 border-white/10" />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <Button onClick={() => createChallenge.mutate(newChallenge)} disabled={!newChallenge.name.trim() || createChallenge.isPending}
                            className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
                            {createChallenge.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Create Challenge
                        </Button>
                        <Button variant="outline" className="border-white/10" onClick={() => setShowCreate(false)}>Cancel</Button>
                    </div>
                </motion.div>
            )}

            {/* Active Challenges from DB */}
            {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : (
                <div>
                    <h3 className="font-semibold mb-3">Active Challenges</h3>
                    {challenges.length === 0 ? (
                        <div className="glass rounded-2xl p-10 text-center border border-white/5 text-muted-foreground">
                            No challenges yet. Create the first one above.
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 gap-4">
                            {challenges.map((ch, i) => {
                                const conf = TYPE_CONFIG[ch.type] || TYPE_CONFIG.streak;
                                const CIcon = conf.icon;
                                const endDays = ch.end_date ? Math.max(0, differenceInDays(new Date(ch.end_date), new Date())) : ch.duration_days;
                                return (
                                    <motion.div key={ch.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                                        <div className={`glass rounded-2xl p-5 border ${conf.border} h-full relative`}>
                                            <button onClick={() => deleteChallenge.mutate(ch.id)}
                                                className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                            <div className="flex items-center justify-between mb-3 pr-6">
                                                <div className={`w-10 h-10 rounded-xl ${conf.bg} flex items-center justify-center`}>
                                                    <CIcon className={`w-5 h-5 ${conf.color}`} />
                                                </div>
                                                <div className={`text-xs px-2 py-1 rounded-full ${conf.bg} ${conf.color} font-medium`}>
                                                    {endDays === 0 ? '⚡ Last Day!' : `${endDays} days left`}
                                                </div>
                                            </div>
                                            <h4 className="font-semibold mb-1">{ch.name}</h4>
                                            {ch.description && <p className="text-xs text-muted-foreground mb-3">{ch.description}</p>}
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{ch.duration_days} days</span>
                                                <span>👥 {allProfiles.length} participants</span>
                                            </div>
                                            {topNames.length > 0 && (
                                                <div className="mb-3">
                                                    <div className="text-xs text-muted-foreground mb-1.5">Top 3 (by XP)</div>
                                                    {topNames.map((name, ri) => (
                                                        <div key={ri} className="flex items-center gap-2 py-0.5">
                                                            <span className="text-sm">{ri === 0 ? '🥇' : ri === 1 ? '🥈' : '🥉'}</span>
                                                            <span className="text-xs font-medium capitalize">{name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {ch.prize && <div className={`text-xs px-3 py-2 rounded-xl ${conf.bg} ${conf.color} text-center font-medium`}>{ch.prize}</div>}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

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
                                    <div className="text-xs text-muted-foreground">Streak: {u.streak} days 🔥</div>
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