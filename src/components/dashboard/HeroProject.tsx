'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Key, Users, BarChart3, Activity, Zap, CheckCircle2, XCircle, Settings } from 'lucide-react';

interface RecentProject {
  id: number | string;
  name: string;
  role_title: string;
  department: string;
  latest_run_id: string | null;
  latest_run_status: string | null;
  candidate_count: number;
}

interface GlobalStats {
  total_candidates: number;
  avg_qualification_score: number;
  active_runs: number;
  api_key_status: 'ok' | 'missing';
}

interface HeroProjectProps {
  project: RecentProject | null;
  stats: GlobalStats;
  onViewDetails: (id: string | number) => void;
}

// Animated count-up hook
function useCountUp(target: number, duration: number = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }

    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));

      if (progress < 1) {
        ref.current = requestAnimationFrame(animate);
      }
    };

    ref.current = requestAnimationFrame(animate);
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, [target, duration]);

  return value;
}

export default function HeroProject({ project, stats, onViewDetails }: HeroProjectProps) {
  const router = useRouter();

  // Animated stat values
  const animatedCandidates = useCountUp(stats.total_candidates);
  const animatedAvgQual = useCountUp(Math.round(stats.avg_qualification_score * 100));
  const animatedActiveRuns = useCountUp(stats.active_runs);

  // Status badge renderer per spec
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'complete':
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 uppercase bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full tracking-wider">
            <CheckCircle2 className="w-3 h-3" />
            <span>Complete</span>
          </span>
        );
      case 'ranking':
      case 'queued':
      case 'indexing':
      case 'active':
      case 'auditing':
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#0000FF] uppercase bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full tracking-wider">
            <Zap className="w-3 h-3 animate-pulse" />
            <span>Analyzing</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-rose-700 uppercase bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full tracking-wider">
            <XCircle className="w-3 h-3" />
            <span>Failed</span>
          </span>
        );
      default:
        return null;
    }
  };

  // Determine if status is "active" (analyzing)
  const isActiveStatus = (status: string | null) =>
    ['ranking', 'queued', 'indexing', 'active', 'auditing'].includes(status || '');

  return (
    <div className="w-full space-y-8 font-body">
      {/* ═══ Hero Card — Pick up where you left off ═══ */}
      {project && (
        <div className="relative w-full rounded-[32px] overflow-hidden reveal">
          {/* Glassmorphic container with blue glow */}
          <div
            className="relative z-10 w-full bg-white/80 backdrop-blur-xl border border-[#0000FF]/15 rounded-[32px] p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8 transition-shadow duration-500 hover:shadow-glow-blue"
            style={{ boxShadow: 'var(--shadow-card), 0 0 80px rgba(0,0,255,0.06)' }}
          >
            {/* Subtle gradient shimmer */}
            <div
              className="absolute inset-0 rounded-[32px] opacity-[0.03] pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, transparent 0%, #0000FF 50%, transparent 100%)',
                backgroundSize: '200% 200%',
                animation: 'scanner-soft 6s ease-in-out infinite',
              }}
            />

            {/* Left content */}
            <div className="space-y-4 max-w-xl relative z-10">
              <span className="text-[11px] font-bold text-[#0000FF] uppercase tracking-[0.2em] block font-display">
                Pick up where you left off
              </span>

              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900 tracking-tight leading-none font-display">
                    {project.name}
                  </h1>
                  {getStatusBadge(project.latest_run_status)}
                </div>
                <p className="text-neutral-500 text-sm font-body">
                  Target Role: <span className="font-medium text-neutral-800">{project.role_title}</span>
                  {project.department && ` • ${project.department}`}
                </p>
              </div>

              {/* Live progress for active runs */}
              {isActiveStatus(project.latest_run_status) && (
                <div className="flex items-center gap-3 pt-1">
                  <div className="relative">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#0000FF]" />
                    <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-[#0000FF] animate-ping" />
                  </div>
                  <span className="text-xs font-semibold text-[#0000FF] font-display">
                    Live: {project.candidate_count} of {project.candidate_count} candidates analyzed
                  </span>
                </div>
              )}

              {/* Completed status */}
              {project.latest_run_status === 'complete' && (
                <div className="flex items-center gap-2 pt-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-700 font-display">
                    {project.candidate_count} candidates ranked
                  </span>
                </div>
              )}
            </div>

            {/* Right — View Details CTA */}
            <div className="shrink-0 flex items-center relative z-10">
              <button
                onClick={() => onViewDetails(project.id)}
                className="w-full md:w-auto bg-[#0000FF] hover:bg-[#0000CC] text-white text-sm font-semibold rounded-full px-7 py-3.5 transition-all flex items-center justify-center gap-2.5 active:scale-[0.97] shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 font-display"
              >
                <span>View Details</span>
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Section 3 — Stats Strip ═══ */}
      <div className="w-full flex justify-between items-stretch py-6 border-y border-neutral-100 px-1 flex-wrap gap-y-5 reveal reveal-delay-1">
        {/* Stat 1: Total Candidates */}
        <div className="flex-1 min-w-[130px] text-center md:text-left px-2">
          <span className="text-3xl font-semibold text-neutral-900 leading-none font-data tabular-nums">
            {animatedCandidates}
          </span>
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] block mt-1.5 font-display">
            Total Candidates
          </span>
        </div>

        <div className="hidden md:block w-px bg-neutral-200 self-stretch" />

        {/* Stat 2: Avg Qualification */}
        <div className="flex-1 min-w-[130px] text-center md:text-left px-2 md:pl-6">
          <span className="text-3xl font-semibold text-neutral-900 leading-none font-data tabular-nums">
            {animatedAvgQual}%
          </span>
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] block mt-1.5 font-display">
            Avg Qualification
          </span>
        </div>

        <div className="hidden md:block w-px bg-neutral-200 self-stretch" />

        {/* Stat 3: Active Runs */}
        <div className="flex-1 min-w-[130px] text-center md:text-left px-2 md:pl-6">
          <span className="text-3xl font-semibold text-neutral-900 leading-none font-data tabular-nums">
            {animatedActiveRuns}
          </span>
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] block mt-1.5 font-display">
            Active Runs
          </span>
        </div>
      </div>
    </div>
  );
}
