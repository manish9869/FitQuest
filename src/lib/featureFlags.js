// Master registry of all dashboard features
// Source of truth for routes, icons, plans, and nav groups
// No Base44 deps — pure config ✅
import {
    LayoutDashboard, Utensils, Droplets, Footprints, Dumbbell, Moon,
    Brain, Trophy, BarChart3, Shield, ChefHat, Zap, Heart, Target,
    Camera, TrendingUp, Map, Settings, Pill, ShoppingCart, Scale,
    MessageSquare, User
} from 'lucide-react';

export const PLAN_ORDER = ['free', 'basic', 'premium', 'elite'];

export const PLAN_CONFIG = {
    free: { label: 'Free', color: 'text-muted-foreground', bg: 'bg-white/5', border: 'border-white/10', dotColor: 'bg-gray-500' },
    basic: { label: 'Basic', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', dotColor: 'bg-blue-500' },
    premium: { label: 'Premium', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', dotColor: 'bg-purple-500' },
    elite: { label: 'Elite', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', dotColor: 'bg-yellow-500' },
};

export const ALL_FEATURES = [
    // ── Overview ───────────────────────────────────────────────────────────────
    { feature_id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', nav_group: 'Overview', sort_order: 0, required_plan: 'free', is_enabled: true, is_beta: false },
    { feature_id: 'readiness', label: 'Readiness Score', icon: Heart, path: '/dashboard/readiness', nav_group: 'Overview', sort_order: 1, required_plan: 'basic', is_enabled: true, is_beta: false },
    { feature_id: 'missions', label: 'Daily Missions', icon: Target, path: '/dashboard/missions', nav_group: 'Overview', sort_order: 2, required_plan: 'free', is_enabled: true, is_beta: false },
    { feature_id: 'weekly_report', label: 'Weekly Report', icon: TrendingUp, path: '/dashboard/weekly-report', nav_group: 'Overview', sort_order: 3, required_plan: 'premium', is_enabled: true, is_beta: false },

    // ── Tracking ───────────────────────────────────────────────────────────────
    { feature_id: 'meals', label: 'Meal Tracker', icon: Utensils, path: '/dashboard/meals', nav_group: 'Tracking', sort_order: 10, required_plan: 'free', is_enabled: true, is_beta: false },
    { feature_id: 'food_camera', label: 'AI Food Scan', icon: Camera, path: '/dashboard/food-camera', nav_group: 'Tracking', sort_order: 11, required_plan: 'premium', is_enabled: true, is_beta: false },
    { feature_id: 'water', label: 'Water Tracker', icon: Droplets, path: '/dashboard/water', nav_group: 'Tracking', sort_order: 12, required_plan: 'free', is_enabled: true, is_beta: false },
    { feature_id: 'steps', label: 'Step Tracker', icon: Footprints, path: '/dashboard/steps', nav_group: 'Tracking', sort_order: 13, required_plan: 'free', is_enabled: true, is_beta: false },
    { feature_id: 'workouts', label: 'Workout Tracker', icon: Dumbbell, path: '/dashboard/workouts', nav_group: 'Tracking', sort_order: 14, required_plan: 'free', is_enabled: true, is_beta: false },
    { feature_id: 'sleep', label: 'Sleep Tracker', icon: Moon, path: '/dashboard/sleep', nav_group: 'Tracking', sort_order: 15, required_plan: 'basic', is_enabled: true, is_beta: false },
    { feature_id: 'weight', label: 'Weight Tracker', icon: Scale, path: '/dashboard/weight', nav_group: 'Tracking', sort_order: 16, required_plan: 'free', is_enabled: true, is_beta: false },
    { feature_id: 'body_progress', label: 'Body Progress', icon: Camera, path: '/dashboard/body-progress', nav_group: 'Tracking', sort_order: 17, required_plan: 'free', is_enabled: true, is_beta: false },

    // ── Growth ─────────────────────────────────────────────────────────────────
    { feature_id: 'journey', label: 'My Journey', icon: Map, path: '/dashboard/journey', nav_group: 'Growth', sort_order: 20, required_plan: 'basic', is_enabled: true, is_beta: false },
    { feature_id: 'achievements', label: 'Achievements', icon: Trophy, path: '/dashboard/achievements', nav_group: 'Growth', sort_order: 21, required_plan: 'free', is_enabled: true, is_beta: false },
    { feature_id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/dashboard/analytics', nav_group: 'Growth', sort_order: 22, required_plan: 'premium', is_enabled: true, is_beta: false },
    { feature_id: 'coach_plan', label: 'Coach Plan', icon: Shield, path: '/dashboard/coach-plan', nav_group: 'Growth', sort_order: 23, required_plan: 'elite', is_enabled: true, is_beta: false },

    // ── Tools ──────────────────────────────────────────────────────────────────
    { feature_id: 'smart_fit', label: 'SmartFit AI', icon: Zap, path: '/dashboard/smart-fit', nav_group: 'Tools', sort_order: 30, required_plan: 'premium', is_enabled: true, is_beta: false },
    { feature_id: 'ai_tools', label: 'AI Tools', icon: Brain, path: '/dashboard/ai-tools', nav_group: 'Tools', sort_order: 31, required_plan: 'basic', is_enabled: true, is_beta: false },
    { feature_id: 'recipes', label: 'Recipes', icon: ChefHat, path: '/dashboard/recipes', nav_group: 'Tools', sort_order: 32, required_plan: 'free', is_enabled: true, is_beta: false },
    { feature_id: 'supplements', label: 'Supplements', icon: Pill, path: '/dashboard/supplements', nav_group: 'Tools', sort_order: 34, required_plan: 'basic', is_enabled: true, is_beta: false },
    { feature_id: 'grocery', label: 'Smart Grocery', icon: ShoppingCart, path: '/dashboard/grocery', nav_group: 'Tools', sort_order: 35, required_plan: 'basic', is_enabled: true, is_beta: false },
    { feature_id: 'settings', label: 'Settings', icon: Settings, path: '/dashboard/settings', nav_group: 'Tools', sort_order: 36, required_plan: 'free', is_enabled: true, is_beta: false },
    { feature_id: 'messages', label: 'Coach Messages', icon: MessageSquare, path: '/dashboard/messages', nav_group: 'Tools', sort_order: 37, required_plan: 'free', is_enabled: true, is_beta: false },
    { feature_id: 'profile', label: 'My Profile', icon: User, path: '/dashboard/profile', nav_group: 'Tools', sort_order: 38, required_plan: 'free', is_enabled: true, is_beta: false },
];

/**
 * Merge persisted DB flags over the local defaults.
 * DB values win for: is_enabled, required_plan, is_beta, sort_order.
 * icon, path, label, nav_group always come from ALL_FEATURES (not stored in DB).
 */
export function mergeFlags(dbFlags) {
    return ALL_FEATURES.map(f => {
        const persisted = dbFlags.find(d => d.feature_id === f.feature_id);
        if (!persisted) return f;
        return {
            ...f,
            is_enabled: persisted.is_enabled ?? f.is_enabled,
            required_plan: persisted.required_plan ?? f.required_plan,
            is_beta: persisted.is_beta ?? f.is_beta,
            sort_order: persisted.sort_order ?? f.sort_order,
        };
    }).sort((a, b) => a.sort_order - b.sort_order);
}

/** Check if a user's plan meets the feature requirement */
export function canAccess(userPlan, requiredPlan) {
    return PLAN_ORDER.indexOf(userPlan) >= PLAN_ORDER.indexOf(requiredPlan);
}