import { motion } from "framer-motion";
import {
    Dumbbell,
    Instagram,
    Youtube,
    MessageCircle,
    Mail,
    Heart
} from "lucide-react"
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input"
const footerLinks = {
    quickLinks: [
        { name: "Home", href: "#home" },
        { name: "About", href: "#features" },
        { name: "Programs", href: "#programs" },
        { name: "Testimonials", href: "#testimonials" },
        { name: "FAQ", href: "#faq" },
    ],
    programs: [
        { name: "Fat Loss", href: "#programs" },
        { name: "Muscle Building", href: "#programs" },
        { name: "Online Coaching", href: "#programs" },
        { name: "Nutrition Planning", href: "#programs" },
    ],
    resources: [
        { name: "Fitness Blog", href: "#" },
        { name: "Success Stories", href: "#testimonials" },
        { name: "Free Consultation", href: "#" },
        { name: "Dashboard", href: "/dashboard" },
    ],
};

const socialLinks = [
    { icon: Instagram, label: "Instagram", href: "#" },
    { icon: Youtube, label: "YouTube", href: "#" },
    { icon: MessageCircle, label: "WhatsApp", href: "#" },
    { icon: Mail, label: "Email", href: "mailto:coach@fitwithsudarshan.com" },
];

export default function FooterSection() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="relative pt-20 pb-8 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-t from-muted/50 to-background" />
            <div className="absolute inset-0 bg-grid opacity-20" />

            <div className="relative container mx-auto px-4">
                {/* Newsletter Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="glass-card rounded-2xl p-8 md:p-12 mb-16 border-primary/20"
                >
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div>
                            <h3 className="text-2xl md:text-3xl font-bold mb-4">
                                Get Free Fitness Tips
                            </h3>
                            <p className="text-muted-foreground">
                                Subscribe to my newsletter for weekly workout tips, nutrition advice,
                                and exclusive content delivered to your inbox.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Input
                                type="email"
                                placeholder="Enter your email"
                                className="bg-muted/50 flex-1"
                            />
                            <Button className="glow-lime whitespace-nowrap">
                                Subscribe
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {/* Main Footer Content */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-4 lg:col-span-1">
                        {/* Use <a> for hash links instead of react-router Link */}
                        <a href="#home" className="flex items-center gap-2 mb-4">
                            <Dumbbell className="h-8 w-8 text-primary" />
                            <span className="text-xl font-bold">
                                Fit with <span className="text-primary">Sudarshan</span>
                            </span>
                        </a>
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                            Transform your body with expert coaching.
                            Personalized fitness programs designed for real results.
                        </p>
                        {/* Social Links */}
                        <div className="flex items-center gap-3">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    className="w-10 h-10 rounded-full glass flex items-center justify-center hover:border-primary/50 hover:text-primary transition-all"
                                    aria-label={social.label}
                                >
                                    <social.icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-semibold mb-4">Quick Links</h4>
                        <ul className="space-y-2">
                            {footerLinks.quickLinks.map((link) => (
                                <li key={link.name}>
                                    <a
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Programs */}
                    <div>
                        <h4 className="font-semibold mb-4">Programs</h4>
                        <ul className="space-y-2">
                            {footerLinks.programs.map((link) => (
                                <li key={link.name}>
                                    <a
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="font-semibold mb-4">Resources</h4>
                        <ul className="space-y-2">
                            {footerLinks.resources.map((link) => (
                                <li key={link.name}>
                                    <a
                                        href={link.href}
                                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-border pt-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground text-center md:text-left">
                            {currentYear} Fit with Sudarshan. All rights reserved.
                        </p>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <a href="#" className="hover:text-primary transition-colors">
                                Privacy Policy
                            </a>
                            <a href="#" className="hover:text-primary transition-colors">
                                Terms of Service
                            </a>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                            Made with <Heart className="h-3 w-3 text-red-500 fill-red-500 mx-1" /> for fitness enthusiasts
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    )
}


