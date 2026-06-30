'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { api } from '@/utils/api-client';
import { 
  ArrowLeft, Upload, FileText, CheckCircle2, AlertCircle, 
  Download, Sparkles, TrendingUp, UserCheck, Key, RefreshCw, 
  HelpCircle, ChevronRight, BarChart2
} from 'lucide-react';
import { toast } from 'sonner';

interface JDAuditQualityFlag {
  flag_type: string;
  location: string;
  recommendation: string;
}

interface JDAuditStructured {
  must_have_skills?: string[];
  nice_to_have_skills?: string[];
  implied_requirements?: string[];
  inferred_seniority?: string;
  stated_seniority?: string;
  seniority_mismatch?: boolean;
  working_style?: {
    pace?: string;
    collaboration?: string;
    mode?: string;
  };
  culture_signals?: string[];
  hidden_expectations?: string[];
  jd_quality_score?: number;
  jd_quality_flags?: JDAuditQualityFlag[];
  audit_narrative?: string;
  pool_report?: any;
}

interface GhostBenchmarkDimensions {
  trajectory_benchmark?: string;
  behaviour_benchmark?: string;
  insider_benchmark?: string;
  credibility_benchmark?: string;
}

interface GhostCandidateData {
  ideal_career_arc?: string;
  expected_trajectory?: string;
  expected_companies_by_type?: string[];
  expected_problems_solved?: string[];
  expected_insider_signals?: string[];
  expected_absence_signals?: { signal: string; reason_absent: string }[];
  ghost_narrative?: string;
  benchmark_dimensions?: GhostBenchmarkDimensions;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  resume_file_url: string;
  analysis_status: 'pending' | 'parsing' | 'parsed' | 'analyzing' | 'complete' | 'failed';
  trajectory_score?: number;
  behaviour_score?: number;
  ghost_score?: number;
  insider_score?: number;
  credibility_score?: number;
  final_score?: number;
  rank?: number;
  trajectory_label?: string;
  red_flags?: any[];
  insider_signals?: any[];
  interrogation_qs?: any[];
  narrative?: string;
  created_at: string;
  _updated?: boolean; // client-only transition indicator
}

export default function ProjectWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const supabase = useMemo(() => createClient(), []);

  // Workspace state
  const [project, setProject] = useState<any | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activeOrg, setActiveOrg] = useState<{ id: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Phase 0 - Workspace Setup states
  const [phase0Title, setPhase0Title] = useState('');
  const [phase0Role, setPhase0Role] = useState('');
  const [phase0Dept, setPhase0Dept] = useState('');
  const [phase0Seniority, setPhase0Seniority] = useState('Senior');
  const [isSavingPhase0, setIsSavingPhase0] = useState(false);

  // Phase 1 - JD Submission states
  const [jdText, setJdText] = useState('');
  const [isSubmittingJd, setIsSubmittingJd] = useState(false);
  const [auditJobId, setAuditJobId] = useState<string | null>(null);
  const [auditProgress, setAuditProgress] = useState({
    status: 'queued',
    stage: 'Queued',
    percent: 0,
    error: null as string | null
  });

  // Phase 2 - Resume upload states
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  // Phase 3 - Slider weights state
  const [weights, setWeights] = useState({
    ghost_match: 0.25,
    trajectory: 0.25,
    behaviour: 0.25,
    insider_signal: 0.15,
    credibility: 0.10
  });
  const [prevRanks, setPrevRanks] = useState<Record<string, number>>({});

  // Fetch initial project, candidates, and org
  const fetchProjectData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Resolve active organization ID from cookie
      const cookiesArr = document.cookie.split(';');
      const orgCookie = cookiesArr.find(c => c.trim().startsWith('org_id='));
      const resolvedOrgId = orgCookie ? orgCookie.split('=')[1].trim() : null;

      if (!resolvedOrgId) {
        toast.error('No active organization selected.');
        router.push('/org-selection');
        return;
      }

      // Fetch org details
      const { data: orgData } = await supabase
        .from('organisations')
        .select('name')
        .eq('id', resolvedOrgId)
        .single();
      
      setActiveOrg({ id: resolvedOrgId, name: orgData?.name || 'My Organization' });

      // Fetch project details
      const { data: projectData, error: projErr } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('org_id', resolvedOrgId)
        .single();

      if (projErr || !projectData) {
        toast.error('Project not found.');
        router.push('/dashboard');
        return;
      }

      setProject(projectData);
      setJdText(projectData.jd_raw_text || '');
      if (projectData.title && projectData.title !== 'Untitled Project') {
        setPhase0Title(projectData.title);
      }
      if (projectData.role && projectData.role !== 'Untitled Role') {
        setPhase0Role(projectData.role);
      }
      setPhase0Dept(projectData.department || '');
      setPhase0Seniority(projectData.seniority || 'Senior');

      // Fetch candidates details
      const { data: candidatesData } = await supabase
        .from('candidates')
        .select('*')
        .eq('project_id', projectId)
        .eq('org_id', resolvedOrgId);

      setCandidates(candidatesData || []);
    } catch (err: any) {
      toast.error('Error fetching workspace data.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, router, supabase]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  // Supabase Realtime subscriptions
  useEffect(() => {
    if (!projectId || !activeOrg?.id) return;

    const channel = supabase
      .channel(`project-workspace-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'candidates',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newCand = payload.new as Candidate;
            setCandidates((prev) => [...prev, newCand]);
            toast.info(`New candidate added: ${newCand.name}`);
          } else if (payload.eventType === 'UPDATE') {
            const updatedCand = payload.new as Candidate;
            setCandidates((prev) =>
              prev.map((c) =>
                c.id === updatedCand.id ? { ...updatedCand, _updated: true } : c
              )
            );
            // Flash updated state then reset
            setTimeout(() => {
              setCandidates((prev) =>
                prev.map((c) =>
                  c.id === updatedCand.id ? { ...c, _updated: false } : c
                )
              );
            }, 1000);
          } else if (payload.eventType === 'DELETE') {
            const deletedCand = payload.old as { id: string };
            setCandidates((prev) => prev.filter((c) => c.id !== deletedCand.id));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`
        },
        (payload) => {
          setProject(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, activeOrg, supabase]);

  // Polling Celery JD Audit progress status
  useEffect(() => {
    if (!auditJobId) return;

    const checkStatus = async () => {
      try {
        const res = await api.get(`/projects/job-status/${auditJobId}`);
        let percent = 0;
        switch (res.stage) {
          case 'Reading job description':
            percent = 15;
            break;
          case 'Extracting requirements':
            percent = 45;
            break;
          case 'Building benchmark profile':
            percent = 75;
            break;
          case 'Finalizing audit':
            percent = 90;
            break;
          case 'Complete':
            percent = 100;
            break;
          default:
            percent = 0;
        }

        setAuditProgress({
          status: res.status,
          stage: res.stage,
          percent: percent,
          error: res.error
        });

        if (res.status === 'SUCCESS' || res.status === 'Complete') {
          setAuditJobId(null);
          toast.success('Job description audited successfully!');
          // Re-fetch project to load updated structured fields
          const { data: projectData } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();
          if (projectData) {
            setProject(projectData);
          }
        } else if (res.status === 'FAILURE' || res.status === 'Failed') {
          setAuditJobId(null);
          toast.error(`JD Audit failed: ${res.error || 'Unknown error'}`);
        }
      } catch (err: any) {
        console.error('Failed to query audit job status:', err);
      }
    };

    // Polling interval
    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, [auditJobId, projectId, supabase]);

  // Client-side score calculator based on sliders
  const calculateClientScore = useCallback((candidate: Candidate, sliderWeights: typeof weights) => {
    const totalWeight = Object.values(sliderWeights).reduce((a, b) => a + b, 0);
    if (totalWeight === 0) return 0;
    
    const normW = {
      ghost_match: (sliderWeights.ghost_match || 0) / totalWeight,
      trajectory: (sliderWeights.trajectory || 0) / totalWeight,
      behaviour: (sliderWeights.behaviour || 0) / totalWeight,
      insider_signal: (sliderWeights.insider_signal || 0) / totalWeight,
      credibility: (sliderWeights.credibility || 0) / totalWeight
    };
    
    const weightedSum = 
      (candidate.ghost_score || 0) * normW.ghost_match +
      (candidate.trajectory_score || 0) * normW.trajectory +
      (candidate.behaviour_score || 0) * normW.behaviour +
      (candidate.insider_score || 0) * normW.insider_signal +
      (candidate.credibility_score || 0) * normW.credibility;
      
    const redFlags = candidate.red_flags || [];
    let penalty = 0;
    redFlags.forEach(flag => {
      const sev = (flag.severity || 'LOW').toUpperCase();
      if (sev === 'HIGH') penalty += 8;
      else if (sev === 'MEDIUM') penalty += 4;
      else penalty += 1;
    });
    penalty = Math.min(penalty, 30);
    
    return Math.max(0, Math.round(weightedSum - penalty));
  }, []);

  // Memoized candidate sorting and ranks
  const sortedCandidates = useMemo(() => {
    const list = [...candidates].map(c => {
      let score = c.final_score || 0;
      if (c.analysis_status === 'complete') {
        score = calculateClientScore(c, weights);
      }
      return { ...c, computed_score: score };
    });
    
    list.sort((a, b) => {
      // Completed candidates always sorted above running/pending candidates
      if (a.analysis_status !== 'complete' && b.analysis_status === 'complete') return 1;
      if (a.analysis_status === 'complete' && b.analysis_status !== 'complete') return -1;
      
      if (b.computed_score !== a.computed_score) {
        return b.computed_score - a.computed_score;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    return list;
  }, [candidates, weights, calculateClientScore]);

  // Map of current candidate IDs to their sorted index rank (1-indexed)
  const currentRanksMap = useMemo(() => {
    const map: Record<string, number> = {};
    sortedCandidates.forEach((c, idx) => {
      map[c.id] = idx + 1;
    });
    return map;
  }, [sortedCandidates]);

  // Update weights helper to track rank changes
  const handleWeightChange = (newWeights: typeof weights) => {
    setPrevRanks(currentRanksMap);
    setWeights(newWeights);
  };

  // Apply slider weight presets
  const applyPreset = (presetName: 'founding_engineer' | 'senior_ic' | 'compliance_risk' | 'growth_hire') => {
    const presets = {
      founding_engineer: { ghost_match: 0.20, trajectory: 0.35, behaviour: 0.30, insider_signal: 0.10, credibility: 0.05 },
      senior_ic: { ghost_match: 0.35, trajectory: 0.10, behaviour: 0.05, insider_signal: 0.30, credibility: 0.20 },
      compliance_risk: { ghost_match: 0.20, trajectory: 0.05, behaviour: 0.05, insider_signal: 0.30, credibility: 0.40 },
      growth_hire: { ghost_match: 0.15, trajectory: 0.40, behaviour: 0.35, insider_signal: 0.05, credibility: 0.05 }
    };
    handleWeightChange(presets[presetName]);
    toast.success(`Preset applied: ${presetName.replace('_', ' ')}`);
  };

  // Phase 0: Workspace Setup Details Submission
  const handlePhase0Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phase0Title.trim() || !phase0Role.trim()) {
      toast.error('Project Name and Target Role/Title are required.');
      return;
    }
    setIsSavingPhase0(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          title: phase0Title.trim(),
          role: phase0Role.trim(),
          department: phase0Dept.trim() || null,
          seniority: phase0Seniority || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) throw error;
      
      // Update local project details
      setProject((prev: any) => prev ? { 
        ...prev, 
        title: phase0Title.trim(), 
        role: phase0Role.trim(),
        department: phase0Dept.trim() || null,
        seniority: phase0Seniority || null
      } : null);

      toast.success('Workspace details saved successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save workspace details');
    } finally {
      setIsSavingPhase0(false);
    }
  };

  // Phase 1: JD Submission
  const handleJdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdText.trim()) return;

    setIsSubmittingJd(true);
    setAuditProgress({
      status: 'queued',
      stage: 'Queued',
      percent: 0,
      error: null
    });

    try {
      const res = await api.post(`/projects/${projectId}/jd`, { jd_text: jdText.trim() });
      setAuditJobId(res.job_id);
      // Optimistically update project status to auditing
      setProject((prev: any) => prev ? { ...prev, status: 'auditing', jd_raw_text: jdText.trim() } : null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit Job Description');
      setIsSubmittingJd(false);
    }
  };

  // Phase 2: Resume Ingestion & Storage upload
  const handleFileUpload = async (files: FileList) => {
    if (!project || !activeOrg) return;
    setIsUploadingFiles(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate size (< 10MB) and type
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} exceeds 10MB limit.`);
        }
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext !== 'pdf' && ext !== 'docx') {
          throw new Error(`File ${file.name} is not a PDF or DOCX.`);
        }

        // Generate candidate ID and storage path
        const candidateId = crypto.randomUUID();
        const storagePath = `${activeOrg.id}/${projectId}/${candidateId}/${file.name}`;

        // Upload to Supabase resumes bucket
        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(storagePath, file);

        if (uploadError) throw uploadError;

        // Create candidate record in postgres
        const { data: candData, error: insertError } = await supabase
          .from('candidates')
          .insert({
            id: candidateId,
            project_id: projectId,
            org_id: activeOrg.id,
            name: file.name.replace(/\.[^/.]+$/, ''),
            resume_file_url: storagePath,
            analysis_status: 'parsing'
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return candData;
      });

      const uploadedCandidates = await Promise.all(uploadPromises);
      toast.success(`Successfully uploaded ${uploadedCandidates.length} resumes!`);
      
      // Kick off bulk Celery parsing / analysis
      const candIds = uploadedCandidates.map(c => c.id);
      await api.post('/analysis/start', {
        project_id: projectId,
        candidate_ids: candIds
      });

    } catch (err: any) {
      toast.error(err.message || 'Error uploading resumes');
      console.error(err);
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const handleRetryCandidate = async (candidateId: string) => {
    try {
      setCandidates(prev => 
        prev.map(c => c.id === candidateId ? { ...c, analysis_status: 'parsing' } : c)
      );
      await api.post(`/candidates/${candidateId}/retry`);
      toast.success('Analysis job re-queued.');
    } catch (err: any) {
      toast.error('Failed to retry candidate analysis.');
    }
  };

  // CSV Export Trigger
  const handleExport = () => {
    if (!project) return;
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
    window.location.href = `${API_BASE_URL}/export?project_id=${projectId}`;
  };

  // Calculate provisional stats
  const provisionalStats = useMemo(() => {
    const completed = candidates.filter(c => c.analysis_status === 'complete');
    if (completed.length < 2) return null;
    const avgScore = Math.round(
      completed.reduce((sum, c) => sum + (c.final_score || 0), 0) / completed.length
    );
    const qualifiedCount = completed.filter(c => (c.final_score || 0) > 65).length;
    const qualRate = Math.round((qualifiedCount / completed.length) * 100);
    return {
      count: completed.length,
      avgScore,
      qualRate
    };
  }, [candidates]);

  // Determine current working phase
  const isPhase0 = project?.status === 'draft' && (!project?.title || project?.title === 'Untitled Project');
  const hasJd = project?.jd_raw_text && project?.status !== 'draft';
  const isAuditing = project?.status === 'auditing';
  const hasCandidates = candidates.length > 0;

  let currentPhase = 1;
  if (isPhase0) {
    currentPhase = 0;
  } else if (hasJd && !isAuditing) {
    currentPhase = hasCandidates ? 3 : 2;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center items-center font-sans">
        <div className="relative w-12 h-12 flex justify-center items-center">
          <svg className="w-10 h-10 text-[#0000FF] animate-spin" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="6" strokeDasharray="10 10" />
            <circle cx="50" cy="50" r="10" fill="currentColor" />
          </svg>
        </div>
        <p className="mt-4 text-xs font-mono tracking-widest text-text-secondary uppercase">Loading Workspace...</p>
      </div>
    );
  }

  const jdStructured = (project?.jd_structured || {}) as JDAuditStructured;
  const ghostCandidate = (project?.ghost_candidate || {}) as GhostCandidateData;
  const poolReport = jdStructured.pool_report;

  return (
    <div className="min-h-screen bg-bg-base relative overflow-x-hidden font-sans text-text-primary">
      
      {/* Background ambient drifting glow */}
      <div 
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-blob rounded-full filter blur-[120px] pointer-events-none opacity-20 transform translate-x-[-50%] translate-y-[-50%] animate-blob-drift" 
        style={{ '--blob-duration': '20s' } as React.CSSProperties}
      />

      {/* Navigation Header */}
      <header className="border-b border-neutral-100 bg-white sticky top-0 z-20 px-6 md:px-12 py-5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.push('/dashboard')}
            className="p-2 border border-neutral-200 rounded-full hover:bg-neutral-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-text-secondary" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display font-bold text-xl md:text-2xl text-text-primary tracking-tight">
                {project?.title || 'Project Workspace'}
              </h1>
              <span className="bg-[#EEF2FF] border border-[#8FB3FF]/30 text-[#0000FF] px-2.5 py-0.5 rounded-full text-xs font-mono uppercase tracking-wider">
                Phase {currentPhase}
              </span>
            </div>
            <p className="text-xs text-text-secondary font-mono mt-0.5">
              {project?.department || 'General'} · {project?.seniority || 'All Levels'}
            </p>
          </div>
        </div>

        {currentPhase === 3 && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="px-4 py-2 border border-neutral-200 rounded-full hover:bg-neutral-50 transition-all font-semibold text-xs flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            {poolReport && (
              <button
                onClick={() => router.push(`/project/${projectId}/pool`)}
                className="px-4 py-2 bg-[#0000FF] hover:bg-[#0000CC] text-white rounded-full transition-all font-semibold text-xs flex items-center gap-2 shadow-md shadow-blue-500/10 active:scale-[0.98]"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>View Pool Report</span>
              </button>
            )}
          </div>
        )}
      </header>

      <main className="max-w-content mx-auto px-6 md:px-12 py-12 relative z-10">

        {/* ========================================== */}
        {/* PHASE 1 — JD Not Uploaded / Auditing       */}
        {/* ========================================== */}
        {currentPhase === 1 && (
          <div className="max-w-2xl mx-auto py-12 reveal">
            {isAuditing || auditJobId ? (
              // Polling progress card state
              <div className="bg-white border border-neutral-200 rounded-[20px] p-8 shadow-card text-center">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-mono text-text-tertiary">JOB ID: {auditJobId?.slice(0, 8)}...</span>
                  <span className="text-xs font-mono text-[#0000FF] bg-[#EEF2FF] px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {auditProgress.status}
                  </span>
                </div>

                <h3 className="font-display font-bold text-xl text-text-primary mb-2">
                  Running your audit...
                </h3>
                <p className="text-sm text-text-secondary mb-8 font-mono">
                  {auditProgress.stage}
                </p>

                {/* Progress bar track */}
                <div className="w-full bg-[#EEF2FF] rounded-full h-2.5 overflow-hidden mb-6">
                  <div 
                    className="bg-gradient-score h-full rounded-full transition-all duration-500"
                    style={{ width: `${auditProgress.percent}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-text-tertiary font-mono">
                  <span>Progress: {auditProgress.percent}%</span>
                  <span>Est. time remaining: ~10s</span>
                </div>

                <div className="mt-8 border-t border-neutral-100 pt-6 text-left space-y-3">
                  <div className="flex items-center gap-2.5 text-sm">
                    {auditProgress.percent >= 15 ? (
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-neutral-200" />
                    )}
                    <span className={auditProgress.percent >= 15 ? 'text-text-primary' : 'text-text-tertiary'}>
                      Reading job description
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm">
                    {auditProgress.percent >= 45 ? (
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                    ) : auditProgress.percent >= 15 ? (
                      <div className="w-4 h-4 rounded-full border-2 border-[#0000FF] border-t-transparent animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-neutral-200" />
                    )}
                    <span className={auditProgress.percent >= 45 ? 'text-text-primary' : 'text-text-tertiary'}>
                      Extracting core skills & requirements
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm">
                    {auditProgress.percent >= 75 ? (
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                    ) : auditProgress.percent >= 45 ? (
                      <div className="w-4 h-4 rounded-full border-2 border-[#0000FF] border-t-transparent animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-neutral-200" />
                    )}
                    <span className={auditProgress.percent >= 75 ? 'text-text-primary' : 'text-text-tertiary'}>
                      Building synthetic ideal-candidate benchmark
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              // JD text input zone
              <form onSubmit={handleJdSubmit} className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="font-display font-bold text-2xl tracking-tight text-text-primary mb-2">
                    Submit Job Description
                  </h2>
                  <p className="text-sm text-text-secondary max-w-md mx-auto">
                    We will audit requirements, spot ambiguities, and construct the synthetic Ghost Candidate benchmark.
                  </p>
                </div>

                <div 
                  className={`border-2 border-dashed rounded-[20px] p-8 bg-neutral-50 transition-all ${
                    isDragOver ? 'border-[#0000FF] bg-[#EEF2FF]/30' : 'border-neutral-200'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                      const file = files[0];
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setJdText(event.target?.result as string);
                      };
                      reader.readAsText(file);
                    }
                  }}
                >
                  <textarea
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    placeholder="Paste the raw text of the job description here..."
                    className="w-full h-80 bg-white border border-neutral-200 rounded-[12px] p-4 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[#0000FF]/20 focus:border-[#0000FF] resize-none"
                    required
                  />

                  <div className="flex justify-between items-center mt-4">
                    <p className="text-xs text-text-tertiary font-mono">
                      Accepts direct pasting or raw text
                    </p>
                    <button
                      type="submit"
                      disabled={isSubmittingJd || !jdText.trim()}
                      className="px-6 py-3 bg-[#0A0A0A] hover:bg-neutral-800 text-white rounded-full transition-all font-semibold text-xs disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] flex items-center gap-2"
                    >
                      {isSubmittingJd ? 'Queuing Task...' : 'Analyze Job Description'}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* PHASE 2 — JD Analyzed, No Candidates Yet   */}
        {/* ========================================== */}
        {currentPhase === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 reveal">
            {/* Left: JD structured audit panel */}
            <div className="lg:col-span-7 bg-white border border-neutral-200 rounded-[20px] p-8 shadow-card flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-display font-bold text-lg tracking-tight text-text-primary">
                    JD Audit Intelligence
                  </h3>
                  <div className="flex items-center gap-1.5 bg-[#EEF2FF] border border-[#0000FF]/15 px-3 py-1 rounded-full text-xs font-mono font-bold text-[#0000FF]">
                    <span>Score:</span>
                    <span>{jdStructured.jd_quality_score || 100}/100</span>
                  </div>
                </div>

                <p className="text-sm text-text-secondary leading-relaxed mb-6 font-sans">
                  {jdStructured.audit_narrative}
                </p>

                <div className="space-y-6">
                  {/* Must Have Skills */}
                  {jdStructured.must_have_skills && jdStructured.must_have_skills.length > 0 && (
                    <div>
                      <h4 className="text-xs font-mono uppercase text-text-tertiary tracking-wider mb-2.5">
                        Must-Have Dimensions
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {jdStructured.must_have_skills.map((skill, i) => (
                          <span key={i} className="bg-[#EEF2FF] border border-[#8FB3FF]/30 text-[#0000FF] text-xs font-medium px-3 py-1 rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Nice Have Skills */}
                  {jdStructured.nice_to_have_skills && jdStructured.nice_to_have_skills.length > 0 && (
                    <div>
                      <h4 className="text-xs font-mono uppercase text-text-tertiary tracking-wider mb-2.5">
                        Nice-to-Have Indicators
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {jdStructured.nice_to_have_skills.map((skill, i) => (
                          <span key={i} className="bg-neutral-50 border border-neutral-200 text-text-secondary text-xs px-3 py-1 rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Implied expectations */}
                  {jdStructured.implied_requirements && jdStructured.implied_requirements.length > 0 && (
                    <div>
                      <h4 className="text-xs font-mono uppercase text-text-tertiary tracking-wider mb-2.5">
                        Implied / Hidden Requirements
                      </h4>
                      <ul className="space-y-1.5 text-sm text-text-secondary list-disc pl-4 font-sans">
                        {jdStructured.implied_requirements.map((req, i) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Quality Flags */}
                  {jdStructured.jd_quality_flags && jdStructured.jd_quality_flags.length > 0 && (
                    <div className="border-t border-neutral-100 pt-6">
                      <h4 className="text-xs font-mono uppercase text-text-tertiary tracking-wider mb-3 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-warning" />
                        <span>JD Integrity Flags</span>
                      </h4>
                      <div className="space-y-3">
                        {jdStructured.jd_quality_flags.map((flag, i) => (
                          <div key={i} className="bg-[#FFFBEB] border border-[#D97706]/15 rounded-[12px] p-3 text-xs">
                            <p className="font-semibold text-[#D97706] mb-1 font-sans">{flag.flag_type.replace('_', ' ').toUpperCase()}</p>
                            <p className="text-text-secondary mb-1">Located in: <span className="italic">&quot;{flag.location}&quot;</span></p>
                            <p className="font-medium text-text-primary">Recommendation: {flag.recommendation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-neutral-100 flex items-center gap-2 text-xs text-text-tertiary font-mono">
                <Sparkles className="w-3.5 h-3.5 text-[#0000FF]" />
                <span>Audited via {project?.stated_seniority || 'AI Model'} template rules.</span>
              </div>
            </div>

            {/* Right: Ghost Candidate & resume upload zone */}
            <div className="lg:col-span-5 flex flex-col gap-8">
              
              {/* Ghost candidate card */}
              <div className="bg-bg-subtle border-2 border-dashed border-[#8FB3FF] rounded-[20px] p-6 shadow-glow-blue flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="bg-[#EEF2FF] border border-[#0000FF]/15 text-[#0000FF] px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase">
                      Synthetic Benchmark Profile
                    </span>
                    <div title="The model constructs an ideal candidate based on role expectations to benchmark candidates against.">
                      <HelpCircle className="w-4 h-4 text-[#8FB3FF]" />
                    </div>
                  </div>

                  <h4 className="font-display font-bold text-base text-text-primary mb-3">
                    The Ghost Candidate
                  </h4>

                  <p className="text-xs text-text-secondary leading-relaxed mb-4 font-sans">
                    {ghostCandidate.ghost_narrative || "No benchmark narrative generated yet."}
                  </p>

                  <div className="space-y-4">
                    {ghostCandidate.ideal_career_arc && (
                      <div className="text-xs">
                        <span className="font-mono text-text-tertiary block mb-1">IDEAL CAREER VELOCITY</span>
                        <p className="text-text-primary leading-relaxed">{ghostCandidate.ideal_career_arc}</p>
                      </div>
                    )}

                    {ghostCandidate.expected_insider_signals && (
                      <div className="text-xs">
                        <span className="font-mono text-text-tertiary block mb-1">PRACTITIONER SIGNALS</span>
                        <ul className="list-disc pl-4 text-text-primary space-y-1">
                          {ghostCandidate.expected_insider_signals.map((sig, i) => (
                            <li key={i}>{sig}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-[10px] font-mono text-text-tertiary border-t border-neutral-100 pt-4 mt-6">
                  NOTE: Benchmark is not a real applicant. Created dynamically from role context.
                </div>
              </div>

              {/* Ingestion drop zone */}
              <div 
                className={`bg-white border-2 border-dashed rounded-[20px] p-8 text-center flex flex-col justify-center items-center h-full transition-all ${
                  isDragOver ? 'border-[#0000FF] bg-[#EEF2FF]/20' : 'border-neutral-200'
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files.length > 0) {
                    handleFileUpload(e.dataTransfer.files);
                  }
                }}
              >
                <div className="p-4 border border-neutral-100 bg-neutral-50 rounded-full mb-4">
                  <Upload className="w-6 h-6 text-text-secondary animate-bounce" />
                </div>
                
                <h4 className="font-display font-bold text-base text-text-primary mb-1">
                  Ingest Candidate Resumes
                </h4>
                <p className="text-xs text-text-secondary mb-4">
                  Drag and drop files here, or{' '}
                  <label className="text-[#0000FF] cursor-pointer hover:underline font-semibold">
                    browse local files
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.docx"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFileUpload(e.target.files);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </p>

                <p className="text-[10px] font-mono text-text-tertiary">
                  Accepts PDF or DOCX · Up to 500 files · Max 10MB per resume
                </p>

                {isUploadingFiles && (
                  <div className="mt-4 text-xs text-text-secondary font-mono flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0000FF]" />
                    <span>Uploading and queueing candidate analyses...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* PHASE 3 — Analysis Running or Complete     */}
        {/* ========================================== */}
        {currentPhase === 3 && (
          <div className="space-y-8 reveal">
            
            {/* Top Pool Health Band */}
            <div className="relative">
              {!poolReport ? (
                // Provisional state
                <div className="bg-neutral-50 border-2 border-dashed border-neutral-300 rounded-[20px] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-neutral-200 border border-neutral-300 text-text-secondary px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                        Provisional Health Band
                      </span>
                      <span className="w-2 h-2 rounded-full bg-[#0000FF] animate-pulse" />
                    </div>
                    <h3 className="font-display font-bold text-lg text-text-primary mt-2">
                      Analyzing candidates in background...
                    </h3>
                  </div>

                  {provisionalStats ? (
                    <div className="flex items-center gap-8 border-l border-neutral-200 pl-6 font-mono text-sm text-text-secondary">
                      <div>
                        <span className="text-xs text-text-tertiary block">COMPLETED</span>
                        <span className="text-text-primary font-bold text-base">{provisionalStats.count} candidates</span>
                      </div>
                      <div>
                        <span className="text-xs text-text-tertiary block">AVG SCORE</span>
                        <span className="text-text-primary font-bold text-base">{provisionalStats.avgScore}/100</span>
                      </div>
                      <div>
                        <span className="text-xs text-text-tertiary block">QUAL. RATE</span>
                        <span className="text-[#0000FF] font-bold text-base">{provisionalStats.qualRate}%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs font-mono text-text-tertiary flex items-center gap-2 bg-neutral-100 px-4 py-2.5 rounded-full">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Gathering initial completed metrics...</span>
                    </div>
                  )}
                </div>
              ) : (
                // Final pool report state
                <div className="bg-white border border-neutral-200 rounded-[20px] p-6 shadow-card flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-[#EEF2FF] border border-[#0000FF]/15 text-[#0000FF] px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                        Official Pool Health Report
                      </span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
                    </div>
                    <h3 className="font-display font-bold text-xl text-text-primary mt-2">
                      {poolReport.pool_narrative || "Hiring pool audited successfully."}
                    </h3>
                  </div>

                  <div className="flex items-center gap-8 border-l border-neutral-200 pl-6 font-mono text-sm">
                    <div>
                      <span className="text-xs text-text-tertiary block uppercase">Total Applicants</span>
                      <span className="text-text-primary font-bold text-lg">{poolReport.total_applicants}</span>
                    </div>
                    <div>
                      <span className="text-xs text-text-tertiary block uppercase">Honesty Index</span>
                      <span className="text-[#16A34A] font-bold text-lg">{poolReport.honest_candidate_rate}%</span>
                    </div>
                    <div>
                      <span className="text-xs block uppercase font-bold text-[#0000FF]">Qualification</span>
                      <span className="text-[#0000FF] font-bold text-xl">{poolReport.qualification_rate_percentage}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Layout Grid: Sliders on left, Candidate cards on right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Weight Slider Settings (3 cols width) */}
              <div className="lg:col-span-4 bg-white border border-neutral-200 rounded-[20px] p-6 shadow-card h-fit space-y-8">
                <div>
                  <h3 className="font-display font-bold text-lg tracking-tight text-text-primary mb-1">
                    Ranking Weights
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Adjust dimensions client-side to instantly recalculate and re-sort candidate list metrics.
                  </p>
                </div>

                {/* Preset snaps */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider block">PRESET PROFILES</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => applyPreset('founding_engineer')}
                      className="px-3 py-2 border border-neutral-200 rounded-[12px] hover:bg-neutral-50 text-[11px] font-semibold text-text-primary text-center transition-all active:scale-[0.98]"
                    >
                      Founding Engineer
                    </button>
                    <button
                      onClick={() => applyPreset('senior_ic')}
                      className="px-3 py-2 border border-neutral-200 rounded-[12px] hover:bg-neutral-50 text-[11px] font-semibold text-text-primary text-center transition-all active:scale-[0.98]"
                    >
                      Senior IC Focus
                    </button>
                    <button
                      onClick={() => applyPreset('compliance_risk')}
                      className="px-3 py-2 border border-neutral-200 rounded-[12px] hover:bg-neutral-50 text-[11px] font-semibold text-text-primary text-center transition-all active:scale-[0.98]"
                    >
                      Compliance Check
                    </button>
                    <button
                      onClick={() => applyPreset('growth_hire')}
                      className="px-3 py-2 border border-neutral-200 rounded-[12px] hover:bg-neutral-50 text-[11px] font-semibold text-text-primary text-center transition-all active:scale-[0.98]"
                    >
                      Growth Potential
                    </button>
                  </div>
                </div>

                {/* Dimensions Sliders list */}
                <div className="space-y-5 border-t border-neutral-100 pt-6">
                  {/* Trajectory */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono text-text-secondary">
                      <span>1. TRAJECTORY VELOCITY</span>
                      <span className="font-bold text-[#0000FF]">{Math.round(weights.trajectory * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={weights.trajectory}
                      onChange={(e) => handleWeightChange({ ...weights, trajectory: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-[#EEF2FF] rounded-lg appearance-none cursor-pointer accent-[#0000FF]"
                    />
                  </div>

                  {/* Behaviour fit */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono text-text-secondary">
                      <span>2. BEHAVIOUR & OUTCOME</span>
                      <span className="font-bold text-[#0000FF]">{Math.round(weights.behaviour * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={weights.behaviour}
                      onChange={(e) => handleWeightChange({ ...weights, behaviour: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-[#EEF2FF] rounded-lg appearance-none cursor-pointer accent-[#0000FF]"
                    />
                  </div>

                  {/* Ghost Candidate Match */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono text-text-secondary">
                      <span>3. GHOST BENCHMARK MATCH</span>
                      <span className="font-bold text-[#0000FF]">{Math.round(weights.ghost_match * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={weights.ghost_match}
                      onChange={(e) => handleWeightChange({ ...weights, ghost_match: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-[#EEF2FF] rounded-lg appearance-none cursor-pointer accent-[#0000FF]"
                    />
                  </div>

                  {/* Insider Knowledge */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono text-text-secondary">
                      <span>4. PRACTITIONER INSIDER</span>
                      <span className="font-bold text-[#0000FF]">{Math.round(weights.insider_signal * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={weights.insider_signal}
                      onChange={(e) => handleWeightChange({ ...weights, insider_signal: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-[#EEF2FF] rounded-lg appearance-none cursor-pointer accent-[#0000FF]"
                    />
                  </div>

                  {/* Credibility */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono text-text-secondary">
                      <span>5. CREDIBILITY & RISK</span>
                      <span className="font-bold text-[#0000FF]">{Math.round(weights.credibility * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={weights.credibility}
                      onChange={(e) => handleWeightChange({ ...weights, credibility: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-[#EEF2FF] rounded-lg appearance-none cursor-pointer accent-[#0000FF]"
                    />
                  </div>
                </div>

                <div className="text-[10px] font-mono text-text-tertiary bg-neutral-50 p-3 rounded-[12px] border border-neutral-100">
                  Weights normalize automatically during score calculations. Client re-ranking involves no API latency.
                </div>
              </div>

              {/* Right Candidates List (8 cols width) */}
              <div className="lg:col-span-8 space-y-4">
                
                {/* Drag-over/Upload section inside candidates list */}
                <div 
                  className={`border-2 border-dashed rounded-[20px] p-4 text-center transition-all bg-white relative ${
                    isDragOver ? 'border-[#0000FF] bg-[#EEF2FF]/10' : 'border-neutral-200'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    if (e.dataTransfer.files.length > 0) {
                      handleFileUpload(e.dataTransfer.files);
                    }
                  }}
                >
                  <p className="text-xs text-text-secondary font-medium">
                    Have more resumes? Drag files here or{' '}
                    <label className="text-[#0000FF] cursor-pointer hover:underline font-bold">
                      browse
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.docx"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleFileUpload(e.target.files);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </p>
                </div>

                {/* Real-time status list banner */}
                <div className="flex justify-between items-center text-xs font-mono text-text-tertiary px-2">
                  <span>Candidates Pool ({candidates.length} total)</span>
                  <span>Sort Order: Calculated Score (Desc)</span>
                </div>

                {/* Candidate list items */}
                <div className="space-y-4">
                  {sortedCandidates.map((c, idx) => {
                    const isComplete = c.analysis_status === 'complete';
                    const isFailed = c.analysis_status === 'failed';
                    const isProcessing = !isComplete && !isFailed;
                    
                    const rankNum = idx + 1;
                    const prevRank = prevRanks[c.id];
                    const rankDiff = prevRank ? prevRank - rankNum : 0;

                    return (
                      <div
                        key={c.id}
                        className={`bg-white border rounded-[20px] p-6 transition-all duration-300 shadow-card ${
                          c._updated ? 'ring-2 ring-[#8FB3FF] scale-[1.01]' : 'border-neutral-200 hover:border-neutral-300 hover:shadow-card-hover'
                        }`}
                      >
                        {isProcessing ? (
                          // Analyzing candidate card (honest sparse state)
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-display font-bold text-text-primary text-base">
                                {c.name}
                              </h4>
                              <p className="text-xs text-text-tertiary mt-0.5">Resume file queued</p>
                            </div>
                            
                            <div className="flex items-center gap-2 bg-[#EEF2FF] border border-[#0000FF]/10 px-3 py-1.5 rounded-full text-xs font-mono text-[#0000FF]">
                              <span className="w-2 h-2 rounded-full bg-[#0000FF] animate-pulse-dot" />
                              <span className="uppercase tracking-wider">
                                {c.analysis_status}...
                              </span>
                            </div>
                          </div>
                        ) : isFailed ? (
                          // Failed card state
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h4 className="font-display font-bold text-text-primary text-base">
                                {c.name}
                              </h4>
                              <p className="text-xs text-[#DC2626] font-mono mt-1">
                                Analysis failed: {c.narrative || 'Check API key provider state'}
                              </p>
                            </div>
                            
                            <button
                              onClick={() => handleRetryCandidate(c.id)}
                              className="px-3.5 py-1.5 border border-[#DC2626] text-[#DC2626] hover:bg-[#FEF2F2] rounded-full font-semibold text-xs font-mono transition-colors"
                            >
                              Retry Ingestion
                            </button>
                          </div>
                        ) : (
                          // Complete candidate card details
                          <div className="space-y-4">
                            {/* Card Top: rank, name, score */}
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                {/* Rank badges */}
                                <div className="flex items-center gap-1.5 bg-[#FAFAFA] border border-neutral-200 rounded-full px-3 py-1 text-xs font-mono font-bold text-text-secondary">
                                  <span>#{rankNum}</span>
                                  {rankDiff > 0 && (
                                    <span className="text-[#16A34A] text-[10px]">
                                      ▲ +{rankDiff}
                                    </span>
                                  )}
                                  {rankDiff < 0 && (
                                    <span className="text-[#D97706] text-[10px]">
                                      ▼ {rankDiff}
                                    </span>
                                  )}
                                </div>

                                <div>
                                  <h4 className="font-display font-bold text-text-primary text-base">
                                    {c.name}
                                  </h4>
                                  <p className="text-xs text-text-secondary mt-0.5">{c.email || 'No email registered'}</p>
                                </div>
                              </div>

                              {/* Oversized gradient blended score display */}
                              <div className="text-right">
                                <span className="font-display font-bold text-2xl bg-gradient-score bg-clip-text text-transparent block">
                                  {c.computed_score}
                                </span>
                                <span className="text-[9px] font-mono text-text-tertiary uppercase tracking-wider block mt-0.5">
                                  Blended Score
                                </span>
                              </div>
                            </div>

                            {/* Card Middle: narrative summary */}
                            <p className="text-xs text-text-secondary leading-relaxed font-sans line-clamp-2">
                              {c.narrative}
                            </p>

                            {/* Card Bottom: mini progress charts */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 border-t border-neutral-100 pt-4 mt-2">
                              {/* Trajectory */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-mono text-text-tertiary">
                                  <span>TRAJECTORY</span>
                                  <span className="font-bold text-text-secondary">{c.trajectory_score}</span>
                                </div>
                                <div className="w-full bg-neutral-100 rounded-full h-1 overflow-hidden">
                                  <div className="bg-[#0000FF] h-full" style={{ width: `${c.trajectory_score}%` }} />
                                </div>
                              </div>
                              
                              {/* Behaviour */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-mono text-text-tertiary">
                                  <span>BEHAVIOUR</span>
                                  <span className="font-bold text-text-secondary">{c.behaviour_score}</span>
                                </div>
                                <div className="w-full bg-neutral-100 rounded-full h-1 overflow-hidden">
                                  <div className="bg-[#2563EB] h-full" style={{ width: `${c.behaviour_score}%` }} />
                                </div>
                              </div>

                              {/* Ghost match */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-mono text-text-tertiary">
                                  <span>GHOST FIT</span>
                                  <span className="font-bold text-text-secondary">{c.ghost_score}</span>
                                </div>
                                <div className="w-full bg-neutral-100 rounded-full h-1 overflow-hidden">
                                  <div className="bg-[#8FB3FF] h-full" style={{ width: `${c.ghost_score}%` }} />
                                </div>
                              </div>

                              {/* Insider knowledge */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-mono text-text-tertiary">
                                  <span>INSIDER</span>
                                  <span className="font-bold text-text-secondary">{c.insider_score}</span>
                                </div>
                                <div className="w-full bg-neutral-100 rounded-full h-1 overflow-hidden">
                                  <div className="bg-[#0000FF] h-full" style={{ width: `${c.insider_score}%` }} />
                                </div>
                              </div>

                              {/* Credibility */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-mono text-text-tertiary">
                                  <span>CREDIBILITY</span>
                                  <span className="font-bold text-text-secondary">{c.credibility_score}</span>
                                </div>
                                <div className="w-full bg-neutral-100 rounded-full h-1 overflow-hidden">
                                  <div className="bg-[#16A34A] h-full" style={{ width: `${c.credibility_score}%` }} />
                                </div>
                              </div>
                            </div>

                            {/* Red Flags Badge count */}
                            {c.red_flags && c.red_flags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-2">
                                {c.red_flags.map((flag, idx) => (
                                  <span key={idx} className="bg-[#FEF2F2] border border-[#DC2626]/15 text-[#DC2626] text-[10px] font-semibold font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>{flag.flag_type.replace('_', ' ').toUpperCase()}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
