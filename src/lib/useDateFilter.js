// lib/useDateFilter.js
// Fixed version — correctly computes startDate/endDate for all presets
// and exposes helpers that each tracker page needs.

import { useState, useMemo, useCallback } from 'react';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, parseISO } from 'date-fns';

const todayStr = () => format(new Date(), 'yyyy-MM-dd');

function rangeForPreset(preset) {
    const today = new Date();
    const td = format(today, 'yyyy-MM-dd');

    switch (preset) {
        case 'today':
            return { startDate: td, endDate: td };
        case 'yesterday': {
            const y = format(subDays(today, 1), 'yyyy-MM-dd');
            return { startDate: y, endDate: y };
        }
        case '7d':
            return { startDate: format(subDays(today, 6), 'yyyy-MM-dd'), endDate: td };
        case '14d':
            return { startDate: format(subDays(today, 13), 'yyyy-MM-dd'), endDate: td };
        case '30d':
            return { startDate: format(subDays(today, 29), 'yyyy-MM-dd'), endDate: td };
        case '90d':
            return { startDate: format(subDays(today, 89), 'yyyy-MM-dd'), endDate: td };
        case 'month':
            return {
                startDate: format(startOfMonth(today), 'yyyy-MM-dd'),
                endDate: format(endOfMonth(today), 'yyyy-MM-dd'),
            };
        case 'year':
            return {
                startDate: format(startOfYear(today), 'yyyy-MM-dd'),
                endDate: format(endOfYear(today), 'yyyy-MM-dd'),
            };
        default:
            return { startDate: format(subDays(today, 6), 'yyyy-MM-dd'), endDate: td };
    }
}

/**
 * @param {number} defaultDays  – initial preset (7 → '7d')
 */
export function useDateFilter(defaultDays = 7) {
    const defaultPreset = defaultDays === 0 ? 'today'
        : defaultDays === 1 ? 'yesterday'
            : defaultDays === 14 ? '14d'
                : defaultDays === 30 ? '30d'
                    : defaultDays === 90 ? '90d'
                        : '7d';

    const [preset, setPreset] = useState(defaultPreset);
    const [isCustom, setIsCustom] = useState(false);
    const [customStart, setCustomStart] = useState(null);
    const [customEnd, setCustomEnd] = useState(null);

    const { startDate, endDate } = useMemo(() => {
        if (isCustom && customStart && customEnd) {
            return { startDate: customStart, endDate: customEnd };
        }
        return rangeForPreset(preset);
    }, [preset, isCustom, customStart, customEnd]);

    // All dates in the selected range as 'yyyy-MM-dd' strings
    const dateRange = useMemo(() => {
        try {
            return eachDayOfInterval({
                start: parseISO(startDate),
                end: parseISO(endDate),
            }).map(d => format(d, 'yyyy-MM-dd'));
        } catch {
            return [todayStr()];
        }
    }, [startDate, endDate]);

    const selectPreset = useCallback((p) => {
        setPreset(p);
        setIsCustom(false);
        setCustomStart(null);
        setCustomEnd(null);
    }, []);

    const selectCustom = useCallback((s, e) => {
        setCustomStart(s);
        setCustomEnd(e);
        setIsCustom(true);
    }, []);

    return {
        preset,
        startDate,
        endDate,
        isCustom,
        dateRange,          // ['2025-05-01', '2025-05-02', …]
        todayStr: todayStr(), // convenience: today as yyyy-MM-dd
        selectPreset,
        selectCustom,
    };
}