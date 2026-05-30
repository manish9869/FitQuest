import React, { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { entities } from '@/api/entities';
import { mergeFlags } from './featureFlags';
import { computeAccess, getActiveOverrides } from './hybridAccess';
import { useAuth } from './AuthContext';

const FlagCtx = createContext({
    features: [],
    isLoading: true,
    isFeatureAccessible: () => true,
    isFeatureEnabled: () => true,
    userPlan: 'free',
    userOverrides: [],
});

export function FeatureFlagProvider({ children }) {
    const { user } = useAuth();

    const { data: dbFlags = [], isLoading: flagsLoading } = useQuery({
        queryKey: ['feature-flags'],
        queryFn: () => entities.FeatureFlag.list(),
        staleTime: 30_000,
    });

    const { data: profiles = [], isLoading: profileLoading } = useQuery({
        queryKey: ['userProfile', user?.email],
        queryFn: () => entities.UserProfile.filter({ user_email: user?.email }),
        enabled: !!user?.email,
        staleTime: 60_000,
    });

    const { data: rawOverrides = [] } = useQuery({
        queryKey: ['my-overrides', user?.email],
        queryFn: () => entities.UserFeatureOverride.filter({ user_email: user?.email, is_active: true }),
        enabled: !!user?.email && user?.role !== 'admin',
        staleTime: 60_000,
    });

    const features = useMemo(() => mergeFlags(dbFlags), [dbFlags]);

    // ── isLoading: true until both flags AND profile are resolved ─────────────
    // This prevents the nav from showing lock icons during the loading flash
    const isLoading = flagsLoading || profileLoading;

    const userPlan = user?.role === 'admin'
        ? 'elite'
        : (profiles[0]?.plan || 'free');

    const userOverrides = user?.role === 'admin'
        ? []
        : getActiveOverrides(rawOverrides);

    const isFeatureEnabled = (id) =>
        features.find((f) => f.feature_id === id)?.is_enabled ?? true;

    const isFeatureAccessible = (id) => {
        // Always allow free features — never lock them regardless of load state
        const feature = features.find((f) => f.feature_id === id);
        if (feature?.required_plan === 'free') return true;
        if (user?.role === 'admin') return true;
        // While loading, return true to avoid false lock icons
        if (isLoading) return true;
        return computeAccess({ featureId: id, userPlan, userOverrides, features }).allowed;
    };

    const getAccessDetails = (id) => {
        if (user?.role === 'admin') return { allowed: true, reason: 'admin' };
        return computeAccess({ featureId: id, userPlan, userOverrides, features });
    };

    return (
        <FlagCtx.Provider value={{
            features,
            isLoading,
            isFeatureEnabled,
            isFeatureAccessible,
            getAccessDetails,
            userPlan,
            userOverrides,
        }}>
            {children}
        </FlagCtx.Provider>
    );
}

export const useFeatureFlags = () => useContext(FlagCtx);