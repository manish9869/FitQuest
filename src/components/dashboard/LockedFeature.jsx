import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Crown, ArrowRight } from 'lucide-react';
import { PLAN_CONFIG } from '@/lib/featureFlags';
import { Link } from 'react-router-dom';

export default function LockedFeature({ feature, userPlan }) {
    const required = PLAN_CONFIG[feature.required_plan];

    return (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="min-h-[60vh] flex items-center justify-center p-8">
            <div className="max-w-md w-full text-center">
                {/* Blurred preview mockup */}
                <div className="relative rounded-3xl overflow-hidden mb-6 border border-white/10">
                    <div className="h-48 glass" style={{ filter: 'blur(3px)' }}>
                        <div className="p-6 space-y-3">
                            <div className="h-4 bg-white/10 rounded-full w-3/4 mx-auto" />
                            <div className="h-4 bg-white/5 rounded-full w-1/2 mx-auto" />
                            <div className="grid grid-cols-3 gap-2 mt-4">
                                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl" />)}
                            </div>
                        </div>
                    </div>
                    {/* Lock overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}>
                        <div className={`w-14 h-14 rounded-2xl ${required.bg} border ${required.border} flex items-center justify-center mb-2`}>
                            <Lock className={`w-7 h-7 ${required.color}`} />
                        </div>
                    </div>
                </div>

                {/* Message */}
                <div className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full ${required.bg} ${required.color} border ${required.border} mb-4 font-semibold`}>
                    <Crown className="w-3.5 h-3.5" />
                    {required.label} Plan Required
                </div>

                <h2 className="text-xl font-space font-bold mb-2">{feature.label}</h2>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                    Upgrade to <span className={`font-semibold ${required.color}`}>{required.label}</span> to unlock this feature and elevate your fitness experience.
                </p>

                <Link to="/dashboard/settings">
                    <button className={`w-full py-3 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-105 border ${required.border} ${required.bg} ${required.color}`}>
                        <Crown className="w-4 h-4" />
                        Upgrade to {required.label}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </Link>
                <p className="text-xs text-muted-foreground mt-3">Your current plan: <span className="text-white font-medium capitalize">{userPlan}</span></p>
            </div>
        </motion.div>
    );
}


