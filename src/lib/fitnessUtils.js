import { format } from 'date-fns';

export const today = () => format(new Date(), 'yyyy-MM-dd');

export function calculateBMR(weight, height, age, gender = 'male') {
    if (gender === 'male') return 10 * weight + 6.25 * height - 5 * age + 5;
    return 10 * weight + 6.25 * height - 5 * age - 161;
}

export function calculateTDEE(bmr, activityLevel) {
    const multipliers = {
        sedentary: 1.2,
        lightly_active: 1.375,
        moderately_active: 1.55,
        very_active: 1.725,
        extremely_active: 1.9,
    };
    return Math.round(bmr * (multipliers[activityLevel] || 1.55));
}

export function calculateCalorieTarget(tdee, goal) {
    const adjustments = {
        fat_loss: -500,
        muscle_gain: 300,
        strength: 200,
        general_fitness: 0,
        athletic_performance: 400,
    };
    return Math.round(tdee + (adjustments[goal] || 0));
}

export function calculateMacros(calories, goal) {
    const ratios = {
        fat_loss: { protein: 0.35, carbs: 0.35, fat: 0.30 },
        muscle_gain: { protein: 0.30, carbs: 0.45, fat: 0.25 },
        strength: { protein: 0.30, carbs: 0.40, fat: 0.30 },
        general_fitness: { protein: 0.25, carbs: 0.45, fat: 0.30 },
        athletic_performance: { protein: 0.25, carbs: 0.50, fat: 0.25 },
    };
    const r = ratios[goal] || ratios.general_fitness;
    return {
        protein: Math.round((calories * r.protein) / 4),
        carbs: Math.round((calories * r.carbs) / 4),
        fat: Math.round((calories * r.fat) / 9),
    };
}

export function calculateFitnessScore({ caloriesPct, proteinPct, waterPct, stepsPct, workoutDone, sleepHours }) {
    const cal = Math.min(caloriesPct || 0, 100) * 0.25;
    const pro = Math.min(proteinPct || 0, 100) * 0.20;
    const wat = Math.min(waterPct || 0, 100) * 0.15;
    const stp = Math.min(stepsPct || 0, 100) * 0.15;
    const wrk = (workoutDone ? 100 : 0) * 0.15;
    const slp = Math.min(((sleepHours || 0) / 8) * 100, 100) * 0.10;
    return Math.round(cal + pro + wat + stp + wrk + slp);
}

export function getScoreEmoji(score) {
    if (score >= 80) return { emoji: '🔥', label: 'Excellent', color: 'text-emerald-400' };
    if (score >= 60) return { emoji: '💪', label: 'Good', color: 'text-blue-400' };
    if (score >= 40) return { emoji: '⚡', label: 'Fair', color: 'text-yellow-400' };
    return { emoji: '🎯', label: 'Needs Work', color: 'text-red-400' };
}

export function getSmartInsights({ calories, calorieTarget, protein, proteinTarget, water, waterGoal, steps, stepGoal }) {
    const insights = [];
    if (calories > calorieTarget * 1.1) {
        insights.push({ type: 'warning', message: "You exceeded your calorie target today. Consider a lighter dinner or an extra walk." });
    }
    if (protein < proteinTarget * 0.7) {
        insights.push({ type: 'warning', message: "Your protein intake is low. Add eggs, chicken, Greek yogurt, or whey protein." });
    }
    if (water < waterGoal * 0.5) {
        insights.push({ type: 'info', message: "Increase water intake for better recovery and energy." });
    }
    if (steps < stepGoal * 0.5) {
        insights.push({ type: 'info', message: "You're below your step goal. Try a 20–30 minute walk." });
    }
    if (calories >= calorieTarget * 0.9 && calories <= calorieTarget * 1.1) {
        insights.push({ type: 'success', message: "Great job staying within your calorie target today! 🎉" });
    }
    if (protein >= proteinTarget * 0.9) {
        insights.push({ type: 'success', message: "Excellent protein intake! Your muscles will thank you. 💪" });
    }
    return insights;
}

export const goalLabels = {
    fat_loss: 'Fat Loss',
    muscle_gain: 'Muscle Gain',
    strength: 'Strength',
    general_fitness: 'General Fitness',
    athletic_performance: 'Athletic Performance',
};

export const activityLabels = {
    sedentary: 'Sedentary',
    lightly_active: 'Lightly Active',
    moderately_active: 'Moderately Active',
    very_active: 'Very Active',
    extremely_active: 'Extremely Active',
};


