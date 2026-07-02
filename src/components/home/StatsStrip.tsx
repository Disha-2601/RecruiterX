'use client';

import React from 'react';

const STATS = [
  { value: '147', label: 'Candidate intelligence metrics' },
  { value: '41%', label: 'Average salary/skill inflation caught' },
  { value: '7.4%', label: 'Disqualification rate on integrity checks' },
  { value: '3.2x', label: 'Faster shortlist-to-hire ratio' },
];

export default function StatsStrip() {
  return (
    <section className="bg-white border-y border-neutral-100 py-10 relative overflow-hidden select-none">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-neutral-200/60 items-center justify-center">
          {STATS.map((stat, i) => (
            <div 
              key={i} 
              className="flex flex-col items-center justify-center text-center p-4 md:p-6 space-y-2 first:pt-0 last:pb-0 md:first:pt-4 md:last:pb-6"
            >
              <span className="font-display font-black text-4xl md:text-5xl text-[#0000FF] tracking-tight">
                {stat.value}
              </span>
              <span className="font-body text-[11px] text-neutral-500 tracking-wide max-w-[180px] mx-auto leading-relaxed">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
