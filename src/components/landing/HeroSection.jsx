import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, ChevronDown, Flame, Trophy, Users, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
    { icon: Users, value: 500, suffix: "+", label: "Clients Transformed" },
    { icon: Trophy, value: 8, suffix: "+", label: "Years Experience" },
    { icon: Flame, value: 120, suffix: "+", label: "Success Stories" },
    { icon: TrendingUp, value: 98, suffix: "%", label: "Client Satisfaction" },
];

function AnimatedCounter({ value, suffix }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const duration = 2000;
        const steps = 60;
        const increment = value / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
                setCount(value);
                clearInterval(timer);
            } else {
                setCount(Math.floor(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [value]);

    return (
        <span className="text-3xl md:text-4xl font-bold text-primary">
            {count}{suffix}
        </span>
    );
}

const heroBg = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&h=1080&fit=crop&q=80";

export default function HeroSection() {
    return (
        <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">

            {/* Full-bleed background image */}
            <img
                src={heroBg}
                alt="Fitness training background"
                className="absolute inset-0 w-full h-full object-cover object-center"
            />

            {/* Background Elements */}
            <div className="absolute inset-0 bg-grid opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background" />

            {/* Animated Background Orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />

            {/* Main Content */}
            <div className="relative container mx-auto px-4 pt-16 pb-20">
                <div className="max-w-5xl mx-auto text-center">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8"
                    >
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-sm font-medium text-muted-foreground">
                            Certified Personal Trainer & Nutrition Coach
                        </span>
                    </motion.div>

                    {/* Main Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.15] mb-7 text-white"
                    >
                        Transform Your Body{" "}
                        <br className="hidden md:block" />
                        <span className="text-primary text-glow-lime">With Expert Coaching</span>
                    </motion.h1>

                    {/* Subheadline */}
                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
                    >
                        Personalized fitness coaching, nutrition guidance, and transformation
                        programs designed for real results. Your journey to a stronger,
                        healthier you starts here.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
                    >
                        <Button size="lg" className="glow-lime text-lg px-8 py-6">
                            Start Your Transformation
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="text-lg px-8 py-6 group hover:bg-white/5 hover:text-white hover:border-white/20"
                        >
                            <Play className="mr-2 h-5 w-5 group-hover:text-primary transition-colors" />
                            Watch Success Stories
                        </Button>
                    </motion.div>

                    {/* Stats Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
                    >
                        {stats.map((stat, index) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                                className="glass-card rounded-2xl p-6 hover:border-primary/30 transition-all group"
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <stat.icon className="h-6 w-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                                    <span className="text-sm text-muted-foreground text-center">
                                        {stat.label}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2"
                >
                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="flex flex-col items-center gap-2 text-muted-foreground"
                    >
                        <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
                        <ChevronDown className="h-5 w-5" />
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}


