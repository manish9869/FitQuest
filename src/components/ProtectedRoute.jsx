import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { entities } from '@/api/entities';
import { useNavigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
    const { isAuthenticated, isLoadingAuth, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const { data: profiles = [], isLoading: isLoadingProfile } = useQuery({
        queryKey: ['userProfile', user?.email],
        queryFn: () => entities.UserProfile.filter({ user_email: user?.email }),
        enabled: !!user?.email && isAuthenticated,
        staleTime: 60000,
    });

    if (isLoadingAuth || isLoadingProfile) return null;

    if (!isAuthenticated) {
        navigate('/login', { replace: true });
        return null;
    }

    const profile = profiles[0];
    const onboardingDone = profile?.onboarding_complete;
    const isOnboardingRoute = location.pathname === '/onboarding';

    // No profile or onboarding not complete → send to onboarding
    if (!onboardingDone && !isOnboardingRoute) {
        navigate('/onboarding', { replace: true });
        return null;
    }

    // Onboarding done but trying to visit /onboarding again → send to dashboard
    if (onboardingDone && isOnboardingRoute) {
        navigate('/dashboard', { replace: true });
        return null;
    }

    return children;
}