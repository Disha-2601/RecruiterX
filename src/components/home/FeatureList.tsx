'use client';

import React from 'react';

const FEATURES = [
  {
    num: '01',
    title: 'JD Audit',
    desc: 'Your job description is parsed, structured, and scored. Must-haves are separated from nice-to-haves.',
    highlight: false,
  },
  {
    num: '02',
    title: 'Ghost Candidate',
    desc: 'A synthetic ideal candidate profile is constructed from your job description first. Every real resume is compared to this fixed reference point.',
    highlight: true,
  },
  {
    num: '03',
    title: 'Candidate Deep Analysis',
    desc: 'Three layers run in parallel: career trajectory analysis, behavioral signal detection, and credibility auditing.',
    highlight: false,
  },
  {
    num: '04',
    title: 'Insider Signal Test',
    desc: 'Checks for the presence of implicit practitioner indicators and flags suspicious pride markers or title inflation.',
    highlight: false,
  },
  {
    num: '05',
    title: 'Ghost Match Score',
    desc: 'Candidates are scored 0-100 against the Ghost benchmark. Gap reports show exactly where they fall short.',
    highlight: true,
  },
  {
    num: '06',
    title: 'Hybrid Ranker',
    desc: 'Fuses all layers into a single ranked shortlist. Weight sliders let you prioritise what matters most.',
    highlight: false,
  },
  {
    num: '07',
    title: 'Interrogation Engine',
    desc: 'Three surgical interview questions per candidate, calibrated to probe their specific suspicious gaps.',
    highlight: false,
  },
];

export default function FeatureList() {
  return (
    <section className="bg-white py-24 md:py-32 relative border-b border-neutral-100">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Centered Header */}
        <div className="text-center mb-16 space-y-4">
          <span className="font-data text-xs font-bold uppercase tracking-widest text-[#0000FF] block">
            THE PLATFORM
          </span>
          <h2 className="font-display font-black text-3xl md:text-5xl text-[#0A0A14] tracking-tight uppercase leading-none">
            Seven layers of intelligence. <br />
            One <span className="text-[#0000FF]">ranked shortlist</span>.
          </h2>
        </div>

        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          
          {/* Left Column: Numbered List */}
          <div className="space-y-4">
            {FEATURES.map((feat) => (
              <div 
                key={feat.num}
                className={`flex gap-4 p-4 rounded-xl transition-all duration-300 ${
                  feat.highlight ? 'bg-neutral-50 border border-neutral-200/60 shadow-sm' : 'opacity-65 hover:opacity-100'
                }`}
              >
                {/* Number Circle */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-data text-xs font-bold shrink-0 ${
                  feat.highlight ? 'bg-[#0000FF] text-white' : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                }`}>
                  {feat.num}
                </div>
                
                {/* Text Content */}
                <div className="space-y-1">
                  <h3 className={`font-display font-bold text-sm uppercase tracking-wider text-[#0A0A14] ${
                    feat.highlight ? 'font-black' : ''
                  }`}>
                    {feat.title}
                  </h3>
                  <p className="font-body text-xs text-neutral-500 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: UI Preview Card */}
          <div className="relative">
            {/* Glow backing */}
            <div className="absolute inset-0 bg-[#0000FF]/5 rounded-2xl filter blur-[30px] pointer-events-none" />

            <div className="relative bg-[#0A0A14] border border-white/10 rounded-2xl p-6 shadow-[0_16px_40px_rgba(0,0,0,0.6)] space-y-6 select-none text-left">
              
              {/* Header */}
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="font-display font-bold text-xs uppercase text-white tracking-widest">
                  Ghost Candidate Profile
                </span>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                </div>
              </div>

              {/* Row Items */}
              <div className="space-y-4">
                <div className="text-[11px] font-mono text-[#8888AA]">
                  Target Segment: <span className="text-white font-bold">Revenue · Platform · Staff Ops</span>
                </div>

                {/* Skill tags */}
                <div className="space-y-2">
                  <span className="font-data text-[9px] font-bold text-[#8888AA] uppercase tracking-wider block">
                    Core Trajectory Anchors
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] rounded-full px-2.5 py-0.5">
                      Operational Design
                    </span>
                    <span className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] rounded-full px-2.5 py-0.5">
                      Staff Analytics
                    </span>
                    <span className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] rounded-full px-2.5 py-0.5">
                      Revenue Tracking
                    </span>
                  </div>
                </div>

                {/* Large Match Score Visual */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="font-data text-[9px] font-bold text-[#8888AA] uppercase tracking-wider block">
                      Archetype Match
                    </span>
                    <p className="font-body text-xs text-neutral-400 leading-normal max-w-[200px]">
                      Constructed ideal reference vector for the target role.
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-display font-black text-3xl text-rose-400">
                      78%
                    </span>
                    <span className="text-[8px] font-mono text-white/40 uppercase">Confidence</span>
                  </div>
                </div>

                <p className="font-body text-[11px] text-neutral-500 italic">
                  * Note: Benchmarking parses career timelines in isolation to prevent structural recruitment bias.
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
