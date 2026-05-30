import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Award, Clock, Target, Heart, Shield, Zap } from "lucide-react";

const achievements = [
    { icon: Award, value: "500+", label: "Clients Trained" },
    { icon: Clock, value: "8+", label: "Years Experience" },
    { icon: Target, value: "120+", label: "Transformations" },
    { icon: Shield, value: "Certified", label: "Nutrition Coach" },
];

const philosophy = [
    {
        icon: Target,
        title: "Goal-Oriented Approach",
        description: "Every program is tailored to your specific goals, whether it's fat loss, muscle building, or overall fitness.",
    },
    {
        icon: Heart,
        title: "Sustainable Results",
        description: "I focus on building habits that last a lifetime, not quick fixes that fade away.",
    },
    {
        icon: Zap,
        title: "Science-Based Methods",
        description: "All my programs are backed by the latest research in exercise science and nutrition.",
    },
];

const timeline = [
    { year: "2016", event: "Started my fitness journey and discovered my passion for training" },
    { year: "2018", event: "Obtained my first personal training certification" },
    { year: "2020", event: "Became a certified nutrition coach and expanded online coaching" },
    { year: "2022", event: "Reached 300+ successful client transformations" },
    { year: "2024", event: "Launched comprehensive online coaching programs" },
];

export default function FeaturesSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    return (
        <section id="about" className="relative py-24 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />

            <div ref={ref} className="relative container mx-auto px-4">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <span className="text-primary text-sm font-semibold uppercase tracking-widest">
                        About Me
                    </span>
                    <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">
                        Meet Your Coach
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
                        Dedicated to helping you achieve the body and health you deserve through
                        personalized coaching and unwavering support.
                    </p>
                </motion.div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
                    {/* Image Side */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="relative aspect-[4/5] rounded-3xl overflow-hidden glass-card">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center p-8">
                                    <div className="w-32 h-32 rounded-full bg-primary/20 mx-auto mb-6 flex items-center justify-center">
                                        <span className="text-5xl font-bold text-primary">S</span>
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2">Sudarshan</h3>
                                    <p className="text-muted-foreground">Certified Personal Trainer</p>
                                </div>
                            </div>
                            {/* Floating Achievement Cards */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                transition={{ duration: 0.5, delay: 0.6 }}
                                className="absolute top-6 right-6 glass-card rounded-xl p-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                        <Award className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Experience</p>
                                        <p className="font-bold">8+ Years</p>
                                    </div>
                                </div>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                transition={{ duration: 0.5, delay: 0.7 }}
                                className="absolute bottom-6 left-6 glass-card rounded-xl p-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                        <Target className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Transformations</p>
                                        <p className="font-bold">120+</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Content Side */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="space-y-8"
                    >
                        <div>
                            <h3 className="text-2xl md:text-3xl font-bold mb-4">
                                Transforming Lives Through{" "}
                                <span className="text-primary">Fitness Excellence</span>
                            </h3>
                            <p className="text-muted-foreground leading-relaxed mb-4">
                                With over 8 years of experience in the fitness industry, I have helped
                                hundreds of clients achieve their dream physiques and improve their
                                overall health. My journey began with my own transformation, which
                                ignited my passion for helping others.
                            </p>
                            <p className="text-muted-foreground leading-relaxed">
                                As a certified personal trainer and nutrition coach, I combine
                                scientific knowledge with practical experience to deliver results
                                that last. Every client receives a customized approach based on
                                their unique goals, lifestyle, and preferences.
                            </p>
                        </div>

                        {/* Philosophy Cards */}
                        <div className="space-y-4">
                            {philosophy.map((item, index) => (
                                <motion.div
                                    key={item.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                                    transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                                    className="glass-card rounded-xl p-4 hover:border-primary/30 transition-all group"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/30 transition-colors">
                                            <item.icon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-1">{item.title}</h4>
                                            <p className="text-sm text-muted-foreground">{item.description}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Achievement Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20"
                >
                    {achievements.map((item, index) => (
                        <motion.div
                            key={item.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={isInView ? { opacity: 1, scale: 1 } : {}}
                            transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                            className="glass-card rounded-2xl p-6 text-center hover:border-primary/30 transition-all group"
                        >
                            <item.icon className="h-8 w-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
                            <p className="text-3xl font-bold text-primary mb-1">{item.value}</p>
                            <p className="text-sm text-muted-foreground">{item.label}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Timeline */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.6 }}
                >
                    <h3 className="text-2xl font-bold text-center mb-10">My Journey</h3>
                    <div className="relative">
                        {/* Timeline Line */}
                        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-border" />

                        <div className="space-y-8">
                            {timeline.map((item, index) => (
                                <motion.div
                                    key={item.year}
                                    initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                                    transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                                    className={`relative flex items-center ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                                        }`}
                                >
                                    {/* Dot */}
                                    <div className="absolute left-4 md:left-1/2 w-3 h-3 bg-primary rounded-full -translate-x-1/2 glow-lime" />

                                    {/* Content */}
                                    <div className={`ml-12 md:ml-0 md:w-1/2 ${index % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"}`}>
                                        <span className="text-primary font-bold">{item.year}</span>
                                        <p className="text-muted-foreground mt-1">{item.event}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}


