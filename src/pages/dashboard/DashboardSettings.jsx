import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Settings, Save, Loader2 } from 'lucide-react';
import { goalLabels, activityLabels } from '@/lib/fitnessUtils';
import { toast } from 'sonner';

export default function DashboardSettings() {
    const { user } = useAuth();
    const qc = useQueryClient();
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(null);

    const { data: profiles } = useQuery({ queryKey: ['userProfile', user?.email], queryFn: () => entities.UserProfile.filter({ user_email: user?.email }), enabled: !!user?.email });
    const profile = profiles?.[0];

    useEffect(() => {
        if (profile && !form) {
            setForm({
                age: profile.age || 25,
                height_cm: profile.height_cm || 175,
                weight_kg: profile.weight_kg || 80,
                target_weight_kg: profile.target_weight_kg || 70,
                fitness_goal: profile.fitness_goal || 'fat_loss',
                activity_level: profile.activity_level || 'moderately_active',
                daily_calorie_target: profile.daily_calorie_target || 2000,
                protein_target: profile.protein_target || 150,
                carb_target: profile.carb_target || 200,
                fat_target: profile.fat_target || 70,
                water_goal_ml: profile.water_goal_ml || 2500,
                step_goal: profile.step_goal || 10000,
            });
        }
    }, [profile]);

    const handleSave = async () => {
        setSaving(true);
        await entities.UserProfile.update(profile.id, form);
        qc.invalidateQueries({ queryKey: ['userProfile'] });
        setSaving(false);
        toast.success('Settings saved!');
    };

    if (!form) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>;

    const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

    return (
        <div className="space-y-6 max-w-2xl">
            <h1 className="text-2xl font-space font-bold flex items-center gap-3"><Settings className="w-7 h-7" /> Settings</h1>

            <GlassCard>
                <h3 className="font-semibold mb-4">Body Stats</h3>
                <div className="space-y-4">
                    {[
                        { label: 'Weight (kg)', key: 'weight_kg', min: 40, max: 200 },
                        { label: 'Target Weight (kg)', key: 'target_weight_kg', min: 40, max: 200 },
                    ].map(item => (
                        <div key={item.key}>
                            <Label>{item.label}</Label>
                            <div className="flex items-center gap-4 mt-2">
                                <Slider value={[form[item.key]]} onValueChange={([v]) => update(item.key, v)} min={item.min} max={item.max} className="flex-1" />
                                <span className="font-bold w-16 text-right">{form[item.key]}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </GlassCard>

            <GlassCard>
                <h3 className="font-semibold mb-4">Goals & Targets</h3>
                <div className="space-y-4">
                    <div><Label>Fitness Goal</Label>
                        <Select value={form.fitness_goal} onValueChange={v => update('fitness_goal', v)}>
                            <SelectTrigger className="mt-1 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                            <SelectContent>{Object.entries(goalLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div><Label>Activity Level</Label>
                        <Select value={form.activity_level} onValueChange={v => update('activity_level', v)}>
                            <SelectTrigger className="mt-1 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                            <SelectContent>{Object.entries(activityLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><Label>Calorie Target</Label><Input type="number" value={form.daily_calorie_target} onChange={e => update('daily_calorie_target', Number(e.target.value))} className="mt-1 bg-white/5 border-white/10" /></div>
                        <div><Label>Protein (g)</Label><Input type="number" value={form.protein_target} onChange={e => update('protein_target', Number(e.target.value))} className="mt-1 bg-white/5 border-white/10" /></div>
                        <div><Label>Water (ml)</Label><Input type="number" value={form.water_goal_ml} onChange={e => update('water_goal_ml', Number(e.target.value))} className="mt-1 bg-white/5 border-white/10" /></div>
                        <div><Label>Step Goal</Label><Input type="number" value={form.step_goal} onChange={e => update('step_goal', Number(e.target.value))} className="mt-1 bg-white/5 border-white/10" /></div>
                    </div>
                </div>
            </GlassCard>

            <Button className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold w-full py-6" onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save Settings</>}
            </Button>
        </div>
    );
}


