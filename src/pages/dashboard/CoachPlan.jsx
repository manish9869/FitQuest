import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { Shield, Dumbbell, Utensils, Target, MessageSquare } from 'lucide-react';

export default function CoachPlan() {
    const { user } = useAuth();

    const { data: plans = [] } = useQuery({
        queryKey: ['coachPlans', user?.email],
        queryFn: () => entities.CoachPlan.filter({ user_email: user?.email, status: 'active' }),
        enabled: !!user?.email,
    });

    const { data: notes = [] } = useQuery({
        queryKey: ['adminNotes', user?.email],
        queryFn: () => entities.AdminNote.filter({ user_email: user?.email }),
        enabled: !!user?.email,
    });

    const workoutPlan = plans.find(p => p.plan_type === 'workout');
    const nutritionPlan = plans.find(p => p.plan_type === 'nutrition');
    const weeklyTargets = plans.find(p => p.plan_type === 'weekly_targets');

    const planTypeConfig = {
        workout: { icon: Dumbbell, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
        nutrition: { icon: Utensils, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
        weekly_targets: { icon: Target, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Shield className="w-7 h-7 text-emerald-400" />
                <h1 className="text-2xl font-space font-bold">Your Coach Plan</h1>
            </div>

            {plans.length === 0 && notes.length === 0 ? (
                <GlassCard className="text-center py-16">
                    <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Coach Plans Yet</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Your coach hasn't assigned a personalized plan yet. Keep tracking your progress — your coach will customize your journey soon!
                    </p>
                </GlassCard>
            ) : (
                <>
                    {/* Plans */}
                    {plans.map((plan, i) => {
                        const config = planTypeConfig[plan.plan_type] || planTypeConfig.workout;
                        const Icon = config.icon;
                        return (
                            <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                                <GlassCard animate={false} className={`border ${config.border}`}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
                                            <Icon className={`w-5 h-5 ${config.color}`} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold">{plan.title}</h3>
                                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">Coach Assigned</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{plan.description}</p>
                                        </div>
                                    </div>

                                    {/* Plan details */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {plan.calorie_target && (
                                            <div className="glass rounded-lg p-3 text-center">
                                                <div className="text-xs text-muted-foreground">Calories</div>
                                                <div className="font-bold text-emerald-400">{plan.calorie_target}</div>
                                            </div>
                                        )}
                                        {plan.protein_target && (
                                            <div className="glass rounded-lg p-3 text-center">
                                                <div className="text-xs text-muted-foreground">Protein</div>
                                                <div className="font-bold text-blue-400">{plan.protein_target}g</div>
                                            </div>
                                        )}
                                        {plan.step_target && (
                                            <div className="glass rounded-lg p-3 text-center">
                                                <div className="text-xs text-muted-foreground">Steps</div>
                                                <div className="font-bold text-orange-400">{plan.step_target?.toLocaleString()}</div>
                                            </div>
                                        )}
                                        {plan.water_target_ml && (
                                            <div className="glass rounded-lg p-3 text-center">
                                                <div className="text-xs text-muted-foreground">Water</div>
                                                <div className="font-bold text-cyan-400">{plan.water_target_ml}ml</div>
                                            </div>
                                        )}
                                    </div>

                                    {plan.notes && (
                                        <div className="mt-4 glass rounded-lg p-4">
                                            <div className="text-xs text-muted-foreground mb-1">Coach Notes</div>
                                            <p className="text-sm">{plan.notes}</p>
                                        </div>
                                    )}
                                </GlassCard>
                            </motion.div>
                        );
                    })}

                    {/* Coach Notes */}
                    {notes.length > 0 && (
                        <GlassCard>
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-yellow-400" /> Coach Messages
                            </h3>
                            <div className="space-y-3">
                                {notes.map(note => (
                                    <div key={note.id} className="glass rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${note.category === 'motivation' ? 'bg-emerald-500/20 text-emerald-400' :
                                                note.category === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    note.category === 'intervention' ? 'bg-red-500/20 text-red-400' :
                                                        'bg-white/10 text-muted-foreground'
                                                }`}>{note.category}</span>
                                        </div>
                                        <p className="text-sm">{note.note}</p>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    )}
                </>
            )}
        </div>
    );
}


