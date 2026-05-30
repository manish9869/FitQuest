import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { entities } from '@/api/entities';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ALL_FEATURES, PLAN_CONFIG, mergeFlags } from '@/lib/featureFlags';
import { Layers, Lock, Zap, ChevronDown, RotateCcw, Save, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const PLAN_OPTIONS = ['free', 'basic', 'premium', 'elite'];

function PlanDropdown({ featureId, currentPlan, onChangePlan }) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const btnRef = useRef(null);
    const menuRef = useRef(null);

    const safePlan = (currentPlan || 'free').toLowerCase();
    const cfg = PLAN_CONFIG[safePlan] || PLAN_CONFIG['free'];

    const calcPos = () => {
        if (!btnRef.current) return;
        const r = btnRef.current.getBoundingClientRect();
        setPos({ top: r.bottom + 4, left: r.left });
    };

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (
                menuRef.current && !menuRef.current.contains(e.target) &&
                btnRef.current && !btnRef.current.contains(e.target)
            ) setOpen(false);
        };
        const t = setTimeout(() => document.addEventListener('mousedown', handler), 0);
        return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
    }, [open]);

    // Reposition on scroll
    useEffect(() => {
        if (!open) return;
        window.addEventListener('scroll', calcPos, true);
        return () => window.removeEventListener('scroll', calcPos, true);
    }, [open]);

    return (
        <>
            <button
                ref={btnRef}
                onClick={() => { if (!open) { calcPos(); setOpen(true); } else setOpen(false); }}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border mt-2
          ${cfg.bg} ${cfg.color} ${cfg.border} font-semibold`}
            >
                <Lock className="w-3 h-3" />
                {cfg.label} Plan
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && createPortal(
                <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    transition={{ duration: 0.12 }}
                    style={{
                        position: 'fixed',
                        top: pos.top,
                        left: pos.left,
                        zIndex: 9999,
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        minWidth: '150px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}
                >
                    {PLAN_OPTIONS.map((p) => {
                        const pcfg = PLAN_CONFIG[p] || PLAN_CONFIG['free'];
                        const selected = safePlan === p;
                        return (
                            <button
                                key={p}
                                onClick={() => { onChangePlan(featureId, p); setOpen(false); }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    width: '100%',
                                    padding: '10px 14px',
                                    fontSize: '12px',
                                    background: selected ? 'rgba(255,255,255,0.08)' : 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'background 0.15s',
                                    fontWeight: selected ? '600' : '400',
                                }}
                                onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                                onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
                            >
                                <div style={{
                                    width: '8px', height: '8px', borderRadius: '50%',
                                    background: p === 'free' ? '#6b7280'
                                        : p === 'basic' ? '#3b82f6'
                                            : p === 'premium' ? '#a855f7'
                                                : '#f59e0b',
                                    flexShrink: 0,
                                }} />
                                <span className={pcfg.color}>{pcfg.label}</span>
                                {selected && <CheckCircle className="w-3 h-3 ml-auto text-emerald-400" />}
                            </button>
                        );
                    })}
                </motion.div>,
                document.body
            )}
        </>
    );
}

function FeatureCard({ feature, onToggleEnabled, onChangePlan, onToggleBeta }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass rounded-2xl p-4 border transition-all duration-300 overflow-visible
        ${!feature.is_enabled ? 'opacity-50 border-white/5' : 'border-white/10 hover:border-white/20'}`}
        >
            <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
          ${feature.is_enabled ? 'bg-white/10' : 'bg-white/3'}`}>
                    <feature.icon className={`w-5 h-5 ${feature.is_enabled ? 'text-white' : 'text-muted-foreground'}`} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{feature.label}</span>
                        <span className="text-[10px] text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded font-mono">
                            {feature.feature_id}
                        </span>
                        {feature.is_beta && (
                            <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-bold">BETA</span>
                        )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                        {feature.nav_group} · order {feature.sort_order}
                    </div>
                    <PlanDropdown
                        featureId={feature.feature_id}
                        currentPlan={feature.required_plan}
                        onChangePlan={onChangePlan}
                    />
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <button
                        onClick={() => onToggleEnabled(feature.feature_id, !feature.is_enabled)}
                        className={`w-12 h-6 rounded-full transition-all duration-300 relative
              ${feature.is_enabled ? 'bg-emerald-500' : 'bg-white/10'}`}
                    >
                        <motion.div
                            className="w-4 h-4 bg-white rounded-full absolute top-1 shadow"
                            animate={{ left: feature.is_enabled ? 28 : 4 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                    </button>
                    <span className={`text-[10px] font-semibold
            ${feature.is_enabled ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                        {feature.is_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <button
                        onClick={() => onToggleBeta(feature.feature_id, !feature.is_beta)}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-all
              ${feature.is_beta
                                ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10'
                                : 'border-white/10 text-muted-foreground hover:border-white/20'}`}
                    >
                        {feature.is_beta ? '⚡ Beta' : 'Set Beta'}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

export default function AdminFeatureFlags() {
    const qc = useQueryClient();
    const [filter, setFilter] = useState('all');
    const [pending, setPending] = useState({});
    const [saving, setSaving] = useState(false);

    const { data: dbFlags = [] } = useQuery({
        queryKey: ['feature-flags'],
        queryFn: () => entities.FeatureFlag.list(),
    });

    const features = useMemo(() => {
        const merged = mergeFlags(dbFlags);
        return merged.map((f) => {
            const p = pending[f.feature_id];
            return p ? { ...f, ...p } : f;
        });
    }, [dbFlags, pending]);

    const setPendingField = (id, changes) =>
        setPending((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...changes } }));

    const onToggleEnabled = (id, val) => setPendingField(id, { is_enabled: val });
    const onChangePlan = (id, val) => setPendingField(id, { required_plan: val });
    const onToggleBeta = (id, val) => setPendingField(id, { is_beta: val });

    const saveAll = async () => {
        setSaving(true);
        const ids = Object.keys(pending);
        for (const id of ids) {
            const existing = dbFlags.find((f) => f.feature_id === id);
            const defaults = ALL_FEATURES.find((f) => f.feature_id === id);
            const data = { ...pending[id], feature_id: id, label: defaults?.label || id };
            if (existing) {
                await entities.FeatureFlag.update(existing.id, data);
            } else {
                await entities.FeatureFlag.create(data);
            }
        }
        await qc.invalidateQueries({ queryKey: ['feature-flags'] });
        setPending({});
        setSaving(false);
        toast.success(`${ids.length} feature(s) updated!`);
    };

    const resetAll = async () => {
        for (const f of dbFlags) await entities.FeatureFlag.delete(f.id);
        await qc.invalidateQueries({ queryKey: ['feature-flags'] });
        setPending({});
        toast.success('All features reset to defaults');
    };

    const groups = ['all', 'Overview', 'Tracking', 'Growth', 'Tools'];
    const filtered = filter === 'all' ? features : features.filter((f) => f.nav_group === filter);
    const pendingCount = Object.keys(pending).length;

    const planStats = PLAN_OPTIONS.map((p) => ({
        plan: p,
        count: features.filter((f) => f.required_plan === p && f.is_enabled).length,
        ...PLAN_CONFIG[p],
    }));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-space font-bold flex items-center gap-2">
                        <Layers className="w-7 h-7 text-blue-400" /> Feature Access Manager
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Control which features users can access by plan</p>
                </div>
                <div className="flex gap-2">
                    {pendingCount > 0 && (
                        <Button onClick={saveAll} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold">
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? 'Saving...' : `Save ${pendingCount} change${pendingCount > 1 ? 's' : ''}`}
                        </Button>
                    )}
                    <Button variant="outline" className="border-white/10 text-muted-foreground" onClick={resetAll}>
                        <RotateCcw className="w-4 h-4 mr-2" /> Reset Defaults
                    </Button>
                </div>
            </div>

            <AnimatePresence>
                {pendingCount > 0 && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        className="glass rounded-xl p-3 border border-yellow-500/30 bg-yellow-500/5 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                        <span className="text-sm text-yellow-400 font-medium">
                            {pendingCount} unsaved change{pendingCount > 1 ? 's' : ''} — click Save to apply
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {planStats.map((p) => (
                    <div key={p.plan} className={`glass rounded-xl p-3 border ${p.border}`}>
                        <div className={`text-xl font-bold font-space ${p.color}`}>{p.count}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{p.label} features</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Total Features', val: features.length, color: 'text-white' },
                    { label: 'Enabled', val: features.filter((f) => f.is_enabled).length, color: 'text-emerald-400' },
                    { label: 'Disabled', val: features.filter((f) => !f.is_enabled).length, color: 'text-red-400' },
                ].map((s) => (
                    <div key={s.label} className="glass rounded-xl p-3 border border-white/5 text-center">
                        <div className={`text-2xl font-bold font-space ${s.color}`}>{s.val}</div>
                        <div className="text-xs text-muted-foreground">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="flex gap-2 flex-wrap">
                {groups.map((g) => (
                    <button key={g} onClick={() => setFilter(g)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all capitalize
              ${filter === g ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'border-white/10 text-muted-foreground hover:border-white/20'}`}>
                        {g}
                    </button>
                ))}
            </div>

            <div className="space-y-2">
                {filtered.map((f) => (
                    <FeatureCard
                        key={f.feature_id}
                        feature={f}
                        onToggleEnabled={onToggleEnabled}
                        onChangePlan={onChangePlan}
                        onToggleBeta={onToggleBeta}
                    />
                ))}
            </div>

            <div className="glass rounded-2xl p-5 border border-white/5">
                <h3 className="font-semibold text-sm mb-4">Plan Access Guide</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        { plan: 'free', desc: 'Basic trackers, missions, recipes', features: ['Dashboard', 'Meals', 'Water', 'Steps', 'Workouts', 'Achievements'] },
                        { plan: 'basic', desc: 'Core tracking + recovery tools', features: ['Readiness Score', 'Sleep', 'My Journey', 'AI Tools'] },
                        { plan: 'premium', desc: 'Advanced analytics & AI tools', features: ['Analytics', 'Weekly Report', 'AI Food Scan', 'SmartFit AI'] },
                        { plan: 'elite', desc: 'Full access + coaching', features: ['Coach Plan', 'All Features'] },
                    ].map((p) => {
                        const cfg = PLAN_CONFIG[p.plan];
                        return (
                            <div key={p.plan} className={`rounded-xl p-3 border ${cfg.border} ${cfg.bg}`}>
                                <div className={`text-xs font-bold ${cfg.color} mb-1`}>{cfg.label}</div>
                                <div className="text-[10px] text-muted-foreground mb-2">{p.desc}</div>
                                <ul className="space-y-0.5">
                                    {p.features.map((f) => (
                                        <li key={f} className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <span className="text-emerald-400">✓</span>{f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}