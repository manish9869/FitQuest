import React, { useState } from 'react';
import { entities } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ChevronRight, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { goalLabels } from '@/lib/fitnessUtils';

export default function AdminUsers() {
    const [search, setSearch] = useState('');
    const [goalFilter, setGoalFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const { data: allUsers = [] } = useQuery({
        queryKey: ['admin-users'],
        queryFn: () => entities.UserProfile.list(),
    });

    const getStatus = (u) => {
        const streak = u?.login_streak || 0;
        if (streak > 3) return 'active';
        if (streak > 0) return 'at_risk';
        return 'inactive';
    };

    const filtered = allUsers.filter(u => {
        const matchesSearch = !search || (u.user_email || '').toLowerCase().includes(search.toLowerCase());
        const matchesGoal = goalFilter === 'all' || u.fitness_goal === goalFilter;
        const matchesStatus = statusFilter === 'all' || getStatus(u) === statusFilter;
        return matchesSearch && matchesGoal && matchesStatus;
    });

    const statusColors = {
        active: 'text-emerald-400 bg-emerald-500/10',
        at_risk: 'text-yellow-400 bg-yellow-500/10',
        inactive: 'text-red-400 bg-red-500/10',
    };
    const statusLabels = { active: 'Active', at_risk: 'At Risk', inactive: 'Inactive' };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-space font-bold flex items-center gap-3">
                    <Users className="w-7 h-7 text-blue-400" /> User Management
                </h1>
                <span className="text-sm text-muted-foreground">{filtered.length} users</span>
            </div>

            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search users..." className="pl-10 bg-white/5 border-white/10" />
                </div>
                <Select value={goalFilter} onValueChange={setGoalFilter}>
                    <SelectTrigger className="w-40 bg-white/5 border-white/10"><SelectValue placeholder="Goal" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Goals</SelectItem>
                        {Object.entries(goalLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40 bg-white/5 border-white/10"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="at_risk">At Risk</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <GlassCard animate={false}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Email</th>
                                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Goal</th>
                                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Streak</th>
                                <th className="text-left py-3 px-4 text-muted-foreground font-medium">XP</th>
                                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                                <th className="text-left py-3 px-4 text-muted-foreground font-medium"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(u => {
                                const status = getStatus(u);
                                return (
                                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="py-3 px-4 text-muted-foreground text-xs">{u.user_email}</td>
                                        <td className="py-3 px-4 capitalize text-muted-foreground">
                                            {u.fitness_goal?.replace('_', ' ') || '—'}
                                        </td>
                                        <td className="py-3 px-4">{u.login_streak || 0} 🔥</td>
                                        <td className="py-3 px-4">{u.total_xp || 0}</td>
                                        <td className="py-3 px-4">
                                            <span className={`text-xs px-2 py-1 rounded-full ${statusColors[status]}`}>
                                                {statusLabels[status]}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <Link to={`/admin/user/${u.id}`}>
                                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
                                                    <ChevronRight className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
}


