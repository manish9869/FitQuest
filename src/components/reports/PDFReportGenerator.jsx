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
import html2canvas from 'html2canvas';

// ---- the actual printable report (light theme) ----
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
    const consistencyScore = Math.round((activeDays / Math.max(daysCount, 1)) * 100);

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

    const scoreColor = consistencyScore >= 70 ? '#16a34a' : consistencyScore >= 40 ? '#d97706' : '#dc2626';

    // Light-theme chart props
    const axisProps = { stroke: '#94a3b8', fontSize: 9, tick: { fontSize: 9, fill: '#64748b' }, tickLine: false, axisLine: false };
    const gridProps = { strokeDasharray: '3 3', stroke: '#e2e8f0' };
    const tooltipStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11, color: '#1e293b' };

    return (
        <div ref={ref} style={{ fontFamily: 'Inter, Arial, sans-serif', background: '#ffffff', color: '#1e293b', padding: '40px', minWidth: 900 }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 60%, #faf5ff 100%)', borderRadius: 16, padding: '28px 36px', marginBottom: 28, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ fontSize: 10, letterSpacing: 3, color: '#16a34a', textTransform: 'uppercase', marginBottom: 6, fontWeight: 700 }}>FitElite Performance Report</div>
                        <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4, color: '#0f172a' }}>
                            {profile?.user_email?.split('@')[0] || 'Athlete'}
                        </div>
                        <div style={{ color: '#64748b', fontSize: 13 }}>{dateLabel}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2, fontWeight: 600 }}>Consistency Score</div>
                        <div style={{ fontSize: 44, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{consistencyScore}%</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{activeDays}/{daysCount} active days</div>
                    </div>
                </div>
            </div>

            {/* KPI row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 14 }}>
                {[
                    { label: 'Total Calories', value: totalCal.toLocaleString(), unit: 'kcal', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
                    { label: 'Total Steps', value: totalSteps.toLocaleString(), unit: 'steps', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
                    { label: 'Water Intake', value: (totalWater / 1000).toFixed(1), unit: 'L total', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
                    { label: 'Workouts', value: workouts.length, unit: 'sessions', color: '#7c3aed', bg: '#faf5ff', border: '#ddd6fe' },
                ].map(k => (
                    <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.border}`, borderRadius: 12, padding: '16px 20px' }}>
                        <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>{k.label}</div>
                        <div style={{ fontSize: 26, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{k.unit}</div>
                    </div>
                ))}
            </div>

            {/* KPI row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
                {[
                    { label: 'Avg Daily Cal', value: Math.round(totalCal / Math.max(daysCount, 1)).toLocaleString(), unit: 'kcal/day', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
                    { label: 'Avg Daily Steps', value: Math.round(totalSteps / Math.max(daysCount, 1)).toLocaleString(), unit: 'steps/day', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
                    { label: 'Avg Sleep', value: avgSleep, unit: 'hours/night', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
                    { label: 'Current Weight', value: latestWeight?.weight_kg || '—', unit: 'kg', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
                ].map(k => (
                    <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.border}`, borderRadius: 12, padding: '16px 20px' }}>
                        <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>{k.label}</div>
                        <div style={{ fontSize: 26, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{k.unit}</div>
                    </div>
                ))}
            </div>

            {/* Nutrition Chart */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 1 }}>📊 Nutrition Trend</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 14 }}>Daily calories & protein</div>
                <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={nutritionChart}>
                        <defs>
                            <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#16a34a" stopOpacity={0.25} /><stop offset="100%" stopColor="#16a34a" stopOpacity={0} /></linearGradient>
                            <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity={0.2} /><stop offset="100%" stopColor="#2563eb" stopOpacity={0} /></linearGradient>
                        </defs>
                        <CartesianGrid {...gridProps} />
                        <XAxis dataKey="day" {...axisProps} />
                        <YAxis {...axisProps} />
                        <Tooltip contentStyle={tooltipStyle} />
                        {profile?.daily_calorie_target && <ReferenceLine y={profile.daily_calorie_target} stroke="#d97706" strokeDasharray="4 4" />}
                        <Area type="monotone" dataKey="calories" name="Calories" stroke="#16a34a" fill="url(#cg)" strokeWidth={2} dot={false} />
                        <Area type="monotone" dataKey="protein" name="Protein (g)" stroke="#2563eb" fill="url(#pg)" strokeWidth={1.5} dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 14 }}>
                    {[
                        { label: 'Calories', value: `${totalCal.toLocaleString()} kcal`, color: '#16a34a' },
                        { label: 'Protein', value: `${Math.round(totalProt)}g`, color: '#2563eb' },
                        { label: 'Carbs', value: `${Math.round(totalCarbs)}g`, color: '#7c3aed' },
                        { label: 'Fats', value: `${Math.round(totalFat)}g`, color: '#ea580c' },
                    ].map(m => (
                        <div key={m.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                            <div style={{ color: m.color, fontWeight: 700, fontSize: 15 }}>{m.value}</div>
                            <div style={{ color: '#94a3b8', fontSize: 10 }}>{m.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Steps + Water */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 24px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#ea580c', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 1 }}>👟 Steps</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 14 }}>Total: {totalSteps.toLocaleString()} · ~{Math.round(totalSteps * 0.0008)} km</div>
                    <ResponsiveContainer width="100%" height={130}>
                        <BarChart data={activityChart}>
                            <CartesianGrid {...gridProps} />
                            <XAxis dataKey="day" {...axisProps} />
                            <YAxis {...axisProps} />
                            <Tooltip contentStyle={tooltipStyle} />
                            {profile?.step_goal && <ReferenceLine y={profile.step_goal} stroke="#d97706" strokeDasharray="3 3" />}
                            <Bar dataKey="steps" name="Steps" fill="#ea580c" radius={[4, 4, 0, 0]} opacity={0.85} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 24px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0891b2', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 1 }}>💧 Hydration</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 14 }}>Total: {(totalWater / 1000).toFixed(1)}L · Avg: {Math.round(totalWater / Math.max(daysCount, 1))}ml/day</div>
                    <ResponsiveContainer width="100%" height={130}>
                        <AreaChart data={activityChart}>
                            <defs><linearGradient id="wg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0891b2" stopOpacity={0.25} /><stop offset="100%" stopColor="#0891b2" stopOpacity={0} /></linearGradient></defs>
                            <CartesianGrid {...gridProps} />
                            <XAxis dataKey="day" {...axisProps} />
                            <YAxis {...axisProps} />
                            <Tooltip contentStyle={tooltipStyle} />
                            {profile?.water_goal_ml && <ReferenceLine y={profile.water_goal_ml} stroke="#d97706" strokeDasharray="3 3" />}
                            <Area type="monotone" dataKey="water" name="Water (ml)" stroke="#0891b2" fill="url(#wg2)" strokeWidth={2} dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Sleep + Weight */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 24px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#2563eb', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 1 }}>🌙 Sleep</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 14 }}>Avg: {avgSleep}h · {sleep.length} nights logged</div>
                    <ResponsiveContainer width="100%" height={130}>
                        <BarChart data={sleepChart}>
                            <CartesianGrid {...gridProps} />
                            <XAxis dataKey="day" {...axisProps} />
                            <YAxis {...axisProps} domain={[0, 10]} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <ReferenceLine y={8} stroke="#16a34a" strokeDasharray="3 3" />
                            <Bar dataKey="hours" name="Sleep (h)" fill="#2563eb" radius={[4, 4, 0, 0]} opacity={0.85} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 24px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#d97706', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 1 }}>⚖️ Weight Progress</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 14 }}>Current: {latestWeight?.weight_kg || '—'}kg · Target: {profile?.target_weight_kg || '—'}kg</div>
                    {weightChart.length >= 2 ? (
                        <ResponsiveContainer width="100%" height={130}>
                            <LineChart data={weightChart}>
                                <CartesianGrid {...gridProps} />
                                <XAxis dataKey="day" {...axisProps} />
                                <YAxis {...axisProps} domain={['auto', 'auto']} />
                                <Tooltip contentStyle={tooltipStyle} />
                                {profile?.target_weight_kg && <ReferenceLine y={profile.target_weight_kg} stroke="#d97706" strokeDasharray="4 4" />}
                                <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="#d97706" strokeWidth={2.5} dot={{ fill: '#d97706', r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>Not enough data</div>
                    )}
                </div>
            </div>

            {/* Workout Log */}
            {workouts.length > 0 && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>🏋️ Workout Log</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                {['Date', 'Name', 'Type', 'Duration', 'Calories', 'Intensity'].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '7px 10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: 10, letterSpacing: 1 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[...workouts].sort((a, b) => b.date?.localeCompare(a.date)).slice(0, 15).map((w, i) => (
                                <tr key={w.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                    <td style={{ padding: '8px 10px', color: '#64748b' }}>{w.date}</td>
                                    <td style={{ padding: '8px 10px', color: '#0f172a', fontWeight: 600 }}>{w.name || '—'}</td>
                                    <td style={{ padding: '8px 10px', color: '#7c3aed' }}>{w.workout_type || '—'}</td>
                                    <td style={{ padding: '8px 10px', color: '#16a34a' }}>{w.duration_min || 0} min</td>
                                    <td style={{ padding: '8px 10px', color: '#ea580c' }}>{w.calories_burned || 0} kcal</td>
                                    <td style={{ padding: '8px 10px' }}>
                                        <span style={{ background: w.intensity === 'high' ? '#ede9fe' : w.intensity === 'extreme' ? '#fee2e2' : '#dcfce7', color: w.intensity === 'high' ? '#7c3aed' : w.intensity === 'extreme' ? '#dc2626' : '#16a34a', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600 }}>
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
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>🎯 Goal Achievement</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        {[
                            { label: 'Daily Calories', current: Math.round(totalCal / Math.max(daysCount, 1)), target: profile.daily_calorie_target, color: '#16a34a', unit: 'kcal' },
                            { label: 'Daily Protein', current: Math.round(totalProt / Math.max(daysCount, 1)), target: profile.protein_target, color: '#2563eb', unit: 'g' },
                            { label: 'Daily Steps', current: Math.round(totalSteps / Math.max(daysCount, 1)), target: profile.step_goal, color: '#ea580c', unit: 'steps' },
                            { label: 'Daily Water', current: Math.round(totalWater / Math.max(daysCount, 1)), target: profile.water_goal_ml, color: '#0891b2', unit: 'ml' },
                        ].filter(g => g.target).map(g => {
                            const pct = Math.min(100, Math.round((g.current / g.target) * 100));
                            return (
                                <div key={g.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{g.label}</span>
                                        <span style={{ fontSize: 12, color: g.color, fontWeight: 700 }}>{pct}%</span>
                                    </div>
                                    <div style={{ background: '#e2e8f0', borderRadius: 999, height: 6, overflow: 'hidden', marginBottom: 6 }}>
                                        <div style={{ width: `${pct}%`, height: '100%', background: g.color, borderRadius: 999 }} />
                                    </div>
                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Avg {g.current?.toLocaleString()} / {g.target?.toLocaleString()} {g.unit}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Footer */}
            <div style={{ textAlign: 'center', padding: '16px', borderTop: '1px solid #e2e8f0', marginTop: 8 }}>
                <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>FitElite</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>Generated on {format(new Date(), 'MMMM d, yyyy')} · Keep pushing your limits 🚀</div>
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

    const dateRange = useMemo(() => {
        const from = new Date(fromDate);
        const to = new Date(toDate);
        const days = Math.min(Math.round((to - from) / 86400000) + 1, 180);
        return Array.from({ length: days }, (_, i) => format(new Date(from.getTime() + i * 86400000), 'yyyy-MM-dd'));
    }, [fromDate, toDate]);

    const filteredData = useMemo(() => ({
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
        // Wait for charts to fully render
        await new Promise(r => setTimeout(r, 800));
        try {
            const el = reportRef.current;
            if (!el) return;

            // Capture the report element as a canvas image so charts are visible
            const canvas = await html2canvas(el, {
                backgroundColor: '#ffffff',
                scale: 1.5,
                useCORS: true,
                allowTaint: true,
                logging: false,
            });

            const imgData = canvas.toDataURL('image/png');
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;

            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
        <!DOCTYPE html><html><head>
        <title>FitElite Report - ${email}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: #fff; }
          img { display: block; width: 100%; height: auto; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { margin: 0; }
          }
        </style>
        </head><body>
        <img src="${imgData}" width="${imgWidth}" height="${imgHeight}" />
        </body></html>
      `);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
                setGenerating(false);
                toast.success('Report ready — use "Save as PDF" in the print dialog');
            }, 800);
        } catch (err) {
            console.error(err);
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

                    {/* Summary stats */}
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

                    {/* Hidden render target — must be visible for html2canvas to capture charts */}
                    <div style={{ position: 'fixed', left: '-9999px', top: 0, width: 960, pointerEvents: 'none', zIndex: -1 }}>
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