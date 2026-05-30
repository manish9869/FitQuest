import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";


const testimonials = [
    {
        id: 1,
        name: "Rajesh Kumar",
        role: "Software Engineer",
        rating: 5,
        text: "Sudarshan's coaching completely transformed my approach to fitness. Lost 18kg in 4 months while gaining strength. His scientific approach and constant support made all the difference.",
        transformation: "Lost 18kg",
        duration: "4 months",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80",
    },
    {
        id: 2,
        name: "Priyanka Sharma",
        role: "Marketing Manager",
        rating: 5,
        text: "As a working professional, I thought fitness was impossible. Sudarshan created a plan that fit my hectic schedule. Now I'm stronger and more energetic than ever!",
        transformation: "Lost 12kg",
        duration: "3 months",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&q=80",
    },
    {
        id: 3,
        name: "Amit Patel",
        role: "Business Owner",
        rating: 5,
        text: "The best investment I've made in myself. Not just about workouts, but complete lifestyle transformation. My energy levels are through the roof!",
        transformation: "Gained 8kg muscle",
        duration: "6 months",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&q=80",
    },
    {
        id: 4,
        name: "Sneha Reddy",
        role: "Doctor",
        rating: 5,
        text: "Being a healthcare professional, I appreciate the evidence-based approach. The nutrition plans are practical and the workout routines are efficient. Highly recommended!",
        transformation: "Lost 10kg",
        duration: "3 months",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&q=80",
    },
    {
        id: 5,
        name: "Vikram Singh",
        role: "Athlete",
        rating: 5,
        text: "Sudarshan helped me take my athletic performance to the next level. The periodized training and recovery protocols were exactly what I needed for competition prep.",
        transformation: "Competition ready",
        duration: "12 weeks",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&q=80",
    },
    {
        id: 6,
        name: "Meera Joshi",
        role: "Homemaker",
        rating: 5,
        text: "Started my fitness journey at 45 and never felt better! The home workout plans are perfect, and the constant motivation keeps me going. Thank you, Sudarshan!",
        transformation: "Lost 15kg",
        duration: "5 months",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&q=80",
    },
];


export default function TestimonialsSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isAutoPlaying, setIsAutoPlaying] = useState(true)

    useEffect(() => {
        if (!isAutoPlaying) return

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % testimonials.length)
        }, 5000)

        return () => clearInterval(timer)
    }, [isAutoPlaying])

    const nextSlide = () => {
        setIsAutoPlaying(false)
        setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }

    const prevSlide = () => {
        setIsAutoPlaying(false)
        setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
    }

    return (
        <section id="testimonials" className="relative py-24 overflow-hidden">
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
                        Testimonials
                    </span>
                    <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">
                        What Clients <span className="text-primary">Say</span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
                        Real stories from real people who transformed their lives through
                        dedicated coaching and hard work.
                    </p>
                </motion.div>

                {/* Featured Testimonial */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="max-w-4xl mx-auto mb-12"
                >
                    <div className="glass-card rounded-3xl p-8 md:p-12 relative">
                        {/* Quote Icon */}
                        <Quote className="absolute top-6 left-6 h-12 w-12 text-primary/20" />

                        {/* Content */}
                        <div className="relative z-10">
                            {/* Stars */}
                            <div className="flex items-center gap-1 mb-6">
                                {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                                    <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                                ))}
                            </div>

                            {/* Quote */}
                            <blockquote className="text-xl md:text-2xl leading-relaxed mb-8">
                                &quot;{testimonials[currentIndex].text}&quot;
                            </blockquote>

                            {/* Author */}
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={testimonials[currentIndex].avatar}
                                        alt={testimonials[currentIndex].name}
                                        className="w-14 h-14 rounded-full object-cover border-2 border-primary/30"
                                    />

                                    <div>
                                        <p className="font-semibold">{testimonials[currentIndex].name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {testimonials[currentIndex].role}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-center">
                                        <p className="text-primary font-bold">{testimonials[currentIndex].transformation}</p>
                                        <p className="text-xs text-muted-foreground">Result</p>
                                    </div>
                                    <div className="w-px h-10 bg-border" />
                                    <div className="text-center">
                                        <p className="font-bold">{testimonials[currentIndex].duration}</p>
                                        <p className="text-xs text-muted-foreground">Duration</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center justify-center gap-4 mt-8">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={prevSlide}
                                className="rounded-full"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <div className="flex items-center gap-2">
                                {testimonials.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            setIsAutoPlaying(false)
                                            setCurrentIndex(index)
                                        }}
                                        className={`w-2 h-2 rounded-full transition-all ${index === currentIndex
                                            ? "w-8 bg-primary"
                                            : "bg-muted hover:bg-muted-foreground"
                                            }`}
                                    />
                                ))}
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={nextSlide}
                                className="rounded-full"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {/* Testimonial Cards Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {testimonials.slice(0, 3).map((testimonial, index) => (
                        <motion.div
                            key={testimonial.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={isInView ? { opacity: 1, scale: 1 } : {}}
                            transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                            className="border border-white/10 bg-white/5 rounded-2xl p-6 hover:border-primary/30 transition-all"
                        >
                            <div className="flex items-center gap-1 mb-4">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                                ))}
                            </div>
                            <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-4">
                                &quot;{testimonial.text}&quot;
                            </p>
                            <div className="flex items-center gap-3">
                                <img
                                    src={testimonial.avatar}
                                    alt={testimonial.name}
                                    className="w-10 h-10 rounded-full object-cover border border-primary/20"
                                />
                                <div>
                                    <p className="font-semibold text-sm">{testimonial.name}</p>
                                    <p className="text-xs text-muted-foreground">{testimonial.transformation}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}


