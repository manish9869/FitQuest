import React from 'react';
import { entities } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { FileText, Trash2 } from 'lucide-react';

export default function AdminPlans() {
    const qc = useQueryClient();
    const { data: plans = [] } = useQuery({ queryKey: ['admin-all-plans'], queryFn: () => entities.CoachPlan.list('created_at', false) });

    const deletePlan = useMutation({
        mutationFn: (id) => entities.CoachPlan.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-all-plans'] }),
    });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-space font-bold flex items-center gap-3"><FileText className="w-7 h-7 text-purple-400" /> All Plans</h1>

            {plans.length === 0 ? (
                <GlassCard className="text-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No plans created yet. Assign plans from individual user profiles.</p>
                </GlassCard>
            ) : (
                <div className="space-y-3">
                    {plans.map(plan => (
                        <GlassCard key={plan.id} animate={false}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${plan.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/10 text-muted-foreground'}`}>{plan.status}</span>
                                        <span className="text-xs text-muted-foreground capitalize">{plan.plan_type?.replace('_', ' ')}</span>
                                        <span className="text-xs text-muted-foreground">• {plan.user_email}</span>
                                    </div>
                                    <div className="font-semibold">{plan.title}</div>
                                    {plan.description && <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>}
                                </div>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-400" onClick={() => deletePlan.mutate(plan.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
}


