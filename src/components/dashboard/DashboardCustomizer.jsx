import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, GripVertical, Eye, EyeOff, X, Check, LayoutGrid, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ALL_WIDGETS = [
    { id: 'score', label: 'Daily Score', defaultVisible: true },
    { id: 'stats', label: "Today's Stats", defaultVisible: true },
    { id: 'macros', label: 'Macros', defaultVisible: true },
    { id: 'quick_actions', label: 'Quick Actions', defaultVisible: true },
    { id: 'calorie_trend', label: 'Calorie Trend', defaultVisible: true },
    { id: 'bmi', label: 'BMI Widget', defaultVisible: true },
    { id: 'weight', label: 'Weight Chart', defaultVisible: true },
    { id: 'workout_consistency', label: 'Workout Consistency', defaultVisible: true },
    { id: 'daily_tip', label: 'Daily Tip', defaultVisible: true },
    { id: 'habit_grid', label: '21-Day Habit Grid', defaultVisible: true },
    { id: 'insights', label: 'Smart Insights', defaultVisible: true },
    { id: 'premium_cards', label: 'Feature Cards', defaultVisible: true },
    { id: 'coach_banner', label: 'Coach Plan Banner', defaultVisible: true },
];

// Admin-specific widget registry
export const ALL_ADMIN_WIDGETS = [
    { id: 'kpis', label: 'KPI Cards', defaultVisible: true },
    { id: 'activity_chart', label: 'Weekly Activity Chart', defaultVisible: true },
    { id: 'platform_health', label: 'Platform Health', defaultVisible: true },
    { id: 'ai_insights', label: 'AI Insights', defaultVisible: true },
    { id: 'risk_clients', label: 'High Risk Clients', defaultVisible: true },
    { id: 'top_performers', label: 'Top Performers Table', defaultVisible: true },
];

export function getDefaultLayout(registry = ALL_WIDGETS) {
    return registry.map((w, i) => ({ id: w.id, visible: w.defaultVisible, order: i }));
}

export function parseLayout(saved, registry = ALL_WIDGETS) {
    if (!saved || !Array.isArray(saved)) return getDefaultLayout(registry);
    const savedIds = new Set(saved.map(s => s.id));
    const missing = registry.filter(w => !savedIds.has(w.id)).map((w, i) => ({ id: w.id, visible: w.defaultVisible, order: saved.length + i }));
    // Preserve colSpan + height from saved data
    return [...saved, ...missing].sort((a, b) => a.order - b.order);
}

/** Merge new widget sizes/positions into an existing layout array */
export function mergeLayoutSizes(layout, updates) {
    return layout.map(w => {
        const u = updates.find(u => u.id === w.id);
        return u ? { ...w, ...u } : w;
    });
}

export default function DashboardCustomizer({ layout, onSave, isSaving, registry = ALL_WIDGETS, accentColor = 'emerald', title = 'Customize Dashboard' }) {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState(layout);

    // Keep draft in sync if parent layout changes externally
    useEffect(() => { if (!open) setDraft(layout); }, [layout, open]);

    const accent = {
        emerald: { btn: 'bg-emerald-500 hover:bg-emerald-400 text-black', icon: 'text-emerald-400', drag: 'bg-emerald-500/10 border-emerald-500/30', eye: 'text-emerald-400 hover:bg-emerald-500/10' },
        purple: { btn: 'bg-purple-500 hover:bg-purple-400 text-white', icon: 'text-purple-400', drag: 'bg-purple-500/10 border-purple-500/30', eye: 'text-purple-400 hover:bg-purple-500/10' },
    }[accentColor] || {};

    const handleDragEnd = (result) => {
        if (!result.destination) return;
        const items = Array.from(draft);
        const [moved] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, moved);
        setDraft(items.map((item, i) => ({ ...item, order: i })));
    };

    const toggleVisible = (id) => setDraft(prev => prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w));

    const handleSave = () => { onSave(draft); setOpen(false); };

    const handleReset = () => setDraft(getDefaultLayout(registry));

    return (
        <>
            <Button onClick={() => { setDraft(layout); setOpen(true); }} variant="ghost" size="sm"
                className="gap-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl text-xs">
                <LayoutGrid className="w-4 h-4" />
                Customize
            </Button>

            <AnimatePresence>
                {open && (
                    <>
                        <motion.div className="fixed inset-0 bg-black/70 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setOpen(false)} />
                        <motion.div className="fixed right-0 top-0 h-full w-80 z-50 flex flex-col"
                            style={{ background: 'hsl(220 20% 5%)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 250 }}>

                            <div className="p-5 border-b border-white/5 flex items-center justify-between">
                                <div>
                                    <h3 className={`font-semibold flex items-center gap-2`}>
                                        <Settings2 className={`w-4 h-4 ${accent.icon}`} /> {title}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">Drag to reorder · toggle to show/hide</p>
                                </div>
                                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-white transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4">
                                <DragDropContext onDragEnd={handleDragEnd}>
                                    <Droppable droppableId="widgets">
                                        {(provided) => (
                                            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1.5">
                                                {draft.map((widget, index) => {
                                                    const meta = registry.find(w => w.id === widget.id);
                                                    if (!meta) return null;
                                                    return (
                                                        <Draggable key={widget.id} draggableId={widget.id} index={index}>
                                                            {(prov, snapshot) => (
                                                                <div ref={prov.innerRef} {...prov.draggableProps}
                                                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all select-none
                                    ${snapshot.isDragging
                                                                            ? `${accent.drag} shadow-xl scale-105`
                                                                            : widget.visible
                                                                                ? 'bg-white/3 border-white/5 hover:bg-white/5'
                                                                                : 'bg-transparent border-white/3 opacity-40'}`}>
                                                                    <div {...prov.dragHandleProps} className="text-muted-foreground hover:text-white cursor-grab active:cursor-grabbing flex-shrink-0">
                                                                        <GripVertical className="w-4 h-4" />
                                                                    </div>
                                                                    <span className="flex-1 text-sm truncate">
                                                                        {meta.label}
                                                                    </span>
                                                                    <div className="text-[10px] text-muted-foreground/40 font-mono flex-shrink-0 w-4 text-center">
                                                                        {index + 1}
                                                                    </div>
                                                                    <button onClick={() => toggleVisible(widget.id)}
                                                                        className={`p-1 rounded-lg transition-colors flex-shrink-0 ${widget.visible ? accent.eye : 'text-muted-foreground/30 hover:text-muted-foreground hover:bg-white/5'}`}>
                                                                        {widget.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    );
                                                })}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </DragDropContext>
                            </div>

                            <div className="p-4 border-t border-white/5 space-y-2">
                                <Button onClick={handleSave} disabled={isSaving}
                                    className={`w-full font-semibold rounded-xl gap-2 ${accent.btn}`}>
                                    <Check className="w-4 h-4" />
                                    {isSaving ? 'Saving...' : 'Save Layout'}
                                </Button>
                                <Button onClick={handleReset} variant="ghost"
                                    className="w-full text-muted-foreground hover:text-white text-sm gap-2">
                                    <RotateCcw className="w-3.5 h-3.5" /> Reset to Default
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}


