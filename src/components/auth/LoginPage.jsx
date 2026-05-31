import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import AuthVisualPanel from './AuthVisualPanel';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [mode, setMode] = useState('login');
    const navigate = useNavigate();
    const location = useLocation();
    const { refreshRole } = useAuth();

    const handleSubmit = async () => {
        setIsLoading(true);
        setError('');
        try {
            const { data, error: authError } = mode === 'login'
                ? await supabase.auth.signInWithPassword({ email, password })
                : await supabase.auth.signUp({ email, password });

            if (authError) {
                setError(authError.message);
                return;
            }

            if (data?.user) {
                // Fetch the role immediately so we can redirect to the right place
                const role = await refreshRole(data.user.email);

                if (role === 'admin') {
                    navigate('/admin', { replace: true });
                } else {
                    // Redirect back to the page they came from, or dashboard
                    const from = location.state?.from?.pathname || '/dashboard';
                    navigate(from, { replace: true });
                }
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/dashboard` },
        });
    };

    return (
        <div className="min-h-screen flex">
            {/* Left — Visual Panel */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <AuthVisualPanel />
            </div>

            {/* Right — Login Form */}
            <div className="flex-1 flex flex-col items-center justify-center bg-background relative overflow-hidden px-6">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-sm"
                >
                    {/* Logo */}
                    <div className="flex items-center justify-center gap-3 mb-10">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-xl shadow-emerald-500/30">
                            <span className="text-2xl">🔥</span>
                        </div>
                        <div className="text-left">
                            <div className="font-space font-bold text-xl">FitElite</div>
                            <div className="text-[10px] text-emerald-400 tracking-widest uppercase">Premium Fitness</div>
                        </div>
                    </div>

                    <h2 className="text-3xl font-space font-bold mb-2 text-center">
                        {mode === 'login' ? 'Welcome back' : 'Create account'}
                    </h2>
                    <p className="text-muted-foreground text-sm mb-8 text-center">
                        {mode === 'login' ? 'Sign in to your account' : 'Start your fitness journey'}
                    </p>

                    {/* Google OAuth */}
                    <button
                        onClick={handleGoogle}
                        className="w-full py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm font-medium flex items-center justify-center gap-2 mb-4"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </button>

                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-xs text-muted-foreground">or</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Email + Password */}
                    <div className="space-y-3 mb-4">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-emerald-500/50 transition"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-emerald-500/50 transition"
                        />
                    </div>

                    {error && (
                        <p className="text-red-400 text-xs mb-3">{error}</p>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !email || !password}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-black font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                    </button>

                    <p className="text-center text-xs text-muted-foreground mt-4">
                        {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                        <button
                            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
                            className="text-emerald-400 hover:underline"
                        >
                            {mode === 'login' ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}