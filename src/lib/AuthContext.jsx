import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/api/supabaseClient';
import { updateLoginStreak } from '@/lib/xpEngine';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState('user');
    const [isLoadingRole, setIsLoadingRole] = useState(true); // ← NEW: true until role is confirmed
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);

    const isMounted = useRef(true);

    const fetchRole = useCallback(async (email) => {
        try {
            const result = await Promise.race([
                supabase
                    .from('user_profiles')
                    .select('role')
                    .eq('user_email', email)
                    .maybeSingle(),
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
        setIsLoadingRole(true);
        const role = await fetchRole(email);
        if (isMounted.current) {
            setUserRole(role);
            setIsLoadingRole(false);
        }
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
                    setIsLoadingRole(false);
                    setIsAuthenticated(false);
                    setIsLoadingAuth(false);
                    setAuthChecked(true);
                    return;
                }

                if (session?.user) {
                    // Unblock auth spinner immediately — but keep isLoadingRole=true
                    // so ProtectedRoute doesn't redirect before role is known.
                    setUser(session.user);
                    setIsAuthenticated(true);
                    setIsLoadingAuth(false);
                    setAuthChecked(true);
                    setIsLoadingRole(true); // hold redirects until role resolves

                    fetchRole(session.user.email).then(role => {
                        if (isMounted.current) {
                            setUserRole(role);
                            setIsLoadingRole(false); // now safe to route
                        }
                    });

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
                    setIsLoadingRole(false);
                    setIsAuthenticated(false);
                    setIsLoadingAuth(false);
                    setAuthChecked(true);
                }
            }
        );

        // Fallback if onAuthStateChange never fires
        const fallbackTimer = setTimeout(async () => {
            if (!isMounted.current || listenerFired) return;

            const { data: { session } } = await supabase.auth.getSession()
                .catch(() => ({ data: { session: null } }));

            if (!isMounted.current || listenerFired) return;

            if (session?.user) {
                setUser(session.user);
                setIsAuthenticated(true);
                setIsLoadingRole(true);
                fetchRole(session.user.email).then(role => {
                    if (isMounted.current) {
                        setUserRole(role);
                        setIsLoadingRole(false);
                    }
                });
            } else {
                setUser(null);
                setIsAuthenticated(false);
                setIsLoadingRole(false);
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
        setIsLoadingRole(false);
        setIsAuthenticated(false);
        setAuthChecked(true);
        setIsLoadingAuth(false);
        clearLocalStorage();
        window.location.href = '/';
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{
            user,
            userRole,
            isLoadingRole, // ← expose so ProtectedRoute can wait
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