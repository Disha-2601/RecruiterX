'use client';

import React from 'react';
import { Ghost, Activity, MessageSquareWarning, FileSearch, Sliders, TrendingUp, ShieldCheck } from 'lucide-react';

export default function FeatureGrid() {
  return (
    <section className="bg-white py-24 md:py-32 relative border-b border-neutral-100">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center mb-16 space-y-3">
          <span className="font-data text-xs font-bold uppercase tracking-widest text-[#0000FF] block">
            OUR INGREDIENTS
          </span>
          <h2 className="font-display font-black text-3xl md:text-5xl text-[#0A0A14] tracking-tight uppercase">
            Seven layers of candidate <br />
            <span className="text-[#0000FF]">analysis</span>.
          </h2>
        </div>

        {/* 3-Column Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: GHOST CANDIDATE BENCHMARK (col-span-2) */}
          <div className="bg-[#0A0A14] border border-white/5 hover:border-white/10 rounded-2xl p-8 flex flex-col justify-between min-h-[300px] transition-all duration-300 md:col-span-2 group">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Ghost className="w-5 h-5 text-[#0000FF]" />
                <span className="font-data text-[10px] font-bold uppercase tracking-widest text-[#0000FF]">
                  GHOST CANDIDATE BENCHMARK
                </span>
              </div>
              <p className="font-body text-xs text-[#8888AA] leading-relaxed max-w-xl">
                A synthetic ideal candidate profile is constructed from your job description first. Every real resume is compared to this fixed reference point, bypassing the usual candidate-to-candidate bias.
              </p>
            </div>
            
            <div className="flex justify-between items-end pt-6 border-t border-white/5">
              <div className="flex flex-wrap gap-1.5 max-w-[80%]">
                <span className="bg-white/5 border border-white/10 text-white text-[9px] rounded-full px-2 py-0.5">Senior</span>
                <span className="bg-white/5 border border-white/10 text-white text-[9px] rounded-full px-2 py-0.5">Ghost Candidate employed</span>
                <span className="bg-white/5 border border-white/10 text-white text-[9px] rounded-full px-2 py-0.5">Data Eng</span>
                <span className="bg-white/5 border border-white/10 text-white text-[9px] rounded-full px-2 py-0.5">Output</span>
              </div>
              <span className="font-data text-[10px] font-bold text-white/40 uppercase tracking-wider">
                PR Merit +
              </span>
            </div>
          </div>

          {/* Card 2: POOL HEALTH (col-span-1, blue) */}
          <div className="bg-[#0000FF] text-white rounded-2xl p-8 flex flex-col justify-between min-h-[300px] shadow-lg shadow-blue-500/10 md:col-span-1">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-white" />
                <span className="font-data text-[10px] font-bold uppercase tracking-widest text-white/70">
                  POOL HEALTH
                </span>
              </div>
              <p className="font-body text-xs text-white/90 leading-relaxed">
                Meta-analysis of applicant pool qualification vs resume inflation. Instantly gauge the overall density of qualified fits in your applicant stream.
              </p>
            </div>

            <div className="space-y-3 pt-6 border-t border-white/10">
              <div className="space-y-1">
                <div className="flex justify-between font-mono text-[9px] text-white/75">
                  <span>Qualified Fit Density</span>
                  <span className="text-white font-bold">7.4%</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: '7.4%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-mono text-[9px] text-white/75">
                  <span>Inflation Rate Detected</span>
                  <span className="text-white font-bold">41.0%</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: '41%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: INTERROGATION (col-span-1, dark) */}
          <div className="bg-[#0A0A14] border border-white/5 hover:border-white/10 rounded-2xl p-8 flex flex-col justify-between min-h-[300px] transition-all duration-300 md:col-span-1">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquareWarning className="w-5 h-5 text-[#0000FF]" />
                <span className="font-data text-[10px] font-bold uppercase tracking-widest text-[#0000FF]">
                  INTERROGATION
                </span>
              </div>
              <p className="font-body text-xs text-[#8888AA] leading-relaxed">
                Generates surgical interview questions designed to probe specific claimed gaps. Real practitioners answer instantly. Inflators cannot.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-6">
              <span className="font-data text-[8px] text-white/50 uppercase font-bold block mb-1">PROBE INPUT</span>
              <p className="font-data text-[10px] leading-snug font-bold text-white">
                &quot;What broke first when you crossed 10K QPS on the sharding migration?&quot;
              </p>
            </div>
          </div>

          {/* Card 4: JD AUDIT (col-span-1, white) */}
          <div className="bg-white border border-neutral-200 shadow-sm rounded-2xl p-8 flex flex-col justify-between min-h-[300px]">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileSearch className="w-5 h-5 text-[#0000FF]" />
                <span className="font-data text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  A THOROUGH ANALYSIS
                </span>
              </div>
              <h3 className="font-display font-bold text-sm uppercase text-[#0A0A14] tracking-wider">
                JD Quality Audit
              </h3>
              <p className="font-body text-xs text-neutral-500 leading-relaxed">
                Flags vague criteria, impossible requirements, and chronologically inconsistent skill sets in your descriptions.
              </p>
            </div>

            <div className="bg-neutral-50 border border-neutral-200/65 rounded-xl p-4 mt-4 font-mono text-[9px] text-neutral-600 space-y-1">
              <div className="font-bold text-[#0A0A14] flex items-center gap-1">
                <span>⚠️</span> Chronological Mismatch
              </div>
              <div className="opacity-90">&quot;10+ Yr Experience: Transformers&quot; (Created 2017)</div>
            </div>
          </div>

          {/* Card 5: INSIDER SIGNAL (col-span-1, white) */}
          <div className="bg-white border border-neutral-200 shadow-sm rounded-2xl p-8 flex flex-col justify-between min-h-[300px]">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0000FF]" />
                <span className="font-data text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  INSIDER SIGNAL
                </span>
              </div>
              <h3 className="font-display font-bold text-sm uppercase text-[#0A0A14] tracking-wider">
                Expert Indicators
              </h3>
              <p className="font-body text-xs text-neutral-500 leading-relaxed">
                Detects specialized knowledge, jargon usage, and project details that indicate genuine hands-on experience.
              </p>
            </div>

            <div className="bg-neutral-50 border border-neutral-200/65 rounded-xl p-4 mt-4 font-mono text-[9px] text-neutral-600 space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                <span className="text-xs">✓</span> Practitioner Lingo Checked
              </div>
              <div className="opacity-90">Deep collective communication NCCL patterns detected.</div>
            </div>
          </div>

          {/* Card 6: HYBRID RANKER (col-span-2, blue) */}
          <div className="bg-[#0000FF] text-white rounded-2xl p-8 flex flex-col justify-between min-h-[300px] shadow-lg shadow-blue-500/10 md:col-span-2">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-white" />
                <span className="font-data text-[10px] font-bold uppercase tracking-widest text-white/70">
                  HYBRID RANKER
                </span>
              </div>
              <p className="font-body text-xs text-white/95 leading-relaxed max-w-xl">
                Adjust weights of different evaluation dimensions and recalculate the shortlist order dynamically.
              </p>
            </div>

            <div className="flex justify-between items-end mt-6">
              <div className="space-y-2 w-[70%]">
                <div className="flex justify-between font-mono text-[8px] text-white/75">
                  <span>Trajectory Fit</span>
                  <span className="font-bold text-white">45%</span>
                </div>
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: '45%' }} />
                </div>
              </div>
              <span className="font-data text-[10px] font-bold text-white/40 uppercase tracking-wider">
                Interrogating Inventory
              </span>
            </div>
          </div>

          {/* Card 7: TRAJECTORY ANALYZER (col-span-1, white) */}
          <div className="bg-white border border-neutral-200 shadow-sm rounded-2xl p-8 flex flex-col justify-between min-h-[300px] md:col-span-1">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#0000FF]" />
                <span className="font-data text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  TRAJECTORY ANALYZER
                </span>
              </div>
              <p className="font-body text-xs text-neutral-500 leading-relaxed">
                Tracks career velocity, title-to-skills relevance, and employer reputation profiles to identify accelerating talents.
              </p>
            </div>

            <div className="space-y-2 pt-6 border-t border-neutral-100">
              <div className="flex justify-between font-mono text-[9px] text-neutral-500">
                <span>Velocity Score</span>
                <span className="text-[#0A0A14] font-bold">92%</span>
              </div>
              <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#0000FF] rounded-full" style={{ width: '92%' }} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
