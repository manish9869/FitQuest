import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { entities } from '@/api/entities';
import { updateLoginStreak } from '@/lib/xpEngine';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [authError, setAuthError] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(session.user);
                setIsAuthenticated(true);
            }
            setIsLoadingAuth(false);
            setAuthChecked(true);
        });

        // Listen for auth changes — must be synchronous, no async here
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setUser(session?.user ?? null);
                setIsAuthenticated(!!session?.user);
                setIsLoadingAuth(false);
                setAuthChecked(true);

                // Fire streak update detached — never awaited, never blocks auth
                // Only fire on actual new sign-ins, not session restores
                if (event === 'SIGNED_IN' && session?.user?.email) {
                    // Add a short debounce via localStorage to prevent double-fire
                    const lockKey = `streak_lock_${session.user.email}`;
                    if (localStorage.getItem(lockKey)) return;
                    localStorage.setItem(lockKey, '1');
                    setTimeout(() => localStorage.removeItem(lockKey), 5000);

                    entities.UserProfile
                        .filter({ user_email: session.user.email })
                        .then(profiles => {
                            if (profiles?.[0]) return updateLoginStreak(profiles[0]);
                        })
                        .catch(e => console.error('Streak update failed:', e));
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setIsAuthenticated(false);
    };

    const navigateToLogin = () => {
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            isLoadingAuth,
            isLoadingPublicSettings: false,
            authError,
            appPublicSettings: null,
            authChecked,
            logout,
            navigateToLogin,
            checkUserAuth: () => { },
            checkAppState: () => { },
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};