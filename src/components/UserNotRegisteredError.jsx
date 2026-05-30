import React from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import AuthVisualPanel from '@/components/auth/AuthVisualPanel';
import { Shield, ArrowRight } from 'lucide-react';

export default function UserNotRegisteredError() {
    return (
        <div className="min-h-screen flex">
            {/* Left panel */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <AuthVisualPanel quoteIndex={1} />
            </div>

            {/* Right */}
            <div className="flex-1 flex flex-col items-center justify-center bg-background px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                    className="w-full max-w-sm text-center"
                >
                    <div className="flex items-center justify-center gap-3 mb-10">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-xl shadow-emerald-500/30">
                            <span className="text-2xl">🔥</span>
                        </div>
                        <div className="text-left">
                            <div className="font-space font-bold text-xl">FitElite</div>
                            <div className="text-[10px] text-emerald-400 tracking-widest uppercase">Premium Fitness</div>
                        </div>
                    </div>

                    <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-6">
                        <Shield className="w-8 h-8 text-purple-400" />
                    </div>

                    <h2 className="text-2xl font-space font-bold mb-3">Access Restricted</h2>
                    <p className="text-muted-foreground text-sm mb-8">
                        Your account hasn't been granted access to FitElite yet. Please contact your coach or administrator to get access.
                    </p>

                    <div className="glass rounded-2xl p-5 border border-purple-500/15 text-left mb-6">
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">What to do next</p>
                        <div className="space-y-2.5">
                            {[
                                'Contact your FitElite coach or trainer',
                                'Ask them to add your email to the platform',
                                'Then try logging in again',
                            ].map((step, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-bold flex-shrink-0 mt-0.5">
                                        {i + 1}
                                    </div>
                                    <span className="text-sm text-muted-foreground">{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => supabase.auth.signOut()}
                        className="w-full py-3 rounded-xl border border-white/10 text-muted-foreground hover:text-white hover:border-white/20 transition-all text-sm font-medium flex items-center justify-center gap-2"
                    >
                        <ArrowRight className="w-4 h-4" /> Back to Home
                    </button>
                </motion.div>
            </div>
        </div>
    );
}


