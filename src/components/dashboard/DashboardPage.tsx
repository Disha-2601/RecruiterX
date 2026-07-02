'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import HeroProject from './HeroProject';
import ProjectsGrid from './ProjectsGrid';
import { AlertCircle } from 'lucide-react';

// Types matching the spec API responses
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

interface Project {
  id: number | string;
  name: string;
  role_title: string;
  candidate_count: number;
  latest_run_status: string | null;
  latest_run_id: string | null;
  created_at: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

export default function DashboardPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [recentProject, setRecentProject] = useState<RecentProject | null>(null);
  const [stats, setStats] = useState<GlobalStats>({
    total_candidates: 0,
    avg_qualification_score: 0,
    active_runs: 0,
    api_key_status: 'missing',
  });
  const [projects, setProjects] = useState<Project[]>([]);

  // Fetch all dashboard data from spec endpoints
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Parallel fetch of all three endpoints
      const [recentRes, statsRes, projectsRes] = await Promise.allSettled([
        fetch(`${API_BASE}/projects/recent`).then(r => r.ok ? r.json() : null),
        fetch(`${API_BASE}/stats`).then(r => r.ok ? r.json() : null),
        fetch(`${API_BASE}/projects`).then(r => r.ok ? r.json() : null),
      ]);

      // Process recent project
      if (recentRes.status === 'fulfilled' && recentRes.value) {
        setRecentProject(recentRes.value);
      } else {
        // Fallback: try to derive from projects list or use demo data
        setRecentProject(null);
      }

      // Process stats
      if (statsRes.status === 'fulfilled' && statsRes.value) {
        setStats(statsRes.value);
      } else {
        // Fallback: compute from local /api/candidates if available
        try {
          const candRes = await fetch('/api/candidates');
          if (candRes.ok) {
            const candidates = await candRes.json();
            if (Array.isArray(candidates)) {
              const avgScore = candidates.length > 0
                ? candidates.reduce((sum: number, c: any) => sum + (c.score || 0), 0) / candidates.length
                : 0;
              setStats({
                total_candidates: candidates.length,
                avg_qualification_score: avgScore,
                active_runs: 1,
                api_key_status: 'missing',
              });
            }
          }
        } catch {
          // Keep defaults
        }
      }

      // Process projects list
      if (projectsRes.status === 'fulfilled' && projectsRes.value) {
        const projectsList = Array.isArray(projectsRes.value) ? projectsRes.value : [];
        setProjects(projectsList);

        // If we didn't get a recent project from the API, derive from list
        if (!(recentRes.status === 'fulfilled' && recentRes.value) && projectsList.length > 0) {
          const most = projectsList[0]; // Already sorted by recent
          setRecentProject({
            id: most.id,
            name: most.name,
            role_title: most.role_title,
            department: '',
            latest_run_id: most.latest_run_id,
            latest_run_status: most.latest_run_status,
            candidate_count: most.candidate_count || 0,
          });
        }
      } else {
        // Fallback demo data so the page isn't empty during dev
        const fallbackProject: Project = {
          id: 'demo-project-id',
          name: 'Senior AI/ML Engineer Search',
          role_title: 'Senior AI/ML Engineer',
          candidate_count: 100,
          latest_run_status: 'ranking',
          latest_run_id: 'demo-run',
          created_at: new Date().toISOString(),
        };
        setProjects([fallbackProject]);
        setRecentProject({
          id: fallbackProject.id,
          name: fallbackProject.name,
          role_title: fallbackProject.role_title,
          department: 'Engineering',
          latest_run_id: fallbackProject.latest_run_id,
          latest_run_status: fallbackProject.latest_run_status,
          candidate_count: fallbackProject.candidate_count,
        });
        if (stats.total_candidates === 0) {
          setStats(prev => ({ ...prev, total_candidates: 100, active_runs: 1 }));
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Navigation handlers — these NEVER trigger computation
  const handleViewDetails = (projectId: string | number) => {
    router.push(`/dashboard/results?project_id=${projectId}`);
  };

  const handleCardClick = (project: Project) => {
    if (!project.latest_run_status || project.latest_run_status === 'draft') {
      // Draft: send to wizard
      router.push(`/project/${project.id}?phase=1`);
    } else {
      // All other statuses: send to results
      router.push(`/dashboard/results?project_id=${project.id}`);
    }
  };

  const handleCreateNewProject = () => {
    router.push('/project/new');
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="w-full space-y-8 animate-pulse">
        {/* Hero skeleton */}
        <div className="w-full h-[200px] bg-neutral-100 rounded-[32px]" />
        {/* Stats skeleton */}
        <div className="w-full h-[72px] bg-neutral-50 rounded-2xl" />
        {/* Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[180px] bg-neutral-100 rounded-[24px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 relative">
      {/* Ambient background blob */}
      <div
        className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full ambient-blob pointer-events-none"
        style={{ background: 'var(--gradient-blob)' }}
      />

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-800 flex gap-3 text-xs max-w-lg mx-auto reveal">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Section 2 — Hero Card + Section 3 — Stats Strip */}
      {recentProject && (
        <div className="reveal">
          <HeroProject
            project={recentProject}
            stats={stats}
            onViewDetails={handleViewDetails}
          />
        </div>
      )}

      {/* If no recent project, still show stats */}
      {!recentProject && (
        <div className="reveal">
          <HeroProject
            project={null}
            stats={stats}
            onViewDetails={handleViewDetails}
          />
        </div>
      )}

      {/* Section 4 — Workspace Projects */}
      <div className="space-y-5 reveal reveal-delay-2">
        <h2 className="text-2xl font-semibold text-neutral-900 font-display tracking-tight">
          Workspace Projects
        </h2>
        <ProjectsGrid
          projects={projects}
          onCardClick={handleCardClick}
          onCreateNew={handleCreateNewProject}
        />
      </div>
    </div>
  );
}
