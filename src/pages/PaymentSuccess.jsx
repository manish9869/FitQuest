import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Flame, ArrowRight, Download, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

export default function PaymentSuccess() {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get('plan') || 'muscle_gain';
    const name = params.get('name') || 'there';
    const orderId = 'FE' + Math.random().toString(36).slice(2, 10).toUpperCase();

    useEffect(() => {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b'] });
        setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 } }), 400);
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 py-16">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-12">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="font-space font-bold text-lg">FitElite</span>
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                className="w-full max-w-md text-center">

                {/* Success icon */}
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                    className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-6 glow-green">
                    <CheckCircle className="w-12 h-12 text-emerald-400" />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <h1 className="text-3xl font-space font-bold mb-2">Payment Successful! 🎉</h1>
                    <p className="text-muted-foreground mb-8">
                        Welcome to FitElite, <span className="text-white font-semibold">{name}</span>! Your transformation journey starts now.
                    </p>
                </motion.div>

                {/* Order details card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="glass rounded-2xl p-6 border border-emerald-500/20 mb-6 text-left">
                    <div className="space-y-3">
                        {[
                            { label: 'Order ID', value: orderId },
                            { label: 'Plan', value: plan.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) },
                            { label: 'Status', value: '✅ Confirmed' },
                            { label: 'Receipt', value: 'Sent to your email' },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{label}</span>
                                <span className="font-medium">{value}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Next steps */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    className="glass rounded-2xl p-5 border border-white/8 mb-8">
                    <h3 className="font-semibold text-sm mb-4 text-left">What's next?</h3>
                    <div className="space-y-3">
                        {[
                            { n: 1, text: 'Complete your fitness profile & onboarding' },
                            { n: 2, text: 'Get your personalized meal & workout plan' },
                            { n: 3, text: 'Start tracking and earning XP' },
                        ].map(step => (
                            <div key={step.n} className="flex items-center gap-3 text-sm text-muted-foreground">
                                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                    {step.n}
                                </div>
                                {step.text}
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex flex-col gap-3">
                    <Link to="/onboarding">
                        <Button className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold h-11 rounded-xl gap-2">
                            Start Onboarding <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                    <Link to="/dashboard">
                        <Button variant="outline" className="w-full border-white/10 rounded-xl h-11">
                            Go to Dashboard
                        </Button>
                    </Link>
                </motion.div>
            </motion.div>
        </div>
    );
}


