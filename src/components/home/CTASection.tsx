'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-br from-[#0A0A14] via-[#0D0D26] to-[#0000FF]/25 border-b border-white/5">
      {/* Visual background element */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,255,0.08),transparent_60%)] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10">
        
        {/* Heading */}
        <h2 className="font-display font-black text-3xl md:text-5xl text-white tracking-tight uppercase leading-tight max-w-2xl mx-auto">
          The best candidate in your current <br />
          pile is probably <span className="text-[#0000FF]">not at the top</span> of it.
        </h2>

        {/* Subline */}
        <p className="font-body text-[#8888AA] text-xs md:text-sm max-w-xl mx-auto leading-relaxed">
          Upload your JD, bring in the dataset, and get a ranked shortlist ready in minutes. No setup. No training. Just drop in your data and see.
        </p>

        {/* Button */}
        <div className="pt-4 flex justify-center">
          <Link
            href="/dashboard"
            className="bg-white hover:bg-neutral-100 text-[#0A0A14] text-xs font-semibold rounded-full px-8 py-4 transition-all flex items-center gap-2 active:scale-[0.98] shadow-lg shadow-white/5"
          >
            <span>Start Your First Analysis</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
}
