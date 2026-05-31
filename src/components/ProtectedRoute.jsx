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

    // ── 1. Wait until auth + role are fully resolved ─────────────────────────
    // userRole === null means we haven't fetched the role yet (mid-flight).
    // Don't make any routing decision until it's resolved.
    if (!authChecked || isLoadingAuth || userRole === null) {
        return <Spinner />;
    }

    // ── 2. Not logged in → send to login ─────────────────────────────────────
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // ── 3. Admin routing ─────────────────────────────────────────────────────
    if (isAdmin) {
        if (location.pathname.startsWith('/admin')) {
            // Already on an admin route — render normally
            return children;
        }
        // On any non-admin protected route (e.g. /dashboard, /onboarding) → admin panel
        return <Navigate to="/admin" replace />;
    }

    // ── 4. Regular user routing ───────────────────────────────────────────────
    // We need the profile to check onboarding status.
    // This inner component handles the profile fetch so we only run it for non-admins.
    return <UserRoute location={location}>{children}</UserRoute>;
}

// Separate component so the useQuery hook is only called for regular users
function UserRoute({ children, location }) {
    const { user } = useAuth();

    const { data: profiles = [], isLoading: isLoadingProfile } = useQuery({
        queryKey: ['userProfile', user?.email],
        queryFn: () => entities.UserProfile.filter({ user_email: user?.email }),
        enabled: !!user?.email,
        staleTime: 60000,
    });

    if (isLoadingProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            </div>
        );
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