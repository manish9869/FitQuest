import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Flame, Menu, Shield, LogOut, ChevronRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { entities } from '@/api/entities';
import FloatingCoach from '@/components/dashboard/FloatingCoach';
import MessageNotifier from '@/components/dashboard/MessageNotifier';
import { useQuery } from '@tanstack/react-query';
import { useFeatureFlags } from '@/lib/FeatureFlagContext';
import { PLAN_CONFIG } from '@/lib/featureFlags';

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const { user, logout } = useAuth();

    // ── Pull feature flags + user plan ───────────────────────────────────────
    const { features, userPlan, isFeatureAccessible } = useFeatureFlags();

    const { data: profiles = [] } = useQuery({
        queryKey: ['userProfile', user?.email],
        queryFn: () => entities.UserProfile.filter({ user_email: user?.email }),
        enabled: !!user?.email,
        staleTime: 60000,
    });

    const avatarUrl = profiles[0]?.avatar_url;

    // ── Build nav groups from enabled features ────────────────────────────────
    const navGroups = features
        .filter(f => f.is_enabled && f.path)   // only features with a path (nav items)
        .reduce((acc, f) => {
            const g = f.nav_group || 'Other';
            if (!acc[g]) acc[g] = [];
            acc[g].push(f);
            return acc;
        }, {});

    const groupOrder = ['Overview', 'Tracking', 'Growth', 'Tools'];

    // ── Don't show lock until we actually know the user's plan ───────────────
    // If profile is still loading, treat everything as accessible to avoid
    // flash of lock icons for paying users.
    const checkAccess = (featureId) => {
        if (featureId === 'dashboard') return true;
        return isFeatureAccessible(featureId);
    };

    const planCfg = PLAN_CONFIG[userPlan] || PLAN_CONFIG['free'];

    return (
        <div className="min-h-screen bg-background flex">

            {/* Mobile overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={`fixed lg:sticky top-0 left-0 h-screen w-60 border-r border-white/5 z-50
          transform transition-transform duration-300 flex flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
                style={{ background: 'hsl(220 20% 4%)' }}
            >
                {/* Logo */}
                <div className="p-5 border-b border-white/5">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <Flame className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <span className="font-space font-bold text-sm">FitElite</span>
                            {userPlan !== 'free' && (
                                <div className={`text-[10px] ${planCfg?.color} font-semibold capitalize`}>
                                    {userPlan} Plan
                                </div>
                            )}
                        </div>
                    </Link>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-3 overflow-y-auto">
                    {groupOrder.map(groupName => {
                        const items = navGroups[groupName];
                        if (!items?.length) return null;

                        return (
                            <div key={groupName}>
                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-1">
                                    {groupName}
                                </div>
                                {items.map(item => {
                                    const isActive = location.pathname === item.path;
                                    // ── KEY FIX: wait for profile load before showing lock ──
                                    const accessible = checkAccess(item.feature_id);
                                    const Icon = item.icon;

                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setSidebarOpen(false)}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium
                        transition-all duration-200 relative
                        ${isActive
                                                    ? 'bg-emerald-500/10 text-emerald-400'
                                                    : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}
                                        >
                                            {isActive && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-400 rounded-full" />
                                            )}
                                            <Icon className="w-4 h-4 flex-shrink-0" />
                                            <span className="flex-1">{item.label}</span>

                                            {/* Only show lock if we're sure user doesn't have access */}
                                            {!accessible && (
                                                <Lock className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />
                                            )}
                                            {item.is_beta && (
                                                <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-1 rounded font-bold">β</span>
                                            )}
                                            {isActive && accessible && (
                                                <ChevronRight className="w-3 h-3" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        );
                    })}
                </nav>

                {/* Bottom actions */}
                <div className="p-3 border-t border-white/5">
                    {user?.role === 'admin' && (
                        <Link
                            to="/admin"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium
                text-purple-400 hover:bg-purple-500/10 transition-all mb-1"
                        >
                            <Shield className="w-4 h-4" />
                            Admin Panel
                        </Link>
                    )}
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium
              text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 min-h-screen overflow-x-clip">
                <header className="sticky top-0 z-30 glass border-b border-white/5 px-4 lg:px-8 h-16 flex items-center justify-between">
                    <button
                        className="lg:hidden p-2 rounded-lg hover:bg-white/5"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="text-sm text-muted-foreground hidden sm:block">
                        Welcome back,{' '}
                        <span className="text-white font-medium">
                            {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Athlete'}
                        </span>{' '}
                        👋
                    </div>

                    <div className="flex items-center gap-3">
                        {userPlan !== 'free' && (
                            <div className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-semibold
                ${planCfg?.bg} ${planCfg?.color} ${planCfg?.border}`}>
                                {planCfg?.label}
                            </div>
                        )}
                        <Link to="/dashboard/settings">
                            <Button variant="ghost" size="icon" className="rounded-lg hover:bg-white/5">
                                <Settings className="w-5 h-5 text-muted-foreground" />
                            </Button>
                        </Link>
                        <Link
                            to="/dashboard/profile"
                            className="w-9 h-9 rounded-full bg-emerald-500/20 overflow-hidden flex items-center
                justify-center text-emerald-400 font-bold text-sm hover:ring-2
                hover:ring-emerald-500/50 transition-all"
                        >
                            {avatarUrl
                                ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                : (user?.user_metadata?.full_name || user?.email || 'A')[0].toUpperCase()}
                        </Link>
                    </div>
                </header>

                <div className="p-4 lg:p-8">
                    <Outlet />
                </div>
            </main>

            <FloatingCoach />
            <MessageNotifier />
        </div>
    );
}