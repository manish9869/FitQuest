import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/api/supabaseClient';
import { updateLoginStreak } from '@/lib/xpEngine';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);
    const roleFetchRef = useRef(false); // prevent double-fetch on mount

    const fetchRole = async (email) => {
        try {
            const { data } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('user_email', email)
                .maybeSingle();
            return data?.role || 'user';
        } catch {
            return 'user';
        }
    };



    /** Remove every key we own from localStorage */
    function clearLocalStorage(email) {
        // streak lock for any email
        if (email) localStorage.removeItem(`streak_lock_${email}`);

        // remove any leftover supabase / mgn_* tokens that accumulate on the landing page
        const toDelete = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            if (
                key.startsWith('streak_lock_') ||
                key.startsWith('sb-') ||          // supabase internal keys
                key.startsWith('mgn_') ||          // the base64 mgn_* tokens visible in screenshot
                key.startsWith('supabase.')
            ) {
                toDelete.push(key);
            }
        }
        toDelete.forEach(k => localStorage.removeItem(k));
    }


    // Exposed so AdminSetupPage can force a role re-fetch after its upsert
    const refreshRole = useCallback(async (email) => {
        const role = await fetchRole(email);
        setUserRole(role);
        return role;
    }, []);

    useEffect(() => {
        // On mount: check existing session
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (session?.user) {
                const role = await fetchRole(session.user.email);
                setUser(session.user);
                setUserRole(role);
                setIsAuthenticated(true);
            }
            // Always mark done after initial check
            setIsLoadingAuth(false);
            setAuthChecked(true);
            roleFetchRef.current = true;
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                // SIGNED_OUT — clear everything immediately and stop loading
                if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setUserRole(null);
                    setIsAuthenticated(false);
                    setIsLoadingAuth(false);
                    setAuthChecked(true);
                    return;
                }

                if (session?.user) {
                    const role = await fetchRole(session.user.email);
                    setUser(session.user);
                    setUserRole(role);
                    setIsAuthenticated(true);

                    // Award login streak for regular users on sign-in
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
                    setUser(null);
                    setUserRole(null);
                    setIsAuthenticated(false);
                }

                setIsLoadingAuth(false);
                setAuthChecked(true);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const logout = async () => {
        // 1. Clear state immediately so UI doesn't get stuck on spinner
        setUser(null);
        setUserRole(null);
        setIsAuthenticated(false);
        setAuthChecked(true);
        setIsLoadingAuth(false);
        clearLocalStorage(user?.email);

        // 2. Sign out from Supabase (fires SIGNED_OUT event, handled above)
        await supabase.auth.signOut();

        // 3. Navigate to landing
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