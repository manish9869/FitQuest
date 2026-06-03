import React, { useState, useRef, useMemo } from 'react';
import { entities } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Download, Loader2, FileText, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine
} from 'recharts';

// ------ small inline progress bar ------
const Bar2 = ({ value, max, color }) => {
    const pct = Math.min(100, max > 0 ? Math.round((value / max) * 100) : 0);
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="text-[10px] text-white/60 w-8 text-right">{pct}%</span>
        </div>
    );
};

// ---- the actual printable report (hidden div we print from) ----
const PrintableReport = React.forwardRef(({ data, profile, dateLabel }, ref) => {
    const { meals, water, steps, workouts, sleep, weight } = data;

    const totalCal = meals.reduce((s, m) => s + (m.calories || 0), 0);
    const totalProt = meals.reduce((s, m) => s + (m.protein || 0), 0);
    const totalCarbs = meals.reduce((s, m) => s + (m.carbs || 0), 0);
    const totalFat = meals.reduce((s, m) => s + (m.fats || 0), 0);
    const totalSteps = steps.reduce((s, st) => s + (st.steps || 0), 0);
    const totalWater = water.reduce((s, w) => s + (w.amount_ml || 0), 0);
    const avgSleep = sleep.length ? (sleep.reduce((s, sl) => s + (sl.hours || 0), 0) / sleep.length).toFixed(1) : '—';
    const latestWeight = [...weight].sort((a, b) => b.date?.localeCompare(a.date))[0];
    const daysCount = data.dateRange.length || 7;
    const activeDays = data.dateRange.filter(d => workouts.some(w => w.date === d) || steps.some(s => s.date === d && s.steps > 3000)).length;

    const nutritionChart = data.dateRange.map(d => ({
        day: format(new Date(d), 'MMM d'),
        calories: meals.filter(m => m.date === d).reduce((s, m) => s + (m.calories || 0), 0),
        protein: Math.round(meals.filter(m => m.date === d).reduce((s, m) => s + (m.protein || 0), 0)),
    }));
    const activityChart = data.dateRange.map(d => ({
        day: format(new Date(d), 'MMM d'),
        steps: steps.filter(s => s.date === d).reduce((s, st) => s + (st.steps || 0), 0),
        water: water.filter(w => w.date === d).reduce((s, w) => s + (w.amount_ml || 0), 0),
    }));
    const sleepChart = data.dateRange.map(d => ({
        day: format(new Date(d), 'MMM d'),
        hours: sleep.filter(s => s.date === d).reduce((s, sl) => s + (sl.hours || 0), 0),
    }));
    const weightChart = [...weight].sort((a, b) => a.date?.localeCompare(b.date))
        .map(l => ({ day: format(parseISO(l.date), 'MMM d'), weight: l.weight_kg }));

    const consistencyScore = Math.round((activeDays / Math.max(daysCount, 1)) * 100);

    return (
        <div ref={ref} style={{ fontFamily: 'Inter, sans-serif', background: '#0a0f16', color: '#f0f0f0', padding: '40px', minWidth: 900 }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #0d2a1a 0%, #0a1628 50%, #1a0d28 100%)', borderRadius: 20, padding: '32px 40px', marginBottom: 32, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ fontSize: 11, letterSpacing: 3, color: '#4ade80', textTransform: 'uppercase', marginBottom: 8 }}>FitElite Performance Report</div>
                        <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 6, background: 'linear-gradient(90deg, #4ade80, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {profile?.user_email?.split('@')[0] || 'Athlete'}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: 14 }}>{dateLabel}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Consistency Score</div>
                        <div style={{ fontSize: 48, fontWeight: 900, color: consistencyScore >= 70 ? '#4ade80' : consistencyScore >= 40 ? '#f59e0b' : '#ef4444', lineHeight: 1 }}>{consistencyScore}%</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{activeDays}/{daysCount} active days</div>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
                {[
                    { label: 'Total Calories', value: totalCal.toLocaleString(), unit: 'kcal', color: '#4ade80', bg: '#0d2a1a' },
                    { label: 'Total Steps', value: totalSteps.toLocaleString(), unit: 'steps', color: '#f97316', bg: '#1f1006' },
                    { label: 'Water Intake', value: (totalWater / 1000).toFixed(1), unit: 'L total', color: '#06b6d4', bg: '#06151a' },
                    { label: 'Workouts', value: workouts.length, unit: 'sessions', color: '#a855f7', bg: '#180f28' },
                ].map(k => (
                    <div key={k.label} style={{ background: k.bg, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 24px' }}>
                        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{k.label}</div>
                        <div style={{ fontSize: 30, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{k.unit}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
                {[
                    { label: 'Avg Daily Cal', value: Math.round(totalCal / Math.max(daysCount, 1)).toLocaleString(), unit: 'kcal/day', color: '#4ade80', bg: '#0d2a1a' },
                    { label: 'Avg Daily Steps', value: Math.round(totalSteps / Math.max(daysCount, 1)).toLocaleString(), unit: 'steps/day', color: '#f97316', bg: '#1f1006' },
                    { label: 'Avg Sleep', value: avgSleep, unit: 'hours/night', color: '#3b82f6', bg: '#06111a' },
                    { label: 'Current Weight', value: latestWeight?.weight_kg || '—', unit: 'kg', color: '#f59e0b', bg: '#1a1006' },
                ].map(k => (
                    <div key={k.label} style={{ background: k.bg, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 24px' }}>
                        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{k.label}</div>
                        <div style={{ fontSize: 30, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{k.unit}</div>
                    </div>
                ))}
            </div>

            {/* Nutrition Chart */}
            <div style={{ background: '#0d1520', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '24px', marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#4ade80', marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase' }}>📊 Nutrition Trend</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Daily calories & protein over the report period</div>
                <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={nutritionChart}>
                        <defs>
                            <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4ade80" stopOpacity={0.4} /><stop offset="100%" stopColor="#4ade80" stopOpacity={0} /></linearGradient>
                            <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" fontSize={10} tick={{ fontSize: 9 }} />
                        <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} />
                        <Tooltip contentStyle={{ background: '#0d1520', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} />
                        {profile?.daily_calorie_target && <ReferenceLine y={profile.daily_calorie_target} stroke="#f59e0b" strokeDasharray="4 4" />}
                        <Area type="monotone" dataKey="calories" name="Calories" stroke="#4ade80" fill="url(#cg)" strokeWidth={2} dot={false} />
                        <Area type="monotone" dataKey="protein" name="Protein (g)" stroke="#3b82f6" fill="url(#pg)" strokeWidth={1.5} dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
                {/* Macro summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
                    {[
                        { label: 'Calories', value: `${totalCal.toLocaleString()} kcal`, color: '#4ade80' },
                        { label: 'Protein', value: `${Math.round(totalProt)}g`, color: '#3b82f6' },
                        { label: 'Carbs', value: `${Math.round(totalCarbs)}g`, color: '#a855f7' },
                        { label: 'Fats', value: `${Math.round(totalFat)}g`, color: '#f97316' },
                    ].map(m => (
                        <div key={m.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                            <div style={{ color: m.color, fontWeight: 700, fontSize: 16 }}>{m.value}</div>
                            <div style={{ color: '#64748b', fontSize: 11 }}>{m.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Steps + Water Chart */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                <div style={{ background: '#0d1520', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '24px' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f97316', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>👟 Steps Activity</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Total: {totalSteps.toLocaleString()} · ~{Math.round(totalSteps * 0.0008)} km</div>
                    <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={activityChart}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" fontSize={9} tick={{ fontSize: 9 }} />
                            <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} />
                            <Tooltip contentStyle={{ background: '#0d1520', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} />
                            {profile?.step_goal && <ReferenceLine y={profile.step_goal} stroke="#f59e0b" strokeDasharray="3 3" />}
                            <Bar dataKey="steps" name="Steps" fill="#f97316" radius={[4, 4, 0, 0]} opacity={0.9} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div style={{ background: '#0d1520', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '24px' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#06b6d4', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>💧 Hydration</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Total: {(totalWater / 1000).toFixed(1)}L · Avg: {Math.round(totalWater / Math.max(daysCount, 1))}ml/day</div>
                    <ResponsiveContainer width="100%" height={140}>
                        <AreaChart data={activityChart}>
                            <defs><linearGradient id="wg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} /><stop offset="100%" stopColor="#06b6d4" stopOpacity={0} /></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" fontSize={9} tick={{ fontSize: 9 }} />
                            <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} />
                            <Tooltip contentStyle={{ background: '#0d1520', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} />
                            {profile?.water_goal_ml && <ReferenceLine y={profile.water_goal_ml} stroke="#f59e0b" strokeDasharray="3 3" />}
                            <Area type="monotone" dataKey="water" name="Water (ml)" stroke="#06b6d4" fill="url(#wg2)" strokeWidth={2} dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Sleep + Weight */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                <div style={{ background: '#0d1520', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '24px' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#3b82f6', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>🌙 Sleep Quality</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Avg: {avgSleep}h per night · {sleep.length} nights logged</div>
                    <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={sleepChart}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" fontSize={9} tick={{ fontSize: 9 }} />
                            <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} domain={[0, 10]} />
                            <Tooltip contentStyle={{ background: '#0d1520', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} />
                            <ReferenceLine y={8} stroke="#4ade80" strokeDasharray="3 3" />
                            <Bar dataKey="hours" name="Sleep (h)" fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.9} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div style={{ background: '#0d1520', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '24px' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>⚖️ Weight Progress</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
                        Current: {latestWeight?.weight_kg || '—'}kg · Target: {profile?.target_weight_kg || '—'}kg
                    </div>
                    {weightChart.length >= 2 ? (
                        <ResponsiveContainer width="100%" height={140}>
                            <LineChart data={weightChart}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" fontSize={9} tick={{ fontSize: 9 }} />
                                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} domain={['auto', 'auto']} />
                                <Tooltip contentStyle={{ background: '#0d1520', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} />
                                {profile?.target_weight_kg && <ReferenceLine y={profile.target_weight_kg} stroke="#f59e0b" strokeDasharray="4 4" />}
                                <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 13 }}>Not enough data</div>
                    )}
                </div>
            </div>

            {/* Workout Log */}
            {workouts.length > 0 && (
                <div style={{ background: '#0d1520', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '24px', marginBottom: 24 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#a855f7', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>🏋️ Workout Log</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                                {['Date', 'Name', 'Type', 'Duration', 'Calories', 'Intensity'].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: 10, letterSpacing: 1 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[...workouts].sort((a, b) => b.date?.localeCompare(a.date)).slice(0, 15).map((w, i) => (
                                <tr key={w.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                                    <td style={{ padding: '9px 12px', color: '#94a3b8' }}>{w.date}</td>
                                    <td style={{ padding: '9px 12px', color: '#f0f0f0', fontWeight: 600 }}>{w.name || '—'}</td>
                                    <td style={{ padding: '9px 12px', color: '#a855f7' }}>{w.workout_type || '—'}</td>
                                    <td style={{ padding: '9px 12px', color: '#4ade80' }}>{w.duration_min || 0} min</td>
                                    <td style={{ padding: '9px 12px', color: '#f97316' }}>{w.calories_burned || 0} kcal</td>
                                    <td style={{ padding: '9px 12px' }}>
                                        <span style={{ background: w.intensity === 'high' ? '#7c3aed22' : w.intensity === 'extreme' ? '#dc262622' : '#16a34a22', color: w.intensity === 'high' ? '#a78bfa' : w.intensity === 'extreme' ? '#f87171' : '#4ade80', padding: '2px 8px', borderRadius: 6, fontSize: 10 }}>
                                            {w.intensity || 'moderate'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Goal Progress */}
            {profile && (
                <div style={{ background: '#0d1520', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '24px', marginBottom: 24 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#4ade80', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>🎯 Goal Achievement</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {[
                            { label: 'Daily Calories', current: Math.round(totalCal / Math.max(daysCount, 1)), target: profile.daily_calorie_target, color: '#4ade80', unit: 'kcal' },
                            { label: 'Daily Protein', current: Math.round(totalProt / Math.max(daysCount, 1)), target: profile.protein_target, color: '#3b82f6', unit: 'g' },
                            { label: 'Daily Steps', current: Math.round(totalSteps / Math.max(daysCount, 1)), target: profile.step_goal, color: '#f97316', unit: 'steps' },
                            { label: 'Daily Water', current: Math.round(totalWater / Math.max(daysCount, 1)), target: profile.water_goal_ml, color: '#06b6d4', unit: 'ml' },
                        ].filter(g => g.target).map(g => {
                            const pct = Math.min(100, Math.round((g.current / g.target) * 100));
                            return (
                                <div key={g.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '14px 16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ fontSize: 12, color: '#94a3b8' }}>{g.label}</span>
                                        <span style={{ fontSize: 12, color: g.color, fontWeight: 600 }}>{pct}%</span>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 999, height: 6, overflow: 'hidden', marginBottom: 6 }}>
                                        <div style={{ width: `${pct}%`, height: '100%', background: g.color, borderRadius: 999 }} />
                                    </div>
                                    <div style={{ fontSize: 11, color: '#64748b' }}>Avg {g.current?.toLocaleString()} / {g.target?.toLocaleString()} {g.unit}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Footer */}
            <div style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8 }}>
                <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>FitElite</div>
                <div style={{ fontSize: 10, color: '#334155', marginTop: 4 }}>Generated on {format(new Date(), 'MMMM d, yyyy')} · Keep pushing your limits 🚀</div>
            </div>
        </div>
    );
});
PrintableReport.displayName = 'PrintableReport';

// ---- Main exported component ----
export default function PDFReportGenerator({ userEmail, profileData, buttonLabel = 'Download Report', variant = 'default' }) {
    const [open, setOpen] = useState(false);
    const [fromDate, setFromDate] = useState(format(subDays(new Date(), 6), 'yyyy-MM-dd'));
    const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [generating, setGenerating] = useState(false);
    const reportRef = useRef(null);

    const email = userEmail;

    const { data: meals = [] } = useQuery({ queryKey: ['pdf-meals', email], queryFn: () => entities.MealLog.filter({ user_email: email }), enabled: !!email && open });
    const { data: water = [] } = useQuery({ queryKey: ['pdf-water', email], queryFn: () => entities.WaterLog.filter({ user_email: email }), enabled: !!email && open });
    const { data: steps = [] } = useQuery({ queryKey: ['pdf-steps', email], queryFn: () => entities.StepLog.filter({ user_email: email }), enabled: !!email && open });
    const { data: workouts = [] } = useQuery({ queryKey: ['pdf-workouts', email], queryFn: () => entities.WorkoutLog.filter({ user_email: email }), enabled: !!email && open });
    const { data: sleep = [] } = useQuery({ queryKey: ['pdf-sleep', email], queryFn: () => entities.SleepLog.filter({ user_email: email }), enabled: !!email && open });
    const { data: weight = [] } = useQuery({ queryKey: ['pdf-weight', email], queryFn: () => entities.WeightLog.filter({ user_email: email }), enabled: !!email && open });
    const { data: profiles = [] } = useQuery({ queryKey: ['pdf-profile', email], queryFn: () => entities.UserProfile.filter({ user_email: email }), enabled: !!email && open });
    const profile = profileData || profiles[0];

    const dateRange = React.useMemo(() => {
        const from = new Date(fromDate);
        const to = new Date(toDate);
        const days = Math.min(Math.round((to - from) / 86400000) + 1, 180);
        return Array.from({ length: days }, (_, i) => format(new Date(from.getTime() + i * 86400000), 'yyyy-MM-dd'));
    }, [fromDate, toDate]);

    const filteredData = React.useMemo(() => ({
        meals: meals.filter(m => dateRange.includes(m.date)),
        water: water.filter(w => dateRange.includes(w.date)),
        steps: steps.filter(s => dateRange.includes(s.date)),
        workouts: workouts.filter(w => dateRange.includes(w.date)),
        sleep: sleep.filter(s => dateRange.includes(s.date)),
        weight: weight.filter(l => dateRange.includes(l.date)),
        dateRange,
    }), [meals, water, steps, workouts, sleep, weight, dateRange]);

    const dateLabel = `${format(new Date(fromDate), 'MMM d')} – ${format(new Date(toDate), 'MMM d, yyyy')} (${dateRange.length} days)`;

    const handlePrint = async () => {
        setGenerating(true);
        await new Promise(r => setTimeout(r, 500)); // let charts render
        try {
            const el = reportRef.current;
            if (!el) return;
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
        <!DOCTYPE html><html><head>
        <title>FitElite Report - ${email}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: #0a0f16; color: #f0f0f0; font-family: Inter, sans-serif; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { margin: 0; size: A4 landscape; }
          }
        </style>
        </head><body>${el.innerHTML}</body></html>
      `);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
                setGenerating(false);
                toast.success('Report ready — use your browser\'s Save as PDF option');
            }, 1200);
        } catch {
            toast.error('Failed to generate report');
            setGenerating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant={variant} className={variant === 'default' ? 'bg-emerald-500 hover:bg-emerald-600 text-black font-semibold' : ''}>
                    <Download className="w-4 h-4 mr-2" />{buttonLabel}
                </Button>
            </DialogTrigger>
            <DialogContent className="glass border-white/10 max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-emerald-400" />
                        </div>
                        Generate Performance Report
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-5 pt-1">
                    {/* Preset range pills */}
                    <div>
                        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest font-semibold">Quick Range</p>
                        <div className="flex gap-2 flex-wrap">
                            {[
                                { label: 'Last 7 days', d: 6 },
                                { label: 'Last 14 days', d: 13 },
                                { label: 'Last 30 days', d: 29 },
                                { label: 'Last 60 days', d: 59 },
                            ].map(({ label: l, d }) => {
                                const f = format(subDays(new Date(), d), 'yyyy-MM-dd');
                                const t = format(new Date(), 'yyyy-MM-dd');
                                const active = fromDate === f && toDate === t;
                                return (
                                    <button key={d} onClick={() => { setFromDate(f); setToDate(t); }}
                                        className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all border ${active ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'border-white/10 text-muted-foreground hover:text-white hover:bg-white/5'}`}>
                                        {l}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Custom date range */}
                    <div>
                        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest font-semibold">Custom Range</p>
                        <div className="flex items-center gap-3 p-4 bg-white/3 rounded-xl border border-white/8">
                            <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex items-center gap-2 flex-1">
                                <div className="flex-1">
                                    <label className="text-[10px] text-muted-foreground block mb-1">From</label>
                                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                                        className="w-full text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:border-emerald-500/50" />
                                </div>
                                <span className="text-muted-foreground mt-4">→</span>
                                <div className="flex-1">
                                    <label className="text-[10px] text-muted-foreground block mb-1">To</label>
                                    <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                                        className="w-full text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:border-emerald-500/50" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary of what will be included */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'Days', value: dateRange.length, color: 'text-emerald-400' },
                            { label: 'Meals', value: filteredData.meals.length, color: 'text-blue-400' },
                            { label: 'Workouts', value: filteredData.workouts.length, color: 'text-purple-400' },
                            { label: 'Weight logs', value: filteredData.weight.length, color: 'text-yellow-400' },
                        ].map(s => (
                            <div key={s.label} className="bg-white/3 border border-white/8 rounded-xl p-3 text-center">
                                <div className={`text-xl font-bold font-space ${s.color}`}>{s.value}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Date label preview */}
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
                        <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-sm text-emerald-300 font-medium">{dateLabel}</span>
                    </div>

                    {/* Hidden render target */}
                    <div className="hidden">
                        <PrintableReport ref={reportRef} data={filteredData} profile={profile} dateLabel={dateLabel} />
                    </div>

                    <Button onClick={handlePrint} disabled={generating} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold h-11 rounded-xl shadow-lg shadow-emerald-500/20">
                        {generating
                            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Preparing Report...</>
                            : <><Download className="w-4 h-4 mr-2" /> Generate & Print PDF</>}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground -mt-2">Use "Save as PDF" in the print dialog to download</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}