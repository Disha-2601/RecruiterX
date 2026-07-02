'use client';

import React from 'react';
import { useProjectStore } from '@/stores/useProjectStore';

export default function PipelinePreview() {
  const { jdIsDemo, candidatesIsDemo } = useProjectStore();

  // Mode A: both ticks ON (jd_is_demo = true AND candidates_is_demo = true)
  const isModeA = jdIsDemo && candidatesIsDemo;
  
  // Mode B: new JD uploaded (jd_is_demo = false)
  const isModeB = !jdIsDemo;

  return (
    <div className="bg-white border border-[#E5E7EB] border-l-[3px] border-l-[#0000FF] rounded-2xl shadow-[0_4px_16px_rgba(0,0,34,0.06)] p-6 space-y-4 font-sans text-left select-none animate-fade-in">
      <span className="text-[10px] font-bold text-[#8C8C8C] uppercase tracking-[0.08em] block">
        Pipeline Configuration
      </span>

      <div className="space-y-3.5 divide-y divide-[#F0F0F0]">
        {/* Row 1 — Ranking only */}
        <div className={`pt-0 flex items-start gap-3 transition-opacity ${isModeA ? 'opacity-100' : 'opacity-35'}`}>
          <span className="text-sm mt-0.5">{isModeA ? '✅' : '⚪'}</span>
          <div>
            <h5 className="font-semibold text-xs text-[#0A0A0A]">
              Ranking only (~30 sec)
            </h5>
            <p className="text-[11px] text-[#4A4A4A] mt-0.5">
              rank.py loads precomputed cache directly
            </p>
          </div>
        </div>

        {/* Row 2 — Re-embedding JD */}
        <div className={`pt-3.5 flex items-start gap-3 transition-opacity ${isModeB ? 'opacity-100' : 'opacity-35'}`}>
          <span className="text-sm mt-0.5">{isModeB ? '⚡' : '⚪'}</span>
          <div>
            <h5 className="font-semibold text-xs text-[#0A0A0A]">
              Re-embedding JD (~45 sec)
            </h5>
            <p className="text-[11px] text-[#4A4A4A] mt-0.5">
              parse_jd.py → embed_jd.py → rank.py
            </p>
          </div>
        </div>

        {/* Row 3 — Full re-indexing */}
        <div className="pt-3.5 flex items-start gap-3 opacity-35">
          <span className="text-sm mt-0.5">🔒</span>
          <div>
            <h5 className="font-semibold text-xs text-[#0A0A0A]">
              Full re-indexing (offline only)
            </h5>
            <p className="text-[11px] text-[#4A4A4A] mt-0.5">
              New candidate pools require offline indexing. This runs outside the app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
