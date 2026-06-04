import React, { useState, useRef, useMemo } from 'react';
import { entities } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Download, Loader2, FileText, Calendar, TrendingUp, Zap, Droplets, Footprints, Dumbbell, Moon, Scale, Target, Award } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine
} from 'recharts';
import html2canvas from 'html2canvas';

// ─── Printable Report ────────────────────────────────────────────────────────
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
    const activeDays = data.dateRange.filter(d =>
        workouts.some(w => w.date === d) || steps.some(s => s.date === d && s.steps > 3000)
    ).length;
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
    const weightChart = [...weight]
        .sort((a, b) => a.date?.localeCompare(b.date))
        .map(l => ({ day: format(parseISO(l.date), 'MMM d'), weight: l.weight_kg }));

    const scoreColor = consistencyScore >= 70 ? '#10b981' : consistencyScore >= 40 ? '#f59e0b' : '#ef4444';
    const scoreGrade = consistencyScore >= 90 ? 'A+' : consistencyScore >= 80 ? 'A' : consistencyScore >= 70 ? 'B' : consistencyScore >= 50 ? 'C' : 'D';

    const axisProps = { stroke: '#cbd5e1', fontSize: 9, tick: { fontSize: 9, fill: '#94a3b8' }, tickLine: false, axisLine: false };
    const gridProps = { strokeDasharray: '3 3', stroke: '#f1f5f9', vertical: false };
    const ttStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11, color: '#1e293b', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' };

    const weightChange = latestWeight && profile?.weight_kg
        ? (latestWeight.weight_kg - profile.weight_kg).toFixed(1)
        : null;

    return (
        <div ref={ref} style={{ fontFamily: '"DM Sans", "Helvetica Neue", Arial, sans-serif', background: '#f8fafc', color: '#0f172a', padding: '36px', minWidth: 940 }}>

            {/* ── Cover strip ── */}
            <div style={{ background: 'linear-gradient(120deg, #0f172a 0%, #1e293b 55%, #0f2b1e 100%)', borderRadius: 20, padding: '32px 40px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
                {/* decorative ring */}
                <div style={{ position: 'absolute', right: -40, top: -40, width: 220, height: 220, borderRadius: '50%', border: '40px solid rgba(16,185,129,0.12)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', right: 60, bottom: -60, width: 140, height: 140, borderRadius: '50%', border: '28px solid rgba(16,185,129,0.07)', pointerEvents: 'none' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                            <div style={{ width: 6, height: 24, background: '#10b981', borderRadius: 3 }} />
                            <span style={{ fontSize: 11, letterSpacing: 3, color: '#10b981', textTransform: 'uppercase', fontWeight: 700 }}>FitElite Performance</span>
                        </div>
                        <div style={{ fontSize: 32, fontWeight: 800, color: '#ffffff', marginBottom: 6, letterSpacing: -0.5 }}>
                            {profile?.user_email?.split('@')[0] || 'Athlete'}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>📅</span>
                            <span>{dateLabel}</span>
                        </div>
                    </div>

                    {/* Score ring */}
                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: '20px 28px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}>Consistency</div>
                        <div style={{ fontSize: 52, fontWeight: 900, color: scoreColor, lineHeight: 1, letterSpacing: -2 }}>{consistencyScore}<span style={{ fontSize: 20 }}>%</span></div>
                        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <div style={{ fontSize: 20, fontWeight: 900, color: scoreColor, background: `${scoreColor}20`, borderRadius: 8, padding: '2px 10px' }}>{scoreGrade}</div>
                        </div>
                        <div style={{ fontSize: 10, color: '#475569', marginTop: 6 }}>{activeDays} of {daysCount} days active</div>
                    </div>
                </div>
            </div>

            {/* ── KPI grid: 4 primary ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
                {[
                    { label: 'Total Calories', value: totalCal.toLocaleString(), unit: 'kcal', icon: '🔥', accent: '#10b981', light: '#f0fdf4', border: '#bbf7d0' },
                    { label: 'Total Steps', value: totalSteps.toLocaleString(), unit: 'steps', icon: '👟', accent: '#f97316', light: '#fff7ed', border: '#fed7aa' },
                    { label: 'Water Intake', value: (totalWater / 1000).toFixed(1), unit: 'litres', icon: '💧', accent: '#0891b2', light: '#ecfeff', border: '#a5f3fc' },
                    { label: 'Workouts', value: workouts.length, unit: 'sessions', icon: '🏋️', accent: '#8b5cf6', light: '#faf5ff', border: '#ddd6fe' },
                ].map(k => (
                    <div key={k.label} style={{ background: '#ffffff', border: `1px solid ${k.border}`, borderRadius: 14, padding: '18px 20px', borderLeft: `4px solid ${k.accent}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                            <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>{k.label}</div>
                            <span style={{ fontSize: 18 }}>{k.icon}</span>
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: k.accent, lineHeight: 1, letterSpacing: -0.5 }}>{k.value}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{k.unit}</div>
                    </div>
                ))}
            </div>

            {/* ── KPI grid: 4 secondary ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                {[
                    { label: 'Avg Daily Cal', value: Math.round(totalCal / Math.max(daysCount, 1)).toLocaleString(), unit: 'kcal / day', accent: '#10b981' },
                    { label: 'Avg Daily Steps', value: Math.round(totalSteps / Math.max(daysCount, 1)).toLocaleString(), unit: 'steps / day', accent: '#f97316' },
                    { label: 'Avg Sleep', value: avgSleep, unit: 'hours / night', accent: '#3b82f6' },
                    { label: 'Current Weight', value: latestWeight?.weight_kg || '—', unit: `kg ${weightChange ? (weightChange > 0 ? `(+${weightChange})` : `(${weightChange})`) : ''}`, accent: '#f59e0b' },
                ].map(k => (
                    <div key={k.label} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 18px' }}>
                        <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 8 }}>{k.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: k.accent, lineHeight: 1 }}>{k.value}</div>
                        <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 3 }}>{k.unit}</div>
                    </div>
                ))}
            </div>

            {/* ── Nutrition Chart ── */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '22px 26px', marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 }}>📊 Nutrition Trend</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>Daily calories vs protein intake</div>
                    </div>
                    <div style={{ display: 'flex', gap: 16 }}>
                        {[['Calories', '#10b981'], ['Protein', '#3b82f6']].map(([l, c]) => (
                            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
                                <span style={{ fontSize: 10, color: '#64748b' }}>{l}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={155}>
                    <AreaChart data={nutritionChart} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.2} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                            <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                        </defs>
                        <CartesianGrid {...gridProps} />
                        <XAxis dataKey="day" {...axisProps} />
                        <YAxis {...axisProps} />
                        <Tooltip contentStyle={ttStyle} />
                        {profile?.daily_calorie_target && <ReferenceLine y={profile.daily_calorie_target} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} />}
                        <Area type="monotone" dataKey="calories" name="Calories" stroke="#10b981" fill="url(#cg)" strokeWidth={2} dot={false} />
                        <Area type="monotone" dataKey="protein" name="Protein (g)" stroke="#3b82f6" fill="url(#pg)" strokeWidth={1.5} dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
                {/* Macro summary bar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                    {[
                        { label: 'Calories', value: `${totalCal.toLocaleString()} kcal`, color: '#10b981', pct: null },
                        { label: 'Protein', value: `${Math.round(totalProt)}g`, color: '#3b82f6', pct: Math.round((totalProt * 4 / Math.max(totalCal, 1)) * 100) },
                        { label: 'Carbs', value: `${Math.round(totalCarbs)}g`, color: '#8b5cf6', pct: Math.round((totalCarbs * 4 / Math.max(totalCal, 1)) * 100) },
                        { label: 'Fats', value: `${Math.round(totalFat)}g`, color: '#f97316', pct: Math.round((totalFat * 9 / Math.max(totalCal, 1)) * 100) },
                    ].map(m => (
                        <div key={m.label} style={{ textAlign: 'center', padding: '10px 8px', borderRadius: 10, background: '#f8fafc' }}>
                            <div style={{ color: m.color, fontWeight: 800, fontSize: 16, marginBottom: 2 }}>{m.value}</div>
                            <div style={{ color: '#94a3b8', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>{m.label}</div>
                            {m.pct !== null && <div style={{ color: m.color, fontSize: 9, marginTop: 2, fontWeight: 600 }}>{m.pct}% of cal</div>}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Steps + Hydration ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
                {/* Steps */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#f97316', textTransform: 'uppercase', letterSpacing: 1.5 }}>👟 Activity</div>
                            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{totalSteps.toLocaleString()} steps · ~{Math.round(totalSteps * 0.0008)} km</div>
                        </div>
                        <div style={{ fontSize: 10, color: '#f97316', background: '#fff7ed', padding: '3px 10px', borderRadius: 999, fontWeight: 700, border: '1px solid #fed7aa' }}>
                            avg {Math.round(totalSteps / Math.max(daysCount, 1)).toLocaleString()}/day
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={120}>
                        <BarChart data={activityChart} margin={{ top: 0, right: 5, left: -20, bottom: 0 }}>
                            <CartesianGrid {...gridProps} />
                            <XAxis dataKey="day" {...axisProps} />
                            <YAxis {...axisProps} />
                            <Tooltip contentStyle={ttStyle} />
                            {profile?.step_goal && <ReferenceLine y={profile.step_goal} stroke="#fbbf24" strokeDasharray="3 3" />}
                            <Bar dataKey="steps" name="Steps" fill="#f97316" radius={[3, 3, 0, 0]} opacity={0.85} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Hydration */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#0891b2', textTransform: 'uppercase', letterSpacing: 1.5 }}>💧 Hydration</div>
                            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{(totalWater / 1000).toFixed(1)}L total</div>
                        </div>
                        <div style={{ fontSize: 10, color: '#0891b2', background: '#ecfeff', padding: '3px 10px', borderRadius: 999, fontWeight: 700, border: '1px solid #a5f3fc' }}>
                            avg {Math.round(totalWater / Math.max(daysCount, 1))}ml/day
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={120}>
                        <AreaChart data={activityChart} margin={{ top: 0, right: 5, left: -20, bottom: 0 }}>
                            <defs><linearGradient id="wg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0891b2" stopOpacity={0.2} /><stop offset="100%" stopColor="#0891b2" stopOpacity={0} /></linearGradient></defs>
                            <CartesianGrid {...gridProps} />
                            <XAxis dataKey="day" {...axisProps} />
                            <YAxis {...axisProps} />
                            <Tooltip contentStyle={ttStyle} />
                            {profile?.water_goal_ml && <ReferenceLine y={profile.water_goal_ml} stroke="#fbbf24" strokeDasharray="3 3" />}
                            <Area type="monotone" dataKey="water" name="Water (ml)" stroke="#0891b2" fill="url(#wg2)" strokeWidth={2} dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── Sleep + Weight ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
                {/* Sleep */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: 1.5 }}>🌙 Sleep Quality</div>
                            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{sleep.length} nights logged · avg {avgSleep}h</div>
                        </div>
                        <div style={{ fontSize: 10, color: '#3b82f6', background: '#eff6ff', padding: '3px 10px', borderRadius: 999, fontWeight: 700, border: '1px solid #bfdbfe' }}>
                            goal: 8h
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={120}>
                        <BarChart data={sleepChart} margin={{ top: 0, right: 5, left: -20, bottom: 0 }}>
                            <CartesianGrid {...gridProps} />
                            <XAxis dataKey="day" {...axisProps} />
                            <YAxis {...axisProps} domain={[0, 10]} />
                            <Tooltip contentStyle={ttStyle} />
                            <ReferenceLine y={8} stroke="#10b981" strokeDasharray="3 3" strokeWidth={1.5} />
                            <Bar dataKey="hours" name="Sleep (h)" fill="#3b82f6" radius={[3, 3, 0, 0]} opacity={0.85} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Weight */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1.5 }}>⚖️ Weight Trend</div>
                            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                                Current: {latestWeight?.weight_kg || '—'}kg · Target: {profile?.target_weight_kg || '—'}kg
                            </div>
                        </div>
                        {weightChange && (
                            <div style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, border: '1px solid', ...(weightChange < 0 ? { color: '#10b981', background: '#f0fdf4', borderColor: '#bbf7d0' } : { color: '#ef4444', background: '#fef2f2', borderColor: '#fecaca' }) }}>
                                {weightChange > 0 ? '+' : ''}{weightChange}kg
                            </div>
                        )}
                    </div>
                    {weightChart.length >= 2 ? (
                        <ResponsiveContainer width="100%" height={120}>
                            <LineChart data={weightChart} margin={{ top: 0, right: 5, left: -20, bottom: 0 }}>
                                <CartesianGrid {...gridProps} />
                                <XAxis dataKey="day" {...axisProps} />
                                <YAxis {...axisProps} domain={['auto', 'auto']} />
                                <Tooltip contentStyle={ttStyle} />
                                {profile?.target_weight_kg && <ReferenceLine y={profile.target_weight_kg} stroke="#f59e0b" strokeDasharray="4 4" />}
                                <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: 12 }}>
                            Not enough data in range
                        </div>
                    )}
                </div>
            </div>

            {/* ── Workout Log ── */}
            {workouts.length > 0 && (
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 24px', marginBottom: 18 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#8b5cf6', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1.5 }}>🏋️ Workout Log</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                {['Date', 'Workout', 'Type', 'Duration', 'Calories Burned', 'Intensity'].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '9px 12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: 9, letterSpacing: 1.2, borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[...workouts].sort((a, b) => b.date?.localeCompare(a.date)).slice(0, 12).map((w, i) => {
                                const intBg = w.intensity === 'extreme' ? '#fef2f2' : w.intensity === 'high' ? '#faf5ff' : '#f0fdf4';
                                const intColor = w.intensity === 'extreme' ? '#dc2626' : w.intensity === 'high' ? '#7c3aed' : '#16a34a';
                                return (
                                    <tr key={w.id} style={{ borderBottom: '1px solid #f8fafc', background: i % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                                        <td style={{ padding: '9px 12px', color: '#64748b', fontWeight: 500 }}>{w.date}</td>
                                        <td style={{ padding: '9px 12px', color: '#0f172a', fontWeight: 700 }}>{w.name || '—'}</td>
                                        <td style={{ padding: '9px 12px', color: '#8b5cf6', fontWeight: 600 }}>{w.workout_type || '—'}</td>
                                        <td style={{ padding: '9px 12px', color: '#10b981', fontWeight: 600 }}>{w.duration_min || 0} min</td>
                                        <td style={{ padding: '9px 12px', color: '#f97316', fontWeight: 600 }}>{w.calories_burned || 0} kcal</td>
                                        <td style={{ padding: '9px 12px' }}>
                                            <span style={{ background: intBg, color: intColor, padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: 'capitalize' }}>
                                                {w.intensity || 'moderate'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Goal Achievement ── */}
            {profile && (
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 24px', marginBottom: 18 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#10b981', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1.5 }}>🎯 Goal Achievement</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {[
                            { label: 'Daily Calories', current: Math.round(totalCal / Math.max(daysCount, 1)), target: profile.daily_calorie_target, color: '#10b981', unit: 'kcal' },
                            { label: 'Daily Protein', current: Math.round(totalProt / Math.max(daysCount, 1)), target: profile.protein_target, color: '#3b82f6', unit: 'g' },
                            { label: 'Daily Steps', current: Math.round(totalSteps / Math.max(daysCount, 1)), target: profile.step_goal, color: '#f97316', unit: 'steps' },
                            { label: 'Daily Water', current: Math.round(totalWater / Math.max(daysCount, 1)), target: profile.water_goal_ml, color: '#0891b2', unit: 'ml' },
                        ].filter(g => g.target).map(g => {
                            const pct = Math.min(100, Math.round((g.current / g.target) * 100));
                            const met = pct >= 100;
                            return (
                                <div key={g.label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <span style={{ fontSize: 12, color: '#334155', fontWeight: 700 }}>{g.label}</span>
                                        <span style={{ fontSize: 13, color: met ? '#10b981' : g.color, fontWeight: 800 }}>{pct}%</span>
                                    </div>
                                    <div style={{ background: '#e2e8f0', borderRadius: 999, height: 7, overflow: 'hidden', marginBottom: 8 }}>
                                        <div style={{ width: `${pct}%`, height: '100%', background: met ? '#10b981' : g.color, borderRadius: 999, transition: 'width 0.3s' }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8' }}>
                                        <span>Avg {g.current?.toLocaleString()} {g.unit}</span>
                                        <span>Target {g.target?.toLocaleString()} {g.unit}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Footer ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 4px', borderTop: '1px solid #e2e8f0', marginTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 4, height: 16, background: '#10b981', borderRadius: 2 }} />
                    <span style={{ fontSize: 12, color: '#10b981', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>FitElite</span>
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>
                    Generated {format(new Date(), 'MMMM d, yyyy')} · Confidential Performance Data
                </div>
            </div>
        </div>
    );
});
PrintableReport.displayName = 'PrintableReport';

// ─── Dialog UI ────────────────────────────────────────────────────────────────
const PRESETS = [
    { label: '7d', days: 6, full: 'Last 7 days' },
    { label: '14d', days: 13, full: 'Last 14 days' },
    { label: '30d', days: 29, full: 'Last 30 days' },
    { label: '60d', days: 59, full: 'Last 60 days' },
];

export default function PDFReportGenerator({ userEmail, profileData, buttonLabel = 'Download Report', variant = 'default' }) {
    const [open, setOpen] = useState(false);
    const [fromDate, setFromDate] = useState(format(subDays(new Date(), 6), 'yyyy-MM-dd'));
    const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [generating, setGenerating] = useState(false);
    const reportRef = useRef(null);

    const email = userEmail;

    const qOpts = { enabled: !!email && open };
    const { data: meals = [] } = useQuery({ queryKey: ['pdf-meals', email], queryFn: () => entities.MealLog.filter({ user_email: email }), ...qOpts });
    const { data: water = [] } = useQuery({ queryKey: ['pdf-water', email], queryFn: () => entities.WaterLog.filter({ user_email: email }), ...qOpts });
    const { data: steps = [] } = useQuery({ queryKey: ['pdf-steps', email], queryFn: () => entities.StepLog.filter({ user_email: email }), ...qOpts });
    const { data: workouts = [] } = useQuery({ queryKey: ['pdf-workouts', email], queryFn: () => entities.WorkoutLog.filter({ user_email: email }), ...qOpts });
    const { data: sleep = [] } = useQuery({ queryKey: ['pdf-sleep', email], queryFn: () => entities.SleepLog.filter({ user_email: email }), ...qOpts });
    const { data: weight = [] } = useQuery({ queryKey: ['pdf-weight', email], queryFn: () => entities.WeightLog.filter({ user_email: email }), ...qOpts });
    const { data: profiles = [] } = useQuery({ queryKey: ['pdf-profile', email], queryFn: () => entities.UserProfile.filter({ user_email: email }), ...qOpts });
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

    // Quick stats for the dialog preview
    const totalCal = filteredData.meals.reduce((s, m) => s + (m.calories || 0), 0);
    const totalSteps = filteredData.steps.reduce((s, st) => s + (st.steps || 0), 0);
    const totalWater = filteredData.water.reduce((s, w) => s + (w.amount_ml || 0), 0);
    const avgSleep = filteredData.sleep.length
        ? (filteredData.sleep.reduce((s, sl) => s + (sl.hours || 0), 0) / filteredData.sleep.length).toFixed(1)
        : '—';

    const handlePrint = async () => {
        setGenerating(true);
        await new Promise(r => setTimeout(r, 900));
        try {
            const el = reportRef.current;
            if (!el) return;
            const canvas = await html2canvas(el, {
                backgroundColor: '#f8fafc',
                scale: 1.6,
                useCORS: true,
                allowTaint: true,
                logging: false,
            });
            const imgData = canvas.toDataURL('image/png');
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`<!DOCTYPE html><html><head>
                <title>FitElite Report — ${email}</title>
                <style>
                  * { margin:0; padding:0; box-sizing:border-box; }
                  body { background:#f8fafc; }
                  img  { display:block; width:100%; height:auto; }
                  @media print {
                    body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
                    @page { margin:0; size:A4 portrait; }
                  }
                </style>
            </head><body>
                <img src="${imgData}" />
            </body></html>`);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
                setGenerating(false);
                toast.success('Report ready — choose "Save as PDF" in the print dialog');
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
                <Button variant={variant} className={variant === 'default' ? 'bg-emerald-500 hover:bg-emerald-600 text-black font-semibold gap-2' : 'gap-2'}>
                    <Download className="w-4 h-4" />{buttonLabel}
                </Button>
            </DialogTrigger>

            <DialogContent className="glass border-white/10 max-w-2xl p-0 overflow-hidden">
                {/* Dialog header strip */}
                <div className="px-6 pt-6 pb-4 border-b border-white/5">
                    <DialogTitle className="flex items-center gap-3 text-base font-bold">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/25 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                            <div className="text-base font-bold">Performance Report</div>
                            <div className="text-xs text-muted-foreground font-normal mt-0.5">{email}</div>
                        </div>
                    </DialogTitle>
                </div>

                <div className="px-6 py-5 space-y-5">
                    {/* ── Preset pills ── */}
                    <div>
                        <p className="text-[10px] text-muted-foreground mb-2.5 uppercase tracking-widest font-bold">Quick Select</p>
                        <div className="flex gap-2">
                            {PRESETS.map(({ label, days, full }) => {
                                const f = format(subDays(new Date(), days), 'yyyy-MM-dd');
                                const t = format(new Date(), 'yyyy-MM-dd');
                                const active = fromDate === f && toDate === t;
                                return (
                                    <button key={days} onClick={() => { setFromDate(f); setToDate(t); }}
                                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all border ${active
                                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                            : 'border-white/8 text-muted-foreground hover:text-white hover:bg-white/5 hover:border-white/15'}`}>
                                        {label}
                                        <div className={`text-[9px] mt-0.5 font-normal ${active ? 'text-emerald-400/70' : 'text-muted-foreground/50'}`}>{full}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Custom date range ── */}
                    <div>
                        <p className="text-[10px] text-muted-foreground mb-2.5 uppercase tracking-widest font-bold">Custom Range</p>
                        <div className="flex items-center gap-3 p-3.5 bg-white/3 rounded-xl border border-white/8">
                            <Calendar className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
                            <div className="flex items-center gap-2 flex-1">
                                <div className="flex-1">
                                    <div className="text-[9px] text-muted-foreground/60 mb-1 uppercase tracking-wider">From</div>
                                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                                        className="w-full text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:border-emerald-500/40 transition-colors" />
                                </div>
                                <div className="text-muted-foreground/40 text-xs mt-4 flex-shrink-0">→</div>
                                <div className="flex-1">
                                    <div className="text-[9px] text-muted-foreground/60 mb-1 uppercase tracking-wider">To</div>
                                    <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                                        className="w-full text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:border-emerald-500/40 transition-colors" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Live data preview ── */}
                    <div>
                        <p className="text-[10px] text-muted-foreground mb-2.5 uppercase tracking-widest font-bold">Data Preview · {dateRange.length} days</p>
                        <div className="grid grid-cols-4 gap-2.5">
                            {[
                                { icon: TrendingUp, label: 'Calories', value: totalCal.toLocaleString(), unit: 'kcal', color: 'text-emerald-400', bg: 'bg-emerald-500/8 border-emerald-500/15' },
                                { icon: Footprints, label: 'Steps', value: totalSteps.toLocaleString(), unit: 'total', color: 'text-orange-400', bg: 'bg-orange-500/8 border-orange-500/15' },
                                { icon: Droplets, label: 'Water', value: (totalWater / 1000).toFixed(1), unit: 'litres', color: 'text-cyan-400', bg: 'bg-cyan-500/8 border-cyan-500/15' },
                                { icon: Moon, label: 'Avg Sleep', value: avgSleep, unit: 'hrs/night', color: 'text-blue-400', bg: 'bg-blue-500/8 border-blue-500/15' },
                                { icon: Dumbbell, label: 'Workouts', value: filteredData.workouts.length, unit: 'sessions', color: 'text-purple-400', bg: 'bg-purple-500/8 border-purple-500/15' },
                                { icon: Zap, label: 'Meals', value: filteredData.meals.length, unit: 'entries', color: 'text-yellow-400', bg: 'bg-yellow-500/8 border-yellow-500/15' },
                                { icon: Scale, label: 'Weigh-ins', value: filteredData.weight.length, unit: 'entries', color: 'text-amber-400', bg: 'bg-amber-500/8 border-amber-500/15' },
                                { icon: Target, label: 'Active Days', value: dateRange.filter(d => filteredData.workouts.some(w => w.date === d) || filteredData.steps.some(s => s.date === d && s.steps > 3000)).length, unit: `of ${dateRange.length}`, color: 'text-rose-400', bg: 'bg-rose-500/8 border-rose-500/15' },
                            ].map(({ icon: Icon, label, value, unit, color, bg }) => (
                                <div key={label} className={`rounded-xl p-3 border ${bg}`}>
                                    <Icon className={`w-3.5 h-3.5 ${color} mb-1.5`} />
                                    <div className={`text-base font-bold font-space ${color}`}>{value}</div>
                                    <div className="text-[9px] text-muted-foreground/60 leading-tight mt-0.5">{unit}</div>
                                    <div className="text-[9px] text-muted-foreground/40 mt-0.5 uppercase tracking-wide">{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Date range label ── */}
                    <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
                        <Award className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <div>
                            <div className="text-xs text-emerald-300 font-semibold">{dateLabel}</div>
                            <div className="text-[10px] text-emerald-400/50 mt-0.5">Report will include all charts, tables, and goal analysis</div>
                        </div>
                    </div>

                    {/* ── Hidden render target ── */}
                    <div style={{ position: 'fixed', left: '-9999px', top: 0, width: 960, pointerEvents: 'none', visibility: 'hidden', zIndex: 9999 }}>
                        <PrintableReport ref={reportRef} data={filteredData} profile={profile} dateLabel={dateLabel} />
                    </div>

                    {/* ── Generate button ── */}
                    <Button onClick={handlePrint} disabled={generating}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold h-12 rounded-xl shadow-lg shadow-emerald-500/20 text-sm gap-2">
                        {generating ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Rendering report…</>
                        ) : (
                            <><Download className="w-4 h-4" /> Generate PDF Report</>
                        )}
                    </Button>
                    <p className="text-[11px] text-center text-muted-foreground/50 -mt-2">
                        Opens print dialog → select "Save as PDF" to download
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
