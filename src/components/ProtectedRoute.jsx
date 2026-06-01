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

    console.log('[ProtectedRoute] render →', {
        path: location.pathname,
        isAuthenticated,
        isLoadingAuth,
        authChecked,
        userRole,
        isAdmin,
        email: user?.email
    });

    // Wait until auth + role are fully resolved
    if (!authChecked || isLoadingAuth || userRole === null) {
        console.log('[ProtectedRoute] → showing spinner (auth not ready)', {
            authChecked,
            isLoadingAuth,
            userRole
        });
        return <Spinner />;
    }

    // Not logged in → send to login
    if (!isAuthenticated) {
        console.log('[ProtectedRoute] → not authenticated, redirecting to /login');
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Admin on admin route → render
    if (isAdmin) {
        if (location.pathname.startsWith('/admin')) {
            console.log('[ProtectedRoute] → admin on admin route, rendering');
            return children;
        }
        console.log('[ProtectedRoute] → admin on non-admin route, redirecting to /admin');
        return <Navigate to="/admin" replace />;
    }

    // Regular user → check onboarding
    console.log('[ProtectedRoute] → regular user, delegating to UserRoute');
    return <UserRoute location={location}>{children}</UserRoute>;
}

function UserRoute({ children, location }) {
    const { user } = useAuth();

    const { data: profiles = [], isLoading: isLoadingProfile } = useQuery({
        queryKey: ['userProfile', user?.email],
        queryFn: () => entities.UserProfile.filter({ user_email: user?.email }),
        enabled: !!user?.email,
        staleTime: 60000,
    });

    console.log('[UserRoute] render →', {
        email: user?.email,
        isLoadingProfile,
        profileCount: profiles.length,
        onboardingComplete: profiles[0]?.onboarding_complete,
        path: location.pathname
    });

    if (isLoadingProfile) {
        console.log('[UserRoute] → loading profile, showing spinner');
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
        console.log('[UserRoute] → onboarding not complete, redirecting to /onboarding');
        return <Navigate to="/onboarding" replace />;
    }

    if (onboardingDone && isOnboardingRoute) {
        console.log('[UserRoute] → onboarding complete, redirecting to /dashboard');
        return <Navigate to="/dashboard" replace />;
    }

    console.log('[UserRoute] → rendering children');
    return children;
}