import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { today } from '@/lib/fitnessUtils';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import ProgressRing from '@/components/ui/ProgressRing';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Footprints, Plus, Flame } from 'lucide-react';

export default function StepTracker() {
    const { user } = useAuth();
    const qc = useQueryClient();
    const todayStr = today();
    const [stepInput, setStepInput] = useState('');

    const { data: profiles } = useQuery({ queryKey: ['userProfile', user?.email], queryFn: () => entities.UserProfile.filter({ user_email: user?.email }), enabled: !!user?.email });
    const profile = profiles?.[0];

    const { data: logs = [] } = useQuery({ queryKey: ['steps', todayStr, user?.email], queryFn: () => entities.StepLog.filter({ user_email: user?.email, date: todayStr }), enabled: !!user?.email });

    const addSteps = useMutation({
        mutationFn: (steps) => entities.StepLog.create({ user_email: user.email, date: todayStr, steps, calories_burned: Math.round(steps * 0.04) }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['steps'] }); setStepInput(''); },
    });

    const totalSteps = useMemo(() => logs.reduce((s, l) => s + (l.steps || 0), 0), [logs]);
    const totalCals = useMemo(() => logs.reduce((s, l) => s + (l.calories_burned || 0), 0), [logs]);
    const goal = profile?.step_goal || 10000;

    const quickSteps = [1000, 2500, 5000];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-space font-bold">Step Tracker</h1>

            <div className="grid lg:grid-cols-3 gap-6">
                <GlassCard className="flex flex-col items-center">
                    <ProgressRing value={totalSteps} max={goal} size={200} strokeWidth={14} color="#f97316">
                        <div className="text-center">
                            <Footprints className="w-6 h-6 text-orange-400 mx-auto mb-1" />
                            <div className="text-3xl font-bold font-space text-orange-400">
                                <AnimatedCounter value={totalSteps} />
                            </div>
                            <div className="text-xs text-muted-foreground">/ {goal.toLocaleString()}</div>
                        </div>
                    </ProgressRing>
                    <div className="flex items-center gap-2 mt-4">
                        <Flame className="w-4 h-4 text-red-400" />
                        <span className="text-sm"><AnimatedCounter value={totalCals} /> cal burned</span>
                    </div>
                </GlassCard>

                <GlassCard className="lg:col-span-2">
                    <h3 className="font-semibold mb-4">Log Steps</h3>
                    <div className="flex gap-3 mb-4">
                        <Input
                            type="number"
                            placeholder="Enter steps..."
                            value={stepInput}
                            onChange={e => setStepInput(e.target.value)}
                            className="bg-white/5 border-white/10"
                        />
                        <Button
                            className="bg-orange-500 hover:bg-orange-600 text-black font-semibold"
                            disabled={!stepInput || addSteps.isPending}
                            onClick={() => addSteps.mutate(Number(stepInput))}
                        >
                            <Plus className="w-4 h-4 mr-1" /> Add
                        </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {quickSteps.map(s => (
                            <motion.button
                                key={s}
                                className="glass rounded-xl p-3 text-center hover:bg-orange-500/10 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => addSteps.mutate(s)}
                            >
                                <Footprints className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                                <div className="text-sm font-bold">+{s.toLocaleString()}</div>
                            </motion.button>
                        ))}
                    </div>

                    <h3 className="font-semibold mb-3">Today's Entries</h3>
                    {logs.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No steps logged yet. Get moving! 👟</p>
                    ) : (
                        <div className="space-y-2">
                            {logs.map(log => (
                                <div key={log.id} className="flex items-center justify-between glass rounded-xl p-3">
                                    <div className="flex items-center gap-3">
                                        <Footprints className="w-4 h-4 text-orange-400" />
                                        <span className="font-medium text-sm">{log.steps?.toLocaleString()} steps</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{log.calories_burned} cal</span>
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>
            </div>
        </div>
    );
}


