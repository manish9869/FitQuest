import React from 'react';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import ProgramsSection from '@/components/landing/ProgramsSection';
import FAQSection from '@/components/landing/FAQSection';
import FooterSection from '@/components/landing/FooterSection';
import { TransformationsSection } from '@/components/landing/TransformationsSection';
import { ToolsSection } from '@/components/landing/ToolsSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { ContactSection } from '@/components/landing/ContactSection';
import { BlogSection } from '@/components/landing/BlogSection';
import DashboardSection from '@/components/landing/DashboardSelection';
import { Button } from '@/components/ui/button';
import { Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/landing/Navbar';
export default function Landing() {
    return (
        <div className="min-h-screen bg-background text-foreground">

            {/* Navbar */}
            <motion.nav
                className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5"
                initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.5 }}
            >
                <Navbar />
            </motion.nav>

            <HeroSection />
            <div id="features"><FeaturesSection /></div>
            <div id="programs"><ProgramsSection /></div>
            <div id="transformations"><TransformationsSection /></div>
            <div id="tools"><ToolsSection /></div>
            <div id="dashboard"><DashboardSection /></div>
            <div id="testimonials"><TestimonialsSection /></div>
            <div id="pricing"><PricingSection /></div>
            {/* <div id="faq"><FAQSection /></div> */}
            <div id="blog"><BlogSection /></div>

            {/* CTA Section */}
            <section className="py-24 px-4 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-lime-950/20 to-transparent" />
                <motion.div
                    className="max-w-3xl mx-auto text-center relative z-10"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-3xl sm:text-5xl font-space font-bold mb-6">
                        Ready to <span className="text-primary">Transform?</span>
                    </h2>
                    <p className="text-lg text-muted-foreground mb-8">
                        Join hundreds who've already started their fitness journey with Sudarshan. Your transformation begins today.
                    </p>
                    <Link to="/dashboard">
                        <Button
                            size="lg"
                            className="text-black rounded-xl py-7 text-lg font-semibold px-10 glow-lime"
                        >
                            Start My Transformation
                        </Button>
                    </Link>
                </motion.div>
            </section>

            <div id="contact"><ContactSection /></div>
            <FooterSection />
        </div>
    );
}


