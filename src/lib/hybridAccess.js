/**
 * Hybrid Access Control Engine
 * Decision priority:
 * 1. restrict override → always DENY
 * 2. grant/trial override (not expired) → always ALLOW
 * 3. Global feature disabled → DENY
 * 4. Plan check → ALLOW if plan meets requirement
 */

import { PLAN_ORDER } from './featureFlags';

export function computeAccess({ featureId, userPlan, userOverrides, features }) {
    const feature = features.find(f => f.feature_id === featureId);
    if (!feature) return { allowed: true, reason: 'unknown_feature' };

    // Check user-specific overrides
    const override = userOverrides?.find(o =>
        o.feature_id === featureId && o.is_active
    );

    if (override) {
        if (override.override_type === 'restrict') {
            return { allowed: false, reason: 'admin_restricted', override };
        }
        if (override.override_type === 'grant') {
            return { allowed: true, reason: 'admin_granted', override };
        }
        if (override.override_type === 'trial') {
            const expired = override.expires_at && new Date(override.expires_at) < new Date();
            if (!expired) return { allowed: true, reason: 'trial_access', override };
        }
    }

    // Global kill switch
    if (!feature.is_enabled) {
        return { allowed: false, reason: 'feature_disabled' };
    }

    // Plan-based access
    const hasAccess = PLAN_ORDER.indexOf(userPlan) >= PLAN_ORDER.indexOf(feature.required_plan);
    return {
        allowed: hasAccess,
        reason: hasAccess ? 'plan_access' : 'plan_upgrade_required',
        required_plan: feature.required_plan,
    };
}

export function getActiveOverrides(overrides) {
    const now = new Date();
    return overrides.filter(o => {
        if (!o.is_active) return false;
        if (o.override_type === 'trial' && o.expires_at && new Date(o.expires_at) < now) return false;
        return true;
    });
}


