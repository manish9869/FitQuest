import React, { useState, useMemo } from 'react';
import { entities } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { format, subDays, parseISO } from 'date-fns';
import { today, goalLabels, activityLabels } from '@/lib/fitnessUtils';
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine
} from 'recharts';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
    ArrowLeft, User, Flame, Target, Droplets, Footprints, Plus, FileText,
    MessageSquare, Loader2, Scale, Moon, Dumbbell, Pill, Activity,
    TrendingDown, TrendingUp, Trophy, Award, Calendar, Heart, Utensils,
    Camera, Image, Ruler, Zap, Star
} from 'lucide-react';
import { toast } from 'sonner';

const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="glass rounded-lg p-2.5 text-xs border border-white/10">
            <p className="font-semibold mb-1 text-muted-foreground">{label}</p>
            {payload.map(p => <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value?.toLocaleString()}</p>)}
        </div>
    );
};

const StatBadge = ({ label, value, color = 'text-white', sub }) => (
    <div className="glass rounded-xl p-3 text-center border border-white/5">
        <div className={`text-lg font-bold font-space ${color}`}>{value}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
        {sub && <div className="text-[10px] text-muted-foreground/50 mt-0.5">{sub}</div>}
    </div>
);

const SectionTab = ({ id, label, icon: Icon, active, onClick }) => (
    <button onClick={() => onClick(id)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${active ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}>
        <Icon className="w-4 h-4" />
        {label}
    </button>
);

export default function AdminUserDetail() {
    const navigate = useNavigate();
    const { user: admin } = useAuth();
    const qc = useQueryClient();
    const userId = window.location.pathname.split('/').pop();
    const [activeTab, setActiveTab] = useState('overview');
    const [chartRange, setChartRange] = useState(14);

    // Fetch all user profiles, find the target by id
    const { data: allUsers = [] } = useQuery({
        queryKey: ['admin-users'],
        queryFn: () => entities.UserProfile.list(),
    });
    const targetUser = allUsers.find(u => u.id === userId);

    // Use user_email from the profile row
    const email = targetUser?.user_email;

    const { data: profiles = [] } = useQuery({ queryKey: ['aup', email], queryFn: () => entities.UserProfile.filter({ user_email: email }), enabled: !!email });
    const { data: meals = [] } = useQuery({ queryKey: ['aum', email], queryFn: () => entities.MealLog.filter({ user_email: email }), enabled: !!email });
    const { data: waterLogs = [] } = useQuery({ queryKey: ['auw', email], queryFn: () => entities.WaterLog.filter({ user_email: email }), enabled: !!email });
    const { data: stepLogs = [] } = useQuery({ queryKey: ['aus', email], queryFn: () => entities.StepLog.filter({ user_email: email }), enabled: !!email });
    const { data: workouts = [] } = useQuery({ queryKey: ['auwk', email], queryFn: () => entities.WorkoutLog.filter({ user_email: email }), enabled: !!email });
    const { data: sleepLogs = [] } = useQuery({ queryKey: ['ausl', email], queryFn: () => entities.SleepLog.filter({ user_email: email }), enabled: !!email });
    const { data: weightLogs = [] } = useQuery({ queryKey: ['auwt', email], queryFn: () => entities.WeightLog.filter({ user_email: email }), enabled: !!email });
    const { data: supplements = [] } = useQuery({ queryKey: ['ausupp', email], queryFn: () => entities.UserSupplement.filter({ user_email: email }), enabled: !!email });
    const { data: notes = [] } = useQuery({ queryKey: ['aun', email], queryFn: () => entities.AdminNote.filter({ user_email: email }), enabled: !!email });
    const { data: plans = [] } = useQuery({ queryKey: ['aucoa', email], queryFn: () => entities.CoachPlan.filter({ user_email: email }), enabled: !!email });
    const { data: bodyProgress = [] } = useQuery({ queryKey: ['aubp', email], queryFn: () => entities.BodyProgress.filter({ user_email: email }, 'date', 50), enabled: !!email });

    const profile = profiles[0] || targetUser; // fallback to targetUser which is itself a profile

    const dateRange = useMemo(() => Array.from({ length: chartRange }, (_, i) =>
        format(subDays(new Date(), chartRange - 1 - i), 'yyyy-MM-dd')
    ), [chartRange]);

    const rangeLabel = (d) => format(new Date(d), chartRange <= 14 ? 'MMM d' : 'MMM d');

    const nutritionChartData = useMemo(() => dateRange.map(date => ({
        date: rangeLabel(date),
        calories: meals.filter(m => m.date === date).reduce((s, m) => s + (m.calories || 0), 0),
        protein: meals.filter(m => m.date === date).reduce((s, m) => s + (m.protein || 0), 0),
        carbs: meals.filter(m => m.date === date).reduce((s, m) => s + (m.carbs || 0), 0),
    })), [dateRange, meals]);

    const activityChartData = useMemo(() => dateRange.map(date => ({
        date: rangeLabel(date),
        steps: stepLogs.filter(s => s.date === date).reduce((s, st) => s + (st.steps || 0), 0),
        water: waterLogs.filter(w => w.date === date).reduce((s, w) => s + (w.amount_ml || 0), 0),
        workouts: workouts.filter(w => w.date === date).length,
    })), [dateRange, stepLogs, waterLogs, workouts]);

    const sleepChartData = useMemo(() => dateRange.map(date => ({
        date: rangeLabel(date),
        hours: sleepLogs.filter(s => s.date === date).reduce((s, sl) => s + (sl.hours || 0), 0),
    })), [dateRange, sleepLogs]);

    const weightChartData = useMemo(() =>
        [...weightLogs]
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(l => ({ date: format(parseISO(l.date), 'MMM d'), weight: l.weight_kg })),
        [weightLogs]);

    const last7start = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    const totalWorkouts7 = workouts.filter(w => w.date >= last7start).length;
    const avgCalories7 = useMemo(() => {
        const days = dateRange.slice(-7);
        const total = days.reduce((s, d) => s + meals.filter(m => m.date === d).reduce((ss, m) => ss + (m.calories || 0), 0), 0);
        return Math.round(total / 7);
    }, [dateRange, meals]);
    const avgSleep7 = useMemo(() => {
        const recent = sleepLogs.filter(s => s.date >= last7start);
        return recent.length ? (recent.reduce((s, sl) => s + (sl.hours || 0), 0) / recent.length).toFixed(1) : '—';
    }, [sleepLogs]);
    const avgSteps7 = useMemo(() => {
        const days = dateRange.slice(-7);
        const total = days.reduce((s, d) => s + stepLogs.filter(st => st.date === d).reduce((ss, st) => ss + (st.steps || 0), 0), 0);
        return Math.round(total / 7);
    }, [dateRange, stepLogs]);

    const latestWeight = [...weightLogs].sort((a, b) => b.date.localeCompare(a.date))[0];
    const streak = profile?.login_streak || 0;
    const status = streak > 3 ? 'Active' : streak > 0 ? 'At Risk' : 'Inactive';
    const statusColor = status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        : status === 'At Risk' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
            : 'bg-red-500/10 text-red-400 border-red-500/20';

    const [planOpen, setPlanOpen] = useState(false);
    const [planForm, setPlanForm] = useState({ plan_type: 'nutrition', title: '', description: '', calorie_target: '', protein_target: '', step_target: '', water_target_ml: '', notes: '' });
    const createPlan = useMutation({
        mutationFn: (data) => entities.CoachPlan.create({ ...data, user_email: email, assigned_by: admin?.email, status: 'active', start_date: today() }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['aucoa'] }); setPlanOpen(false); toast.success('Plan assigned!'); },
    });

    const [noteOpen, setNoteOpen] = useState(false);
    const [noteForm, setNoteForm] = useState({ note: '', category: 'general' });
    const createNote = useMutation({
        mutationFn: (data) => entities.AdminNote.create({ ...data, user_email: email, admin_email: admin?.email }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['aun'] }); setNoteOpen(false); setNoteForm({ note: '', category: 'general' }); toast.success('Note added!'); },
    });

    if (!targetUser) return (
        <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
    );

    const tabs = [
        { id: 'overview', label: 'Overview', icon: User },
        { id: 'nutrition', label: 'Nutrition', icon: Utensils },
        { id: 'activity', label: 'Activity', icon: Activity },
        { id: 'weight', label: 'Weight', icon: Scale },
        { id: 'sleep', label: 'Sleep', icon: Moon },
        { id: 'supplements', label: 'Supplements', icon: Pill },
        { id: 'plans', label: 'Plans & Notes', icon: FileText },
        { id: 'body_progress', label: 'Body Progress', icon: Camera },
    ];

    const RangeSelector = () => (
        <div className="flex gap-1">
            {[7, 14, 30].map(r => (
                <button key={r} onClick={() => setChartRange(r)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${chartRange === r ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-muted-foreground hover:bg-white/5'}`}>
                    {r}d
                </button>
            ))}
        </div>
    );

    const displayName = targetUser.user_email?.split('@')[0] || targetUser.user_email;

    return (
        <div className="space-y-5">
            <Button variant="ghost" className="text-muted-foreground" onClick={() => navigate('/admin/users')}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Users
            </Button>

            {/* Header */}
            <GlassCard className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center text-2xl font-bold text-purple-400">
                        {displayName[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{displayName}</h2>
                        <p className="text-sm text-muted-foreground">{targetUser.user_email}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${statusColor}`}>{status}</span>
                            <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">
                                {goalLabels[profile?.fitness_goal] || 'No goal set'}
                            </span>
                            <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">
                                {profile?.activity_level ? activityLabels[profile.activity_level] : '—'}
                            </span>
                            <span className="text-xs text-orange-400 font-semibold">{streak} 🔥</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Dialog open={planOpen} onOpenChange={setPlanOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-purple-500 hover:bg-purple-600 text-white rounded-xl">
                                <FileText className="w-4 h-4 mr-2" /> Assign Plan
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="glass border-white/10 max-w-lg">
                            <DialogHeader><DialogTitle>Assign Coach Plan</DialogTitle></DialogHeader>
                            <div className="space-y-3">
                                <div><Label>Plan Type</Label>
                                    <Select value={planForm.plan_type} onValueChange={v => setPlanForm(f => ({ ...f, plan_type: v }))}>
                                        <SelectTrigger className="mt-1 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="workout">Workout Plan</SelectItem>
                                            <SelectItem value="nutrition">Nutrition Plan</SelectItem>
                                            <SelectItem value="weekly_targets">Weekly Targets</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div><Label>Title</Label><Input value={planForm.title} onChange={e => setPlanForm(f => ({ ...f, title: e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
                                <div><Label>Description</Label><Textarea value={planForm.description} onChange={e => setPlanForm(f => ({ ...f, description: e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><Label>Calorie Target</Label><Input type="number" value={planForm.calorie_target} onChange={e => setPlanForm(f => ({ ...f, calorie_target: e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
                                    <div><Label>Protein (g)</Label><Input type="number" value={planForm.protein_target} onChange={e => setPlanForm(f => ({ ...f, protein_target: e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
                                    <div><Label>Step Target</Label><Input type="number" value={planForm.step_target} onChange={e => setPlanForm(f => ({ ...f, step_target: e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
                                    <div><Label>Water (ml)</Label><Input type="number" value={planForm.water_target_ml} onChange={e => setPlanForm(f => ({ ...f, water_target_ml: e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
                                </div>
                                <div><Label>Notes</Label><Textarea value={planForm.notes} onChange={e => setPlanForm(f => ({ ...f, notes: e.target.value }))} className="mt-1 bg-white/5 border-white/10" /></div>
                                <Button className="w-full bg-purple-500 hover:bg-purple-600"
                                    disabled={!planForm.title || createPlan.isPending}
                                    onClick={() => createPlan.mutate({
                                        ...planForm,
                                        calorie_target: Number(planForm.calorie_target) || undefined,
                                        protein_target: Number(planForm.protein_target) || undefined,
                                        step_target: Number(planForm.step_target) || undefined,
                                        water_target_ml: Number(planForm.water_target_ml) || undefined,
                                    })}>
                                    {createPlan.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Assign Plan
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="border-white/10 rounded-xl">
                                <MessageSquare className="w-4 h-4 mr-2" /> Add Note
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="glass border-white/10">
                            <DialogHeader><DialogTitle>Add Note</DialogTitle></DialogHeader>
                            <div className="space-y-3">
                                <div><Label>Category</Label>
                                    <Select value={noteForm.category} onValueChange={v => setNoteForm(f => ({ ...f, category: v }))}>
                                        <SelectTrigger className="mt-1 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="general">General</SelectItem>
                                            <SelectItem value="motivation">Motivation</SelectItem>
                                            <SelectItem value="warning">Warning</SelectItem>
                                            <SelectItem value="intervention">Intervention</SelectItem>
                                            <SelectItem value="progress">Progress</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div><Label>Note</Label>
                                    <Textarea value={noteForm.note} onChange={e => setNoteForm(f => ({ ...f, note: e.target.value }))} className="mt-1 bg-white/5 border-white/10" rows={4} />
                                </div>
                                <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-black"
                                    disabled={!noteForm.note || createNote.isPending}
                                    onClick={() => createNote.mutate(noteForm)}>
                                    {createNote.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Save Note
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </GlassCard>

            {/* Summary KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                <StatBadge label="Current Weight" value={latestWeight ? `${latestWeight.weight_kg}kg` : '—'} color="text-emerald-400" />
                <StatBadge label="Target Weight" value={profile?.target_weight_kg ? `${profile.target_weight_kg}kg` : '—'} color="text-yellow-400" />
                <StatBadge label="Avg Calories" value={avgCalories7 || '—'} sub="7-day avg" color="text-white" />
                <StatBadge label="Avg Steps" value={avgSteps7 ? avgSteps7.toLocaleString() : '—'} sub="7-day avg" color="text-orange-400" />
                <StatBadge label="Workouts" value={totalWorkouts7} sub="last 7 days" color="text-purple-400" />
                <StatBadge label="Avg Sleep" value={avgSleep7 !== '—' ? `${avgSleep7}h` : '—'} sub="7-day avg" color="text-blue-400" />
                <StatBadge label="Total XP" value={(profile?.total_xp || 0).toLocaleString()} color="text-yellow-400" />
                <StatBadge label="Streak" value={`${streak}🔥`} sub="login days" color="text-orange-400" />
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5 flex-wrap">
                {tabs.map(t => <SectionTab key={t.id} {...t} active={activeTab === t.id} onClick={setActiveTab} />)}
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
                <div className="space-y-5">
                    <div className="grid lg:grid-cols-3 gap-5">
                        <GlassCard animate={false}>
                            <h3 className="font-semibold mb-4 flex items-center gap-2"><User className="w-4 h-4 text-purple-400" /> Profile</h3>
                            <div className="space-y-2.5 text-sm">
                                {[
                                    ['Age', profile?.age ? `${profile.age} yrs` : '—'],
                                    ['Height', profile?.height_cm ? `${profile.height_cm} cm` : '—'],
                                    ['Starting Weight', profile?.weight_kg ? `${profile.weight_kg} kg` : '—'],
                                    ['Fitness Goal', goalLabels[profile?.fitness_goal] || '—'],
                                    ['Activity Level', activityLabels[profile?.activity_level] || '—'],
                                    ['Workout Freq.', profile?.workout_frequency ? `${profile.workout_frequency}x/week` : '—'],
                                ].map(([k, v]) => (
                                    <div key={k} className="flex justify-between border-b border-white/5 pb-2 last:border-0">
                                        <span className="text-muted-foreground">{k}</span>
                                        <span className="font-medium">{v}</span>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                        <GlassCard animate={false}>
                            <h3 className="font-semibold mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-emerald-400" /> Daily Targets</h3>
                            <div className="space-y-2.5 text-sm">
                                {[
                                    ['Calories', profile?.daily_calorie_target ? `${profile.daily_calorie_target} kcal` : '—', 'text-emerald-400'],
                                    ['Protein', profile?.protein_target ? `${profile.protein_target}g` : '—', 'text-blue-400'],
                                    ['Carbs', profile?.carb_target ? `${profile.carb_target}g` : '—', 'text-yellow-400'],
                                    ['Fat', profile?.fat_target ? `${profile.fat_target}g` : '—', 'text-purple-400'],
                                    ['Water', profile?.water_goal_ml ? `${profile.water_goal_ml}ml` : '—', 'text-cyan-400'],
                                    ['Steps', profile?.step_goal ? profile.step_goal.toLocaleString() : '—', 'text-orange-400'],
                                ].map(([k, v, c]) => (
                                    <div key={k} className="flex justify-between border-b border-white/5 pb-2 last:border-0">
                                        <span className="text-muted-foreground">{k}</span>
                                        <span className={`font-semibold ${c}`}>{v}</span>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                        <GlassCard animate={false}>
                            <h3 className="font-semibold mb-4 flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-400" /> Achievements</h3>
                            {(!profile?.achievements || profile.achievements.length === 0) ? (
                                <p className="text-sm text-muted-foreground italic">No achievements yet.</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {profile.achievements.map(a => (
                                        <span key={a} className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2.5 py-1 rounded-full">{a}</span>
                                    ))}
                                </div>
                            )}
                            <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-3 text-center">
                                <div>
                                    <div className="text-xl font-bold text-yellow-400">{profile?.total_xp?.toLocaleString() || 0}</div>
                                    <div className="text-xs text-muted-foreground">Total XP</div>
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-orange-400">{profile?.longest_streak || 0}</div>
                                    <div className="text-xs text-muted-foreground">Best Streak</div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                    <div className="grid lg:grid-cols-2 gap-5">
                        <GlassCard animate={false}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold">Calories Overview</h3>
                                <RangeSelector />
                            </div>
                            <ResponsiveContainer width="100%" height={180}>
                                <AreaChart data={nutritionChartData}>
                                    <defs><linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} /><stop offset="100%" stopColor="#22c55e" stopOpacity={0} /></linearGradient></defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                                    <Tooltip content={<ChartTooltip />} />
                                    {profile?.daily_calorie_target && <ReferenceLine y={profile.daily_calorie_target} stroke="#f59e0b" strokeDasharray="4 4" />}
                                    <Area type="monotone" dataKey="calories" stroke="#22c55e" fill="url(#cg2)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </GlassCard>
                        <GlassCard animate={false}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold">Steps Overview</h3>
                                <RangeSelector />
                            </div>
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={activityChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                                    <Tooltip content={<ChartTooltip />} />
                                    {profile?.step_goal && <ReferenceLine y={profile.step_goal} stroke="#f59e0b" strokeDasharray="4 4" />}
                                    <Bar dataKey="steps" fill="#f97316" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </GlassCard>
                    </div>
                </div>
            )}

            {/* NUTRITION TAB */}
            {activeTab === 'nutrition' && (
                <div className="space-y-5">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">Nutrition Analysis</h3>
                        <RangeSelector />
                    </div>
                    <div className="grid lg:grid-cols-2 gap-5">
                        <GlassCard animate={false}>
                            <h4 className="font-medium mb-4 text-emerald-400">Calories vs Target</h4>
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={nutritionChartData}>
                                    <defs><linearGradient id="ncg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} /><stop offset="100%" stopColor="#22c55e" stopOpacity={0} /></linearGradient></defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                                    <Tooltip content={<ChartTooltip />} />
                                    {profile?.daily_calorie_target && <ReferenceLine y={profile.daily_calorie_target} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Target', fill: '#f59e0b', fontSize: 10 }} />}
                                    <Area type="monotone" dataKey="calories" stroke="#22c55e" fill="url(#ncg)" strokeWidth={2} dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </GlassCard>
                        <GlassCard animate={false}>
                            <h4 className="font-medium mb-4 text-blue-400">Macros Breakdown</h4>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={nutritionChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Bar dataKey="protein" fill="#3b82f6" radius={[2, 2, 0, 0]} stackId="a" />
                                    <Bar dataKey="carbs" fill="#a855f7" radius={[2, 2, 0, 0]} stackId="a" />
                                </BarChart>
                            </ResponsiveContainer>
                        </GlassCard>
                    </div>
                    <GlassCard animate={false}>
                        <h4 className="font-medium mb-4">Recent Meals ({meals.length} total)</h4>
                        <div className="space-y-2 max-h-72 overflow-y-auto">
                            {[...meals].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20).map(m => (
                                <div key={m.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/3 text-sm">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        {m.photo_url ? <img src={m.photo_url} alt={m.food_name} className="w-full h-full object-cover" /> : <Utensils className="w-3.5 h-3.5 text-emerald-400" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{m.food_name}</div>
                                        <div className="text-xs text-muted-foreground">{m.date} · {m.meal_type}</div>
                                    </div>
                                    <div className="text-right text-xs">
                                        <div className="text-emerald-400 font-semibold">{m.calories || 0} kcal</div>
                                        <div className="text-muted-foreground">{m.protein || 0}g P</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* ACTIVITY TAB */}
            {activeTab === 'activity' && (
                <div className="space-y-5">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">Activity & Training</h3>
                        <RangeSelector />
                    </div>
                    <div className="grid lg:grid-cols-2 gap-5">
                        <GlassCard animate={false}>
                            <h4 className="font-medium mb-4 text-orange-400">Daily Steps</h4>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={activityChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                                    <Tooltip content={<ChartTooltip />} />
                                    {profile?.step_goal && <ReferenceLine y={profile.step_goal} stroke="#f59e0b" strokeDasharray="4 4" />}
                                    <Bar dataKey="steps" fill="#f97316" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </GlassCard>
                        <GlassCard animate={false}>
                            <h4 className="font-medium mb-4 text-cyan-400">Water Intake (ml)</h4>
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={activityChartData}>
                                    <defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} /><stop offset="100%" stopColor="#06b6d4" stopOpacity={0} /></linearGradient></defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                                    <Tooltip content={<ChartTooltip />} />
                                    {profile?.water_goal_ml && <ReferenceLine y={profile.water_goal_ml} stroke="#f59e0b" strokeDasharray="4 4" />}
                                    <Area type="monotone" dataKey="water" stroke="#06b6d4" fill="url(#wg)" strokeWidth={2} dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </GlassCard>
                    </div>
                    <GlassCard animate={false}>
                        <h4 className="font-medium mb-4">Workout History ({workouts.length} sessions)</h4>
                        <div className="space-y-2 max-h-72 overflow-y-auto">
                            {[...workouts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20).map(w => (
                                <div key={w.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/3">
                                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                        <Dumbbell className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">{w.name}</div>
                                        <div className="text-xs text-muted-foreground">{w.date} · {w.workout_type} · {w.intensity}</div>
                                    </div>
                                    <div className="text-right text-xs flex-shrink-0">
                                        <div className="text-purple-400 font-semibold">{w.duration_min || 0} min</div>
                                        {w.calories_burned && <div className="text-muted-foreground">{w.calories_burned} kcal</div>}
                                    </div>
                                </div>
                            ))}
                            {workouts.length === 0 && <p className="text-sm text-muted-foreground italic p-2">No workouts logged.</p>}
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* WEIGHT TAB */}
            {activeTab === 'weight' && (
                <div className="space-y-5">
                    <h3 className="font-semibold text-lg">Weight Progress</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <StatBadge label="Current" value={latestWeight ? `${latestWeight.weight_kg}kg` : '—'} color="text-white" />
                        <StatBadge label="Starting" value={profile?.weight_kg ? `${profile.weight_kg}kg` : '—'} color="text-blue-400" />
                        <StatBadge label="Goal" value={profile?.target_weight_kg ? `${profile.target_weight_kg}kg` : '—'} color="text-yellow-400" />
                        <StatBadge label="Total Change"
                            value={latestWeight && profile?.weight_kg ? `${(latestWeight.weight_kg - profile.weight_kg).toFixed(1)}kg` : '—'}
                            color={latestWeight && profile?.weight_kg && latestWeight.weight_kg < profile.weight_kg ? 'text-emerald-400' : 'text-red-400'} />
                    </div>
                    <GlassCard animate={false}>
                        <h4 className="font-medium mb-4 text-emerald-400">Weight Trend ({weightLogs.length} entries)</h4>
                        {weightChartData.length < 2 ? (
                            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Not enough data to show chart</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={240}>
                                <LineChart data={weightChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} domain={['auto', 'auto']} />
                                    <Tooltip content={<ChartTooltip />} />
                                    {profile?.target_weight_kg && <ReferenceLine y={profile.target_weight_kg} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Goal', fill: '#f59e0b', fontSize: 10 }} />}
                                    <Line type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: '#22c55e', r: 3 }} activeDot={{ r: 5 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </GlassCard>
                    <GlassCard animate={false}>
                        <h4 className="font-medium mb-3">All Weight Entries</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {[...weightLogs].sort((a, b) => b.date.localeCompare(a.date)).map(l => (
                                <div key={l.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/3 text-sm">
                                    <Scale className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    <span className="font-bold">{l.weight_kg} kg</span>
                                    <span className="text-muted-foreground text-xs">{format(parseISO(l.date), 'EEEE, MMM d yyyy')}</span>
                                    {l.notes && <span className="text-xs text-muted-foreground/60 truncate ml-auto">{l.notes}</span>}
                                </div>
                            ))}
                            {weightLogs.length === 0 && <p className="text-sm text-muted-foreground italic">No weight entries.</p>}
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* SLEEP TAB */}
            {activeTab === 'sleep' && (
                <div className="space-y-5">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">Sleep Analysis</h3>
                        <RangeSelector />
                    </div>
                    <GlassCard animate={false}>
                        <h4 className="font-medium mb-4 text-blue-400">Sleep Duration</h4>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={sleepChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} domain={[0, 10]} />
                                <Tooltip content={<ChartTooltip />} />
                                <ReferenceLine y={8} stroke="#22c55e" strokeDasharray="4 4" label={{ value: 'Ideal (8h)', fill: '#22c55e', fontSize: 10 }} />
                                <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </GlassCard>
                    <GlassCard animate={false}>
                        <h4 className="font-medium mb-3">Sleep Log ({sleepLogs.length} entries)</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {[...sleepLogs].sort((a, b) => b.date.localeCompare(a.date)).map(s => (
                                <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/3 text-sm">
                                    <Moon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                    <div className="flex-1">
                                        <span className="font-semibold">{s.hours}h</span>
                                        {s.quality && <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${s.quality === 'excellent' ? 'bg-emerald-500/10 text-emerald-400' : s.quality === 'good' ? 'bg-blue-500/10 text-blue-400' : s.quality === 'fair' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>{s.quality}</span>}
                                    </div>
                                    <span className="text-xs text-muted-foreground">{s.date}</span>
                                </div>
                            ))}
                            {sleepLogs.length === 0 && <p className="text-sm text-muted-foreground italic">No sleep entries.</p>}
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* SUPPLEMENTS TAB */}
            {activeTab === 'supplements' && (
                <div className="space-y-5">
                    <h3 className="font-semibold text-lg">Supplement Stack</h3>
                    {supplements.length === 0 ? (
                        <GlassCard animate={false}><p className="text-sm text-muted-foreground italic">No supplements tracked.</p></GlassCard>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {supplements.map(s => (
                                <GlassCard key={s.id} animate={false} className="border border-white/5">
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                            <Pill className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-sm">{s.name}</div>
                                            {s.brand && <div className="text-xs text-muted-foreground">{s.brand}</div>}
                                            <div className="flex gap-2 mt-2 flex-wrap">
                                                {s.dosage && <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full">{s.dosage}</span>}
                                                {s.timing && <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">{s.timing.replace('_', ' ')}</span>}
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${s.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-muted-foreground'}`}>
                                                    {s.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* BODY PROGRESS TAB */}
            {activeTab === 'body_progress' && (
                <div className="space-y-5">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Camera className="w-5 h-5 text-emerald-400" /> Body Progress
                        </h3>
                        <span className="text-sm text-muted-foreground">{bodyProgress.length} check-ins</span>
                    </div>
                    {bodyProgress.length === 0 ? (
                        <GlassCard animate={false}>
                            <div className="flex flex-col items-center py-12 gap-3 text-center">
                                <Camera className="w-12 h-12 text-muted-foreground/20" />
                                <p className="text-muted-foreground">No body progress entries yet.</p>
                            </div>
                        </GlassCard>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[...bodyProgress].sort((a, b) => b.date.localeCompare(a.date)).map(entry => {
                                const photos = [entry.front_photo_url, entry.side_photo_url, entry.back_photo_url].filter(Boolean);
                                const moodEmoji = { terrible: '😞', bad: '😕', okay: '😐', good: '😊', amazing: '🤩' };
                                return (
                                    <GlassCard key={entry.id} animate={false} className="p-0 overflow-hidden border border-white/5">
                                        {photos.length > 0 ? (
                                            <div className="relative grid grid-cols-3 gap-0.5 h-44">
                                                {photos.map((p, i) => (
                                                    <div key={i} className="relative overflow-hidden">
                                                        <img src={p} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />
                                                <div className="absolute bottom-0 inset-x-0 p-3">
                                                    <div className="font-semibold text-sm text-white">{format(parseISO(entry.date), 'MMM d, yyyy')}</div>
                                                    <div className="flex gap-2 text-xs text-white/80 mt-1">
                                                        {entry.weight_kg && <span>{entry.weight_kg}kg</span>}
                                                        {entry.body_fat_pct && <span>{entry.body_fat_pct}% BF</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4">
                                                <div className="font-semibold text-sm">{format(parseISO(entry.date), 'MMM d, yyyy')}</div>
                                                <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                                                    {entry.weight_kg && <span>{entry.weight_kg}kg</span>}
                                                    {entry.body_fat_pct && <span>{entry.body_fat_pct}% BF</span>}
                                                </div>
                                            </div>
                                        )}
                                    </GlassCard>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* PLANS & NOTES TAB */}
            {activeTab === 'plans' && (
                <div className="grid lg:grid-cols-2 gap-5">
                    <GlassCard animate={false}>
                        <h3 className="font-semibold mb-4">Assigned Plans ({plans.length})</h3>
                        {plans.length === 0 ? <p className="text-sm text-muted-foreground italic">No plans assigned yet.</p> : (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {plans.map(plan => (
                                    <div key={plan.id} className="glass rounded-xl p-4 border border-white/5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${plan.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/10 text-muted-foreground border-white/10'}`}>{plan.status}</span>
                                            <span className="text-xs text-muted-foreground capitalize">{plan.plan_type?.replace('_', ' ')}</span>
                                        </div>
                                        <div className="font-medium">{plan.title}</div>
                                        {plan.description && <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </GlassCard>
                    <GlassCard animate={false}>
                        <h3 className="font-semibold mb-4">Coach Notes ({notes.length})</h3>
                        {notes.length === 0 ? <p className="text-sm text-muted-foreground italic">No notes yet.</p> : (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {notes.map(note => (
                                    <div key={note.id} className="glass rounded-xl p-4 border border-white/5">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${note.category === 'motivation' ? 'bg-emerald-500/10 text-emerald-400' : note.category === 'warning' ? 'bg-yellow-500/10 text-yellow-400' : note.category === 'intervention' ? 'bg-red-500/10 text-red-400' : note.category === 'progress' ? 'bg-blue-500/10 text-blue-400' : 'bg-white/10 text-muted-foreground'}`}>{note.category}</span>
                                            <span className="text-xs text-muted-foreground">{note.created_date ? format(new Date(note.created_date), 'MMM d') : ''}</span>
                                        </div>
                                        <p className="text-sm">{note.note}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </GlassCard>
                </div>
            )}
        </div>
    );
}


