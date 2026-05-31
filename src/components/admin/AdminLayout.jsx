import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Users, BarChart3, FileText, Shield, Flame, Menu,
    Brain, Target, TrendingUp, MessageSquare, Trophy, Activity, Zap,
    X, Sparkles, Layers, ChefHat, Dumbbell, Apple, BookOpen, Star, LogOut
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import AdminMessageNotifier from '@/components/admin/AdminMessageNotifier';

const navGroups = [
    {
        label: 'Command Center',
        items: [
            { path: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
            { path: '/admin/ai-insights', label: 'AI Insights', icon: Brain, badge: 'NEW', badgeColor: 'bg-purple-500' },
            { path: '/admin/risk', label: 'Risk Monitor', icon: Target },
            { path: '/admin/live-feed', label: 'Live Activity', icon: Activity, dot: true },
        ]
    },
    {
        label: 'Client Management',
        items: [
            { path: '/admin/users', label: 'Users', icon: Users },
            { path: '/admin/messages', label: 'Messages', icon: MessageSquare },
            { path: '/admin/tasks', label: 'Tasks', icon: Zap },
        ]
    },
    {
        label: 'Analytics',
        items: [
            { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
            { path: '/admin/revenue', label: 'Revenue', icon: TrendingUp },
            { path: '/admin/challenges', label: 'Challenges', icon: Trophy },
        ]
    },
    {
        label: 'Content CMS',
        items: [
            { path: '/admin/cms/recipes', label: 'Recipes', icon: ChefHat },
            { path: '/admin/cms/exercises', label: 'Exercise Library', icon: Dumbbell },
            { path: '/admin/cms/workouts', label: 'Workout Plans', icon: Zap },
            { path: '/admin/cms/food', label: 'Food Database', icon: Apple },
            { path: '/admin/cms/programs', label: 'Programs', icon: Target },
            { path: '/admin/cms/blog', label: 'Blog & Content', icon: BookOpen },
            { path: '/admin/cms/testimonials', label: 'Testimonials', icon: Star },
            { path: '/admin/gamification', label: 'Gamification', icon: Trophy, badge: 'NEW', badgeColor: 'bg-yellow-500' },
        ]
    },
    {
        label: 'Management',
        items: [
            { path: '/admin/plans', label: 'Plans', icon: FileText },
            { path: '/admin/automations', label: 'Automations', icon: Sparkles },
            { path: '/admin/features', label: 'Feature Flags', icon: Layers },
            { path: '/admin/access-control', label: 'User Access', icon: Shield, badge: 'NEW', badgeColor: 'bg-purple-500' },
        ]
    }
];

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [confirmLogout, setConfirmLogout] = useState(false);
    const location = useLocation();
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-background flex">
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)} />
                )}
            </AnimatePresence>

            <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 z-50 flex flex-col transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
                style={{ background: 'hsl(220 20% 3%)', borderRight: '1px solid rgba(139,92,246,0.15)' }}>

                {/* Logo */}
                <div className="p-5 border-b border-purple-500/10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <div className="font-space font-bold text-sm">FitElite Admin</div>
                            <div className="text-[10px] text-purple-400">Intelligence Center</div>
                        </div>
                        <button className="lg:hidden ml-auto text-muted-foreground" onClick={() => setSidebarOpen(false)}>
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
                    {navGroups.map(group => (
                        <div key={group.label}>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-1">
                                {group.label}
                            </div>
                            {group.items.map(item => {
                                const active = item.exact
                                    ? location.pathname === item.path
                                    : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                                return (
                                    <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${active ? 'bg-purple-500/15 text-purple-300' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}>
                                        {active && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-purple-400 rounded-full" />
                                        )}
                                        <item.icon className="w-4 h-4 flex-shrink-0" />
                                        <span className="flex-1">{item.label}</span>
                                        {item.badge && (
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold text-white ${item.badgeColor}`}>
                                                {item.badge}
                                            </span>
                                        )}
                                        {item.dot && (
                                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-white/5">
                    {/* User info */}
                    <div className="px-3 py-2.5 mb-1 rounded-xl bg-white/2">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xs flex-shrink-0">
                                {(user?.full_name || user?.email || 'A')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <div className="text-xs font-medium text-purple-300 truncate">
                                    {user?.full_name || user?.email?.split('@')[0]}
                                </div>
                                <div className="text-[10px] text-muted-foreground">Super Admin</div>
                            </div>
                        </div>
                    </div>

                    {/* Logout */}
                    <AnimatePresence mode="wait">
                        {!confirmLogout ? (
                            <motion.button
                                key="logout-btn"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setConfirmLogout(true)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/5 transition-all"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Sign Out</span>
                            </motion.button>
                        ) : (
                            <motion.div
                                key="logout-confirm"
                                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                                className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 space-y-2"
                            >
                                <p className="text-xs text-red-400 font-medium text-center">Sign out of admin?</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setConfirmLogout(false)}
                                        className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-muted-foreground transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={logout}
                                        className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </aside>

            <main className="flex-1 min-h-screen overflow-x-clip">
                <AdminMessageNotifier />

                <header className="sticky top-0 z-30 px-4 lg:px-8 h-16 flex items-center justify-between"
                    style={{ background: 'hsl(220 20% 3%/0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
                    <div className="flex items-center gap-3">
                        <button className="lg:hidden p-2 rounded-lg hover:bg-white/5" onClick={() => setSidebarOpen(true)}>
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                            <span className="text-sm text-purple-300 font-medium hidden sm:block">
                                Coaching Intelligence System
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="glass px-3 py-1.5 rounded-lg flex items-center gap-2 border border-purple-500/20">
                            <Flame className="w-3.5 h-3.5 text-orange-400" />
                            <span className="text-xs text-muted-foreground">Live</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xs">
                            {(user?.full_name || user?.email || 'A')[0].toUpperCase()}
                        </div>
                    </div>
                </header>

                <div className="p-4 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}