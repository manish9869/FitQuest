import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Flame, Dumbbell, Target, Monitor, Apple, Zap, Home, Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const programs = [
    {
        icon: Flame,
        title: "Fat Loss",
        description: "Scientifically designed programs to burn fat efficiently while preserving muscle mass.",
        features: ["Custom meal plans", "HIIT workouts", "Progress tracking"],
        color: "from-orange-500/20 to-red-500/20",
    },
    {
        icon: Dumbbell,
        title: "Muscle Building",
        description: "Build lean muscle mass with structured hypertrophy programs tailored to your level.",
        features: ["Progressive overload", "Nutrition optimization", "Recovery protocols"],
        color: "from-blue-500/20 to-cyan-500/20",
    },
    {
        icon: Target,
        title: "Strength Training",
        description: "Increase your overall strength and power with periodized strength programs.",
        features: ["Compound movements", "Strength periodization", "Form coaching"],
        color: "from-emerald-500/20 to-green-500/20",
    },
    {
        icon: Monitor,
        title: "Online Coaching",
        description: "Full online coaching experience with personalized programs and weekly check-ins.",
        features: ["Video consultations", "24/7 support", "App access"],
        color: "from-purple-500/20 to-pink-500/20",
    },
    {
        icon: Apple,
        title: "Nutrition Planning",
        description: "Customized nutrition plans that fit your lifestyle and support your fitness goals.",
        features: ["Macro calculations", "Meal templates", "Supplement guidance"],
        color: "from-emerald-500/20 to-teal-500/20",
    },
    {
        icon: Zap,
        title: "Functional Training",
        description: "Improve overall fitness, mobility, and functional strength for daily life.",
        features: ["Mobility work", "Core strength", "Athletic performance"],
        color: "from-yellow-500/20 to-amber-500/20",
    },
    {
        icon: Home,
        title: "Home Workouts",
        description: "Effective workout programs designed for home with minimal equipment required.",
        features: ["Minimal equipment", "Flexible scheduling", "Bodyweight options"],
        color: "from-indigo-500/20 to-violet-500/20",
    },
    {
        icon: Heart,
        title: "Lifestyle Coaching",
        description: "Holistic approach including sleep, stress management, and habit building.",
        features: ["Habit coaching", "Stress management", "Sleep optimization"],
        color: "from-rose-500/20 to-pink-500/20",
    },
];

export default function ProgramsSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    return (
        <section id="programs" className="relative py-24 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-grid opacity-30" />

            <div ref={ref} className="relative container mx-auto px-4">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <span className="text-primary text-sm font-semibold uppercase tracking-widest">
                        Programs
                    </span>
                    <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">
                        Choose Your Path to{" "}
                        <span className="text-primary">Success</span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
                        Whether you want to lose fat, build muscle, or improve your overall fitness,
                        I have a program designed specifically for your goals.
                    </p>
                </motion.div>

                {/* Programs Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {programs.map((program, index) => (
                        <motion.div
                            key={program.title}
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
                            className="group"
                        >
                            <div className="h-full glass-card rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
                                {/* Icon */}
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${program.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                                    <program.icon className="h-7 w-7 text-foreground" />
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                                    {program.title}
                                </h3>
                                <p className="text-muted-foreground text-sm mb-5 leading-relaxed">
                                    {program.description}
                                </p>

                                {/* Features */}
                                <ul className="space-y-2 mb-6">
                                    {program.features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-2 text-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            <span className="text-muted-foreground">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                <Button
                                    variant="ghost"
                                    className="w-full group/btn hover:bg-primary/10 hover:text-primary"
                                >
                                    Learn More
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="text-center mt-16"
                >
                    <p className="text-muted-foreground mb-6">
                        Not sure which program is right for you?
                    </p>
                    <Button size="lg" className="glow-lime">
                        Book a Free Consultation
                    </Button>
                </motion.div>
            </div>
        </section>
    )
}


