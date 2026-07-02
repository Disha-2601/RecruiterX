'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import LandingSandbox from '../LandingSandbox';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen bg-[#0A0A14] pt-32 pb-20 flex flex-col items-center justify-center overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#0000FF]/15 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#0000FF]/10 rounded-full filter blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 w-full flex flex-col items-center text-center relative z-10 space-y-10">
        
        {/* Badges Row */}
        <div className="flex flex-wrap gap-3 justify-center items-center">
          <div className="flex items-center gap-1.5 border border-white/10 bg-white/5 rounded-full px-4 py-1.5 text-xs text-white/80 font-medium">
            <Calendar className="w-3.5 h-3.5 text-[#0000FF]" />
            <span>Receive ≤ 35 days</span>
          </div>
          <div className="flex items-center gap-1.5 border border-white/10 bg-white/5 rounded-full px-4 py-1.5 text-xs text-white/80 font-medium">
            <Clock className="w-3.5 h-3.5 text-[#0000FF]" />
            <span>Available 24 Days</span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="font-display font-black text-5xl md:text-7xl tracking-tight text-white leading-none uppercase">
            NEW ERA OF CANDIDATE <br className="hidden md:inline" />
            <span className="text-[#0000FF]">INTELLIGENCE</span>
          </h1>
          <p className="font-body text-neutral-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Find who actually suits the system and write for the resume, rank and shortlist qualifying every candidate to parallel.
          </p>
        </div>

        {/* CTA Button */}
        <div>
          <Link
            href="/dashboard"
            className="bg-[#0000FF] hover:bg-[#0000CC] text-white text-xs font-semibold rounded-full px-8 py-4 transition-all flex items-center gap-2 active:scale-[0.98] shadow-[0_4px_20px_rgba(0,0,255,0.3)] hover:shadow-[0_4px_30px_rgba(0,0,255,0.5)]"
          >
            <span>Start Your First Analysis</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Interactive Sandbox Console */}
        <div className="w-full max-w-4xl pt-8 relative">
          {/* Card glow */}
          <div className="absolute inset-0 bg-[#0000FF]/5 rounded-3xl filter blur-[40px] pointer-events-none transform translate-y-8" />
          <LandingSandbox />
        </div>

      </div>
    </section>
  );
}
