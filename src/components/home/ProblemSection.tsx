'use client';

import React from 'react';
import { Search, ShieldAlert, Clock } from 'lucide-react';

const CARDS = [
  {
    icon: Search,
    title: 'Keyword Matching Theater',
    description: "ATS tools filter by keywords, not competence. Candidates who know the right buzzwords pass. Candidates who do the actual work often don't.",
    stat: '60–70%',
    statLabel: 'pass ATS despite missing baseline requirements',
  },
  {
    icon: ShieldAlert,
    title: 'Inflation Goes Undetected',
    description: 'No tool checks whether "Led a team of 12" matches a job title that says "Junior Developer." The resume says one thing. The career says another.',
    stat: '40–50%',
    statLabel: 'of resumes contain materially inflated claims',
  },
  {
    icon: Clock,
    title: 'Ranking by Arrival, Not Fit',
    description: 'Resumes are reviewed in the order they arrive. The best candidate in the pile is just as likely to be #147 as #1. Nobody has time for #147.',
    stat: '6–8s',
    statLabel: 'average time spent on initial resume scan',
  },
];

export default function ProblemSection() {
  return (
    <section className="bg-white py-24 md:py-32 relative border-b border-neutral-100">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          
          {/* Left Column: Editorial */}
          <div className="space-y-6">
            <span className="font-data text-xs font-bold uppercase tracking-widest text-[#0000FF] block">
              THE PROBLEM
            </span>
            <h2 className="font-display font-black text-3xl md:text-5xl text-[#0A0A14] tracking-tight leading-none uppercase">
              The hiring system rewards <br />
              <span className="text-[#0000FF]">resume writers</span>, not <br />
              capable candidates.
            </h2>
            <div className="font-body text-neutral-500 text-sm md:text-base space-y-4 leading-relaxed max-w-xl">
              <p>
                A typical senior role attracts 150–400 applications. Your ATS filters by keyword. Your recruiters spend 6 seconds per resume. The system is a lottery dressed as a process.
              </p>
              <p>
                The candidates who surface aren&apos;t the most qualified — they&apos;re the most optimised. They know the keywords. They inflate the titles. They write resumes designed to pass filters, not prove competence.
              </p>
              <p>
                Meanwhile, the engineer who actually built the thing — but wrote a terse, honest resume — sits at position #147 in the pile. Nobody gets to #147.
              </p>
            </div>
          </div>

          {/* Right Column: Problem Cards */}
          <div className="space-y-6">
            {CARDS.map((card, i) => {
              const Icon = card.icon;
              return (
                <div 
                  key={i}
                  className="bg-[#0A0A14] border-l-4 border-l-[#0000FF] border-y border-r border-white/5 hover:border-white/10 rounded-r-xl rounded-l-md p-6 transition-all duration-300 group"
                >
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#0000FF]/10 flex items-center justify-center shrink-0 text-[#0000FF] group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-3 flex-1 min-w-0">
                      <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                        {card.title}
                      </h3>
                      <p className="font-body text-xs text-[#8888AA] leading-relaxed">
                        {card.description}
                      </p>
                      
                      {/* Metric Area */}
                      <div className="flex items-baseline gap-2 pt-2 border-t border-white/5">
                        <span className="font-data text-xl font-black text-white">
                          {card.stat}
                        </span>
                        <span className="font-body text-[10px] text-[#8888AA]">
                          {card.statLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
