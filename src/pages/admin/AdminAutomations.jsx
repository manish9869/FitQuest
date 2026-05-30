import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Plus, Power, Trash2, Zap, Bell, MessageSquare, Trophy, AlertTriangle, Droplets, Dumbbell, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const TRIGGER_TYPES = [
    { value: 'missed_workouts', label: 'Missed Workouts', icon: Dumbbell, color: 'text-purple-400' },
    { value: 'low_water', label: 'Low Water Intake', icon: Droplets, color: 'text-blue-400' },
    { value: 'streak_milestone', label: 'Streak Milestone', icon: Trophy, color: 'text-yellow-400' },
    { value: 'inactivity', label: 'Inactivity Days', icon: Bell, color: 'text-orange-400' },
    { value: 'low_calories', label: 'Under Calorie Goal', icon: AlertTriangle, color: 'text-red-400' },
];

const ACTION_TYPES = [
    { value: 'send_reminder', label: 'Send App Reminder', icon: Bell },
    { value: 'send_message', label: 'Send Chat Message', icon: MessageSquare },
    { value: 'unlock_badge', label: 'Unlock Badge', icon: Trophy },
    { value: 'notify_trainer', label: 'Notify Trainer', icon: AlertTriangle },
];

const DEFAULT_RULES = [
    { id: 1, name: 'Missed Workout Alert', trigger: 'missed_workouts', triggerVal: '3', action: 'send_reminder', actionVal: 'You missed 3 workouts this week. Time to get back on track! 💪', active: true, icon: Dumbbell, iconColor: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', runs: 24 },
    { id: 2, name: 'Hydration Reminder', trigger: 'low_water', triggerVal: '2', action: 'send_message', actionVal: "Your water intake has been low for 2 days. Don't forget to stay hydrated! 💧", active: true, icon: Droplets, iconColor: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', runs: 67 },
    { id: 3, name: 'Streak Celebration', trigger: 'streak_milestone', triggerVal: '30', action: 'unlock_badge', actionVal: '🔥 Legend Badge', active: true, icon: Trophy, iconColor: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', runs: 8 },
    { id: 4, name: 'Inactivity Intervention', trigger: 'inactivity', triggerVal: '5', action: 'notify_trainer', actionVal: 'User has been inactive for 5+ days. Manual check-in required.', active: false, icon: AlertTriangle, iconColor: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', runs: 3 },
];

export default function AdminAutomations() {
    const [rules, setRules] = useState(DEFAULT_RULES);
    const [showCreate, setShowCreate] = useState(false);
    const [newRule, setNewRule] = useState({ name: '', trigger: 'missed_workouts', triggerVal: '3', action: 'send_reminder', actionVal: '' });

    const toggleRule = (id) => {
        setRules(r => r.map(rule => rule.id === id ? { ...rule, active: !rule.active } : rule));
    };

    const deleteRule = (id) => {
        setRules(r => r.filter(rule => rule.id !== id));
        toast.success('Automation deleted');
    };

    const addRule = () => {
        if (!newRule.name.trim() || !newRule.actionVal.trim()) return;
        const trigger = TRIGGER_TYPES.find(t => t.value === newRule.trigger);
        const r = {
            id: Date.now(), ...newRule,
            active: true, icon: trigger?.icon || Zap, iconColor: trigger?.color || 'text-white',
            bg: 'bg-white/5', border: 'border-white/10', runs: 0,
        };
        setRules(prev => [...prev, r]);
        setShowCreate(false);
        setNewRule({ name: '', trigger: 'missed_workouts', triggerVal: '3', action: 'send_reminder', actionVal: '' });
        toast.success('Automation created!');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-space font-bold flex items-center gap-2"><Sparkles className="w-7 h-7 text-pink-400" /> Smart Automations</h1>
                    <p className="text-sm text-muted-foreground mt-1">No-code automation rules for client engagement</p>
                </div>
                <Button onClick={() => setShowCreate(s => !s)} className="bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 text-white font-semibold">
                    <Plus className="w-4 h-4 mr-2" /> New Automation
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Active Rules', value: rules.filter(r => r.active).length, color: 'text-emerald-400' },
                    { label: 'Total Triggers', value: rules.reduce((s, r) => s + r.runs, 0), color: 'text-blue-400' },
                    { label: 'Paused', value: rules.filter(r => !r.active).length, color: 'text-yellow-400' },
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
                                <select value={newRule.trigger} onChange={e => setNewRule(n => ({ ...n, trigger: e.target.value }))}
                                    className="w-full h-9 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-white">
                                    {TRIGGER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Threshold Value</label>
                                <Input type="number" value={newRule.triggerVal} onChange={e => setNewRule(n => ({ ...n, triggerVal: e.target.value }))} placeholder="e.g. 3" className="bg-white/5 border-white/10" />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Action: Then...</label>
                                <select value={newRule.action} onChange={e => setNewRule(n => ({ ...n, action: e.target.value }))}
                                    className="w-full h-9 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-white">
                                    {ACTION_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Action Message / Value</label>
                                <Input value={newRule.actionVal} onChange={e => setNewRule(n => ({ ...n, actionVal: e.target.value }))} placeholder="Message or badge name..." className="bg-white/5 border-white/10" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={addRule} className="bg-pink-500 hover:bg-pink-600 text-white font-semibold">Create Rule</Button>
                            <Button variant="outline" className="border-white/10" onClick={() => setShowCreate(false)}>Cancel</Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Rules List */}
            <div className="space-y-3">
                {rules.map((rule, i) => {
                    const Icon = rule.icon;
                    const trigger = TRIGGER_TYPES.find(t => t.value === rule.trigger);
                    const action = ACTION_TYPES.find(a => a.value === rule.action);
                    const ActionIcon = action?.icon || Zap;
                    return (
                        <motion.div key={rule.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                            <div className={`glass rounded-xl p-4 border ${rule.border} ${!rule.active ? 'opacity-50' : ''} transition-all`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl ${rule.bg} flex items-center justify-center flex-shrink-0`}>
                                        <Icon className={`w-5 h-5 ${rule.iconColor}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <span className="font-semibold text-sm">{rule.name}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${rule.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-muted-foreground'}`}>
                                                {rule.active ? 'Active' : 'Paused'}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">{rule.runs} runs</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                            <span className={`flex items-center gap-1 ${rule.iconColor}`}><Icon className="w-3 h-3" />{trigger?.label} ≥ {rule.triggerVal}</span>
                                            <span className="text-white/20">→</span>
                                            <span className="flex items-center gap-1"><ActionIcon className="w-3 h-3" />{action?.label}: "{rule.actionVal}"</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => toggleRule(rule.id)}
                                            className={`w-10 h-6 rounded-full transition-all relative ${rule.active ? 'bg-emerald-500' : 'bg-white/10'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${rule.active ? 'right-1' : 'left-1'}`} />
                                        </button>
                                        <button onClick={() => deleteRule(rule.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}


