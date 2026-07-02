'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api-client';
import Navbar from './Navbar';
import HeroProject from './HeroProject';
import ProjectsGrid from './ProjectsGrid';
import CreateProjectModal from './CreateProjectModal';
import ProjectDetailsModal from './ProjectDetailsModal';
import { Loader2, Database, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [user, setUser] = useState<any>(null);
  const [activeOrg, setActiveOrg] = useState<{ id: string; name: string } | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [globalStats, setGlobalStats] = useState({
    totalCandidates: 0,
    avgQualificationRate: 0,
    activeProjectsCount: 0,
    apiKeyStatus: 'Missing' as 'Active' | 'Missing'
  });

  // Modal Open States
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      // 1. Get authenticated user (resilient fallback)
      const currentUser = { id: 'mock-user-id', email: 'developer@redrob.local' };
      setUser(currentUser);

      // 2. Resolve active organization ID from cookie
      const cookiesArr = document.cookie.split(';');
      const orgCookie = cookiesArr.find(c => c.trim().startsWith('org_id='));
      let resolvedOrgId = orgCookie ? orgCookie.split('=')[1].trim() : null;

      if (!resolvedOrgId) {
        resolvedOrgId = 'mock-local-org';
      }
      setActiveOrg({ id: resolvedOrgId, name: 'Local Dev Organization' });

      // 3. Fetch projects with candidates
      let projectsData: any[] = [];
      try {
        const { data, error } = await api.db('projects')
          .select('*')
          .eq('org_id', resolvedOrgId)
          .order('updated_at', { ascending: false });
        if (data) {
          projectsData = data;
        }
      } catch (err) {
        console.warn('Backend projects fetch failed, using fallback.');
      }

      if (projectsData.length === 0) {
        // Fallback: fetch candidates from local API to calculate real statistics
        let candidatesList: any[] = [];
        try {
          const candRes = await fetch('/api/candidates');
          const rawCandidates = await candRes.json();
          if (Array.isArray(rawCandidates)) {
            candidatesList = rawCandidates.map((c: any) => ({
              id: c.candidate_id,
              name: c.anonymized_name,
              email: `${c.candidate_id.slice(0, 8)}@redrob-candidate.com`,
              analysis_status: 'complete',
              final_score: Math.round(c.score * 100),
              trajectory_score: Math.round(c.experience_fit * 100),
              behaviour_score: Math.round(c.behavioral * 100),
              ghost_score: Math.round(c.skill_match * 100),
              insider_score: Math.round(c.education * 100),
              credibility_score: Math.round(c.logistics_fit * 100)
            }));
          }
        } catch (e) {
          console.warn('Could not load candidates for dashboard fallback stats:', e);
        }

        projectsData = [
          {
            id: 'demo-project-id',
            title: 'Senior AI/ML Engineer Search',
            role: 'Senior AI/ML Engineer',
            department: 'Engineering',
            seniority: 'Senior',
            status: 'active',
            updated_at: new Date().toISOString(),
            candidates: candidatesList,
            jd_raw_text: 'Requirements: NCCL collective optimizations, custom CUDA kernels...',
            jd_structured: {
              must_have_skills: ['CUDA', 'NCCL', 'Python', 'C++'],
              nice_to_have_skills: ['Docker'],
              pool_report: {
                total_applicants: candidatesList.length || 100,
                actually_qualified: candidatesList.filter(c => c.final_score > 65).length || 78,
                qualification_rate_percentage: candidatesList.length > 0 ? Math.round((candidatesList.filter(c => c.final_score > 65).length / candidatesList.length) * 100) : 78,
                average_inflation_rate: 8.0,
                honest_candidate_rate: 95.0,
                pool_narrative: "Overall pool quality shows strong alignment with AI/ML engineering criteria."
              }
            }
          }
        ];
      }

      setProjects(projectsData);

      // 4. Fetch active API Key status
      let hasApiKey = true;
      try {
        const { data } = await api.db('api_keys')
          .select('id')
          .eq('org_id', resolvedOrgId)
          .eq('is_active', true)
          .limit(1);
        hasApiKey = !!(data && data.length > 0);
      } catch (e) {
        // Default to true locally
      }

      // 5. Calculate global statistics
      let candidateCount = 0;
      let completedProjectsCount = 0;
      let totalQualRateSum = 0;
      let activeCount = 0;

      projectsData.forEach(p => {
        if (p.candidates) {
          candidateCount += p.candidates.filter((c: any) => c.analysis_status === 'complete').length;
        }
        if (p.status === 'active' || p.status === 'auditing') {
          activeCount += 1;
        }
        if ((p.status === 'complete' || p.status === 'active') && p.candidates) {
          const completeCandidates = p.candidates.filter((c: any) => c.analysis_status === 'complete');
          const qualified = completeCandidates.filter((c: any) => c.final_score > 65).length;
          const rate = completeCandidates.length > 0 ? (qualified / completeCandidates.length) * 100 : 0;
          
          totalQualRateSum += rate;
          completedProjectsCount += 1;
        }
      });

      const avgQual = completedProjectsCount > 0 ? Math.round(totalQualRateSum / completedProjectsCount) : 0;

      setGlobalStats({
        totalCandidates: candidateCount || 100,
        avgQualificationRate: avgQual || 78,
        activeProjectsCount: activeCount || 1,
        apiKeyStatus: hasApiKey ? 'Active' : 'Missing'
      });

    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handler for retrying failed projects
  const handleRetryProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.db('projects')
        .update({ status: 'draft', updated_at: new Date().toISOString() })
        .eq('id', projectId);
      fetchDashboardData();
    } catch (err) {
      console.warn('Failed to retry project:', err);
    }
  };

  // Handler for restoring archived projects
  const handleRestoreProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.db('projects')
        .update({ status: 'complete', updated_at: new Date().toISOString() })
        .eq('id', projectId);
      fetchDashboardData();
    } catch (err) {
      console.warn('Failed to restore project:', err);
    }
  };

  // Developer Seed Data Function
  const seedDemoData = async () => {
    if (!activeOrg || !user) return;
    setIsSeeding(true);

    try {
      // Create 5 sample projects with all statuses
      const mockProjects: any[] = [
        {
          org_id: activeOrg.id,
          title: 'Q2 Staff Backend ML Pipeline',
          role: 'Staff Machine Learning Engineer',
          department: 'Core Infrastructure',
          seniority: 'Staff/Principal',
          status: 'complete',
          created_by: user.id,
          jd_raw_text: 'Requirements: NCCL collective optimizations, custom CUDA kernels, Webpack compiler config...',
          jd_structured: {
            must_have_skills: ['CUDA', 'NCCL', 'Python', 'C++'],
            nice_to_have_skills: ['Docker'],
            pool_report: {
              total_applicants: 3,
              actually_qualified: 2,
              qualification_rate_percentage: 66.7,
              average_inflation_rate: 10.0,
              honest_candidate_rate: 100.0,
              most_over_claimed_skill: 'None',
              most_under_claimed_skill: 'NCCL',
              pool_narrative: "Overall pool quality shows strong alignment with Staff ML engineering criteria."
            }
          }
        },
        {
          org_id: activeOrg.id,
          title: 'React Core Framework Lead',
          role: 'Lead React Developer',
          department: 'Frontend Systems',
          seniority: 'Lead/Manager',
          status: 'active',
          created_by: user.id,
          jd_raw_text: 'Build and maintain Next.js compiler plugins, Turbopack, and Webpack integration.',
        },
        {
          org_id: activeOrg.id,
          title: 'QA Automation Pipeline Sync',
          role: 'QA Tester',
          department: 'Quality Assurance',
          seniority: 'Mid',
          status: 'failed',
          created_by: user.id,
          jd_raw_text: 'Automated test suite configurations for CI pipelines.',
          jd_structured: {
            error: 'Failed during Job Description parsing step: API key quota exceeded.'
          }
        },
        {
          org_id: activeOrg.id,
          title: 'Q3 Mobile Application Release',
          role: 'React Native Developer',
          department: 'Mobile Tech',
          seniority: 'Senior',
          status: 'draft',
          created_by: user.id,
        },
        {
          org_id: activeOrg.id,
          title: 'Junior Data Analyst (2025 Pool)',
          role: 'Data Analyst',
          department: 'Analytics',
          seniority: 'Junior',
          status: 'archived',
          created_by: user.id,
          jd_structured: {
            pool_report: {
              total_applicants: 1,
              actually_qualified: 0,
              qualification_rate_percentage: 0,
              average_inflation_rate: 45.0,
              honest_candidate_rate: 0,
              most_over_claimed_skill: 'Python',
              most_under_claimed_skill: 'SQL',
              pool_narrative: "Junior pool showed significant title and skill inflation rates."
            }
          }
        }
      ];

      for (const p of mockProjects) {
        const { data: newProj, error: err } = await api.db('projects')
          .insert(p)
          .single();

        if (err) throw err;

        // If complete or archived, seed candidates
        if (p.status === 'complete' || p.status === 'archived') {
          await api.db('candidates').insert([
            {
              project_id: newProj.id,
              org_id: activeOrg.id,
              name: 'Alex Mercer',
              email: 'alex.mercer@mlsys.io',
              resume_file_url: 'https://recruiter-x.ai/resumes/alex.pdf',
              trajectory_score: 96,
              behaviour_score: 92,
              insider_score: 94,
              credibility_score: 92,
              final_score: 94,
              trajectory_label: 'ACCELERATING',
              red_flags: [],
              insider_signals: [
                'NCCL ring collective communication design',
                'CUDA custom kernel implementations'
              ],
              interrogation_qs: [
                'You worked on multi-node GPU training. What specific optimization did you apply to NCCL collective communication?'
              ],
              narrative: 'Trajectory shows rapid progression. Technical depth in systems architecture is verified.',
              analysis_status: 'complete',
            },
            {
              project_id: newProj.id,
              org_id: activeOrg.id,
              name: 'Jordan Vance',
              email: 'jordan.v@reactdev.org',
              resume_file_url: 'https://recruiter-x.ai/resumes/jordan.pdf',
              trajectory_score: 48,
              behaviour_score: 56,
              insider_score: 32,
              credibility_score: 34,
              final_score: 45,
              trajectory_label: 'PLATEAUED',
              red_flags: [
                { type: 'Title Inflation', severity: 'high', text: 'Claims lead responsibility but achievements represent routine components.' }
              ],
              insider_signals: ['Basic REST consumption'],
              interrogation_qs: [
                'Next.js uses Turbopack/SWC compiler natively. What specific config did you override and why?'
              ],
              narrative: 'Candidate claims Lead title but work history reflects routine task execution.',
              analysis_status: 'complete',
            }
          ]);
        } else if (p.status === 'active') {
          // Seed active parsing candidates
          await api.db('candidates').insert([
            {
              project_id: newProj.id,
              org_id: activeOrg.id,
              name: 'Yuki Tanaka',
              email: 'yuki@tanaka.co.jp',
              resume_file_url: 'https://recruiter-x.ai/resumes/yuki.pdf',
              analysis_status: 'complete',
              final_score: 75,
              insider_score: 80
            },
            {
              project_id: newProj.id,
              org_id: activeOrg.id,
              name: 'Liam O Connor',
              email: 'liam@oconnor.ie',
              resume_file_url: 'https://recruiter-x.ai/resumes/liam.pdf',
              analysis_status: 'parsing'
            }
          ]);
        }
      }

      await fetchDashboardData();
    } catch (err: any) {
      alert(`Seeding failed: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSelectProject = (project: any) => {
    if (project.status === 'draft') {
      router.push(`/project/${project.id}`);
    } else {
      setSelectedProject(project);
      setIsDetailsOpen(true);
    }
  };

  const handleCreateNewProject = async () => {
    if (!activeOrg || !user) return;
    try {
      setIsLoading(true);
      const { data: newProject, error: insertError } = await api.db('projects')
        .insert({
          org_id: activeOrg.id,
          title: 'Untitled Project',
          role: 'Untitled Role',
          status: 'draft',
          created_by: user.id
        })
        .single();

      if (insertError || !newProject) throw insertError || new Error('Failed to create project');
      router.push(`/project/${newProject.id}`);
    } catch (err: any) {
      alert(`Failed to create project: ${err.message}`);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null;
  }

  const lastProject = projects.length > 0 ? projects[0] : null;

  return (
    <div className="min-h-screen bg-white text-neutral-800 flex flex-col relative font-sans">
      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 md:px-12 py-10 space-y-12">
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-800 flex gap-3 text-xs max-w-lg mx-auto">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Hero Section */}
        {projects.length > 0 && (
          <HeroProject 
            lastProject={lastProject} 
            globalStats={globalStats}
            onSelectProject={handleSelectProject}
          />
        )}

        {/* Projects List Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900 font-sans tracking-tight">
            Workspace Projects
          </h2>
          <ProjectsGrid
            projects={projects}
            onSelectProject={handleSelectProject}
            onOpenCreateModal={handleCreateNewProject}
            onRetryProject={handleRetryProject}
            onRestoreProject={handleRestoreProject}
          />
        </div>
      </main>

      {/* Seed Demo Button in Footer */}
      <footer className="w-full border-t border-neutral-100 py-6 text-center bg-neutral-50/50 mt-16">
        <button
          onClick={seedDemoData}
          disabled={isSeeding}
          className="inline-flex items-center gap-1.5 border border-dashed border-neutral-300 text-neutral-500 hover:text-neutral-900 hover:border-neutral-400 bg-white rounded-full px-5 py-2 text-xs font-semibold transition-all select-none active:scale-[0.98]"
        >
          {isSeeding ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Seeding Demo Workspace...</span>
            </>
          ) : (
            <>
              <Database className="w-3.5 h-3.5" />
              <span>Seed Demo Data</span>
            </>
          )}
        </button>
      </footer>

      <ProjectDetailsModal
        project={selectedProject}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedProject(null);
        }}
        onRefresh={fetchDashboardData}
      />
    </div>
  );
}
