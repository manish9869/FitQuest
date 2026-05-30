import React, { useMemo } from 'react';
import { entities } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import GlassCard from '@/components/ui/GlassCard';
import { Dumbbell, Flame, Clock } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.[0]) return null;
    return (
        <div className="glass rounded-lg p-3 text-xs border border-white/10">
            <p className="font-semibold mb-1">{label}</p>
            <p className="text-purple-400">{payload[0].value} workout{payload[0].value !== 1 ? 's' : ''}</p>
            {payload[1] && <p className="text-orange-400">{payload[1].value} min</p>}
        </div>
    );
};

export default function WorkoutConsistency() {
    const { user } = useAuth();

    const { data: workouts = [] } = useQuery({
        queryKey: ['workouts-week', user?.email],
        queryFn: () => entities.WorkoutLog.filter({ user_email: user?.email }),
        enabled: !!user?.email,
    });

    const { data: profiles = [] } = useQuery({
        queryKey: ['userProfile', user?.email],
        queryFn: () => entities.UserProfile.filter({ user_email: user?.email }),
        enabled: !!user?.email,
    });
    const target = profiles[0]?.workout_frequency || 4;

    const last8Weeks = useMemo(() => {
        return Array.from({ length: 8 }, (_, i) => {
            const weekStart = startOfWeek(subDays(new Date(), i * 7), { weekStartsOn: 1 });
            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
            const label = `W${8 - i}`;
            const weekWorkouts = workouts.filter(w => {
                const d = new Date(w.date);
                return d >= weekStart && d <= weekEnd;
            });
            return {
                label,
                count: weekWorkouts.length,
                duration: weekWorkouts.reduce((s, w) => s + (w.duration_min || 0), 0),
                calories: weekWorkouts.reduce((s, w) => s + (w.calories_burned || 0), 0),
            };
        }).reverse();
    }, [workouts]);

    const thisWeek = last8Weeks[last8Weeks.length - 1];
    const totalWorkouts = workouts.length;
    const avgDuration = workouts.length ? Math.round(workouts.reduce((s, w) => s + (w.duration_min || 0), 0) / workouts.length) : 0;

    return (
        <GlassCard animate={false}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <Dumbbell className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold">Workout Consistency</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{thisWeek?.count || 0}/{target} sessions this week</p>
                    </div>
                </div>
                <div className="flex gap-4 text-right">
                    <div>
                        <div className="text-lg font-bold text-purple-400">{totalWorkouts}</div>
                        <div className="text-[10px] text-muted-foreground">Total</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold text-orange-400">{avgDuration}m</div>
                        <div className="text-[10px] text-muted-foreground">Avg Dur.</div>
                    </div>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={160}>
                <BarChart data={last8Weeks} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
                        {last8Weeks.map((entry, i) => (
                            <Cell key={i} fill={entry.count >= target ? '#a855f7' : entry.count > 0 ? '#7c3aed80' : 'rgba(255,255,255,0.05)'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            {/* Consistency percentage */}
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>8-week consistency</span>
                <span className="font-semibold text-white">
                    {last8Weeks.filter(w => w.count >= target).length} / 8 weeks on target
                </span>
            </div>
        </GlassCard>
    );
}


