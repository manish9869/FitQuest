import React, { useState, useMemo } from 'react';
import { entities } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { format, subDays, parseISO, eachDayOfInterval } from 'date-fns';
import { today, goalLabels, activityLabels } from '@/lib/fitnessUtils';
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine
} from 'recharts';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
    ArrowLeft, User, Target, FileText, MessageSquare, Loader2,
    Scale, Moon, Dumbbell, Pill, Activity, Trophy, Utensils,
    Camera, CalendarRange, ChevronLeft, ChevronRight, Zap
} from 'lucide-react';
import UserTasksWidget from '@/pages/admin/UserTasksWidget';
import { toast } from 'sonner';

// ─── Tooltip ─────────────────────────────────────────────────────────────────
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

const ACHIEVEMENT_COLORS = {
    yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
    pink: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
};

// ─── Chart date-range picker (multi-day) ──────────────────────────────────────
function ChartRangePicker({ startDate, endDate, onStartChange, onEndChange, onPreset }) {
    const presets = [{ label: '7d', days: 7 }, { label: '14d', days: 14 }, { label: '30d', days: 30 }, { label: '90d', days: 90 }];
    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1">
                {presets.map(p => (
                    <button key={p.label} onClick={() => onPreset(p.days)}
                        className="text-xs px-2.5 py-1 rounded-lg font-medium text-muted-foreground hover:bg-white/5 hover:text-white transition-all border border-white/5">
                        {p.label}
                    </button>
                ))}
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
                <CalendarRange className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <input type="date" value={startDate} onChange={e => onStartChange(e.target.value)}
                    className="bg-transparent text-xs text-white border-none outline-none w-[115px] [color-scheme:dark]" />
                <span className="text-muted-foreground text-xs">→</span>
                <input type="date" value={endDate} onChange={e => onEndChange(e.target.value)}
                    className="bg-transparent text-xs text-white border-none outline-none w-[115px] [color-scheme:dark]" />
            </div>
        </div>
    );
}

// ─── Single-day picker (for logs) ────────────────────────────────────────────
function DayPicker({ date, onChange }) {
    const prev = () => onChange(format(subDays(parseISO(date), 1), 'yyyy-MM-dd'));
    const next = () => {
        const n = format(new Date(new Date(date).getTime() + 86400000), 'yyyy-MM-dd');
        if (n <= format(new Date(), 'yyyy-MM-dd')) onChange(n);
    };
    const isToday = date === format(new Date(), 'yyyy-MM-dd');
    return (
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl px-2 py-1.5">
            <button onClick={prev} className="p-0.5 rounded hover:bg-white/10 transition-colors">
                <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <input type="date" value={date} onChange={e => e.target.value && onChange(e.target.value)}
                className="bg-transparent text-xs text-white border-none outline-none w-[115px] [color-scheme:dark]" />
            <button onClick={next} disabled={isToday}
                className="p-0.5 rounded hover:bg-white/10 transition-colors disabled:opacity-30">
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            {!isToday && (
                <button onClick={() => onChange(format(new Date(), 'yyyy-MM-dd'))}
                    className="text-[10px] text-purple-400 hover:text-purple-300 ml-1 transition-colors">Today</button>
            )}
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminUserDetail() {
    const navigate = useNavigate();
    const { user: admin } = useAuth();
    const qc = useQueryClient();
    const userId = window.location.pathname.split('/').pop();
    const [activeTab, setActiveTab] = useState('overview');

    // Chart range (multi-day) — used for all charts
    const [chartStart, setChartStart] = useState(format(subDays(new Date(), 13), 'yyyy-MM-dd'));
    const [chartEnd, setChartEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
    const handleChartPreset = (days) => {
        setChartStart(format(subDays(new Date(), days - 1), 'yyyy-MM-dd'));
        setChartEnd(format(new Date(), 'yyyy-MM-dd'));
    };

    // Single-day (for log tables)
    const [selectedDay, setSelectedDay] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Date range as array
    const chartDates = useMemo(() => {
        const s = parseISO(chartStart), e = parseISO(chartEnd);
        if (e < s) return [chartStart];
        return eachDayOfInterval({ start: s, end: e }).map(d => format(d, 'yyyy-MM-dd'));
    }, [chartStart, chartEnd]);

    const chartDays = chartDates.length || 1;
    const rangeLabel = (d) => format(parseISO(d), chartDays <= 31 ? 'MMM d' : 'MMM d');

    // ── Data queries ──────────────────────────────────────────────────────────
    const { data: allUsers = [] } = useQuery({ queryKey: ['admin-users'], queryFn: () => entities.UserProfile.list() });
    const targetUser = allUsers.find(u => u.id === userId);
    const email = targetUser?.user_email;
    const qOpts = { enabled: !!email };

    // Master achievements table — keyed by achievement_id AND id AND name
    const { data: masterAchievements = [] } = useQuery({
        queryKey: ['achievements-master'],
        queryFn: () => entities.Achievement.list(),
        staleTime: 300000,
    });
    // Also fetch challenges so we can resolve challenge UUIDs
    const { data: masterChallenges = [] } = useQuery({
        queryKey: ['challenges-master'],
        queryFn: () => entities.Challenge.list(),
        staleTime: 300000,
    });

    const { data: profiles = [] } = useQuery({ queryKey: ['aup', email], queryFn: () => entities.UserProfile.filter({ user_email: email }), ...qOpts });
    const { data: meals = [] } = useQuery({ queryKey: ['aum', email], queryFn: () => entities.MealLog.filter({ user_email: email }), ...qOpts });
    const { data: waterLogs = [] } = useQuery({ queryKey: ['auw', email], queryFn: () => entities.WaterLog.filter({ user_email: email }), ...qOpts });
    const { data: stepLogs = [] } = useQuery({ queryKey: ['aus', email], queryFn: () => entities.StepLog.filter({ user_email: email }), ...qOpts });
    const { data: workouts = [] } = useQuery({ queryKey: ['auwk', email], queryFn: () => entities.WorkoutLog.filter({ user_email: email }), ...qOpts });
    const { data: sleepLogs = [] } = useQuery({ queryKey: ['ausl', email], queryFn: () => entities.SleepLog.filter({ user_email: email }), ...qOpts });
    const { data: weightLogs = [] } = useQuery({ queryKey: ['auwt', email], queryFn: () => entities.WeightLog.filter({ user_email: email }), ...qOpts });
    const { data: supplements = [] } = useQuery({ queryKey: ['ausupp', email], queryFn: () => entities.UserSupplement.filter({ user_email: email }), ...qOpts });
    const { data: notes = [] } = useQuery({ queryKey: ['aun', email], queryFn: () => entities.AdminNote.filter({ user_email: email }), ...qOpts });
    const { data: plans = [] } = useQuery({ queryKey: ['aucoa', email], queryFn: () => entities.CoachPlan.filter({ user_email: email }), ...qOpts });
    const { data: bodyProgress = [] } = useQuery({ queryKey: ['aubp', email], queryFn: () => entities.BodyProgress.filter({ user_email: email }, 'date', 50), ...qOpts });

    const profile = profiles[0] || targetUser;

    // ── Unified lookup: achievement_id, uuid, name → achievement row ──────────
    const achievementLookup = useMemo(() => {
        const map = {};
        masterAchievements.forEach(a => {
            map[a.id] = a;
            map[a.achievement_id] = a;
            if (a.name) map[a.name.toLowerCase()] = a;
        });
        return map;
    }, [masterAchievements]);

    // Challenge lookup by id or name
    const challengeLookup = useMemo(() => {
        const map = {};
        masterChallenges.forEach(c => {
            map[c.id] = c;
            if (c.name) map[c.name.toLowerCase()] = c;
        });
        return map;
    }, [masterChallenges]);

    // Resolve a raw achievement string to display info
    const resolveAchievement = (raw) => {
        // 1. Try achievements table
        const a = achievementLookup[raw] || achievementLookup[raw?.toLowerCase?.()];
        if (a) return { name: a.name, icon: a.icon || '🏅', color: a.color || 'yellow', xp: a.xp_reward };

        // 2. Try challenges table (UUIDs stored in achievements array)
        const c = challengeLookup[raw] || challengeLookup[raw?.toLowerCase?.()];
        if (c) return { name: `${c.name}`, icon: '🏆', color: 'orange', xp: null };

        // 3. It's a known short string like "xp_500" — humanise it
        if (raw && !raw.includes('-')) {
            const pretty = raw.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return { name: pretty, icon: '⭐', color: 'yellow', xp: null };
        }

        // 4. Absolute fallback for unresolvable UUIDs — skip rendering
        return null;
    };

    // ── Chart data ────────────────────────────────────────────────────────────
    const nutritionChartData = useMemo(() => chartDates.map(date => ({
        date: rangeLabel(date),
        calories: meals.filter(m => m.date === date).reduce((s, m) => s + (m.calories || 0), 0),
        protein: meals.filter(m => m.date === date).reduce((s, m) => s + (m.protein || 0), 0),
        carbs: meals.filter(m => m.date === date).reduce((s, m) => s + (m.carbs || 0), 0),
    })), [chartDates, meals]);

    const activityChartData = useMemo(() => chartDates.map(date => ({
        date: rangeLabel(date),
        steps: stepLogs.filter(s => s.date === date).reduce((s, st) => s + (st.steps || 0), 0),
        water: waterLogs.filter(w => w.date === date).reduce((s, w) => s + (w.amount_ml || 0), 0),
        workouts: workouts.filter(w => w.date === date).length,
    })), [chartDates, stepLogs, waterLogs, workouts]);

    const sleepChartData = useMemo(() => chartDates.map(date => ({
        date: rangeLabel(date),
        hours: sleepLogs.filter(s => s.date === date).reduce((s, sl) => s + (sl.hours || 0), 0),
    })), [chartDates, sleepLogs]);

    const weightChartData = useMemo(() =>
        weightLogs
            .filter(l => l.date >= chartStart && l.date <= chartEnd)
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(l => ({ date: format(parseISO(l.date), 'MMM d'), weight: l.weight_kg })),
        [weightLogs, chartStart, chartEnd]);

    // ── Day-filtered log data ─────────────────────────────────────────────────
    const dayMeals = useMemo(() => meals.filter(m => m.date === selectedDay), [meals, selectedDay]);
    const dayWater = useMemo(() => waterLogs.filter(w => w.date === selectedDay), [waterLogs, selectedDay]);
    const daySteps = useMemo(() => stepLogs.filter(s => s.date === selectedDay), [stepLogs, selectedDay]);
    const dayWorkouts = useMemo(() => workouts.filter(w => w.date === selectedDay), [workouts, selectedDay]);
    const daySleep = useMemo(() => sleepLogs.filter(s => s.date === selectedDay), [sleepLogs, selectedDay]);
    const dayWeight = useMemo(() => weightLogs.filter(l => l.date === selectedDay), [weightLogs, selectedDay]);
    const dayProgress = useMemo(() => bodyProgress.filter(b => b.date === selectedDay), [bodyProgress, selectedDay]);

    // ── KPI summaries (last 7 days always, independent of filters) ───────────
    const last7start = format(subDays(new Date(), 6), 'yyyy-MM-dd');
    const workouts7 = workouts.filter(w => w.date >= last7start).length;
    const avgCal7 = useMemo(() => { const d = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd')); const t = d.reduce((s, dt) => s + meals.filter(m => m.date === dt).reduce((ss, m) => ss + (m.calories || 0), 0), 0); return Math.round(t / 7); }, [meals]);
    const avgSleep7 = useMemo(() => { const r = sleepLogs.filter(s => s.date >= last7start); return r.length ? (r.reduce((s, sl) => s + (sl.hours || 0), 0) / r.length).toFixed(1) : '—'; }, [sleepLogs]);
    const avgSteps7 = useMemo(() => { const d = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd')); const t = d.reduce((s, dt) => s + stepLogs.filter(st => st.date === dt).reduce((ss, st) => ss + (st.steps || 0), 0), 0); return Math.round(t / 7); }, [stepLogs]);
    const latestWeight = [...weightLogs].sort((a, b) => b.date.localeCompare(a.date))[0];
    const streak = profile?.login_streak || 0;
    const status = streak > 3 ? 'Active' : streak > 0 ? 'At Risk' : 'Inactive';
    const statusColor = status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : status === 'At Risk' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20';

    // ── Mutations ─────────────────────────────────────────────────────────────
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
        { id: 'body_progress', label: 'Body Progress', icon: Camera }, { id: 'tasks', label: 'Tasks', icon: Zap },
    ];

    // Tabs that use the day picker for log tables
    const DAY_TABS = ['nutrition', 'activity', 'weight', 'sleep', 'body_progress'];
    // Tabs that show charts (use chart range)
    const CHART_TABS = ['overview', 'nutrition', 'activity', 'weight', 'sleep'];

    const displayName = targetUser.user_email?.split('@')[0] || targetUser.user_email;

    // ── Achievement badge renderer ─────────────────────────────────────────────
    const AchievementBadges = () => {
        const rawList = profile?.achievements || [];
        if (!rawList.length) return <p className="text-sm text-muted-foreground italic">No achievements yet.</p>;

        const resolved = rawList.map((raw, i) => ({ raw, info: resolveAchievement(raw), i }));
        const visible = resolved.filter(r => r.info !== null);

        if (!visible.length) return <p className="text-sm text-muted-foreground italic">No achievements yet.</p>;

        return (
            <div className="flex flex-wrap gap-2">
                {visible.map(({ raw, info, i }) => {
                    const c = ACHIEVEMENT_COLORS[info.color] || ACHIEVEMENT_COLORS.yellow;
                    return (
                        <div key={i} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-semibold ${c.bg} ${c.text} ${c.border}`}>
                            <span>{info.icon}</span>
                            <span>{info.name}</span>
                            {info.xp && <span className="opacity-60">+{info.xp}xp</span>}
                        </div>
                    );
                })}
            </div>
        );
    };

    // ── Shared filter bar shown at top of relevant tabs ───────────────────────
    const FilterBar = () => {
        const showChart = CHART_TABS.includes(activeTab);
        const showDay = DAY_TABS.includes(activeTab);
        if (!showChart && !showDay) return null;
        return (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 glass rounded-xl px-4 py-3 border border-white/5">
                {showChart && (
                    <div className="flex flex-col gap-1 flex-1">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Chart range</span>
                        <ChartRangePicker startDate={chartStart} endDate={chartEnd} onStartChange={setChartStart} onEndChange={setChartEnd} onPreset={handleChartPreset} />
                    </div>
                )}
                {showChart && showDay && <div className="hidden sm:block w-px h-10 bg-white/10" />}
                {showDay && (
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Log date</span>
                        <DayPicker date={selectedDay} onChange={setSelectedDay} />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-5">
            <Button variant="ghost" className="text-muted-foreground" onClick={() => navigate('/admin/users')}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Users
            </Button>

            {/* ── Header card ── */}
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
                            <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">{goalLabels[profile?.fitness_goal] || 'No goal set'}</span>
                            <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">{profile?.activity_level ? activityLabels[profile.activity_level] : '—'}</span>
                            <span className="text-xs text-orange-400 font-semibold">{streak} 🔥</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {/* Assign Plan dialog */}
                    <Dialog open={planOpen} onOpenChange={setPlanOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-purple-500 hover:bg-purple-600 text-white rounded-xl"><FileText className="w-4 h-4 mr-2" /> Assign Plan</Button>
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
                                <Button className="w-full bg-purple-500 hover:bg-purple-600" disabled={!planForm.title || createPlan.isPending}
                                    onClick={() => createPlan.mutate({ ...planForm, calorie_target: Number(planForm.calorie_target) || undefined, protein_target: Number(planForm.protein_target) || undefined, step_target: Number(planForm.step_target) || undefined, water_target_ml: Number(planForm.water_target_ml) || undefined })}>
                                    {createPlan.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Assign Plan
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Add Note dialog */}
                    <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="border-white/10 rounded-xl"><MessageSquare className="w-4 h-4 mr-2" /> Add Note</Button>
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
                                <div><Label>Note</Label><Textarea value={noteForm.note} onChange={e => setNoteForm(f => ({ ...f, note: e.target.value }))} className="mt-1 bg-white/5 border-white/10" rows={4} /></div>
                                <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-black" disabled={!noteForm.note || createNote.isPending} onClick={() => createNote.mutate(noteForm)}>
                                    {createNote.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Save Note
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </GlassCard>

            {/* ── KPI row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                <StatBadge label="Current Weight" value={latestWeight ? `${latestWeight.weight_kg}kg` : '—'} color="text-emerald-400" />
                <StatBadge label="Target Weight" value={profile?.target_weight_kg ? `${profile.target_weight_kg}kg` : '—'} color="text-yellow-400" />
                <StatBadge label="Avg Calories" value={avgCal7 || '—'} sub="7-day avg" color="text-white" />
                <StatBadge label="Avg Steps" value={avgSteps7 ? avgSteps7.toLocaleString() : '—'} sub="7-day avg" color="text-orange-400" />
                <StatBadge label="Workouts" value={workouts7} sub="last 7 days" color="text-purple-400" />
                <StatBadge label="Avg Sleep" value={avgSleep7 !== '—' ? `${avgSleep7}h` : '—'} sub="7-day avg" color="text-blue-400" />
                <StatBadge label="Total XP" value={(profile?.total_xp || 0).toLocaleString()} color="text-yellow-400" />
                <StatBadge label="Streak" value={`${streak}🔥`} sub="login days" color="text-orange-400" />
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1.5 flex-wrap">
                {tabs.map(t => <SectionTab key={t.id} {...t} active={activeTab === t.id} onClick={setActiveTab} />)}
            </div>

            {/* ── Contextual filter bar ── */}
            <FilterBar />

            {/* ══════════════ OVERVIEW ══════════════ */}
            {activeTab === 'overview' && (
                <div className="space-y-5">
                    <div className="grid lg:grid-cols-3 gap-5">
                        <GlassCard animate={false}>
                            <h3 className="font-semibold mb-4 flex items-center gap-2"><User className="w-4 h-4 text-purple-400" /> Profile</h3>
                            <div className="space-y-2.5 text-sm">
                                {[['Age', profile?.age ? `${profile.age} yrs` : '—'], ['Height', profile?.height_cm ? `${profile.height_cm} cm` : '—'], ['Starting Weight', profile?.weight_kg ? `${profile.weight_kg} kg` : '—'], ['Fitness Goal', goalLabels[profile?.fitness_goal] || '—'], ['Activity Level', activityLabels[profile?.activity_level] || '—'], ['Workout Freq.', profile?.workout_frequency ? `${profile.workout_frequency}x/week` : '—']].map(([k, v]) => (
                                    <div key={k} className="flex justify-between border-b border-white/5 pb-2 last:border-0">
                                        <span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                        <GlassCard animate={false}>
                            <h3 className="font-semibold mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-emerald-400" /> Daily Targets</h3>
                            <div className="space-y-2.5 text-sm">
                                {[['Calories', profile?.daily_calorie_target ? `${profile.daily_calorie_target} kcal` : '—', 'text-emerald-400'], ['Protein', profile?.protein_target ? `${profile.protein_target}g` : '—', 'text-blue-400'], ['Carbs', profile?.carb_target ? `${profile.carb_target}g` : '—', 'text-yellow-400'], ['Fat', profile?.fat_target ? `${profile.fat_target}g` : '—', 'text-purple-400'], ['Water', profile?.water_goal_ml ? `${profile.water_goal_ml}ml` : '—', 'text-cyan-400'], ['Steps', profile?.step_goal ? profile.step_goal.toLocaleString() : '—', 'text-orange-400']].map(([k, v, c]) => (
                                    <div key={k} className="flex justify-between border-b border-white/5 pb-2 last:border-0">
                                        <span className="text-muted-foreground">{k}</span><span className={`font-semibold ${c}`}>{v}</span>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                        <GlassCard animate={false}>
                            <h3 className="font-semibold mb-4 flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-400" /> Achievements</h3>
                            <AchievementBadges />
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
                            <h3 className="font-semibold mb-4">Calories Overview <span className="text-xs text-muted-foreground font-normal">({chartStart} → {chartEnd})</span></h3>
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
                            <h3 className="font-semibold mb-4">Steps Overview <span className="text-xs text-muted-foreground font-normal">({chartStart} → {chartEnd})</span></h3>
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

            {/* ══════════════ NUTRITION ══════════════ */}
            {activeTab === 'nutrition' && (
                <div className="space-y-5">
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
                    {/* Day log */}
                    <GlassCard animate={false}>
                        <h4 className="font-medium mb-4">Meals on {format(parseISO(selectedDay), 'EEEE, MMM d')} <span className="text-muted-foreground text-xs font-normal">({dayMeals.length} entries)</span></h4>
                        <div className="space-y-2 max-h-72 overflow-y-auto">
                            {dayMeals.length === 0 && <p className="text-sm text-muted-foreground italic">No meals logged on this day.</p>}
                            {dayMeals.map(m => (
                                <div key={m.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/3 text-sm">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        {m.photo_url ? <img src={m.photo_url} alt="" className="w-full h-full object-cover" /> : <Utensils className="w-3.5 h-3.5 text-emerald-400" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{m.food_name}</div>
                                        <div className="text-xs text-muted-foreground capitalize">{m.meal_type}</div>
                                    </div>
                                    <div className="text-right text-xs">
                                        <div className="text-emerald-400 font-semibold">{m.calories || 0} kcal</div>
                                        <div className="text-muted-foreground">{m.protein || 0}g P · {m.carbs || 0}g C</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {dayMeals.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-white/5 flex gap-4 text-xs text-muted-foreground">
                                <span>Total: <span className="text-white font-semibold">{dayMeals.reduce((s, m) => s + (m.calories || 0), 0)} kcal</span></span>
                                <span>Protein: <span className="text-blue-400 font-semibold">{dayMeals.reduce((s, m) => s + (m.protein || 0), 0)}g</span></span>
                                <span>Carbs: <span className="text-purple-400 font-semibold">{dayMeals.reduce((s, m) => s + (m.carbs || 0), 0)}g</span></span>
                                <span>Fat: <span className="text-yellow-400 font-semibold">{dayMeals.reduce((s, m) => s + (m.fats || 0), 0)}g</span></span>
                            </div>
                        )}
                    </GlassCard>
                </div>
            )}

            {/* ══════════════ ACTIVITY ══════════════ */}
            {activeTab === 'activity' && (
                <div className="space-y-5">
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
                    {/* Day logs */}
                    <div className="grid lg:grid-cols-2 gap-5">
                        <GlassCard animate={false}>
                            <h4 className="font-medium mb-4">Workouts on {format(parseISO(selectedDay), 'MMM d')} <span className="text-muted-foreground text-xs">({dayWorkouts.length})</span></h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {dayWorkouts.length === 0 && <p className="text-sm text-muted-foreground italic">No workouts logged.</p>}
                                {dayWorkouts.map(w => (
                                    <div key={w.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/3">
                                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0"><Dumbbell className="w-4 h-4 text-purple-400" /></div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate">{w.name}</div>
                                            <div className="text-xs text-muted-foreground capitalize">{w.workout_type} · {w.intensity}</div>
                                        </div>
                                        <div className="text-right text-xs flex-shrink-0">
                                            <div className="text-purple-400 font-semibold">{w.duration_min || 0} min</div>
                                            {w.calories_burned && <div className="text-muted-foreground">{w.calories_burned} kcal</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                        <GlassCard animate={false}>
                            <h4 className="font-medium mb-4">Steps & Water on {format(parseISO(selectedDay), 'MMM d')}</h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
                                    <span className="text-sm text-muted-foreground">Steps logged</span>
                                    <span className="font-bold text-orange-400">{daySteps.reduce((s, st) => s + (st.steps || 0), 0).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                                    <span className="text-sm text-muted-foreground">Water intake</span>
                                    <span className="font-bold text-cyan-400">{dayWater.reduce((s, w) => s + (w.amount_ml || 0), 0)} ml</span>
                                </div>
                                {daySteps[0]?.calories_burned && (
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                                        <span className="text-sm text-muted-foreground">Calories burned (steps)</span>
                                        <span className="font-bold text-white">{daySteps[0].calories_burned}</span>
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    </div>
                </div>
            )}

            {/* ══════════════ WEIGHT ══════════════ */}
            {activeTab === 'weight' && (
                <div className="space-y-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <StatBadge label="Current" value={latestWeight ? `${latestWeight.weight_kg}kg` : '—'} color="text-white" />
                        <StatBadge label="Starting" value={profile?.weight_kg ? `${profile.weight_kg}kg` : '—'} color="text-blue-400" />
                        <StatBadge label="Goal" value={profile?.target_weight_kg ? `${profile.target_weight_kg}kg` : '—'} color="text-yellow-400" />
                        <StatBadge label="Total Change"
                            value={latestWeight && profile?.weight_kg ? `${(latestWeight.weight_kg - profile.weight_kg).toFixed(1)}kg` : '—'}
                            color={latestWeight && profile?.weight_kg && latestWeight.weight_kg < profile.weight_kg ? 'text-emerald-400' : 'text-red-400'} />
                    </div>
                    <GlassCard animate={false}>
                        <h4 className="font-medium mb-4 text-emerald-400">Weight Trend <span className="text-muted-foreground text-xs font-normal">({chartStart} → {chartEnd})</span></h4>
                        {weightChartData.length < 2 ? (
                            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Not enough data in selected chart range</div>
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
                        <h4 className="font-medium mb-3">Weight on {format(parseISO(selectedDay), 'EEEE, MMM d')}</h4>
                        {dayWeight.length === 0
                            ? <p className="text-sm text-muted-foreground italic">No weight entry on this day.</p>
                            : dayWeight.map(l => (
                                <div key={l.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/3 text-sm">
                                    <Scale className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    <span className="font-bold text-lg">{l.weight_kg} kg</span>
                                    {l.notes && <span className="text-xs text-muted-foreground/60">{l.notes}</span>}
                                </div>
                            ))
                        }
                    </GlassCard>
                </div>
            )}

            {/* ══════════════ SLEEP ══════════════ */}
            {activeTab === 'sleep' && (
                <div className="space-y-5">
                    <GlassCard animate={false}>
                        <h4 className="font-medium mb-4 text-blue-400">Sleep Duration <span className="text-muted-foreground text-xs font-normal">({chartStart} → {chartEnd})</span></h4>
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
                        <h4 className="font-medium mb-3">Sleep on {format(parseISO(selectedDay), 'EEEE, MMM d')}</h4>
                        {daySleep.length === 0
                            ? <p className="text-sm text-muted-foreground italic">No sleep entry on this day.</p>
                            : daySleep.map(s => (
                                <div key={s.id} className="flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-white/3 text-sm">
                                    <Moon className="w-5 h-5 text-blue-400 flex-shrink-0" />
                                    <div>
                                        <span className="font-bold text-lg">{s.hours}h</span>
                                        {s.quality && <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${s.quality === 'excellent' ? 'bg-emerald-500/10 text-emerald-400' : s.quality === 'good' ? 'bg-blue-500/10 text-blue-400' : s.quality === 'fair' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>{s.quality}</span>}
                                    </div>
                                    {s.bed_time && s.wake_time && <span className="text-xs text-muted-foreground">{s.bed_time} → {s.wake_time}</span>}
                                </div>
                            ))
                        }
                    </GlassCard>
                </div>
            )}

            {/* ══════════════ SUPPLEMENTS ══════════════ */}
            {activeTab === 'supplements' && (
                <div className="space-y-5">
                    <h3 className="font-semibold text-lg">Supplement Stack</h3>
                    {supplements.length === 0
                        ? <GlassCard animate={false}><p className="text-sm text-muted-foreground italic">No supplements tracked.</p></GlassCard>
                        : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {supplements.map(s => (
                                <GlassCard key={s.id} animate={false} className="border border-white/5">
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0"><Pill className="w-4 h-4 text-emerald-400" /></div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-sm">{s.name}</div>
                                            {s.brand && <div className="text-xs text-muted-foreground">{s.brand}</div>}
                                            <div className="flex gap-2 mt-2 flex-wrap">
                                                {s.dosage && <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full">{s.dosage}</span>}
                                                {s.timing && <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">{s.timing.replace('_', ' ')}</span>}
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${s.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-muted-foreground'}`}>{s.is_active ? 'Active' : 'Inactive'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    }
                </div>
            )}

            {/* ══════════════ BODY PROGRESS ══════════════ */}
            {activeTab === 'body_progress' && (
                <div className="space-y-5">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><Camera className="w-5 h-5 text-emerald-400" /> Body Progress</h3>
                    {dayProgress.length === 0 ? (
                        <GlassCard animate={false}>
                            <div className="flex flex-col items-center py-12 gap-3 text-center">
                                <Camera className="w-12 h-12 text-muted-foreground/20" />
                                <p className="text-muted-foreground">No body progress entry on {format(parseISO(selectedDay), 'MMM d, yyyy')}.</p>
                                <p className="text-xs text-muted-foreground/60">Try a different date using the day picker above.</p>
                            </div>
                        </GlassCard>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {dayProgress.map(entry => {
                                const photos = [entry.front_photo_url, entry.side_photo_url, entry.back_photo_url].filter(Boolean);
                                return (
                                    <GlassCard key={entry.id} animate={false} className="p-0 overflow-hidden border border-white/5">
                                        {photos.length > 0 ? (
                                            <div className="relative grid grid-cols-3 gap-0.5 h-44">
                                                {photos.map((p, i) => <div key={i} className="overflow-hidden"><img src={p} alt="" className="w-full h-full object-cover" /></div>)}
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
                                                    {entry.mood && <span>Mood: {entry.mood}</span>}
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

            {/* ══════════════ PLANS & NOTES ══════════════ */}
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
                                            <span className="text-xs text-muted-foreground">{note.created_at ? format(new Date(note.created_at), 'MMM d') : ''}</span>
                                        </div>
                                        <p className="text-sm">{note.note}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </GlassCard>
                </div>
            )}


            {/* ══════════════ TASKS ══════════════ */}
            {activeTab === 'tasks' && (
                <UserTasksWidget userEmail={email} showAddTask={true} />
            )}
        </div>
    );
}