'use client';

import React from 'react';
import { ParsedJD } from '@/stores/useProjectStore';

interface ParsedRequirementsCardProps {
  data: ParsedJD;
  onReset: () => void;
}

export default function ParsedRequirementsCard({ data, onReset }: ParsedRequirementsCardProps) {
  return (
    <div className="bg-[#EEF2FF] border border-[#0000FF]/15 rounded-xl p-6 space-y-6 text-left font-sans animate-fade-in select-none">
      {/* Header Row */}
      <div className="flex justify-between items-center pb-3 border-b border-[#0000FF]/10">
        <h4 className="font-display font-semibold text-sm text-[#0A0A0A]">
          JD Analysis Complete
        </h4>
        <span className="bg-[#F0FDF4] border border-[#16A34A]/25 text-[#16A34A] text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full">
          Quality Score: {data.quality_score}/100
        </span>
      </div>

      {/* Must-have skills */}
      {data.must_have_skills && data.must_have_skills.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-[#8C8C8C] uppercase tracking-wider block">
            Must-have skills
          </span>
          <div className="flex flex-wrap gap-1.5">
            {data.must_have_skills.map((skill, i) => (
              <span
                key={i}
                className="bg-[#0000FF] text-white text-xs font-semibold rounded-full px-3 py-1"
              >
                {skill.name} <span className="opacity-75 text-[10px] ml-0.5">{skill.weight.toFixed(1)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Nice-to-have skills */}
      {data.nice_to_have_skills && data.nice_to_have_skills.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-[#8C8C8C] uppercase tracking-wider block">
            Nice-to-have
          </span>
          <div className="flex flex-wrap gap-1.5">
            {data.nice_to_have_skills.map((skill, i) => (
              <span
                key={i}
                className="border border-[#E5E7EB] bg-white/50 text-[#4A4A4A] text-xs font-semibold rounded-full px-3 py-1"
              >
                {skill.name} <span className="text-[#8C8C8C] text-[10px] ml-0.5">{skill.weight.toFixed(1)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-4 border-t border-[#0000FF]/10 pt-4 text-xs">
        <div className="space-y-3">
          <div>
            <span className="text-[#8C8C8C] block">Experience</span>
            <span className="font-semibold text-[#0A0A0A]">{data.experience_range || 'Not specified'}</span>
          </div>
          <div>
            <span className="text-[#8C8C8C] block">Work mode</span>
            <span className="font-semibold text-[#0A0A0A]">{data.work_mode || 'Not specified'}</span>
          </div>
          <div>
            <span className="text-[#8C8C8C] block">Locations</span>
            <span className="font-semibold text-[#0A0A0A]">
              {data.locations && data.locations.length > 0 ? data.locations.join(' · ') : 'Not specified'}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <span className="text-[#8C8C8C] block">Salary</span>
            <span className="font-semibold text-[#0A0A0A]">{data.salary || 'Not stated'}</span>
          </div>
          <div>
            <span className="text-[#8C8C8C] block">Seniority</span>
            <span className="font-semibold text-[#0A0A0A]">{data.seniority || 'Not specified'}</span>
          </div>
          <div>
            <span className="text-[#8C8C8C] block">Notice period</span>
            <span className="font-semibold text-[#0A0A0A]">{data.notice_period || 'Not specified'}</span>
          </div>
        </div>
      </div>

      {/* Audit narrative */}
      {data.audit_narrative && (
        <div className="border-t border-[#0000FF]/10 pt-4">
          <p className="text-xs text-[#4A4A4A] leading-relaxed italic">
            {data.audit_narrative}
          </p>
        </div>
      )}

      {/* Reset link */}
      <div className="pt-2">
        <button
          onClick={onReset}
          className="text-[#0000FF] hover:underline text-xs font-semibold transition-colors"
        >
          ← Use a different JD
        </button>
      </div>
    </div>
  );
}
