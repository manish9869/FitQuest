import React, { useMemo } from 'react';
import { entities } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import GlassCard from '@/components/ui/GlassCard';
import PersistentResizable from '@/components/ui/PersistentResizable';
import { useWidgetSizes } from '@/lib/useWidgetSizes';
import { BarChart3, PieChart as PieIcon, TrendingUp } from 'lucide-react';
import { goalLabels } from '@/lib/fitnessUtils';

const COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f97316', '#ef4444'];

export default function AdminAnalytics() {
    const { user } = useAuth();
    const qc = useQueryClient();
    const { data: profiles = [] } = useQuery({ queryKey: ['admin-profiles'], queryFn: () => entities.UserProfile.list() });
    const { data: myProfiles = [] } = useQuery({ queryKey: ['userProfile', user?.email], queryFn: () => entities.UserProfile.filter({ user_email: user?.email }), enabled: !!user?.email });
    const myProfile = myProfiles[0];

    const updateProfile = useMutation({
        mutationFn: (data) => entities.UserProfile.update(myProfile.id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['userProfile'] }),
    });

    const { getSavedSize, handleSizeChange } = useWidgetSizes(myProfile, (data) => {
        if (myProfile?.id) updateProfile.mutate(data);
    });

    const goalDistribution = useMemo(() => {
        const counts = {};
        profiles.forEach(p => { const g = p.fitness_goal || 'unknown'; counts[g] = (counts[g] || 0) + 1; });
        return Object.entries(counts).map(([name, value]) => ({ name: goalLabels[name] || name, value }));
    }, [profiles]);

    const streakDistribution = useMemo(() => {
        const buckets = { '0': 0, '1-7': 0, '8-14': 0, '15-30': 0, '30+': 0 };
        profiles.forEach(p => {
            const s = p.login_streak || 0;
            if (s === 0) buckets['0']++;
            else if (s <= 7) buckets['1-7']++;
            else if (s <= 14) buckets['8-14']++;
            else if (s <= 30) buckets['15-30']++;
            else buckets['30+']++;
        });
        return Object.entries(buckets).map(([name, value]) => ({ name, value }));
    }, [profiles]);

    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload?.[0]) return null;
        return (
            <div className="glass rounded-lg p-3 text-xs">
                <p className="font-semibold">{payload[0].name}: {payload[0].value}</p>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-space font-bold flex items-center gap-3"><BarChart3 className="w-7 h-7 text-blue-400" /> Platform Analytics</h1>

            <div className="grid lg:grid-cols-2 gap-6">
                <PersistentResizable widgetId="admin_goal_dist" savedSize={getSavedSize('admin_goal_dist')} onSizeChange={handleSizeChange} defaultHeight={260} title="Goal Distribution" icon={PieIcon} accentColor="#22c55e">
                    {(height) => (
                        <ResponsiveContainer width="100%" height={height || 220}>
                            <PieChart>
                                <Pie data={goalDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={Math.min((height || 220) / 2.5, 90)} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                    {goalDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </PersistentResizable>

                <PersistentResizable widgetId="admin_streak_dist" savedSize={getSavedSize('admin_streak_dist')} onSizeChange={handleSizeChange} defaultHeight={260} title="Streak Distribution" icon={TrendingUp} accentColor="#a855f7">
                    {(height) => (
                        <ResponsiveContainer width="100%" height={height || 220}>
                            <BarChart data={streakDistribution}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" fill="#a855f7" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </PersistentResizable>
            </div>

            {/* Top Performers */}
            <GlassCard>
                <h3 className="font-semibold mb-4">Top Performers</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="text-left py-3 px-4 text-muted-foreground">#</th>
                                <th className="text-left py-3 px-4 text-muted-foreground">User</th>
                                <th className="text-left py-3 px-4 text-muted-foreground">Streak</th>
                                <th className="text-left py-3 px-4 text-muted-foreground">XP</th>
                                <th className="text-left py-3 px-4 text-muted-foreground">Goal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...profiles].sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0)).slice(0, 10).map((p, i) => (
                                <tr key={p.id} className="border-b border-white/5">
                                    <td className="py-3 px-4 font-bold">{i + 1}</td>
                                    <td className="py-3 px-4">{p.user_email}</td>
                                    <td className="py-3 px-4">{p.login_streak || 0} 🔥</td>
                                    <td className="py-3 px-4 font-bold text-yellow-400">{p.total_xp || 0}</td>
                                    <td className="py-3 px-4 text-muted-foreground capitalize">{p.fitness_goal?.replace('_', ' ') || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
}


