import React, { useMemo, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, subDays, subWeeks, startOfWeek, endOfWeek, parseISO, isWithinInterval } from 'date-fns';
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ReferenceLine, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import GlassCard from '@/components/ui/GlassCard';
import PersistentResizable from '@/components/ui/PersistentResizable';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import { useWidgetSizes } from '@/lib/useWidgetSizes';
import { BarChart3, TrendingUp, Scale, Dumbbell, Flame, Footprints, Droplets, Moon, Calendar } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="glass rounded-lg p-3 text-xs border border-white/10">
            <p className="font-semibold mb-1">{label}</p>
            {payload.map(p => <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value?.toLocaleString()}</p>)}
        </div>
    );
};

export default function Analytics() {
    const { user } = useAuth();
    const qc = useQueryClient();
    const [range, setRange] = useState(14);
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [useCustom, setUseCustom] = useState(false);

    const last14 = useMemo(() => {
        if (useCustom && customFrom && customTo) {
            const days = [];
            let cur = new Date(customFrom + 'T00:00:00');
            const end = new Date(customTo + 'T00:00:00');
            while (cur <= end) { days.push(format(cur, 'yyyy-MM-dd')); cur = new Date(cur.getTime() + 86400000); }
            return days;
        }
        return Array.from({ length: range }, (_, i) => format(subDays(new Date(), range - 1 - i), 'yyyy-MM-dd'));
    }, [range, useCustom, customFrom, customTo]);

    const last8Weeks = useMemo(() => Array.from({ length: 8 }, (_, i) => {
        const wStart = startOfWeek(subWeeks(new Date(), 7 - i), { weekStartsOn: 1 });
        const wEnd = endOfWeek(wStart, { weekStartsOn: 1 });
        return { wStart, wEnd, label: `W${i + 1}` };
    }), []);

    const { data: meals = [] } = useQuery({ queryKey: ['meals-week', user?.email], queryFn: () => entities.MealLog.filter({ user_email: user?.email }), enabled: !!user?.email });
    const { data: waterLogs = [] } = useQuery({ queryKey: ['water-week', user?.email], queryFn: () => entities.WaterLog.filter({ user_email: user?.email }), enabled: !!user?.email });
    const { data: stepLogs = [] } = useQuery({ queryKey: ['steps-week', user?.email], queryFn: () => entities.StepLog.filter({ user_email: user?.email }), enabled: !!user?.email });
    const { data: workouts = [] } = useQuery({ queryKey: ['workouts-week', user?.email], queryFn: () => entities.WorkoutLog.filter({ user_email: user?.email }), enabled: !!user?.email });
    const { data: sleepLogs = [] } = useQuery({ queryKey: ['sleep-week', user?.email], queryFn: () => entities.SleepLog.filter({ user_email: user?.email }), enabled: !!user?.email });
    const { data: weightLogs = [] } = useQuery({ queryKey: ['weight-logs', user?.email], queryFn: () => entities.WeightLog.filter({ user_email: user?.email }), enabled: !!user?.email });
    const { data: profiles = [] } = useQuery({ queryKey: ['userProfile', user?.email], queryFn: () => entities.UserProfile.filter({ user_email: user?.email }), enabled: !!user?.email });
    const profile = profiles[0];

    const updateProfileMutation = useMutation({
        mutationFn: (data) => entities.UserProfile.update(profile.id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['userProfile'] }),
    });

    const { getSavedSize, handleSizeChange } = useWidgetSizes(profile, (data) => {
        if (profile?.id) updateProfileMutation.mutate(data);
    });

    const rangeStart = last14[0] || '';
    const rangeEnd = last14[last14.length - 1] || '';
    const rangeLabel = `${last14.length}d`;

    const dailyData = useMemo(() => last14.map(date => ({
        date: format(new Date(date), 'MMM d'),
        calories: meals.filter(m => m.date === date).reduce((s, m) => s + (m.calories || 0), 0),
        protein: meals.filter(m => m.date === date).reduce((s, m) => s + (m.protein || 0), 0),
        water: waterLogs.filter(w => w.date === date).reduce((s, w) => s + (w.amount_ml || 0), 0),
        steps: stepLogs.filter(s => s.date === date).reduce((s, st) => s + (st.steps || 0), 0),
        sleep: sleepLogs.filter(s => s.date === date).reduce((s, sl) => s + (sl.hours || 0), 0),
        workouts: workouts.filter(w => w.date === date).length,
    })), [last14, meals, waterLogs, stepLogs, workouts, sleepLogs]);

    const weeklyWorkouts = useMemo(() => last8Weeks.map(({ wStart, wEnd, label }) => {
        const weekW = workouts.filter(w => {
            const d = new Date(w.date + 'T00:00:00');
            return d >= wStart && d <= wEnd && w.date >= rangeStart && w.date <= rangeEnd;
        });
        return { label, count: weekW.length, duration: weekW.reduce((s, w) => s + (w.duration_min || 0), 0), calories: weekW.reduce((s, w) => s + (w.calories_burned || 0), 0) };
    }), [last8Weeks, workouts, rangeStart, rangeEnd]);

    const filteredWeightData = useMemo(() =>
        [...weightLogs]
            .filter(w => w.date >= rangeStart && w.date <= rangeEnd)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(w => ({ date: format(new Date(w.date), 'MMM d'), weight: w.weight_kg })),
        [weightLogs, rangeStart, rangeEnd]);

    const avgCal = dailyData.filter(d => d.calories > 0).reduce((s, d) => s + d.calories, 0) / (dailyData.filter(d => d.calories > 0).length || 1);
    const avgSteps = dailyData.filter(d => d.steps > 0).reduce((s, d) => s + d.steps, 0) / (dailyData.filter(d => d.steps > 0).length || 1);
    const totalWorkouts = workouts.filter(w => w.date >= rangeStart && w.date <= rangeEnd).length;
    const weightChange = filteredWeightData.length >= 2 ? (filteredWeightData[filteredWeightData.length - 1].weight - filteredWeightData[0].weight).toFixed(1) : null;

    const radarData = [
        { subject: 'Nutrition', score: Math.min(Math.round(avgCal / (profile?.daily_calorie_target || 2000) * 100), 100) },
        { subject: 'Hydration', score: Math.min(Math.round(dailyData.reduce((s, d) => s + d.water, 0) / (dailyData.filter(d => d.water > 0).length || 1) / (profile?.water_goal_ml || 2500) * 100), 100) },
        { subject: 'Steps', score: Math.min(Math.round(avgSteps / (profile?.step_goal || 10000) * 100), 100) },
        { subject: 'Sleep', score: Math.min(Math.round(dailyData.reduce((s, d) => s + d.sleep, 0) / (dailyData.filter(d => d.sleep > 0).length || 1) / 8 * 100), 100) },
        { subject: 'Workouts', score: Math.min(Math.round(weeklyWorkouts.reduce((s, w) => s + w.count, 0) / (profile?.workout_frequency || 4) / 8 * 100), 100) },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-space font-bold flex items-center gap-3">
                        <BarChart3 className="w-7 h-7 text-blue-400" /> Progress Analytics
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">Drag ↕ bottom edge to resize · sizes saved automatically</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {[7, 14, 30, 60].map(r => (
                        <button key={r} onClick={() => { setRange(r); setUseCustom(false); }}
                            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${!useCustom && range === r ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-muted-foreground hover:bg-white/5 border border-transparent'}`}>
                            {r}d
                        </button>
                    ))}
                    <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                            className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-foreground focus:outline-none focus:border-blue-500/50" />
                        <span className="text-xs text-muted-foreground">–</span>
                        <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                            className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-foreground focus:outline-none focus:border-blue-500/50" />
                        {customFrom && customTo && (
                            <button onClick={() => setUseCustom(true)}
                                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${useCustom ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-white/5 text-muted-foreground border border-white/10 hover:border-blue-500/30 hover:text-blue-300'}`}>
                                Apply
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Avg Daily Calories', value: Math.round(avgCal), unit: 'kcal', icon: Flame, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: 'Avg Daily Steps', value: Math.round(avgSteps), unit: 'steps', icon: Footprints, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                    { label: 'Total Workouts', value: totalWorkouts, unit: 'sessions', icon: Dumbbell, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                    { label: 'Weight Change', value: weightChange !== null ? Math.abs(weightChange) : '—', unit: weightChange !== null ? `kg ${Number(weightChange) < 0 ? '↓' : '↑'}` : '', icon: Scale, color: Number(weightChange) < 0 ? 'text-emerald-400' : 'text-blue-400', bg: 'bg-blue-500/10' },
                ].map(s => (
                    <GlassCard key={s.label} animate={false}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                                <s.icon className={`w-5 h-5 ${s.color}`} />
                            </div>
                            <div>
                                <div className={`text-xl font-bold font-space ${s.color}`}>
                                    {typeof s.value === 'number' ? <AnimatedCounter value={s.value} /> : s.value}
                                    {s.unit && <span className="text-xs ml-1 text-muted-foreground">{s.unit}</span>}
                                </div>
                                <div className="text-xs text-muted-foreground">{s.label}</div>
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Weight + Radar — resizable */}
            <div className="grid lg:grid-cols-2 gap-6">
                <PersistentResizable widgetId="analytics_weight" savedSize={getSavedSize('analytics_weight')} onSizeChange={handleSizeChange} defaultHeight={240} title={`Weight Trend (${rangeLabel})`} icon={Scale} accentColor="#3b82f6">
                    {(height) => filteredWeightData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={height || 200}>
                            <LineChart data={filteredWeightData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                                <YAxis domain={['auto', 'auto']} stroke="rgba(255,255,255,0.3)" fontSize={11} />
                                <Tooltip content={<CustomTooltip />} />
                                {profile?.target_weight_kg && <ReferenceLine y={profile.target_weight_kg} stroke="#22c55e" strokeDasharray="4 4" label={{ value: 'Goal', fill: '#22c55e', fontSize: 11 }} />}
                                <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} name="Weight (kg)" />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No weight data yet — log from Dashboard</div>
                    )}
                </PersistentResizable>

                <PersistentResizable widgetId="analytics_radar" savedSize={getSavedSize('analytics_radar')} onSizeChange={handleSizeChange} defaultHeight={240} title="Health Score Radar" icon={TrendingUp} accentColor="#a855f7">
                    {(height) => (
                        <ResponsiveContainer width="100%" height={height || 200}>
                            <RadarChart data={radarData} cx="50%" cy="50%">
                                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} />
                                <Radar name="Score" dataKey="score" stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} strokeWidth={2} />
                                <Tooltip content={<CustomTooltip />} />
                            </RadarChart>
                        </ResponsiveContainer>
                    )}
                </PersistentResizable>
            </div>

            {/* Workout Consistency — resizable */}
            <PersistentResizable widgetId="analytics_workout_consistency" savedSize={getSavedSize('analytics_workout_consistency')} onSizeChange={handleSizeChange} defaultHeight={220} title="Workout Consistency (8 Weeks)" icon={Dumbbell} accentColor="#a855f7">
                {(height) => (
                    <ResponsiveContainer width="100%" height={height || 180}>
                        <BarChart data={weeklyWorkouts}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                            <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} allowDecimals={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" name="Workouts" radius={[6, 6, 0, 0]} maxBarSize={50}>
                                {weeklyWorkouts.map((entry, i) => (
                                    <Cell key={i} fill={entry.count >= (profile?.workout_frequency || 4) ? '#a855f7' : entry.count > 0 ? '#7c3aed60' : 'rgba(255,255,255,0.05)'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </PersistentResizable>

            <div className="grid lg:grid-cols-2 gap-6">
                <PersistentResizable widgetId="analytics_calories" savedSize={getSavedSize('analytics_calories')} onSizeChange={handleSizeChange} defaultHeight={220} title={`Calories (${rangeLabel})`} icon={Flame} accentColor="#22c55e">
                    {(height) => (
                        <ResponsiveContainer width="100%" height={height || 180}>
                            <AreaChart data={dailyData}>
                                <defs>
                                    <linearGradient id="calGrad2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} />
                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} />
                                <Tooltip content={<CustomTooltip />} />
                                {profile?.daily_calorie_target && <ReferenceLine y={profile.daily_calorie_target} stroke="#22c55e" strokeDasharray="4 4" opacity={0.5} />}
                                <Area type="monotone" dataKey="calories" stroke="#22c55e" fill="url(#calGrad2)" strokeWidth={2} name="Calories" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </PersistentResizable>

                <PersistentResizable widgetId="analytics_steps" savedSize={getSavedSize('analytics_steps')} onSizeChange={handleSizeChange} defaultHeight={220} title={`Steps (${rangeLabel})`} icon={Footprints} accentColor="#f97316">
                    {(height) => (
                        <ResponsiveContainer width="100%" height={height || 180}>
                            <BarChart data={dailyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} />
                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} />
                                <Tooltip content={<CustomTooltip />} />
                                {profile?.step_goal && <ReferenceLine y={profile.step_goal} stroke="#f97316" strokeDasharray="4 4" opacity={0.5} />}
                                <Bar dataKey="steps" name="Steps" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </PersistentResizable>

                <PersistentResizable widgetId="analytics_hydration" savedSize={getSavedSize('analytics_hydration')} onSizeChange={handleSizeChange} defaultHeight={220} title={`Hydration (${rangeLabel})`} icon={Droplets} accentColor="#3b82f6">
                    {(height) => (
                        <ResponsiveContainer width="100%" height={height || 180}>
                            <AreaChart data={dailyData}>
                                <defs>
                                    <linearGradient id="waterGrad2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} />
                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="water" stroke="#3b82f6" fill="url(#waterGrad2)" strokeWidth={2} name="Water (ml)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </PersistentResizable>

                <PersistentResizable widgetId="analytics_sleep" savedSize={getSavedSize('analytics_sleep')} onSizeChange={handleSizeChange} defaultHeight={220} title={`Sleep Quality (${rangeLabel})`} icon={Moon} accentColor="#a855f7">
                    {(height) => (
                        <ResponsiveContainer width="100%" height={height || 180}>
                            <BarChart data={dailyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} />
                                <YAxis domain={[0, 10]} stroke="rgba(255,255,255,0.3)" fontSize={10} />
                                <Tooltip content={<CustomTooltip />} />
                                <ReferenceLine y={8} stroke="#a855f7" strokeDasharray="4 4" opacity={0.5} />
                                <Bar dataKey="sleep" name="Sleep (hrs)" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                    {dailyData.map((entry, i) => (
                                        <Cell key={i} fill={entry.sleep >= 7 ? '#a855f7' : entry.sleep >= 5 ? '#7c3aed80' : 'rgba(255,255,255,0.1)'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </PersistentResizable>

                {/* Protein trend */}
                <PersistentResizable widgetId="analytics_protein" savedSize={getSavedSize('analytics_protein')} onSizeChange={handleSizeChange} defaultHeight={220} title={`Protein Intake (${rangeLabel})`} icon={Flame} accentColor="#22c55e">
                    {(height) => (
                        <ResponsiveContainer width="100%" height={height || 180}>
                            <AreaChart data={dailyData}>
                                <defs>
                                    <linearGradient id="protGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} />
                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} />
                                <Tooltip content={<CustomTooltip />} />
                                {profile?.protein_target && <ReferenceLine y={profile.protein_target} stroke="#22c55e" strokeDasharray="4 4" opacity={0.5} />}
                                <Area type="monotone" dataKey="protein" stroke="#22c55e" fill="url(#protGrad)" strokeWidth={2} name="Protein (g)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </PersistentResizable>

                {/* Workout volume */}
                <PersistentResizable widgetId="analytics_workout_volume" savedSize={getSavedSize('analytics_workout_volume')} onSizeChange={handleSizeChange} defaultHeight={220} title="Workout Volume (8 Weeks)" icon={Dumbbell} accentColor="#a855f7">
                    {(height) => (
                        <ResponsiveContainer width="100%" height={height || 180}>
                            <BarChart data={weeklyWorkouts}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="duration" name="Duration (min)" fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                <Bar dataKey="calories" name="Calories Burned" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </PersistentResizable>
            </div>
        </div>
    );
}