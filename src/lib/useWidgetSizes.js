/**
 * useWidgetSizes — hook to persist per-widget sizes in UserProfile
 *
 * Reads from profile.widget_sizes (a JSON object keyed by widgetId)
 * and provides a callback to update individual widget sizes.
 *
 * Usage:
 *   const { getSavedSize, handleSizeChange } = useWidgetSizes(profile, updateProfile);
 */
import { useCallback } from 'react';

export function useWidgetSizes(profile, updateProfile) {
    const sizes = profile?.widget_sizes || {};

    const getSavedSize = useCallback((widgetId) => {
        return sizes[widgetId] || {};
    }, [sizes]);

    const handleSizeChange = useCallback((widgetId, newSize) => {
        if (!profile?.id) return;
        const updated = { ...sizes, [widgetId]: { ...sizes[widgetId], ...newSize } };
        updateProfile({ widget_sizes: updated });
    }, [profile?.id, sizes, updateProfile]);

    return { getSavedSize, handleSizeChange };
}


