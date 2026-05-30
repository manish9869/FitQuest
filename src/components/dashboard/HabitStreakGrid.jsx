import React, { useMemo } from 'react';
import { entities } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import GlassCard from '@/components/ui/GlassCard';
import { Flame, Droplets, Footprints, Moon, Dumbbell } from 'lucide-react';

const HABITS = [
    { key: 'nutrition', label: 'Nutrition', icon: Flame, color: '#22c55e' },
    { key: 'hydration', label: 'Hydration', icon: Droplets, color: '#3b82f6' },
    { key: 'steps', label: 'Steps', icon: Footprints, color: '#f97316' },
    { key: 'sleep', label: 'Sleep', icon: Moon, color: '#a855f7' },
    { key: 'workout', label: 'Workout', icon: Dumbbell, color: '#ec4899' },
];

export default function HabitStreakGrid() {
    const { user } = useAuth();

    const last21 = useMemo(() => Array.from({ length: 21 }, (_, i) => format(subDays(new Date(), 20 - i), 'yyyy-MM-dd')), []);
    const { data: meals = [] } = useQuery({ queryKey: ['meals-week', user?.email], queryFn: () => entities.MealLog.filter({ user_email: user?.email }), enabled: !!user?.email });
    const { data: waterLogs = [] } = useQuery({ queryKey: ['water-week', user?.email], queryFn: () => entities.WaterLog.filter({ user_email: user?.email }), enabled: !!user?.email });
    const { data: stepLogs = [] } = useQuery({ queryKey: ['steps-week', user?.email], queryFn: () => entities.StepLog.filter({ user_email: user?.email }), enabled: !!user?.email });
    const { data: sleepLogs = [] } = useQuery({ queryKey: ['sleep-week', user?.email], queryFn: () => entities.SleepLog.filter({ user_email: user?.email }), enabled: !!user?.email });
    const { data: workouts = [] } = useQuery({ queryKey: ['workouts-week', user?.email], queryFn: () => entities.WorkoutLog.filter({ user_email: user?.email }), enabled: !!user?.email });
    const { data: profiles = [] } = useQuery({ queryKey: ['userProfile', user?.email], queryFn: () => entities.UserProfile.filter({ user_email: user?.email }), enabled: !!user?.email });
    const profile = profiles[0];

    const habitData = useMemo(() => {
        return last21.map(date => {
            const dayMeals = meals.filter(m => m.date === date);
            const dayWater = waterLogs.filter(w => w.date === date);
            const daySteps = stepLogs.filter(s => s.date === date);
            const daySleep = sleepLogs.filter(s => s.date === date);
            const dayWorkout = workouts.filter(w => w.date === date);

            const calTarget = profile?.daily_calorie_target || 2000;
            const waterGoal = profile?.water_goal_ml || 2500;
            const stepGoal = profile?.step_goal || 10000;

            const totalCal = dayMeals.reduce((s, m) => s + (m.calories || 0), 0);
            const totalWater = dayWater.reduce((s, w) => s + (w.amount_ml || 0), 0);
            const totalSteps = daySteps.reduce((s, st) => s + (st.steps || 0), 0);
            const totalSleep = daySleep.reduce((s, sl) => s + (sl.hours || 0), 0);

            return {
                date,
                label: format(new Date(date), 'd'),
                dayLabel: format(new Date(date), 'EEE'),
                nutrition: totalCal >= calTarget * 0.8,
                hydration: totalWater >= waterGoal * 0.8,
                steps: totalSteps >= stepGoal * 0.8,
                sleep: totalSleep >= 6.5,
                workout: dayWorkout.length > 0,
            };
        });
    }, [last21, meals, waterLogs, stepLogs, sleepLogs, workouts, profile]);

    const getStreak = (key) => {
        let streak = 0;
        for (let i = habitData.length - 1; i >= 0; i--) {
            if (habitData[i][key]) streak++;
            else break;
        }
        return streak;
    };

    return (
        <GlassCard animate={false}>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                21-Day Habit Grid
            </h3>

            {/* Date headers */}
            <div className="mb-2">
                <div className="flex items-center gap-1 ml-24">
                    {habitData.map((d, i) => (
                        <div key={i} className="w-7 text-center">
                            <div className="text-[9px] text-muted-foreground">{d.dayLabel[0]}</div>
                            <div className="text-[10px] text-muted-foreground">{d.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Habit rows */}
            <div className="space-y-2">
                {HABITS.map(habit => {
                    const streak = getStreak(habit.key);
                    return (
                        <div key={habit.key} className="flex items-center gap-3">
                            <div className="flex items-center gap-2 w-24 flex-shrink-0">
                                <habit.icon className="w-4 h-4 flex-shrink-0" style={{ color: habit.color }} />
                                <span className="text-xs text-muted-foreground truncate">{habit.label}</span>
                            </div>
                            <div className="flex items-center gap-1 flex-1">
                                {habitData.map((d, i) => (
                                    <div key={i} title={d.date}
                                        className="w-7 h-7 rounded-lg transition-all flex-shrink-0"
                                        style={{
                                            backgroundColor: d[habit.key] ? `${habit.color}33` : 'rgba(255,255,255,0.04)',
                                            border: `1px solid ${d[habit.key] ? `${habit.color}66` : 'rgba(255,255,255,0.06)'}`,
                                        }}
                                    >
                                        {d[habit.key] && (
                                            <div className="w-full h-full rounded-lg flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: habit.color }} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="text-xs font-bold flex-shrink-0 w-14 text-right" style={{ color: streak > 0 ? habit.color : 'var(--muted-foreground)' }}>
                                {streak > 0 ? `${streak}🔥` : '—'}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-500/30 border border-emerald-500/50" /> Completed</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-white/5 border border-white/10" /> Missed</div>
            </div>
        </GlassCard>
    );
}


