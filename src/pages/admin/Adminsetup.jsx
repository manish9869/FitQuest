import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Shield, Eye, EyeOff, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

const ADMIN_INVITE_CODE = import.meta.env.VITE_ADMIN_INVITE_CODE || 'FITELITE-ADMIN-2025';

export default function AdminSetupPage() {
    const [step, setStep] = useState('verify');
    const [code, setCode] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();
    const { refreshRole } = useAuth(); // ✅

    const verifyCode = () => {
        if (code.trim() === ADMIN_INVITE_CODE) {
            setStep('register');
            setError('');
        } else {
            setError('Invalid invite code.');
        }
    };

    const handleRegister = async () => {
        if (!fullName.trim()) { setError('Full name is required.'); return; }
        setIsLoading(true);
        setError('');
        try {
            const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

            if (signUpError) {
                setError(signUpError.message || 'Sign-up failed.');
                return;
            }

            const userEmail = data?.user?.email || email;

            if (data?.session) {
                // Write admin profile
                const { error: profileErr } = await supabase
                    .from('user_profiles')
                    .upsert({
                        user_email: userEmail,
                        full_name: fullName.trim(),
                        role: 'admin',
                        onboarding_complete: true,
                        plan: 'elite',
                    }, { onConflict: 'user_email' });

                if (profileErr) {
                    setError('Failed to create admin profile. Please try again.');
                    return;
                }

                // ✅ Force AuthContext to re-read the role from DB now that
                // the upsert is committed. onAuthStateChange already ran and
                // cached 'user' — this overwrites it with 'admin' before we navigate.
                const role = await refreshRole(userEmail);

                if (role === 'admin') {
                    setSuccess('Admin account created! Redirecting…');
                    navigate('/admin', { replace: true });
                } else {
                    setError('Role not applied correctly. Please try signing in at /login.');
                }
            } else {
                // Email confirmation ON
                localStorage.setItem('pending_admin_email', userEmail);
                localStorage.setItem('pending_admin_name', fullName.trim());
                setSuccess(
                    'Check your inbox and confirm your email. Then sign in at /login — admin access will be applied automatically.'
                );
            }

        } catch (e) {
            console.error('[AdminSetup] unexpected error:', e);
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-6">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm"
            >
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-purple-500/30">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <div className="font-space font-bold text-xl">FitElite Admin</div>
                        <div className="text-[10px] text-purple-400 tracking-widest uppercase">Setup Portal</div>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {step === 'verify' && (
                        <motion.div key="verify"
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                            <h2 className="text-2xl font-space font-bold mb-1 text-center">Enter Invite Code</h2>
                            <p className="text-muted-foreground text-sm mb-6 text-center">This page is restricted to authorised admins only.</p>

                            <div className="space-y-3 mb-4">
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                                    <input
                                        type="text"
                                        placeholder="Admin invite code"
                                        value={code}
                                        onChange={e => setCode(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && verifyCode()}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-sm focus:outline-none focus:border-purple-500/50 transition font-mono tracking-wider text-purple-200 placeholder:text-purple-300/30"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 text-red-400 text-xs mb-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
                                </div>
                            )}

                            <button onClick={verifyCode} disabled={!code}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                                Verify Code
                            </button>
                        </motion.div>
                    )}

                    {step === 'register' && (
                        <motion.div key="register"
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <div className="flex items-center gap-2 mb-4 bg-purple-500/10 border border-purple-500/20 rounded-xl px-3 py-2">
                                <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                <p className="text-xs text-purple-300">Invite code verified — fill in your details below.</p>
                            </div>

                            <h2 className="text-2xl font-space font-bold mb-1 text-center">Create Admin Account</h2>
                            <p className="text-muted-foreground text-sm mb-6 text-center">This account will have full platform access.</p>

                            <div className="space-y-3 mb-4">
                                <input type="text" placeholder="Full name" value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-500/50 transition"
                                />
                                <input type="email" placeholder="Email" value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-500/50 transition"
                                />
                                <div className="relative">
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        placeholder="Password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleRegister()}
                                        className="w-full px-4 py-3 pr-11 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-500/50 transition"
                                    />
                                    <button type="button" onClick={() => setShowPass(s => !s)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors">
                                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="flex items-center gap-2 text-red-400 text-xs mb-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
                                    </motion.div>
                                )}
                                {success && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="flex items-center gap-2 text-emerald-400 text-xs mb-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />{success}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button onClick={handleRegister}
                                disabled={!email || !password || !fullName || isLoading}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                                {isLoading ? 'Creating account…' : 'Create Admin Account'}
                            </button>

                            <p className="text-center text-xs text-muted-foreground mt-4">
                                <button onClick={() => { setStep('verify'); setError(''); }}
                                    className="text-purple-400 hover:underline">← Back</button>
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}