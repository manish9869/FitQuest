import React, { useState } from 'react';
import { entities } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Plus, Trash2, Zap, Bell, MessageSquare, Trophy, AlertTriangle, Droplets, Dumbbell, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const TRIGGER_TYPES = [
    { value: 'missed_workouts', label: 'Missed Workouts', icon: Dumbbell, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { value: 'low_water', label: 'Low Water Intake', icon: Droplets, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { value: 'streak_milestone', label: 'Streak Milestone', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    { value: 'inactivity', label: 'Inactivity Days', icon: Bell, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { value: 'low_calories', label: 'Under Calorie Goal', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
];

const ACTION_TYPES = [
    { value: 'send_reminder', label: 'Send App Reminder', icon: Bell },
    { value: 'send_message', label: 'Send Chat Message', icon: MessageSquare },
    { value: 'unlock_badge', label: 'Unlock Badge', icon: Trophy },
    { value: 'notify_trainer', label: 'Notify Trainer', icon: AlertTriangle },
];

const emptyRule = { name: '', trigger: 'missed_workouts', trigger_value: '3', action: 'send_reminder', action_value: '' };

export default function AdminAutomations() {
    const qc = useQueryClient();
    const [showCreate, setShowCreate] = useState(false);
    const [newRule, setNewRule] = useState(emptyRule);

    const { data: rules = [], isLoading } = useQuery({
        queryKey: ['automations'],
        queryFn: () => entities.Automation.list('created_at', false),
    });

    const createRule = useMutation({
        mutationFn: (data) => entities.Automation.create({
            ...data,
            trigger_value: Number(data.trigger_value) || 0,
            is_active: true,
            run_count: 0,
        }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['automations'] });
            setShowCreate(false);
            setNewRule(emptyRule);
            toast.success('Automation created!');
        },
    });

    const toggleRule = useMutation({
        mutationFn: ({ id, is_active }) => entities.Automation.update(id, { is_active }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['automations'] }),
    });

    const deleteRule = useMutation({
        mutationFn: (id) => entities.Automation.delete(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['automations'] }); toast.success('Automation deleted'); },
    });

    const stats = {
        active: rules.filter(r => r.is_active).length,
        totalRuns: rules.reduce((s, r) => s + (r.run_count || 0), 0),
        paused: rules.filter(r => !r.is_active).length,
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-space font-bold flex items-center gap-2"><Sparkles className="w-7 h-7 text-pink-400" /> Smart Automations</h1>
                    <p className="text-sm text-muted-foreground mt-1">No-code automation rules — saved to database</p>
                </div>
                <Button onClick={() => setShowCreate(s => !s)} className="bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 text-white font-semibold">
                    <Plus className="w-4 h-4 mr-2" /> New Automation
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Active Rules', value: stats.active, color: 'text-emerald-400' },
                    { label: 'Total Triggers', value: stats.totalRuns, color: 'text-blue-400' },
                    { label: 'Paused', value: stats.paused, color: 'text-yellow-400' },
                ].map(s => (
                    <div key={s.label} className="glass rounded-xl p-4 text-center border border-white/5">
                        <div className={`text-2xl font-bold font-space ${s.color}`}>{s.value}</div>
                        <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Create Form */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="glass rounded-2xl p-5 border border-pink-500/20">
                        <h3 className="font-semibold mb-4 text-pink-400">Build Automation Rule</h3>
                        <div className="grid sm:grid-cols-2 gap-4 mb-4">
                            <div className="sm:col-span-2">
                                <label className="text-xs text-muted-foreground mb-1 block">Rule Name</label>
                                <Input value={newRule.name} onChange={e => setNewRule(n => ({ ...n, name: e.target.value }))} placeholder="e.g. 3-Day Inactivity Alert" className="bg-white/5 border-white/10" />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Trigger: When...</label>
                                <Select value={newRule.trigger} onValueChange={v => setNewRule(n => ({ ...n, trigger: v }))}>
                                    <SelectTrigger className="bg-white/5 border-white/10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TRIGGER_TYPES.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Threshold Value</label>
                                <Input type="number" value={newRule.trigger_value} onChange={e => setNewRule(n => ({ ...n, trigger_value: e.target.value }))} placeholder="e.g. 3" className="bg-white/5 border-white/10" />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Action: Then...</label>
                                <Select value={newRule.action} onValueChange={v => setNewRule(n => ({ ...n, action: v }))}>
                                    <SelectTrigger className="bg-white/5 border-white/10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ACTION_TYPES.map(a => (
                                            <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Action Message / Value</label>
                                <Input value={newRule.action_value} onChange={e => setNewRule(n => ({ ...n, action_value: e.target.value }))} placeholder="Message or badge name..." className="bg-white/5 border-white/10" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={() => createRule.mutate(newRule)} disabled={!newRule.name.trim() || !newRule.action_value.trim() || createRule.isPending}
                                className="bg-pink-500 hover:bg-pink-600 text-white font-semibold">
                                {createRule.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Create Rule
                            </Button>
                            <Button variant="outline" className="border-white/10" onClick={() => setShowCreate(false)}>Cancel</Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Rules List */}
            {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : rules.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center border border-white/5">
                    <Sparkles className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-muted-foreground">No automations yet. Create your first rule above.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {rules.map((rule, i) => {
                        const trigger = TRIGGER_TYPES.find(t => t.value === rule.trigger) || TRIGGER_TYPES[0];
                        const action = ACTION_TYPES.find(a => a.value === rule.action) || ACTION_TYPES[0];
                        const TIcon = trigger.icon;
                        const AIcon = action.icon;
                        return (
                            <motion.div key={rule.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                <div className={`glass rounded-xl p-4 border ${trigger.border} ${!rule.is_active ? 'opacity-50' : ''} transition-all`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl ${trigger.bg} flex items-center justify-center flex-shrink-0`}>
                                            <TIcon className={`w-5 h-5 ${trigger.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className="font-semibold text-sm">{rule.name}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${rule.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-muted-foreground'}`}>
                                                    {rule.is_active ? 'Active' : 'Paused'}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">{rule.run_count || 0} runs</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                                <span className={`flex items-center gap-1 ${trigger.color}`}><TIcon className="w-3 h-3" />{trigger.label} ≥ {rule.trigger_value}</span>
                                                <span className="text-white/20">→</span>
                                                <span className="flex items-center gap-1"><AIcon className="w-3 h-3" />{action.label}: "{rule.action_value}"</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button onClick={() => toggleRule.mutate({ id: rule.id, is_active: !rule.is_active })}
                                                className={`w-10 h-6 rounded-full transition-all relative ${rule.is_active ? 'bg-emerald-500' : 'bg-white/10'}`}>
                                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${rule.is_active ? 'right-1' : 'left-1'}`} />
                                            </button>
                                            <button onClick={() => deleteRule.mutate(rule.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}