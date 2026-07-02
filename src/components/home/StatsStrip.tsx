'use client';

import React, { useState, useEffect } from 'react';

const STATS = [
  { value: '147', label: 'Candidate intelligence metrics' },
  { value: '41%', label: 'Average salary/skill inflation caught' },
  { value: '7.4%', label: 'Disqualification rate on integrity checks' },
  { value: '3.2x', label: 'Faster shortlist-to-hire ratio' },
];

interface StatItemProps {
  value: string;
  label: string;
}

function StatItem({ value, label }: StatItemProps) {
  const [displayVal, setDisplayVal] = useState('0');
  
  useEffect(() => {
    // Parse numeric part and suffix
    const match = value.match(/^([\d.]+)(.*)$/);
    if (!match) {
      setDisplayVal(value);
      return;
    }

    const targetNum = parseFloat(match[1]);
    const suffix = match[2] || '';
    const hasDecimal = match[1].includes('.');
    const decimalPlaces = hasDecimal ? match[1].split('.')[1].length : 0;

    const duration = 1500; // 1.5s animation duration
    const startTime = performance.now();
    let animFrameId: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
      const currentVal = eased * targetNum;

      if (hasDecimal) {
        setDisplayVal(currentVal.toFixed(decimalPlaces) + suffix);
      } else {
        setDisplayVal(Math.round(currentVal).toString() + suffix);
      }

      if (progress < 1) {
        animFrameId = requestAnimationFrame(animate);
      }
    };

    animFrameId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [value]);

  return (
    <div className="flex flex-col items-center justify-center text-center p-4 md:p-6 space-y-2 first:pt-0 last:pb-0 md:first:pt-4 md:last:pb-6">
      <span className="font-display font-black text-4xl md:text-5xl text-[#0000FF] tracking-tight tabular-nums">
        {displayVal}
      </span>
      <span className="font-body text-[11px] text-neutral-500 tracking-wide max-w-[180px] mx-auto leading-relaxed">
        {label}
      </span>
    </div>
  );
}

export default function StatsStrip() {
  return (
    <section className="bg-white border-y border-neutral-100 py-10 relative overflow-hidden select-none">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-neutral-200/60 items-center justify-center">
          {STATS.map((stat, i) => (
            <StatItem 
              key={i} 
              value={stat.value}
              label={stat.label}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
