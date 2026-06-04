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
    const { isAuthenticated, isLoadingAuth, authChecked, isLoadingRole, isAdmin, userRole } = useAuth();
    const location = useLocation();

    // 1. Wait for auth session to resolve
    if (!authChecked || isLoadingAuth) {
        return <Spinner />;
    }

    // 2. Not logged in → send to login, remembering where they wanted to go
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 3. Logged in but role not yet fetched from DB → hold here, don't redirect
    //    This is the key fix: prevents the brief flash-redirect to /dashboard
    if (isLoadingRole) {
        return <Spinner />;
    }

    // 4. Role is confirmed — now make routing decisions

    // Admin trying to reach an admin route → allow
    if (isAdmin && location.pathname.startsWith('/admin')) {
        return children;
    }

    // Admin on a non-admin route → send to admin
    if (isAdmin) {
        return <Navigate to="/admin" replace />;
    }

    // Non-admin trying to access /admin → block
    if (location.pathname.startsWith('/admin')) {
        return <Navigate to="/dashboard" replace />;
    }

    // Regular user → check onboarding
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