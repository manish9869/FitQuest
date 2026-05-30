"use client"

import { useState, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { ChevronLeft, ChevronRight, Scale, Clock, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"

const transformations = [
    {
        id: 1,
        name: "Rahul K.",
        duration: "12 weeks",
        weightLost: "15 kg",
        category: "Fat Loss",
        quote: "Sudarshan's program changed my life. I never thought I could achieve this!",
        stats: { before: "95 kg", after: "80 kg", bodyFat: "-8%" },
    },
    {
        id: 2,
        name: "Priya M.",
        duration: "16 weeks",
        weightLost: "12 kg",
        category: "Lifestyle",
        quote: "The personalized nutrition plan made all the difference for me.",
        stats: { before: "78 kg", after: "66 kg", bodyFat: "-10%" },
    },
    {
        id: 3,
        name: "Amit S.",
        duration: "20 weeks",
        weightLost: "+8 kg muscle",
        category: "Muscle Building",
        quote: "Gained lean muscle while staying shredded. Best coach ever!",
        stats: { before: "65 kg", after: "73 kg", bodyFat: "-3%" },
    },
    {
        id: 4,
        name: "Neha R.",
        duration: "8 weeks",
        weightLost: "8 kg",
        category: "Fat Loss",
        quote: "Quick results with sustainable methods. Highly recommended!",
        stats: { before: "68 kg", after: "60 kg", bodyFat: "-6%" },
    },
    {
        id: 5,
        name: "Vikram P.",
        duration: "24 weeks",
        weightLost: "25 kg",
        category: "Transformation",
        quote: "From overweight to fit. This journey was incredible.",
        stats: { before: "110 kg", after: "85 kg", bodyFat: "-15%" },
    },
    {
        id: 6,
        name: "Anita G.",
        duration: "12 weeks",
        weightLost: "10 kg",
        category: "Toning",
        quote: "Got the toned body I always wanted. Thank you, Sudarshan!",
        stats: { before: "72 kg", after: "62 kg", bodyFat: "-7%" },
    },
]

function BeforeAfterSlider({ transformation }) {
    const [sliderPosition, setSliderPosition] = useState(50)

    return (
        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden glass-card">
            {/* After — base layer, always full width */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <div className="text-center p-4">
                    <p className="text-2xl font-bold text-primary">AFTER</p>
                    <p className="text-lg font-semibold mt-2">{transformation.stats.after}</p>
                </div>
            </div>

            {/* Before — top layer, clips from the left based on slider */}
            <div
                className="absolute inset-0 bg-gradient-to-br from-muted to-background flex items-center justify-center"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
                <div className="text-center p-4">
                    <p className="text-2xl font-bold text-muted-foreground">BEFORE</p>
                    <p className="text-lg font-semibold mt-2">{transformation.stats.before}</p>
                </div>
            </div>

            {/* Slider Control */}
            <div
                className="absolute top-0 bottom-0 w-1 bg-primary cursor-ew-resize"
                style={{ left: `${sliderPosition}%` }}
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary flex items-center justify-center glow-lime">
                    <ChevronLeft className="h-4 w-4 text-primary-foreground" />
                    <ChevronRight className="h-4 w-4 text-primary-foreground" />
                </div>
            </div>

            {/* Slider Input */}
            <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
            />

            {/* Labels */}
            <div className="absolute top-4 left-4 glass px-3 py-1 rounded-full text-xs font-semibold">
                Before
            </div>
            <div className="absolute top-4 right-4 glass px-3 py-1 rounded-full text-xs font-semibold text-primary">
                After
            </div>
        </div>
    )
}

export function TransformationsSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })
    const [selectedIndex, setSelectedIndex] = useState(0)

    const nextSlide = () => {
        setSelectedIndex((prev) => (prev + 1) % transformations.length)
    }

    const prevSlide = () => {
        setSelectedIndex((prev) => (prev - 1 + transformations.length) % transformations.length)
    }

    return (
        <section id="transformations" className="relative py-24 overflow-hidden">
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
                        Real Results
                    </span>
                    <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">
                        Client <span className="text-primary">Transformations</span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
                        Real people, real results. See the incredible transformations achieved
                        through dedication and personalized coaching.
                    </p>
                </motion.div>

                {/* Featured Transformation */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="grid lg:grid-cols-2 gap-8 items-center max-w-5xl mx-auto mb-16"
                >
                    {/* Before/After Slider */}
                    <BeforeAfterSlider transformation={transformations[selectedIndex]} />

                    {/* Details */}
                    <div className="space-y-6">
                        <div>
                            <span className="text-primary text-sm font-semibold uppercase tracking-widest">
                                {transformations[selectedIndex].category}
                            </span>
                            <h3 className="text-3xl font-bold mt-2">
                                {transformations[selectedIndex].name}
                            </h3>
                        </div>

                        <blockquote className="text-xl text-muted-foreground italic border-l-4 border-primary pl-4">
                            &quot;{transformations[selectedIndex].quote}&quot;
                        </blockquote>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="glass-card rounded-xl p-4 text-center">
                                <Scale className="h-5 w-5 text-primary mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">Weight Lost</p>
                                <p className="text-lg font-bold">{transformations[selectedIndex].weightLost}</p>
                            </div>
                            <div className="glass-card rounded-xl p-4 text-center">
                                <Clock className="h-5 w-5 text-primary mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">Duration</p>
                                <p className="text-lg font-bold">{transformations[selectedIndex].duration}</p>
                            </div>
                            <div className="glass-card rounded-xl p-4 text-center">
                                <TrendingDown className="h-5 w-5 text-primary mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">Body Fat</p>
                                <p className="text-lg font-bold">{transformations[selectedIndex].stats.bodyFat}</p>
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={prevSlide}
                                className="rounded-full"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <div className="flex-1 flex items-center justify-center gap-2">
                                {transformations.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedIndex(index)}
                                        className={`w-2 h-2 rounded-full transition-all ${index === selectedIndex
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

                {/* Transformation Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
                >
                    {transformations.map((t, index) => (
                        <motion.button
                            key={t.id}
                            onClick={() => setSelectedIndex(index)}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={isInView ? { opacity: 1, scale: 1 } : {}}
                            transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
                            className={`glass-card rounded-xl p-4 text-center transition-all hover:border-primary/50 ${index === selectedIndex ? "border-primary glow-lime" : ""
                                }`}
                        >
                            <div className="w-12 h-12 rounded-full bg-primary/20 mx-auto mb-2 flex items-center justify-center">
                                <span className="text-lg font-bold text-primary">
                                    {t.name.charAt(0)}
                                </span>
                            </div>
                            <p className="font-semibold text-sm">{t.name}</p>
                            <p className="text-xs text-primary">{t.weightLost}</p>
                        </motion.button>
                    ))}
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="text-center mt-16"
                >
                    <p className="text-muted-foreground mb-4">
                        Ready to write your own success story?
                    </p>
                    <Button size="lg" className="glow-lime">
                        Start Your Transformation
                    </Button>
                </motion.div>
            </div>
        </section>
    )
}


