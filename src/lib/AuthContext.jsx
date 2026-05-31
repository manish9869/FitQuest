import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabaseClient';
import { updateLoginStreak } from '@/lib/xpEngine';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);

    const fetchRole = async (email) => {
        try {
            const { data } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('user_email', email)
                .maybeSingle();
            return data?.role || 'user';
        } catch { return 'user'; }
    };

    // ✅ Exposed so AdminSetupPage can force a role re-fetch after its upsert completes
    const refreshRole = useCallback(async (email) => {
        const role = await fetchRole(email);
        setUserRole(role);
        return role;
    }, []);

    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (session?.user) {
                setUser(session.user);
                setIsAuthenticated(true);
                const role = await fetchRole(session.user.email);
                setUserRole(role);
            }
            setIsLoadingAuth(false);
            setAuthChecked(true);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setUser(session?.user ?? null);
                setIsAuthenticated(!!session?.user);

                if (session?.user?.email) {
                    const role = await fetchRole(session.user.email);
                    setUserRole(role);

                    if (event === 'SIGNED_IN' && role !== 'admin') {
                        const lockKey = `streak_lock_${session.user.email}`;
                        if (!localStorage.getItem(lockKey)) {
                            localStorage.setItem(lockKey, '1');
                            setTimeout(() => localStorage.removeItem(lockKey), 5000);
                            const { data: profiles } = await supabase
                                .from('user_profiles')
                                .select('*')
                                .eq('user_email', session.user.email);
                            if (profiles?.[0]) updateLoginStreak(profiles[0]).catch(console.error);
                        }
                    }
                } else {
                    setUserRole(null);
                }

                setIsLoadingAuth(false);
                setAuthChecked(true);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setUserRole(null);
        setIsAuthenticated(false);
        window.location.href = '/';

    };

    return (
        <AuthContext.Provider value={{
            user,
            userRole,
            isAdmin: userRole === 'admin',
            isAuthenticated,
            isLoadingAuth,
            isLoadingPublicSettings: false,
            authError: null,
            appPublicSettings: null,
            authChecked,
            logout,
            refreshRole,  // ✅ exposed
            navigateToLogin: () => { window.location.href = '/login'; },
            checkUserAuth: () => { },
            checkAppState: () => { },
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};