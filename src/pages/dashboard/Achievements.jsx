import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import { Flame, Trophy, Droplets, Footprints, Dumbbell, Target, Award, Star, Zap, Moon, Sun } from 'lucide-react';

const ICON_MAP = { Flame, Trophy, Droplets, Footprints, Dumbbell, Target, Award, Star, Zap, Moon, Sun };
const COLOR_MAP = {
    yellow: { text: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    orange: { text: 'text-orange-400', bg: 'bg-orange-500/10' },
    red: { text: 'text-red-400', bg: 'bg-red-500/10' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    blue: { text: 'text-blue-400', bg: 'bg-blue-500/10' },
    cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    purple: { text: 'text-purple-400', bg: 'bg-purple-500/10' },
    indigo: { text: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    pink: { text: 'text-pink-400', bg: 'bg-pink-500/10' },
};

export default function Achievements() {
    const { user } = useAuth();

    const { data: profiles } = useQuery({ queryKey: ['userProfile', user?.email], queryFn: () => entities.UserProfile.filter({ user_email: user?.email }), enabled: !!user?.email });
    const { data: achievements = [], isLoading } = useQuery({ queryKey: ['achievements'], queryFn: () => entities.Achievement.filter({ is_active: true }, 'sort_order') });

    const profile = profiles?.[0];
    const earned = profile?.achievements || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-space font-bold">Achievements</h1>
                <div className="flex items-center gap-3">
                    <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="font-bold font-space"><AnimatedCounter value={profile?.total_xp || 0} /></span>
                        <span className="text-xs text-muted-foreground">XP</span>
                    </div>
                    <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-400" />
                        <span className="font-bold font-space">{profile?.login_streak || 0}</span>
                        <span className="text-xs text-muted-foreground">Streak</span>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <GlassCard className="text-center">
                    <div className="text-3xl font-bold font-space text-emerald-400"><AnimatedCounter value={earned.length} /></div>
                    <div className="text-xs text-muted-foreground mt-1">Earned</div>
                </GlassCard>
                <GlassCard className="text-center">
                    <div className="text-3xl font-bold font-space text-muted-foreground">{achievements.length - earned.length}</div>
                    <div className="text-xs text-muted-foreground mt-1">Remaining</div>
                </GlassCard>
                <GlassCard className="text-center">
                    <div className="text-3xl font-bold font-space text-yellow-400">{profile?.longest_streak || 0}</div>
                    <div className="text-xs text-muted-foreground mt-1">Best Streak</div>
                </GlassCard>
            </div>

            {isLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => <div key={i} className="h-24 glass rounded-2xl animate-pulse" />)}
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {achievements.map((ach, i) => {
                        const isEarned = earned.includes(ach.achievement_id);
                        const IconComp = ICON_MAP[ach.icon] || Star;
                        const colors = COLOR_MAP[ach.color] || COLOR_MAP.yellow;
                        return (
                            <motion.div key={ach.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                <GlassCard animate={false} className={`${isEarned ? '' : 'opacity-40'} transition-opacity`} glowColor={isEarned ? 'green' : 'none'}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                                            <IconComp className={`w-7 h-7 ${colors.text}`} />
                                        </div>
                                        <div>
                                            <div className="font-semibold">{ach.name}</div>
                                            <div className="text-xs text-muted-foreground">{ach.description}</div>
                                            {isEarned && <div className="text-xs text-emerald-400 mt-1">✓ Earned · {ach.xp_reward} XP</div>}
                                            {!isEarned && <div className="text-xs text-muted-foreground/50 mt-1">+{ach.xp_reward} XP on unlock</div>}
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}


