import React from 'react';
import { useFeatureFlags } from '@/lib/FeatureFlagContext';
import { ALL_FEATURES } from '@/lib/featureFlags';
import LockedFeature from './LockedFeature';

// Wrap any dashboard page with this to enforce feature flag access
export default function FeatureGate({ featureId, children }) {
    const { isFeatureEnabled, isFeatureAccessible, userPlan, features } = useFeatureFlags();

    const feature = features.find(f => f.feature_id === featureId)
        || ALL_FEATURES.find(f => f.feature_id === featureId);

    if (!feature) return children;

    // Feature is globally disabled by admin
    if (!isFeatureEnabled(featureId)) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center text-center p-8">
                <div>
                    <div className="text-4xl mb-4">🔒</div>
                    <h2 className="text-lg font-bold mb-2">Feature Unavailable</h2>
                    <p className="text-sm text-muted-foreground">This feature has been temporarily disabled by your coach.</p>
                </div>
            </div>
        );
    }

    // Feature enabled but user's plan is too low
    if (!isFeatureAccessible(featureId)) {
        return <LockedFeature feature={feature} userPlan={userPlan} />;
    }

    return children;
}


