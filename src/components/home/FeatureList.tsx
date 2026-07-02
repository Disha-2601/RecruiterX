'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Zap, Settings, Activity } from 'lucide-react';

const FEATURES = [
  {
    num: '01',
    title: 'JD Audit',
    desc: 'Your job description is parsed, structured, and scored. Must-haves are separated from nice-to-haves.',
  },
  {
    num: '02',
    title: 'Ghost Candidate',
    desc: 'A synthetic ideal candidate profile is constructed from your job description first. Every real resume is compared to this fixed reference point.',
  },
  {
    num: '03',
    title: 'Candidate Deep Analysis',
    desc: 'Three layers run in parallel: career trajectory analysis, behavioral signal detection, and credibility auditing.',
  },
  {
    num: '04',
    title: 'Insider Signal Test',
    desc: 'Checks for the presence of implicit practitioner indicators and flags suspicious pride markers or title inflation.',
  },
  {
    num: '05',
    title: 'Ghost Match Score',
    desc: 'Candidates are scored 0-100 against the Ghost benchmark. Gap reports show exactly where they fall short.',
  },
  {
    num: '06',
    title: 'Hybrid Ranker',
    desc: 'Fuses all layers into a single ranked shortlist. Weight sliders let you prioritise what matters most.',
  },
  {
    num: '07',
    title: 'Interrogation Engine',
    desc: 'Three surgical interview questions per candidate, calibrated to probe their specific suspicious gaps.',
  },
];

export default function FeatureList() {
  const [activeIdx, setActiveIdx] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-30% 0px -40% 0px',
      threshold: 0.2,
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = itemRefs.current.indexOf(entry.target as HTMLDivElement);
          if (index !== -1) {
            setActiveIdx(index);
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    itemRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const renderMockup = (idx: number) => {
    switch (idx) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="text-[11px] font-mono text-[#8888AA]">
              Status: <span className="text-emerald-400 font-bold">Successfully Parsed</span>
            </div>
            <div className="space-y-2 bg-white/5 border border-white/10 rounded-xl p-4">
              <span className="font-data text-[10px] font-bold text-[#8888AA] uppercase tracking-wider block text-left">Must-Have Skills</span>
              <div className="flex flex-wrap gap-1.5 justify-start">
                <span className="bg-[#0000FF]/20 border border-[#0000FF]/30 text-blue-300 text-[10px] rounded-full px-2.5 py-0.5 font-mono">Python (1.0)</span>
                <span className="bg-[#0000FF]/20 border border-[#0000FF]/30 text-blue-300 text-[10px] rounded-full px-2.5 py-0.5 font-mono">RAG (0.9)</span>
                <span className="bg-[#0000FF]/20 border border-[#0000FF]/30 text-blue-300 text-[10px] rounded-full px-2.5 py-0.5 font-mono">Vector DBs (1.0)</span>
              </div>
              <span className="font-data text-[10px] font-bold text-[#8888AA] uppercase tracking-wider block pt-2 text-left">Nice-To-Have Skills</span>
              <div className="flex flex-wrap gap-1.5 justify-start">
                <span className="bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] rounded-full px-2.5 py-0.5 font-mono">Fine-Tuning (0.4)</span>
                <span className="bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] rounded-full px-2.5 py-0.5 font-mono">LoRA (0.4)</span>
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-[11px] font-mono text-[#8888AA]">
              Target Segment: <span className="text-white font-bold">Revenue · Platform · Staff Ops</span>
            </div>
            <div className="space-y-2 text-left">
              <span className="font-data text-[9px] font-bold text-[#8888AA] uppercase tracking-wider block">Core Trajectory Anchors</span>
              <div className="flex flex-wrap gap-1.5 justify-start">
                <span className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] rounded-full px-2.5 py-0.5">Operational Design</span>
                <span className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] rounded-full px-2.5 py-0.5">Staff Analytics</span>
                <span className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] rounded-full px-2.5 py-0.5">Revenue Tracking</span>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
              <div className="space-y-1 text-left">
                <span className="font-data text-[9px] font-bold text-[#8888AA] uppercase tracking-wider block">Archetype Match</span>
                <p className="font-body text-xs text-neutral-400 leading-normal max-w-[200px]">Constructed ideal reference vector for the target role.</p>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-display font-black text-3xl text-rose-400">78%</span>
                <span className="text-[8px] font-mono text-white/40 uppercase">Confidence</span>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="text-[11px] font-mono text-[#8888AA]">
              Layer Status: <span className="text-blue-400 font-bold">Scanning Complete</span>
            </div>
            <div className="space-y-3 bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="space-y-1 text-left">
                <div className="flex justify-between text-xs">
                  <span className="text-[#8888AA]">Career Trajectory</span>
                  <span className="text-white font-bold font-mono">85%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
              <div className="space-y-1 text-left">
                <div className="flex justify-between text-xs">
                  <span className="text-[#8888AA]">Behavioral Signal</span>
                  <span className="text-white font-bold font-mono">92%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0000FF] rounded-full" style={{ width: '92%' }} />
                </div>
              </div>
              <div className="space-y-1 text-left">
                <div className="flex justify-between text-xs">
                  <span className="text-[#8888AA]">Credibility Audit</span>
                  <span className="text-white font-bold font-mono">100%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="text-[11px] font-mono text-[#8888AA]">
              Consistency Check: <span className="text-amber-400 font-bold">Discrepancies Flagged</span>
            </div>
            <div className="space-y-2">
              <div className="bg-amber-500/10 border border-amber-500/25 rounded-lg p-3 text-xs text-amber-300 flex items-start gap-2 text-left">
                <span className="shrink-0 font-bold">⚠️</span>
                <div>
                  <p className="font-bold">Claims expert proficiency with low duration</p>
                  <p className="text-[10px] text-amber-300/80 mt-0.5">CUDA claimed expert but only 2 months of experience.</p>
                </div>
              </div>
              <div className="bg-rose-500/10 border border-rose-500/25 rounded-lg p-3 text-xs text-rose-300 flex items-start gap-2 text-left">
                <span className="shrink-0 font-bold">🚨</span>
                <div>
                  <p className="font-bold">Suspicious uniformity across skills</p>
                  <p className="text-[10px] text-rose-300/80 mt-0.5">All 8 core skills marked as "Expert" on self-claims.</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#8888AA]">Composite Score</span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">QUALIFIED</span>
            </div>
            <div className="flex items-center gap-6 bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="relative w-16 h-16 flex items-center justify-center rounded-full border-4 border-[#0000FF] border-t-white/20 animate-spin shrink-0">
                <span className="font-display font-black text-xl text-white">84</span>
              </div>
              <div className="space-y-1 text-left">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Candidate Match High</h4>
                <p className="text-[10px] text-[#8888AA]">Strong semantic alignment across Python, RAG, and Vector DBs.</p>
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <div className="text-[11px] font-mono text-[#8888AA]">
              Weight Tuning: <span className="text-blue-400 font-bold">Custom Weights Selected</span>
            </div>
            <div className="space-y-2 bg-white/5 border border-white/10 rounded-xl p-4 text-[11px] text-left">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#8888AA]">Skill Match</span>
                  <span className="text-white font-bold">40%</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full"><div className="h-full bg-blue-500 rounded-full" style={{ width: '40%' }} /></div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#8888AA]">Experience Fit</span>
                  <span className="text-white font-bold">25%</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full"><div className="h-full bg-blue-500 rounded-full" style={{ width: '25%' }} /></div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#8888AA]">Behavioral Signals</span>
                  <span className="text-white font-bold">20%</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full"><div className="h-full bg-blue-500 rounded-full" style={{ width: '20%' }} /></div>
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <div className="text-[11px] font-mono text-[#8888AA]">
              Calibrated for: <span className="text-white font-bold">Anonymized Candidate #1032</span>
            </div>
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-[11px] text-neutral-300 text-left">
                <p className="font-bold text-white mb-1">Question 1</p>
                <p className="leading-relaxed text-neutral-400">"You claimed expert proficiency in CUDA, but your longest project lasted only 2 months. Can you explain your hands-on contribution..."</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-[11px] text-neutral-300 text-left">
                <p className="font-bold text-white mb-1">Question 2</p>
                <p className="leading-relaxed text-neutral-400">"Your career history shows overlapping roles at Company A and Company B. Tell us about..."</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section className="bg-white py-24 md:py-32 relative border-b border-neutral-100">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Centered Header */}
        <div className="text-center mb-24 space-y-4">
          <span className="font-data text-xs font-bold uppercase tracking-widest text-[#0000FF] block">
            THE PLATFORM
          </span>
          <h2 className="font-display font-black text-3xl md:text-5xl text-[#0A0A14] tracking-tight uppercase leading-none">
            Seven layers of intelligence. <br />
            One <span className="text-[#0000FF]">ranked shortlist</span>.
          </h2>
        </div>

        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
          
          {/* Left Column: Numbered List */}
          <div className="space-y-12 pb-24">
            {FEATURES.map((feat, idx) => {
              const isActive = idx === activeIdx;
              return (
                <div 
                  key={feat.num}
                  ref={(el) => {
                    itemRefs.current[idx] = el;
                  }}
                  className={`flex gap-5 p-6 rounded-2xl border transition-all duration-500 text-left ${
                    isActive 
                      ? 'bg-neutral-50 border-neutral-200 shadow-md translate-x-2 scale-[1.02] opacity-100' 
                      : 'border-transparent opacity-30 hover:opacity-50'
                  }`}
                >
                  {/* Number Circle */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-data text-xs font-bold shrink-0 transition-colors duration-500 ${
                    isActive ? 'bg-[#0000FF] text-white' : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                  }`}>
                    {feat.num}
                  </div>
                  
                  {/* Text Content */}
                  <div className="space-y-2">
                    <h3 className={`font-display font-bold text-base uppercase tracking-wider text-[#0A0A14] ${
                      isActive ? 'font-black text-[#0000FF]' : ''
                    }`}>
                      {feat.title}
                    </h3>
                    <p className="font-body text-xs text-neutral-500 leading-relaxed max-w-md">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Sticky UI Preview Card */}
          <div className="sticky top-28 hidden md:block">
            {/* Glow backing */}
            <div className="absolute inset-0 bg-[#0000FF]/5 rounded-3xl filter blur-[40px] pointer-events-none" />

            <div className="relative bg-[#0A0A14] border border-white/10 rounded-3xl p-8 shadow-[0_24px_50px_rgba(0,0,0,0.6)] space-y-6 select-none text-left min-h-[340px] flex flex-col justify-between">
              
              {/* Header */}
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="font-display font-bold text-xs uppercase text-white tracking-widest">
                  {FEATURES[activeIdx].title} Preview
                </span>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-white/20" />
                  <div className="w-2 h-2 rounded-full bg-white/20" />
                  <div className="w-2 h-2 rounded-full bg-white/20" />
                </div>
              </div>

              {/* Dynamic Content based on active index */}
              <div className="flex-1 flex flex-col justify-center py-4">
                {renderMockup(activeIdx)}
              </div>

              {/* Footer disclaimer */}
              <p className="font-body text-[10px] text-neutral-500 italic border-t border-white/5 pt-4">
                * Note: Analysis parameters are parsed in isolation to guarantee integrity.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
