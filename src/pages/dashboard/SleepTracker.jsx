import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { today } from '@/lib/fitnessUtils';
import GlassCard from '@/components/ui/GlassCard';
import ProgressRing from '@/components/ui/ProgressRing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Moon, Plus, Trash2 } from 'lucide-react';

export default function SleepTracker() {
    const { user } = useAuth();
    const qc = useQueryClient();
    const todayStr = today();
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ hours: '', quality: 'good', bed_time: '', wake_time: '' });

    const { data: logs = [] } = useQuery({ queryKey: ['sleep', todayStr, user?.email], queryFn: () => entities.SleepLog.filter({ user_email: user?.email, date: todayStr }), enabled: !!user?.email });

    const addSleep = useMutation({
        mutationFn: (data) => entities.SleepLog.create({ ...data, user_email: user.email, date: todayStr }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['sleep'] }); setOpen(false); setForm({ hours: '', quality: 'good', bed_time: '', wake_time: '' }); },
    });

    const deleteSleep = useMutation({
        mutationFn: (id) => entities.SleepLog.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['sleep'] }),
    });

    const totalHours = logs.reduce((s, l) => s + (l.hours || 0), 0);
    const qualityColors = { poor: 'text-red-400', fair: 'text-yellow-400', good: 'text-blue-400', excellent: 'text-emerald-400' };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-space font-bold">Sleep Tracker</h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl"><Plus className="w-4 h-4 mr-2" /> Log Sleep</Button>
                    </DialogTrigger>
                    <DialogContent className="glass border-white/10">
                        <DialogHeader><DialogTitle>Log Sleep</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                            <div><Label>Hours Slept</Label><Input type="number" step="0.5" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} placeholder="e.g. 7.5" className="mt-1 bg-white/5 border-white/10" /></div>
                            <div><Label>Quality</Label>
                                <Select value={form.quality} onValueChange={v => setForm(f => ({ ...f, quality: v }))}>
                                    <SelectTrigger className="mt-1 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="poor">Poor 😴</SelectItem>
                                        <SelectItem value="fair">Fair 😐</SelectItem>
                                        <SelectItem value="good">Good 😊</SelectItem>
                                        <SelectItem value="excellent">Excellent 🌟</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><Label>Bed Time</Label><Input type="time" value={form.bed_time} onChange={e => setForm(f => ({ ...f, bed_time: e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
                                <div><Label>Wake Time</Label><Input type="time" value={form.wake_time} onChange={e => setForm(f => ({ ...f, wake_time: e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
                            </div>
                            <Button className="w-full bg-indigo-500 hover:bg-indigo-600 font-semibold" disabled={!form.hours || addSleep.isPending} onClick={() => addSleep.mutate({ ...form, hours: Number(form.hours) })}>
                                {addSleep.isPending ? 'Logging...' : 'Log Sleep'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <GlassCard className="flex flex-col items-center">
                    <ProgressRing value={totalHours} max={8} size={180} strokeWidth={12} color="#a855f7">
                        <div className="text-center">
                            <Moon className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                            <div className="text-3xl font-bold font-space text-purple-400">{totalHours}h</div>
                            <div className="text-xs text-muted-foreground">/ 8h goal</div>
                        </div>
                    </ProgressRing>
                </GlassCard>

                <GlassCard className="lg:col-span-2">
                    <h3 className="font-semibold mb-4">Sleep Entries</h3>
                    {logs.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No sleep logged. Sweet dreams! 🌙</p>
                    ) : (
                        <div className="space-y-3">
                            {logs.map(log => (
                                <div key={log.id} className="flex items-center justify-between glass rounded-xl p-4">
                                    <div>
                                        <div className="font-semibold">{log.hours} hours</div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className={qualityColors[log.quality]}>{log.quality}</span>
                                            {log.bed_time && <span>Bed: {log.bed_time}</span>}
                                            {log.wake_time && <span>Wake: {log.wake_time}</span>}
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-400" onClick={() => deleteSleep.mutate(log.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>
            </div>
        </div>
    );
}


