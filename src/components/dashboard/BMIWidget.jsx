import React, { useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import GlassCard from '@/components/ui/GlassCard';
import { Activity } from 'lucide-react';

function getBMICategory(bmi) {
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-400', bg: 'bg-blue-500/10', pct: 20 };
    if (bmi < 25) return { label: 'Healthy', color: 'text-emerald-400', bg: 'bg-emerald-500/10', pct: 45 };
    if (bmi < 30) return { label: 'Overweight', color: 'text-yellow-400', bg: 'bg-yellow-500/10', pct: 70 };
    return { label: 'Obese', color: 'text-red-400', bg: 'bg-red-500/10', pct: 90 };
}

export default function BMIWidget() {
    const { user } = useAuth();
    const { data: profiles = [] } = useQuery({
        queryKey: ['userProfile', user?.email],
        queryFn: () => entities.UserProfile.filter({ user_email: user?.email }),
        enabled: !!user?.email,
    });
    const profile = profiles[0];

    const bmi = useMemo(() => {
        if (!profile?.weight_kg || !profile?.height_cm) return null;
        const h = profile.height_cm / 100;
        return Math.round((profile.weight_kg / (h * h)) * 10) / 10;
    }, [profile]);

    if (!bmi) return null;

    const cat = getBMICategory(bmi);
    const gaugeMin = 15, gaugeMax = 40;
    const bmiClamped = Math.max(gaugeMin, Math.min(bmi, gaugeMax));
    const pct = ((bmiClamped - gaugeMin) / (gaugeMax - gaugeMin)) * 100;

    return (
        <GlassCard animate={false}>
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                    <h3 className="font-semibold">BMI Index</h3>
                    <p className="text-xs text-muted-foreground">Body Mass Index</p>
                </div>
                <div className={`ml-auto px-3 py-1 rounded-full text-sm font-bold ${cat.bg} ${cat.color}`}>
                    {bmi}
                </div>
            </div>
            <div className="relative mb-2">
                <div className="h-3 rounded-full bg-gradient-to-r from-blue-500 via-emerald-500 via-yellow-500 to-red-500 opacity-30" />
                <div className="h-3 rounded-full absolute top-0 left-0 right-0 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 via-emerald-500 via-yellow-500 to-red-500" />
                </div>
                <div className="absolute -top-1 w-5 h-5 rounded-full border-2 border-white bg-background shadow-lg"
                    style={{ left: `calc(${pct}% - 10px)` }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-4 mb-2">
                <span>Underweight<br />&lt;18.5</span>
                <span className="text-center">Healthy<br />18.5–24.9</span>
                <span className="text-center">Overweight<br />25–29.9</span>
                <span className="text-right">Obese<br />&gt;30</span>
            </div>
            <div className={`mt-3 text-center py-2 rounded-xl ${cat.bg}`}>
                <span className={`text-sm font-semibold ${cat.color}`}>{cat.label} — BMI {bmi}</span>
                {profile?.target_weight_kg && (
                    <p className="text-xs text-muted-foreground mt-0.5">Target: {profile.target_weight_kg} kg</p>
                )}
            </div>
        </GlassCard>
    );
}


