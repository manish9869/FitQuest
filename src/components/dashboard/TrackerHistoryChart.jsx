import React, { useState, useMemo } from 'react';
import { format, subDays, parseISO, eachDayOfInterval } from 'date-fns';
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import GlassCard from '@/components/ui/GlassCard';

const RANGES = [
    { label: '7D', days: 7 },
    { label: '14D', days: 14 },
    { label: '1M', days: 30 },
    { label: '3M', days: 90 },
];

const CustomTooltip = ({ active, payload, label, unit, color }) => {
    if (!active || !payload?.[0]) return null;
    return (
        <div className="glass rounded-xl p-3 text-xs border border-white/10 shadow-xl">
            <p className="text-muted-foreground mb-1">{label}</p>
            <p className="font-bold" style={{ color }}>{payload[0].value?.toLocaleString()} {unit}</p>
        </div>
    );
};

/**
 * Generic history chart for tracker pages.
 *
 * Props:
 *  - logs: array of objects, each must have a `date` (yyyy-MM-dd) and one numeric field
 *  - dataKey: string — the numeric field to aggregate per day
 *  - label: string — chart title
 *  - color: string — hex color
 *  - unit: string — display unit in tooltip
 *  - goal: number (optional) — draws a reference line
 *  - type: 'area' | 'bar' | 'line' (default 'area')
 *  - aggregator: 'sum' | 'avg' (default 'sum')
 *  - goalLabel: string (optional)
 */
export default function TrackerHistoryChart({
    logs = [],
    dataKey,
    label,
    color = '#22c55e',
    unit = '',
    goal,
    goalLabel,
    type = 'area',
    aggregator = 'sum',
}) {
    const [range, setRange] = useState(14);

    const chartData = useMemo(() => {
        const cutoff = format(subDays(new Date(), range), 'yyyy-MM-dd');
        const days = eachDayOfInterval({ start: subDays(new Date(), range), end: new Date() });

        return days.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dayLogs = logs.filter(l => l.date === dayStr);
            let value = 0;
            if (dayLogs.length > 0) {
                const sum = dayLogs.reduce((s, l) => s + (Number(l[dataKey]) || 0), 0);
                value = aggregator === 'avg' ? Math.round((sum / dayLogs.length) * 10) / 10 : sum;
            }
            return {
                date: format(day, range <= 14 ? 'MMM d' : 'MMM d'),
                value,
                hasData: dayLogs.length > 0,
            };
        });
    }, [logs, dataKey, range, aggregator]);

    const nonZero = chartData.filter(d => d.value > 0);
    const avg = nonZero.length ? Math.round((nonZero.reduce((s, d) => s + d.value, 0) / nonZero.length) * 10) / 10 : 0;
    const max = nonZero.length ? Math.max(...nonZero.map(d => d.value)) : 0;

    const gradientId = `grad_${dataKey}`;

    const ChartComponent = type === 'bar' ? BarChart : type === 'line' ? LineChart : AreaChart;

    return (
        <GlassCard animate={false}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                    <h3 className="font-semibold text-sm">{label}</h3>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                        <span>Avg: <span className="text-white font-medium">{avg.toLocaleString()} {unit}</span></span>
                        <span>Max: <span className="text-white font-medium">{max.toLocaleString()} {unit}</span></span>
                        {goal && <span>Goal: <span style={{ color }} className="font-medium">{goal.toLocaleString()} {unit}</span></span>}
                    </div>
                </div>
                <div className="flex gap-1">
                    {RANGES.map(r => (
                        <button key={r.label} onClick={() => setRange(r.days)}
                            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${range === r.days ? 'text-white border border-white/20' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}
                            style={range === r.days ? { backgroundColor: color + '22', borderColor: color + '55', color } : {}}>
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            {nonZero.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                    No data in this period yet
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={180}>
                    <ChartComponent data={chartData}>
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="100%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="date" stroke="transparent" fontSize={10} tick={{ fill: 'rgba(255,255,255,0.35)' }} interval="preserveStartEnd" />
                        <YAxis stroke="transparent" fontSize={10} tick={{ fill: 'rgba(255,255,255,0.35)' }} domain={['auto', 'auto']} width={36} />
                        <Tooltip content={<CustomTooltip unit={unit} color={color} />} />
                        {goal && (
                            <ReferenceLine y={goal} stroke={color} strokeDasharray="5 4" strokeWidth={1.5}
                                label={{ value: goalLabel || `Goal`, fill: color, fontSize: 9, position: 'insideTopRight' }} />
                        )}
                        {type === 'bar' && <Bar dataKey="value" fill={color} opacity={0.8} radius={[3, 3, 0, 0]} />}
                        {type === 'line' && <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ fill: color, r: 2 }} activeDot={{ r: 4 }} connectNulls={false} />}
                        {type === 'area' && <Area type="monotone" dataKey="value" stroke={color} fill={`url(#${gradientId})`} strokeWidth={2} dot={{ fill: color, r: 2 }} activeDot={{ r: 4 }} connectNulls={false} />}
                    </ChartComponent>
                </ResponsiveContainer>
            )}
        </GlassCard>
    );
}