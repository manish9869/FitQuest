import React from 'react';
import ProgramsSection from '@/components/landing/ProgramsSection';
import FooterSection from '@/components/landing/FooterSection';
import { Button } from '@/components/ui/button';
import { Flame, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Programs() {
    return (
        <div className="min-h-screen bg-background">
            <nav className="glass border-b border-white/5 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <Flame className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="font-space font-bold">FitElite</span>
                </Link>
                <Link to="/"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button></Link>
            </nav>
            <ProgramsSection />
            <FooterSection />
        </div>
    );
}


