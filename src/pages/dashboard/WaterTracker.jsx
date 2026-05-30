import React, { useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { today } from '@/lib/fitnessUtils';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import ProgressRing from '@/components/ui/ProgressRing';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import { Button } from '@/components/ui/button';
import { Droplets, Plus, Trash2 } from 'lucide-react';

const quickAmounts = [150, 250, 350, 500, 750];

export default function WaterTracker() {
    const { user } = useAuth();
    const qc = useQueryClient();
    const todayStr = today();

    const { data: profiles } = useQuery({ queryKey: ['userProfile', user?.email], queryFn: () => entities.UserProfile.filter({ user_email: user?.email }), enabled: !!user?.email });
    const profile = profiles?.[0];

    const { data: logs = [] } = useQuery({ queryKey: ['water', todayStr, user?.email], queryFn: () => entities.WaterLog.filter({ user_email: user?.email, date: todayStr }), enabled: !!user?.email });

    const addWater = useMutation({
        mutationFn: (ml) => entities.WaterLog.create({ user_email: user.email, date: todayStr, amount_ml: ml, time: new Date().toLocaleTimeString() }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['water'] }),
    });

    const deleteWater = useMutation({
        mutationFn: (id) => entities.WaterLog.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['water'] }),
    });

    const total = useMemo(() => logs.reduce((s, l) => s + (l.amount_ml || 0), 0), [logs]);
    const goal = profile?.water_goal_ml || 2500;
    const glasses = Math.floor(total / 250);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-space font-bold">Water Tracker</h1>

            <div className="grid lg:grid-cols-3 gap-6">
                <GlassCard className="lg:col-span-1 flex flex-col items-center">
                    <ProgressRing value={total} max={goal} size={200} strokeWidth={14} color="#3b82f6">
                        <div className="text-center">
                            <Droplets className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                            <div className="text-3xl font-bold font-space text-blue-400">
                                <AnimatedCounter value={Math.round(total / 10) * 10} />
                            </div>
                            <div className="text-xs text-muted-foreground">/ {goal} ml</div>
                        </div>
                    </ProgressRing>
                    <div className="mt-4 text-center">
                        <div className="text-sm text-muted-foreground">{glasses} glasses today</div>
                        <div className="text-xs text-muted-foreground mt-1">{Math.round((total / goal) * 100)}% of daily goal</div>
                    </div>
                </GlassCard>

                <GlassCard className="lg:col-span-2">
                    <h3 className="font-semibold mb-4">Quick Add</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
                        {quickAmounts.map(ml => (
                            <motion.button
                                key={ml}
                                className="glass rounded-2xl p-4 text-center hover:bg-blue-500/10 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => addWater.mutate(ml)}
                            >
                                <Droplets className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                                <div className="text-sm font-bold">{ml}ml</div>
                            </motion.button>
                        ))}
                    </div>

                    <h3 className="font-semibold mb-3">Today's Log</h3>
                    {logs.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No water logged yet. Stay hydrated! 💧</p>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {logs.map(log => (
                                <motion.div key={log.id} className="flex items-center justify-between glass rounded-xl p-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <div className="flex items-center gap-3">
                                        <Droplets className="w-4 h-4 text-blue-400" />
                                        <div>
                                            <span className="font-medium text-sm">{log.amount_ml}ml</span>
                                            <span className="text-xs text-muted-foreground ml-2">{log.time}</span>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-400 h-8 w-8" onClick={() => deleteWater.mutate(log.id)}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </GlassCard>
            </div>
        </div>
    );
}


