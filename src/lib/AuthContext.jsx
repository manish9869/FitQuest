import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/api/supabaseClient';
import { updateLoginStreak } from '@/lib/xpEngine';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState('user'); // default 'user', never null
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);

    const isMounted = useRef(true);

    // Fetch role with a hard timeout so a slow/blocked DB query never hangs the UI
    const fetchRole = useCallback(async (email) => {
        try {
            const result = await Promise.race([
                supabase
                    .from('user_profiles')
                    .select('role')
                    .eq('user_email', email)
                    .maybeSingle(),
                // 3-second timeout — if the DB hangs, default to 'user'
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('fetchRole timeout')), 3000)
                ),
            ]);
            return result?.data?.role || 'user';
        } catch {
            return 'user';
        }
    }, []);

    const refreshRole = useCallback(async (email) => {
        const role = await fetchRole(email);
        if (isMounted.current) setUserRole(role);
        return role;
    }, [fetchRole]);

    function clearLocalStorage() {
        const toDelete = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            if (
                key.startsWith('streak_lock_') ||
                key.startsWith('sb-') ||
                key.startsWith('mgn_') ||
                key.startsWith('supabase.')
            ) toDelete.push(key);
        }
        toDelete.forEach(k => localStorage.removeItem(k));
    }

    useEffect(() => {
        isMounted.current = true;
        let listenerFired = false;

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!isMounted.current) return;
                listenerFired = true;

                if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setUserRole('user');
                    setIsAuthenticated(false);
                    setIsLoadingAuth(false);
                    setAuthChecked(true);
                    return;
                }

                if (session?.user) {
                    // ── KEY FIX: unblock the spinner IMMEDIATELY ──────────────
                    // Set authenticated state right away with default role 'user',
                    // then fetch the real role in the background.
                    setUser(session.user);
                    setIsAuthenticated(true);
                    setIsLoadingAuth(false);
                    setAuthChecked(true);

                    // Fetch role async — UI is already unblocked
                    fetchRole(session.user.email).then(role => {
                        if (isMounted.current) setUserRole(role);
                    });

                    // Login streak for new sign-ins only
                    if (event === 'SIGNED_IN') {
                        const lockKey = `streak_lock_${session.user.email}`;
                        if (!localStorage.getItem(lockKey)) {
                            localStorage.setItem(lockKey, '1');
                            setTimeout(() => localStorage.removeItem(lockKey), 5000);
                            supabase
                                .from('user_profiles')
                                .select('*')
                                .eq('user_email', session.user.email)
                                .then(({ data: profiles }) => {
                                    if (profiles?.[0] && isMounted.current) {
                                        updateLoginStreak(profiles[0]).catch(() => { });
                                    }
                                });
                        }
                    }
                } else {
                    setUser(null);
                    setUserRole('user');
                    setIsAuthenticated(false);
                    setIsLoadingAuth(false);
                    setAuthChecked(true);
                }
            }
        );

        // Fallback: if onAuthStateChange never fires (rare), use getSession
        const fallbackTimer = setTimeout(async () => {
            if (!isMounted.current || listenerFired) return;

            const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));

            if (!isMounted.current || listenerFired) return;

            if (session?.user) {
                setUser(session.user);
                setIsAuthenticated(true);
                fetchRole(session.user.email).then(role => {
                    if (isMounted.current) setUserRole(role);
                });
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
            setIsLoadingAuth(false);
            setAuthChecked(true);
        }, 1500);

        return () => {
            isMounted.current = false;
            clearTimeout(fallbackTimer);
            subscription.unsubscribe();
        };
    }, [fetchRole]);

    const logout = async () => {
        setUser(null);
        setUserRole('user');
        setIsAuthenticated(false);
        setAuthChecked(true);
        setIsLoadingAuth(false);
        clearLocalStorage();
        await supabase.auth.signOut();
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
            refreshRole,
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