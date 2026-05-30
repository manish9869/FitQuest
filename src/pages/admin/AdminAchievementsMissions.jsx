import React, { useState } from 'react';
import { entities } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Trophy, Target, Plus, Edit2, Trash2, Star, Flame, Droplets, Dumbbell, Footprints, Moon, Zap, Award } from 'lucide-react';
import { toast } from 'sonner';

const TABS = ['Achievements', 'Missions', 'Workout Templates'];

// --- Achievement Form ---
function AchievementForm({ initial, onSave, onClose }) {
    const [form, setForm] = useState(initial || { achievement_id: '', name: '', description: '', icon: 'Star', color: 'yellow', xp_reward: 100, category: 'streak', is_active: true, sort_order: 0 });
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div><Label>ID (unique)</Label><Input value={form.achievement_id} onChange={e => setForm(f => ({ ...f, achievement_id: e.target.value }))} className="mt-1 bg-white/5 border-white/10" placeholder="e.g. 7_day_streak" /></div>
                <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
            </div>
            <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
            <div className="grid grid-cols-3 gap-3">
                <div><Label>Icon</Label>
                    <Select value={form.icon} onValueChange={v => setForm(f => ({ ...f, icon: v }))}>
                        <SelectTrigger className="mt-1 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {['Star', 'Flame', 'Trophy', 'Droplets', 'Footprints', 'Dumbbell', 'Target', 'Award', 'Zap', 'Moon'].map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div><Label>Color</Label>
                    <Select value={form.color} onValueChange={v => setForm(f => ({ ...f, color: v }))}>
                        <SelectTrigger className="mt-1 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {['yellow', 'orange', 'red', 'emerald', 'blue', 'cyan', 'purple', 'indigo', 'pink'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div><Label>XP Reward</Label><Input type="number" value={form.xp_reward} onChange={e => setForm(f => ({ ...f, xp_reward: +e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div><Label>Category</Label>
                    <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                        <SelectTrigger className="mt-1 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {['streak', 'nutrition', 'fitness', 'hydration', 'sleep', 'consistency'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: +e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
            </div>
            <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label>Active (visible to users)</Label>
            </div>
            <div className="flex gap-2 pt-2">
                <Button variant="outline" className="border-white/10" onClick={onClose}>Cancel</Button>
                <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold" onClick={() => onSave(form)}>Save Achievement</Button>
            </div>
        </div>
    );
}

// --- Mission Form ---
function MissionForm({ initial, onSave, onClose }) {
    const [form, setForm] = useState(initial || { mission_id: '', label: '', description: '', icon: 'Target', xp_reward: 50, color_hex: '#22c55e', metric: 'calories_logged', target_value: 1, is_active: true, is_bonus: false, sort_order: 0 });
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div><Label>ID (unique)</Label><Input value={form.mission_id} onChange={e => setForm(f => ({ ...f, mission_id: e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
                <div><Label>Label</Label><Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
            </div>
            <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
            <div className="grid grid-cols-3 gap-3">
                <div><Label>Icon</Label>
                    <Select value={form.icon} onValueChange={v => setForm(f => ({ ...f, icon: v }))}>
                        <SelectTrigger className="mt-1 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {['Droplets', 'Utensils', 'Footprints', 'Dumbbell', 'Moon', 'Flame', 'Trophy', 'Target', 'Star', 'Zap'].map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div><Label>XP Reward</Label><Input type="number" value={form.xp_reward} onChange={e => setForm(f => ({ ...f, xp_reward: +e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
                <div><Label>Color (hex)</Label><Input value={form.color_hex} onChange={e => setForm(f => ({ ...f, color_hex: e.target.value }))} className="mt-1 bg-white/5 border-white/10" placeholder="#22c55e" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div><Label>Metric</Label>
                    <Select value={form.metric} onValueChange={v => setForm(f => ({ ...f, metric: v }))}>
                        <SelectTrigger className="mt-1 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {['water_ml', 'protein_g', 'steps', 'workout_done', 'sleep_hours', 'calories_logged'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div><Label>Target Value</Label><Input type="number" value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: +e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} /><Label>Active</Label></div>
                <div className="flex items-center gap-2"><Switch checked={form.is_bonus} onCheckedChange={v => setForm(f => ({ ...f, is_bonus: v }))} /><Label>Bonus Challenge</Label></div>
            </div>
            <div className="flex gap-2 pt-2">
                <Button variant="outline" className="border-white/10" onClick={onClose}>Cancel</Button>
                <Button className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold" onClick={() => onSave(form)}>Save Mission</Button>
            </div>
        </div>
    );
}

// --- WorkoutTemplate Form ---
function TemplateForm({ initial, onSave, onClose }) {
    const [form, setForm] = useState(initial || { name: '', workout_type: 'strength', default_duration_min: 30, cal_per_min: 6, intensity: 'moderate', emoji: '💪', is_active: true, sort_order: 0 });
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
                <div><Label>Emoji</Label><Input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} className="mt-1 bg-white/5 border-white/10" placeholder="💪" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div><Label>Type</Label>
                    <Select value={form.workout_type} onValueChange={v => setForm(f => ({ ...f, workout_type: v }))}>
                        <SelectTrigger className="mt-1 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                        <SelectContent>{['strength', 'cardio', 'hiit', 'yoga', 'flexibility', 'sports', 'other'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div><Label>Intensity</Label>
                    <Select value={form.intensity} onValueChange={v => setForm(f => ({ ...f, intensity: v }))}>
                        <SelectTrigger className="mt-1 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                        <SelectContent>{['low', 'moderate', 'high', 'extreme'].map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div><Label>Default Duration (min)</Label><Input type="number" value={form.default_duration_min} onChange={e => setForm(f => ({ ...f, default_duration_min: +e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
                <div><Label>Cal/min</Label><Input type="number" step="0.5" value={form.cal_per_min} onChange={e => setForm(f => ({ ...f, cal_per_min: +e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} /><Label>Active (show to users)</Label></div>
            <div className="flex gap-2 pt-2">
                <Button variant="outline" className="border-white/10" onClick={onClose}>Cancel</Button>
                <Button className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold" onClick={() => onSave(form)}>Save Template</Button>
            </div>
        </div>
    );
}

export default function AdminAchievementsMissions() {
    const qc = useQueryClient();
    const [tab, setTab] = useState(0);
    const [editItem, setEditItem] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const { data: achievements = [] } = useQuery({ queryKey: ['achievements'], queryFn: () => entities.Achievement.list('sort_order') });
    const { data: missions = [] } = useQuery({ queryKey: ['missions'], queryFn: () => entities.Mission.list('sort_order') });
    const { data: templates = [] } = useQuery({ queryKey: ['workout-templates'], queryFn: () => entities.WorkoutTemplate.list('sort_order') });

    const saveAchievement = useMutation({
        mutationFn: (data) => editItem?.id ? entities.Achievement.update(editItem.id, data) : entities.Achievement.create(data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['achievements'] }); setShowForm(false); setEditItem(null); toast.success('Achievement saved'); },
    });
    const deleteAchievement = useMutation({
        mutationFn: (id) => entities.Achievement.delete(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['achievements'] }); toast.success('Deleted'); },
    });

    const saveMission = useMutation({
        mutationFn: (data) => editItem?.id ? entities.Mission.update(editItem.id, data) : entities.Mission.create(data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['missions'] }); setShowForm(false); setEditItem(null); toast.success('Mission saved'); },
    });
    const deleteMission = useMutation({
        mutationFn: (id) => entities.Mission.delete(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['missions'] }); toast.success('Deleted'); },
    });

    const saveTemplate = useMutation({
        mutationFn: (data) => editItem?.id ? entities.WorkoutTemplate.update(editItem.id, data) : entities.WorkoutTemplate.create(data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['workout-templates'] }); setShowForm(false); setEditItem(null); toast.success('Template saved'); },
    });
    const deleteTemplate = useMutation({
        mutationFn: (id) => entities.WorkoutTemplate.delete(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['workout-templates'] }); toast.success('Deleted'); },
    });

    const openEdit = (item) => { setEditItem(item); setShowForm(true); };
    const openNew = () => { setEditItem(null); setShowForm(true); };
    const closeForm = () => { setShowForm(false); setEditItem(null); };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-space font-bold flex items-center gap-2"><Trophy className="w-7 h-7 text-yellow-400" /> Gamification CMS</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage achievements, missions & workout templates</p>
                </div>
                <Button onClick={openNew} className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold"><Plus className="w-4 h-4 mr-2" /> Add New</Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {TABS.map((t, i) => (
                    <button key={t} onClick={() => setTab(i)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${tab === i ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'border-white/10 text-muted-foreground hover:border-white/20'}`}>
                        {t}
                    </button>
                ))}
            </div>

            {/* Dialog */}
            <Dialog open={showForm} onOpenChange={(o) => { if (!o) closeForm(); }}>
                <DialogContent className="glass border-white/10 max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editItem ? 'Edit' : 'Add'} {TABS[tab].slice(0, -1)}</DialogTitle>
                    </DialogHeader>
                    {tab === 0 && <AchievementForm initial={editItem} onSave={(d) => saveAchievement.mutate(d)} onClose={closeForm} />}
                    {tab === 1 && <MissionForm initial={editItem} onSave={(d) => saveMission.mutate(d)} onClose={closeForm} />}
                    {tab === 2 && <TemplateForm initial={editItem} onSave={(d) => saveTemplate.mutate(d)} onClose={closeForm} />}
                </DialogContent>
            </Dialog>

            {/* Achievement List */}
            {tab === 0 && (
                <div className="space-y-2">
                    {achievements.map(a => (
                        <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            className="glass rounded-xl p-4 border border-white/5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400 flex-shrink-0`}>
                                    <Star className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <div className="font-medium text-sm truncate">{a.name}</div>
                                    <div className="text-xs text-muted-foreground truncate">{a.description}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="text-xs text-yellow-400 font-semibold">+{a.xp_reward} XP</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${a.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-muted-foreground'}`}>{a.is_active ? 'Active' : 'Hidden'}</span>
                                <button onClick={() => openEdit(a)} className="text-muted-foreground hover:text-white p-1"><Edit2 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => deleteAchievement.mutate(a.id)} className="text-muted-foreground hover:text-red-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Mission List */}
            {tab === 1 && (
                <div className="space-y-2">
                    {missions.map(m => (
                        <motion.div key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            className="glass rounded-xl p-4 border border-white/5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: (m.color_hex || '#22c55e') + '20' }}>
                                    <Target className="w-4 h-4" style={{ color: m.color_hex || '#22c55e' }} />
                                </div>
                                <div className="min-w-0">
                                    <div className="font-medium text-sm truncate">{m.label} {m.is_bonus && <span className="text-[10px] bg-yellow-500/10 text-yellow-400 px-1.5 rounded ml-1">BONUS</span>}</div>
                                    <div className="text-xs text-muted-foreground">{m.metric} · target: {m.target_value}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="text-xs text-yellow-400 font-semibold">+{m.xp_reward} XP</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${m.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-muted-foreground'}`}>{m.is_active ? 'Active' : 'Hidden'}</span>
                                <button onClick={() => openEdit(m)} className="text-muted-foreground hover:text-white p-1"><Edit2 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => deleteMission.mutate(m.id)} className="text-muted-foreground hover:text-red-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Template List */}
            {tab === 2 && (
                <div className="space-y-2">
                    {templates.map(t => (
                        <motion.div key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            className="glass rounded-xl p-4 border border-white/5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className="text-xl flex-shrink-0">{t.emoji || '💪'}</span>
                                <div className="min-w-0">
                                    <div className="font-medium text-sm truncate">{t.name}</div>
                                    <div className="text-xs text-muted-foreground">{t.workout_type} · {t.default_duration_min}min · {t.intensity}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="text-xs text-blue-400">~{Math.round((t.cal_per_min || 0) * (t.default_duration_min || 0))} cal</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${t.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-muted-foreground'}`}>{t.is_active ? 'Active' : 'Hidden'}</span>
                                <button onClick={() => openEdit(t)} className="text-muted-foreground hover:text-white p-1"><Edit2 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => deleteTemplate.mutate(t.id)} className="text-muted-foreground hover:text-red-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}


