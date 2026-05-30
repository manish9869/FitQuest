"use client"

import { useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import {
    Mail,
    Phone,
    MapPin,
    Send,
    MessageCircle,
    Instagram,
    Youtube,
    Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

const contactInfo = [
    {
        icon: Phone,
        label: "Phone",
        value: "+91 98765 43210",
        href: "tel:+919876543210",
    },
    {
        icon: Mail,
        label: "Email",
        value: "coach@fitwithsudarshan.com",
        href: "mailto:coach@fitwithsudarshan.com",
    },
    {
        icon: MapPin,
        label: "Location",
        value: "Mumbai, India",
        href: "#",
    },
]

const socialLinks = [
    { icon: Instagram, label: "Instagram", href: "#" },
    { icon: Youtube, label: "YouTube", href: "#" },
    { icon: MessageCircle, label: "WhatsApp", href: "#" },
]

export function ContactSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 2000))
        setIsSubmitting(false)
        alert("Thank you for your message! I'll get back to you soon.")
    }

    return (
        <section id="contact" className="relative py-24 overflow-hidden">
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
                        Contact
                    </span>
                    <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">
                        Let&apos;s <span className="text-primary">Connect</span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
                        Ready to start your transformation? Get in touch and let&apos;s discuss
                        how I can help you achieve your fitness goals.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
                    {/* Contact Info */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="space-y-8"
                    >
                        <div>
                            <h3 className="text-2xl font-bold mb-4">Get in Touch</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Have questions about coaching programs? Want to discuss your fitness goals?
                                I&apos;m here to help. Reach out through any of the channels below.
                            </p>
                        </div>

                        {/* Contact Cards */}
                        <div className="space-y-4">
                            {contactInfo.map((item, index) => (
                                <motion.a
                                    key={item.label}
                                    href={item.href}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                                    className="flex items-center gap-4 glass-card rounded-xl p-4 hover:border-primary/30 transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                                        <item.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">{item.label}</p>
                                        <p className="font-semibold">{item.value}</p>
                                    </div>
                                </motion.a>
                            ))}
                        </div>

                        {/* Social Links */}
                        <div>
                            <p className="text-sm text-muted-foreground mb-4">Follow me on social media</p>
                            <div className="flex items-center gap-3">
                                {socialLinks.map((social, index) => (
                                    <motion.a
                                        key={social.label}
                                        href={social.href}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                        transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                                        className="w-12 h-12 rounded-full glass-card flex items-center justify-center hover:border-primary/50 hover:text-primary transition-all"
                                        aria-label={social.label}
                                    >
                                        <social.icon className="h-5 w-5" />
                                    </motion.a>
                                ))}
                            </div>
                        </div>

                        {/* WhatsApp CTA */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: 0.6 }}
                            className="glass-card rounded-2xl p-6 border-primary/20"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <MessageCircle className="h-6 w-6 text-green-400" />
                                </div>
                                <div>
                                    <p className="font-semibold">Quick Response on WhatsApp</p>
                                    <p className="text-sm text-muted-foreground">Usually replies within 2 hours</p>
                                </div>
                            </div>
                            <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                                <MessageCircle className="mr-2 h-4 w-4" />
                                Message on WhatsApp
                            </Button>
                        </motion.div>
                    </motion.div>

                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <div className="glass-card rounded-2xl p-6 md:p-8">
                            <h3 className="text-xl font-bold mb-6">Send a Message</h3>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="Your name"
                                            className="bg-muted/50"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            placeholder="+91 98765 43210"
                                            className="bg-muted/50"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="your@email.com"
                                        className="bg-muted/50"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="goal">Fitness Goal</Label>
                                    <Input
                                        id="goal"
                                        placeholder="e.g., Fat loss, Muscle building"
                                        className="bg-muted/50"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message">Message</Label>
                                    <Textarea
                                        id="message"
                                        placeholder="Tell me about your fitness goals..."
                                        className="bg-muted/50 min-h-[120px]"
                                        required
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full glow-lime"
                                    size="lg"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            Send Message
                                        </>
                                    )}
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}


