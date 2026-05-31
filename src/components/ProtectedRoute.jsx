import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { entities } from '@/api/entities';
import { Navigate, useLocation } from 'react-router-dom';

const Spinner = () => (
    <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
    </div>
);

export default function ProtectedRoute({ children }) {
    const { isAuthenticated, isLoadingAuth, authChecked, user, isAdmin, userRole } = useAuth();
    const location = useLocation();


    console.log('[ProtectedRoute]', {
        path: location.pathname,
        authChecked,
        isLoadingAuth,
        userRole,
        isAdmin,
        isAuthenticated,
    });

    const { data: profiles = [], isLoading: isLoadingProfile } = useQuery({
        queryKey: ['userProfile', user?.email],
        queryFn: () => entities.UserProfile.filter({ user_email: user?.email }),
        // Don't run for admins — they never need the onboarding check
        enabled: !!user?.email && isAuthenticated && !isAdmin,
        staleTime: 60000,
    });

    // Wait for auth + role to fully resolve before any routing decision
    if (!authChecked || isLoadingAuth || userRole === null) {
        return <Spinner />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // ── Admin ────────────────────────────────────────────────────────────────
    if (isAdmin) {
        // Already on an admin route — render normally
        if (location.pathname.startsWith('/admin')) {
            return children;
        }
        // Anywhere else (e.g. /dashboard, /onboarding) → send to admin panel
        return <Navigate to="/admin" replace />;
    }

    // ── Regular user ─────────────────────────────────────────────────────────
    if (isLoadingProfile) {
        return <Spinner />;
    }

    const profile = profiles[0];
    const onboardingDone = profile?.onboarding_complete;
    const isOnboardingRoute = location.pathname === '/onboarding';

    if (!onboardingDone && !isOnboardingRoute) {
        return <Navigate to="/onboarding" replace />;
    }

    if (onboardingDone && isOnboardingRoute) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}