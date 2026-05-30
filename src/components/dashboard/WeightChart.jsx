import React, { useState } from 'react';
import { entities } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, subDays } from 'date-fns';
import { today } from '@/lib/fitnessUtils';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Scale, TrendingDown, TrendingUp, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.[0]) return null;
    return (
        <div className="glass rounded-lg p-3 text-xs border border-white/10">
            <p className="font-semibold mb-1">{label}</p>
            <p className="text-blue-400">{payload[0].value} kg</p>
        </div>
    );
};

export default function WeightChart() {
    const { user } = useAuth();
    const qc = useQueryClient();
    const [newWeight, setNewWeight] = useState('');

    const { data: weightLogs = [] } = useQuery({
        queryKey: ['weight-logs', user?.email],
        queryFn: () => entities.WeightLog.filter({ user_email: user?.email }),
        enabled: !!user?.email,
    });

    const { data: profiles = [] } = useQuery({
        queryKey: ['userProfile', user?.email],
        queryFn: () => entities.UserProfile.filter({ user_email: user?.email }),
        enabled: !!user?.email,
    });
    const profile = profiles[0];

    const addWeight = useMutation({
        mutationFn: (weight) => entities.WeightLog.create({ user_email: user.email, date: today(), weight_kg: weight }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['weight-logs'] }); setNewWeight(''); toast.success('Weight logged!'); },
    });

    const last30 = Array.from({ length: 30 }, (_, i) => format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'));
    const chartData = last30
        .map(date => {
            const log = weightLogs.find(w => w.date === date);
            return log ? { date: format(new Date(date), 'MMM d'), weight: log.weight_kg } : null;
        })
        .filter(Boolean);

    const sorted = [...weightLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
    const latest = sorted[sorted.length - 1]?.weight_kg;
    const prev = sorted[sorted.length - 2]?.weight_kg;
    const target = profile?.target_weight_kg;
    const diff = latest && prev ? (latest - prev).toFixed(1) : null;
    const trending = diff < 0 ? 'down' : diff > 0 ? 'up' : 'same';

    return (
        <GlassCard animate={false}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Scale className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold">Weight Progress</h3>
                        {latest && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                <span className="text-white font-medium">{latest} kg</span>
                                {diff !== null && (
                                    <span className={`flex items-center gap-0.5 ${trending === 'down' ? 'text-emerald-400' : trending === 'up' ? 'text-red-400' : 'text-muted-foreground'}`}>
                                        {trending === 'down' ? <TrendingDown className="w-3 h-3" /> : trending === 'up' ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                        {diff > 0 ? '+' : ''}{diff} kg
                                    </span>
                                )}
                                {target && <span className="text-muted-foreground">→ Goal: {target} kg</span>}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        step="0.1"
                        placeholder="kg"
                        value={newWeight}
                        onChange={e => setNewWeight(e.target.value)}
                        className="w-20 h-8 text-sm bg-white/5 border-white/10"
                    />
                    <Button size="sm" className="h-8 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-0"
                        disabled={!newWeight || addWeight.isPending}
                        onClick={() => addWeight.mutate(Number(newWeight))}>
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={chartData}>
                        <defs>
                            <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                        <YAxis domain={['auto', 'auto']} stroke="rgba(255,255,255,0.3)" fontSize={11} />
                        <Tooltip content={<CustomTooltip />} />
                        {target && <ReferenceLine y={target} stroke="#22c55e" strokeDasharray="4 4" label={{ value: 'Goal', fill: '#22c55e', fontSize: 11 }} />}
                        <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-32 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                    <Scale className="w-8 h-8 opacity-30" />
                    <p>Log your first weigh-in above</p>
                </div>
            )}
        </GlassCard>
    );
}


