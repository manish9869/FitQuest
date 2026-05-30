"use client"

import { useState, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"


const plans = [
    {
        name: "Basic",
        description: "Perfect for beginners starting their fitness journey",
        monthlyPrice: 2999,
        yearlyPrice: 29990,
        features: [
            "Personalized workout plan",
            "Basic nutrition guidelines",
            "Weekly check-ins via chat",
            "Access to exercise library",
            "Monthly progress review",
        ],
        popular: false,
    },
    {
        name: "Premium",
        description: "Our most popular plan for serious transformations",
        monthlyPrice: 5999,
        yearlyPrice: 59990,
        features: [
            "Everything in Basic",
            "Custom nutrition plan",
            "Bi-weekly video calls",
            "24/7 WhatsApp support",
            "Weekly progress tracking",
            "Supplement guidance",
            "Recipe suggestions",
        ],
        popular: true,
    },
    {
        name: "Elite",
        description: "VIP coaching for maximum results",
        monthlyPrice: 9999,
        yearlyPrice: 99990,
        features: [
            "Everything in Premium",
            "Daily check-ins",
            "Unlimited video calls",
            "Priority support",
            "Advanced analytics dashboard",
            "Personalized meal prep",
            "Competition prep ready",
            "1-on-1 accountability partner",
        ],
        popular: false,
    },
]

function Toggle({ checked, onCheckedChange }) {
    return (
        <button
            role="switch"
            aria-checked={checked}
            onClick={() => onCheckedChange(!checked)}
            className="relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none"
            style={{
                width: '48px',
                height: '26px',
                background: checked ? '#beff00' : 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.15)',
            }}
        >
            <span
                className="inline-block rounded-full transition-transform duration-200"
                style={{
                    width: '20px',
                    height: '20px',
                    background: checked ? '#0a0a0a' : '#ffffff',
                    transform: checked ? 'translateX(24px)' : 'translateX(3px)',
                }}
            />
        </button>
    )
}

export function PricingSection() {
    const [isYearly, setIsYearly] = useState(false)
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    const formatPrice = (price) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(price)
    }

    return (
        <section id="pricing" className="relative py-24 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-grid opacity-30" />

            <div ref={ref} className="relative container mx-auto px-4">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <span className="text-primary text-sm font-semibold uppercase tracking-widest">
                        Pricing
                    </span>
                    <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">
                        Invest in Your <span className="text-primary">Health</span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed mb-8">
                        Choose the plan that fits your goals. All plans include personalized
                        coaching and proven methods for real results.
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4">
                        <span className={`text-sm ${!isYearly ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                            Monthly
                        </span>
                        <Toggle checked={isYearly} onCheckedChange={setIsYearly} />
                        <span className={`text-sm ${isYearly ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                            Yearly
                        </span>
                        {isYearly && (
                            <span className="text-xs font-medium px-2 py-1 rounded-full"
                                style={{ color: '#beff00', background: 'rgba(190,255,0,0.1)' }}
                            >
                                Save 17%
                            </span>
                        )}
                    </div>
                </motion.div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
                            className={`relative glass-card rounded-2xl p-6 transition-all ${plan.popular
                                ? "scale-105 z-10"
                                : "hover:border-primary/30"
                                }`}
                            style={plan.popular ? {
                                border: '1px solid #beff00',
                                boxShadow: '0 0 20px rgba(190,255,0,0.2), 0 0 60px rgba(190,255,0,0.08)',
                            } : {}}
                        >
                            {/* Popular Badge */}
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <div
                                        className="flex items-center gap-1 px-4 py-1 rounded-full text-sm font-semibold"
                                        style={{ background: '#beff00', color: '#0a0a0a' }}
                                    >
                                        <Sparkles className="h-4 w-4" />
                                        Most Popular
                                    </div>
                                </div>
                            )}

                            {/* Plan Header */}
                            <div className="text-center mb-6 pt-2">
                                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-4xl font-bold">
                                        {formatPrice(isYearly ? plan.yearlyPrice / 12 : plan.monthlyPrice)}
                                    </span>
                                    <span className="text-muted-foreground">/month</span>
                                </div>
                                {isYearly && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Billed {formatPrice(plan.yearlyPrice)} yearly
                                    </p>
                                )}
                            </div>

                            {/* Features */}
                            <ul className="space-y-3 mb-6">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3">
                                        <div
                                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                            style={{ background: 'rgba(190,255,0,0.15)' }}
                                        >
                                            <Check className="h-3 w-3" style={{ color: '#beff00' }} />
                                        </div>
                                        <span className="text-sm text-muted-foreground">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA */}
                            <Button
                                className="w-full font-semibold"
                                variant={plan.popular ? "default" : "outline"}
                                style={plan.popular ? {
                                    background: '#beff00',
                                    color: '#0a0a0a',
                                    boxShadow: '0 0 20px rgba(190,255,0,0.3)',
                                } : {}}
                            >
                                Get Started
                            </Button>
                        </motion.div>
                    ))}
                </div>

                {/* Money Back Guarantee */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="text-center mt-12"
                >
                    <p className="text-muted-foreground text-sm">
                        100% satisfaction guarantee. Full refund within 7 days if you&apos;re not satisfied.
                    </p>
                </motion.div>
            </div>
        </section>
    )
}


