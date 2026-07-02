'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, FolderOpen, CheckCircle2, Activity, XCircle, Zap,
  Plus, FileText, ChevronDown
} from 'lucide-react';

interface Project {
  id: number | string;
  name: string;
  role_title: string;
  candidate_count: number;
  latest_run_status: string | null;
  latest_run_id: string | null;
  created_at: string;
}

interface ProjectsGridProps {
  projects: Project[];
  onCardClick: (project: Project) => void;
  onCreateNew: () => void;
}

type FilterTab = 'all' | 'analyzing' | 'complete' | 'archived';
type SortOption = 'recent' | 'oldest' | 'a-z' | 'z-a';

// Map status to filter category
function getFilterCategory(status: string | null): FilterTab {
  if (!status || status === 'draft') return 'all';
  if (['ranking', 'queued', 'indexing', 'active', 'auditing'].includes(status)) return 'analyzing';
  if (status === 'complete') return 'complete';
  if (status === 'archived') return 'archived';
  return 'all'; // failed, etc.
}

function isAnalyzingStatus(status: string | null): boolean {
  return ['ranking', 'queued', 'indexing', 'active', 'auditing'].includes(status || '');
}

export default function ProjectsGrid({
  projects,
  onCardClick,
  onCreateNew,
}: ProjectsGridProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  // Tab counts
  const counts = useMemo(() => {
    return {
      all: projects.filter(p => p.latest_run_status !== 'archived').length,
      analyzing: projects.filter(p => isAnalyzingStatus(p.latest_run_status)).length,
      complete: projects.filter(p => p.latest_run_status === 'complete').length,
      archived: projects.filter(p => p.latest_run_status === 'archived').length,
    };
  }, [projects]);

  // Filter, search, sort
  const displayedProjects = useMemo(() => {
    let result = [...projects];

    // Tab filter
    if (activeTab === 'archived') {
      result = result.filter(p => p.latest_run_status === 'archived');
    } else {
      result = result.filter(p => p.latest_run_status !== 'archived');
      if (activeTab === 'analyzing') {
        result = result.filter(p => isAnalyzingStatus(p.latest_run_status));
      } else if (activeTab === 'complete') {
        result = result.filter(p => p.latest_run_status === 'complete');
      }
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        p => p.name.toLowerCase().includes(q) || p.role_title.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'a-z':
          return a.name.localeCompare(b.name);
        case 'z-a':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    return result;
  }, [projects, activeTab, searchQuery, sortBy]);

  // Status badge for cards
  const getCardBadge = (status: string | null) => {
    if (isAnalyzingStatus(status)) {
      return (
        <span className="flex items-center gap-1 text-[9px] font-bold text-white uppercase bg-white/20 px-2 py-0.5 rounded-full tracking-wider leading-none backdrop-blur-sm">
          <Zap className="w-2.5 h-2.5 animate-pulse" />
          <span>Analyzing</span>
        </span>
      );
    }
    if (status === 'complete') {
      return (
        <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 uppercase bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full tracking-wider leading-none">
          <CheckCircle2 className="w-2.5 h-2.5" />
          <span>Complete</span>
        </span>
      );
    }
    if (status === 'failed') {
      return (
        <span className="flex items-center gap-1 text-[9px] font-bold text-rose-700 uppercase bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full tracking-wider leading-none">
          <XCircle className="w-2.5 h-2.5" />
          <span>Failed</span>
        </span>
      );
    }
    if (!status || status === 'draft') {
      return (
        <span className="flex items-center gap-1 text-[9px] font-bold text-neutral-400 uppercase bg-neutral-100 px-2 py-0.5 rounded-full tracking-wider leading-none">
          <FileText className="w-2.5 h-2.5" />
          <span>Draft</span>
        </span>
      );
    }
    return null;
  };

  // Card style per status (spec Section 4D)
  const getCardClasses = (status: string | null) => {
    if (isAnalyzingStatus(status)) {
      return 'bg-[#0000FF] text-white hover:shadow-xl hover:shadow-blue-500/25';
    }
    if (status === 'complete') {
      return 'bg-white border border-neutral-200 text-neutral-900 hover:shadow-card-hover';
    }
    if (status === 'failed') {
      return 'bg-white border border-neutral-200 border-l-[3px] border-l-rose-500 text-neutral-900 hover:shadow-card-hover';
    }
    if (!status || status === 'draft') {
      return 'bg-white border-2 border-dashed border-neutral-200 text-neutral-900 hover:border-[#0000FF]/40';
    }
    if (status === 'archived') {
      return 'bg-neutral-50 border border-neutral-200 text-neutral-500 hover:bg-neutral-100';
    }
    return 'bg-white border border-neutral-200 text-neutral-900';
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'analyzing', label: 'Analyzing' },
    { key: 'complete', label: 'Complete' },
    { key: 'archived', label: 'Archived' },
  ];

  return (
    <div className="w-full space-y-6 font-body">
      {/* ═══ Controls Row: Filter Tabs + Search + Sort ═══ */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Filter Tabs */}
        <div className="flex bg-neutral-50/80 backdrop-blur-sm p-1.5 rounded-full border border-neutral-100 items-center overflow-x-auto w-full md:w-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = counts[tab.key];

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`text-xs font-semibold rounded-full px-4 py-2 transition-all flex items-center gap-1.5 whitespace-nowrap active:scale-[0.97] font-display ${
                  isActive
                    ? 'bg-[#0000FF] text-white shadow-sm shadow-blue-500/20'
                    : 'text-neutral-500 hover:text-neutral-800 bg-transparent'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-colors ${
                    isActive ? 'bg-white/25 text-white' : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search + Sort */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:flex-initial">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-neutral-400 pointer-events-none">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search project or role..."
              className="w-full md:w-[220px] bg-white border border-neutral-200 rounded-full py-2.5 pl-9 pr-4 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-[#0000FF] focus:shadow-focus transition-all text-xs font-body"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-white border border-neutral-200 rounded-full py-2.5 px-4 pr-8 text-neutral-600 focus:outline-none focus:border-[#0000FF] focus:shadow-focus transition-all text-xs font-medium cursor-pointer appearance-none font-display"
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest</option>
              <option value="a-z">A–Z</option>
              <option value="z-a">Z–A</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ═══ Project Cards Grid ═══ */}
      {displayedProjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedProjects.map((p, index) => {
            const isBlueCard = isAnalyzingStatus(p.latest_run_status);

            return (
              <div
                key={p.id}
                onClick={() => onCardClick(p)}
                className={`rounded-[24px] p-6 flex flex-col justify-between min-h-[200px] transition-all duration-300 cursor-pointer active:scale-[0.98] select-none lift-on-hover reveal ${
                  getCardClasses(p.latest_run_status)
                }`}
                style={{
                  animationDelay: `${index * 80}ms`,
                  boxShadow: isBlueCard ? undefined : 'var(--shadow-card)',
                }}
              >
                {/* Card Top */}
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3
                      className={`font-semibold text-sm leading-snug font-display tracking-tight ${
                        isBlueCard ? 'text-white' : 'text-neutral-900'
                      }`}
                    >
                      {p.name}
                    </h3>
                    {getCardBadge(p.latest_run_status)}
                  </div>
                  <p className={`text-xs ${isBlueCard ? 'text-white/70' : 'text-neutral-500'}`}>
                    {p.role_title}
                  </p>
                  <p
                    className={`text-[10px] mt-1.5 ${
                      isBlueCard ? 'text-white/40' : 'text-neutral-400'
                    }`}
                  >
                    Candidate pool size: {p.candidate_count}
                  </p>
                </div>

                {/* Card Bottom */}
                <div className="mt-5">
                  {/* Analyzing: progress indicator */}
                  {isAnalyzingStatus(p.latest_run_status) && (
                    <div className="space-y-2">
                      <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white/80 rounded-full transition-all duration-700"
                          style={{
                            width: '65%',
                            background: 'linear-gradient(90deg, rgba(255,255,255,0.4), rgba(255,255,255,0.9))',
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white/60 font-display uppercase tracking-widest font-bold">
                          Live
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Complete: show View Details link */}
                  {p.latest_run_status === 'complete' && (
                    <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                      <span className="text-[10px] text-neutral-400 font-body">
                        {new Date(p.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="text-xs font-semibold text-[#0000FF] font-display flex items-center gap-1">
                        View Details →
                      </span>
                    </div>
                  )}

                  {/* Failed: error hint */}
                  {p.latest_run_status === 'failed' && (
                    <div className="pt-3 border-t border-rose-100">
                      <span className="text-[10px] text-rose-500 font-medium">
                        Analysis encountered an error
                      </span>
                    </div>
                  )}

                  {/* Draft: CTA */}
                  {(!p.latest_run_status || p.latest_run_status === 'draft') && (
                    <div className="pt-3">
                      <span className="text-xs text-[#0000FF] font-semibold flex items-center gap-1 font-display">
                        <span>Add JD to start →</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ═══ Empty State ═══ */
        <div className="w-full bg-white border border-neutral-100 rounded-[32px] py-20 px-8 flex flex-col items-center justify-center text-center space-y-5 max-w-lg mx-auto shadow-card reveal">
          <div className="w-14 h-14 bg-blue-50 text-[#0000FF] rounded-2xl flex items-center justify-center">
            <FolderOpen className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-base text-neutral-900 font-display">
              No projects yet.
            </h3>
            <p className="text-neutral-500 text-xs max-w-sm leading-relaxed font-body">
              Create your first project to start ranking candidates.
            </p>
          </div>
          <button
            onClick={onCreateNew}
            className="bg-[#0000FF] hover:bg-[#0000CC] text-white text-xs font-semibold rounded-full px-6 py-3 transition-all flex items-center gap-1.5 shadow-lg shadow-blue-500/15 hover:shadow-xl hover:shadow-blue-500/25 active:scale-[0.97] font-display"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Project</span>
          </button>
        </div>
      )}
    </div>
  );
}
