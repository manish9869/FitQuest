import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entities } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Search, X, Lock, Unlock, Clock, Users, Zap, ChevronDown } from 'lucide-react';
import { ALL_FEATURES, PLAN_CONFIG } from '@/lib/featureFlags';
import { getActiveOverrides } from '@/lib/hybridAccess';

const TYPES = {
    grant: { label: 'Grant', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', icon: Unlock },
    restrict: { label: 'Restrict', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30', icon: Lock },
    trial: { label: 'Trial', color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', icon: Clock },
};

const PLAN_ORDER = ['free', 'basic', 'premium', 'elite'];

function FeatureRow({ feature, override, userPlan, userEmail, adminEmail, onRevoke, onAdd }) {
    const [showTrialDate, setShowTrialDate] = useState(false);
    const [trialDate, setTrialDate] = useState('');
    const planMet = PLAN_ORDER.indexOf(userPlan) >= PLAN_ORDER.indexOf(feature.required_plan);
    const baseAccess = override ? override.override_type !== 'restrict' : planMet;
    const overrideCfg = override ? TYPES[override.override_type] : null;
    const Icon = feature.icon;

    const handleQuickAdd = (type) => {
        if (type === 'trial') {
            setShowTrialDate(v => !v);
            return;
        }
        onAdd({ feature_id: feature.feature_id, override_type: type, expires_at: null, reason: null });
    };

    const handleTrialConfirm = () => {
        onAdd({ feature_id: feature.feature_id, override_type: 'trial', expires_at: trialDate, reason: '' });
        setShowTrialDate(false);
        setTrialDate('');
    };

    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-white/3 transition-colors group">
                <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs flex-1 min-w-0 truncate">{feature.label}</span>

                {/* Status indicator */}
                {override ? (
                    <div className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-bold ${overrideCfg.bg} ${overrideCfg.border} ${overrideCfg.color}`}>
                        <overrideCfg.icon className="w-2.5 h-2.5" />
                        {overrideCfg.label}
                        <button onClick={() => onRevoke(override.id)} className="ml-1 hover:text-white transition-colors opacity-60 hover:opacity-100">
                            <X className="w-2.5 h-2.5" />
                        </button>
                    </div>
                ) : (
                    <span className={`text-[10px] font-medium ${baseAccess ? 'text-emerald-400/60' : 'text-muted-foreground/40'}`}>
                        {baseAccess ? 'plan ✓' : 'locked'}
                    </span>
                )}

                {/* Quick action buttons — show on hover */}
                {!override && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                        <button onClick={() => handleQuickAdd('grant')}
                            className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/30 transition-colors border border-emerald-500/20">
                            Grant
                        </button>
                        <button onClick={() => handleQuickAdd('restrict')}
                            className="text-[10px] px-2 py-0.5 rounded bg-red-500/15 text-red-400 hover:bg-red-500/30 transition-colors border border-red-500/20">
                            Block
                        </button>
                        <button onClick={() => handleQuickAdd('trial')}
                            className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/30 transition-colors border border-yellow-500/20">
                            Trial
                        </button>
                    </div>
                )}
            </div>

            {/* Trial date inline */}
            <AnimatePresence>
                {showTrialDate && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden px-3">
                        <div className="flex items-center gap-2 py-1.5">
                            <input type="date" value={trialDate} onChange={e => setTrialDate(e.target.value)}
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-foreground" />
                            <button onClick={handleTrialConfirm}
                                className="text-xs px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors border border-yellow-500/30">
                                Set Trial
                            </button>
                            <button onClick={() => setShowTrialDate(false)} className="text-muted-foreground hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function UserPanel({ user, profiles, allOverrides }) {
    const { user: adminUser } = useAuth();
    const qc = useQueryClient();
    const prof = profiles.find(p => p.user_email === user.user_email);
    const userPlan = prof?.plan || 'free';
    const planCfg = PLAN_CONFIG[userPlan] || PLAN_CONFIG.free;
    const userOverrides = getActiveOverrides(allOverrides.filter(o => o.user_email === user.user_email));
    const [expandedGroups, setExpandedGroups] = useState({});

    const addMutation = useMutation({
        mutationFn: (d) => entities.UserFeatureOverride.create({
            ...d, user_email: user.user_email, granted_by: adminUser?.email, is_active: true, expires_at: d.expires_at || null,
            reason: d.reason || null,
        }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['user-overrides'] }),
    });

    const revokeMutation = useMutation({
        mutationFn: (id) => entities.UserFeatureOverride.update(id, { is_active: false }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['user-overrides'] }),
    });

    // Group features
    const groups = ALL_FEATURES.reduce((acc, f) => {
        const g = f.nav_group || 'Other';
        if (!acc[g]) acc[g] = [];
        const override = userOverrides.find(o => o.feature_id === f.feature_id);
        acc[g].push({ ...f, override });
        return acc;
    }, {});

    const toggleGroup = (g) => setExpandedGroups(p => ({ ...p, [g]: !p[g] }));

    const overrideCount = userOverrides.length;
    const grants = userOverrides.filter(o => o.override_type === 'grant').length;
    const restricts = userOverrides.filter(o => o.override_type === 'restrict').length;
    const trials = userOverrides.filter(o => o.override_type === 'trial').length;

    return (
        <div className="space-y-4">
            {/* User header */}
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                <div className="w-11 h-11 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-base flex-shrink-0">
                    {(user.full_name || user.user_email)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{user.full_name || user.user_email}</div>
                    <div className="text-xs text-muted-foreground truncate">{user.user_email}</div>
                </div>
                <div className={`text-xs px-2.5 py-1 rounded-full border font-semibold flex-shrink-0 ${planCfg.bg} ${planCfg.color} ${planCfg.border}`}>
                    {planCfg.label}
                </div>
            </div>

            {/* Override summary — compact chips */}
            {overrideCount > 0 && (
                <div className="flex flex-wrap gap-2">
                    {grants > 0 && <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full">{grants} Granted</span>}
                    {restricts > 0 && <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-full">{restricts} Blocked</span>}
                    {trials > 0 && <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2.5 py-1 rounded-full">{trials} Trial</span>}
                </div>
            )}

            {/* Feature groups — collapsible */}
            <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-2">
                    Hover a feature → Grant / Block / Trial
                </p>
                {Object.entries(groups).map(([groupName, items]) => {
                    const isOpen = expandedGroups[groupName] !== false; // default open
                    const groupOverrides = items.filter(i => i.override).length;
                    return (
                        <div key={groupName} className="rounded-xl overflow-hidden border border-white/5">
                            <button onClick={() => toggleGroup(groupName)}
                                className="w-full flex items-center justify-between px-3 py-2 bg-white/3 hover:bg-white/5 transition-colors">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{groupName}</span>
                                <div className="flex items-center gap-2">
                                    {groupOverrides > 0 && (
                                        <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full font-bold">{groupOverrides}</span>
                                    )}
                                    <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                </div>
                            </button>
                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                        <div className="py-1">
                                            {items.map(f => (
                                                <FeatureRow key={f.feature_id} feature={f} override={f.override} userPlan={userPlan}
                                                    userEmail={user.user_email} adminEmail={adminUser?.email}
                                                    onRevoke={(id) => revokeMutation.mutate(id)}
                                                    onAdd={(d) => addMutation.mutate(d)}
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function AdminUserAccess() {
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);

    const { data: allUsers = [] } = useQuery({ queryKey: ['admin-users'], queryFn: () => entities.UserProfile.list() });
    const { data: allProfiles = [] } = useQuery({ queryKey: ['admin-profiles'], queryFn: () => entities.UserProfile.list() });
    const { data: allOverrides = [] } = useQuery({
        queryKey: ['user-overrides'],
        queryFn: () => entities.UserFeatureOverride.list('created_at', false),
    });

    const filtered = allUsers.filter(u => !search || (u.full_name || u.user_email || '').toLowerCase().includes(search.toLowerCase()));

    const getSummary = (email) => {
        const active = getActiveOverrides(allOverrides.filter(o => o.user_email === email));
        return { grants: active.filter(o => o.override_type === 'grant').length, restricts: active.filter(o => o.override_type === 'restrict').length, trials: active.filter(o => o.override_type === 'trial').length };
    };

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-bold font-space flex items-center gap-2">
                    <Shield className="w-6 h-6 text-purple-400" /> User Access Control
                </h1>
                <p className="text-xs text-muted-foreground mt-1">Hover any feature row to grant, block, or set trial access with one click</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 h-[calc(100vh-180px)]">
                {/* Left — user list */}
                <div className="lg:col-span-2 flex flex-col gap-3 min-h-0">
                    <div className="relative flex-shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="pl-9 bg-white/5 border-white/10" />
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                        {filtered.map(u => {
                            const prof = allProfiles.find(p => p.user_email === u.user_email);
                            const planCfg = PLAN_CONFIG[prof?.plan || 'free'] || PLAN_CONFIG.free;
                            const summary = getSummary(u.user_email);
                            const isSelected = selectedUser?.id === u.id;
                            return (
                                <button key={u.id} onClick={() => setSelectedUser(u)}
                                    className={`w-full text-left px-3 py-2.5 rounded-xl glass transition-all flex items-center gap-3 ${isSelected ? 'border border-purple-500/40 bg-purple-500/10' : 'border border-white/5 hover:bg-white/5'}`}>
                                    <div className="w-8 h-8 rounded-full bg-purple-500/15 flex items-center justify-center text-purple-400 font-bold text-xs flex-shrink-0">
                                        {(u.full_name || u.user_email)[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">{u.full_name || u.user_email}</div>
                                        <div className={`text-xs ${planCfg.color}`}>{planCfg.label}</div>
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0 text-[10px] font-bold">
                                        {summary.grants > 0 && <span className="text-emerald-400 bg-emerald-500/10 px-1.5 rounded-full">+{summary.grants}</span>}
                                        {summary.restricts > 0 && <span className="text-red-400 bg-red-500/10 px-1.5 rounded-full">–{summary.restricts}</span>}
                                        {summary.trials > 0 && <span className="text-yellow-400 bg-yellow-500/10 px-1.5 rounded-full">T{summary.trials}</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right — panel */}
                <div className="lg:col-span-3 min-h-0 overflow-y-auto">
                    {selectedUser ? (
                        <div className="glass rounded-2xl p-5">
                            <UserPanel user={selectedUser} profiles={allProfiles} allOverrides={allOverrides} />
                        </div>
                    ) : (
                        <div className="glass rounded-2xl h-full flex flex-col items-center justify-center text-center p-12">
                            <Users className="w-14 h-14 text-purple-400/20 mb-4" />
                            <div className="text-muted-foreground font-medium">Select a user</div>
                            <div className="text-xs text-muted-foreground/50 mt-1">Then hover any feature to control access instantly</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


