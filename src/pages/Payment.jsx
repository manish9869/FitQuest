import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, CreditCard, Lock, Check, User, Mail, Phone, MapPin, ChevronRight, Shield, Zap, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const PLANS = {
    fat_loss: { name: 'Fat Loss', price: 49, color: 'from-emerald-500 to-green-600', icon: Flame, features: ['Calorie deficit plan', 'Custom meal plans', 'HIIT workouts', '24/7 AI assistant'] },
    muscle_gain: { name: 'Muscle Gain', price: 59, color: 'from-blue-500 to-indigo-600', icon: Zap, features: ['Calorie surplus plan', 'Protein-focused meals', 'Progressive overload', 'Coach support'] },
    premium: { name: 'Premium Coaching', price: 99, color: 'from-purple-500 to-pink-600', icon: Crown, features: ['1-on-1 coaching', 'Custom everything', 'Priority support', 'Video consultations'] },
};

export default function Payment() {
    const navigate = useNavigate();
    const params = new URLSearchParams(window.location.search);
    const planKey = params.get('plan') || 'muscle_gain';
    const plan = PLANS[planKey] || PLANS.muscle_gain;
    const PlanIcon = plan.icon;

    const [step, setStep] = useState(1); // 1=personal, 2=payment
    const [loading, setLoading] = useState(false);
    const [personal, setPersonal] = useState({ name: '', email: '', phone: '', address: '' });
    const [payment, setPayment] = useState({ card: '', expiry: '', cvv: '', name: '' });
    const [agreed, setAgreed] = useState(false);

    const updatePersonal = (k, v) => setPersonal(p => ({ ...p, [k]: v }));
    const updatePayment = (k, v) => setPayment(p => ({ ...p, [k]: v }));

    const formatCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    const formatExpiry = (v) => {
        const d = v.replace(/\D/g, '').slice(0, 4);
        return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
    };

    const handlePersonalSubmit = (e) => {
        e.preventDefault();
        if (!personal.name || !personal.email || !personal.phone) { toast.error('Please fill all required fields'); return; }
        setStep(2);
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        if (!agreed) { toast.error('Please agree to terms'); return; }
        setLoading(true);

        // Razorpay integration point
        // In production, call your backend to create a Razorpay order_id first,
        // then open Razorpay checkout with the order_id.
        // For now we simulate the flow:
        setTimeout(() => {
            setLoading(false);
            navigate('/payment/success?plan=' + planKey + '&name=' + encodeURIComponent(personal.name));
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Navbar */}
            <nav className="border-b border-white/5 px-6 h-14 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Flame className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="font-space font-bold">FitElite</span>
                <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                    <Lock className="w-3.5 h-3.5" /> Secured by 256-bit SSL
                </div>
            </nav>

            <div className="flex-1 flex items-start justify-center px-4 py-12">
                <div className="w-full max-w-5xl grid lg:grid-cols-5 gap-8">

                    {/* Order Summary — left */}
                    <div className="lg:col-span-2">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-2xl p-6 border border-white/8 sticky top-8">
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                                <PlanIcon className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-xl font-bold font-space">{plan.name}</h2>
                            <p className="text-sm text-muted-foreground mb-4">Monthly subscription</p>

                            <div className="border-t border-white/5 pt-4 mb-4">
                                <ul className="space-y-2.5">
                                    {plan.features.map(f => (
                                        <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                                <Check className="w-3 h-3 text-emerald-400" />
                                            </div>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="border-t border-white/5 pt-4 space-y-2">
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Subtotal</span><span>₹{plan.price * 83}/mo</span>
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>GST (18%)</span><span>₹{Math.round(plan.price * 83 * 0.18)}/mo</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg pt-2 border-t border-white/5">
                                    <span>Total</span>
                                    <span className="text-emerald-400">₹{Math.round(plan.price * 83 * 1.18)}/mo</span>
                                </div>
                            </div>

                            <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground bg-white/3 rounded-xl p-3 border border-white/5">
                                <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                Cancel anytime. No hidden fees. 7-day money back guarantee.
                            </div>
                        </motion.div>
                    </div>

                    {/* Checkout form — right */}
                    <div className="lg:col-span-3">
                        {/* Steps indicator */}
                        <div className="flex items-center gap-3 mb-8">
                            {[{ n: 1, label: 'Your Info' }, { n: 2, label: 'Payment' }].map(({ n, label }) => (
                                <React.Fragment key={n}>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= n ? 'bg-emerald-500 text-black' : 'bg-white/10 text-muted-foreground'}`}>
                                            {step > n ? <Check className="w-4 h-4" /> : n}
                                        </div>
                                        <span className={`text-sm font-medium ${step >= n ? 'text-white' : 'text-muted-foreground'}`}>{label}</span>
                                    </div>
                                    {n < 2 && <div className={`flex-1 h-px transition-all ${step > n ? 'bg-emerald-500' : 'bg-white/10'}`} />}
                                </React.Fragment>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            {step === 1 ? (
                                <motion.form key="personal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    onSubmit={handlePersonalSubmit} className="glass rounded-2xl p-6 border border-white/8 space-y-5">
                                    <h3 className="font-bold text-lg">Personal Information</h3>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-muted-foreground">Full Name *</Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input value={personal.name} onChange={e => updatePersonal('name', e.target.value)}
                                                    placeholder="John Doe" required className="pl-9 bg-white/5 border-white/10 focus:border-emerald-500/50" />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-muted-foreground">Email Address *</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input type="email" value={personal.email} onChange={e => updatePersonal('email', e.target.value)}
                                                    placeholder="john@example.com" required className="pl-9 bg-white/5 border-white/10 focus:border-emerald-500/50" />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-muted-foreground">Phone Number *</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input type="tel" value={personal.phone} onChange={e => updatePersonal('phone', e.target.value)}
                                                    placeholder="+91 98765 43210" required className="pl-9 bg-white/5 border-white/10 focus:border-emerald-500/50" />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-muted-foreground">City / Address</Label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input value={personal.address} onChange={e => updatePersonal('address', e.target.value)}
                                                    placeholder="Mumbai, India" className="pl-9 bg-white/5 border-white/10 focus:border-emerald-500/50" />
                                            </div>
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold h-11 rounded-xl gap-2">
                                        Continue to Payment <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </motion.form>
                            ) : (
                                <motion.form key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    onSubmit={handlePayment} className="glass rounded-2xl p-6 border border-white/8 space-y-5">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-lg">Payment Details</h3>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Lock className="w-3.5 h-3.5 text-emerald-400" /> Razorpay Secured
                                        </div>
                                    </div>

                                    {/* Razorpay UPI / Card tabs */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {['Card', 'UPI', 'Net Banking'].map(m => (
                                            <button type="button" key={m}
                                                className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${m === 'Card' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'border-white/10 text-muted-foreground hover:border-white/20'}`}>
                                                {m}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-muted-foreground">Card Number</Label>
                                            <div className="relative">
                                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input value={payment.card} onChange={e => updatePayment('card', formatCard(e.target.value))}
                                                    placeholder="4242 4242 4242 4242" maxLength={19} required
                                                    className="pl-9 bg-white/5 border-white/10 focus:border-emerald-500/50 font-mono tracking-widest" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-muted-foreground">Expiry Date</Label>
                                                <Input value={payment.expiry} onChange={e => updatePayment('expiry', formatExpiry(e.target.value))}
                                                    placeholder="MM/YY" maxLength={5} required
                                                    className="bg-white/5 border-white/10 focus:border-emerald-500/50 font-mono" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-muted-foreground">CVV</Label>
                                                <Input type="password" value={payment.cvv} onChange={e => updatePayment('cvv', e.target.value.slice(0, 4))}
                                                    placeholder="•••" maxLength={4} required
                                                    className="bg-white/5 border-white/10 focus:border-emerald-500/50 font-mono" />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-muted-foreground">Name on Card</Label>
                                            <Input value={payment.name} onChange={e => updatePayment('name', e.target.value)}
                                                placeholder="JOHN DOE" required
                                                className="bg-white/5 border-white/10 focus:border-emerald-500/50 uppercase" />
                                        </div>
                                    </div>

                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                                            className="mt-1 w-4 h-4 accent-emerald-500 flex-shrink-0" />
                                        <span className="text-xs text-muted-foreground leading-relaxed">
                                            I agree to the <span className="text-emerald-400">Terms of Service</span> and <span className="text-emerald-400">Privacy Policy</span>. I understand this is a recurring monthly subscription.
                                        </span>
                                    </label>

                                    <div className="flex gap-3">
                                        <Button type="button" variant="outline" onClick={() => setStep(1)} className="border-white/10 rounded-xl">Back</Button>
                                        <Button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:opacity-90 text-black font-bold h-11 rounded-xl gap-2">
                                            {loading ? (
                                                <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Processing...</>
                                            ) : (
                                                <><Lock className="w-4 h-4" /> Pay ₹{Math.round(plan.price * 83 * 1.18)}/mo</>
                                            )}
                                        </Button>
                                    </div>

                                    <div className="flex items-center justify-center gap-4 pt-2">
                                        {['VISA', 'MC', 'AMEX', 'RuPay', 'UPI'].map(b => (
                                            <span key={b} className="text-[10px] font-bold text-muted-foreground/50 border border-white/10 px-2 py-0.5 rounded">{b}</span>
                                        ))}
                                    </div>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}


