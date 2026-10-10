'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/utils/api-client';
import { X, Sliders, AlertTriangle, CheckCircle, Info, ChevronRight, HelpCircle, Upload, Play, Building } from 'lucide-react';

interface ProjectDetailsModalProps {
  project: any | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function ProjectDetailsModal({
  project,
  isOpen,
  onClose,
  onRefresh
}: ProjectDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'candidates' | 'overview'>('candidates');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [activeCandidateId, setActiveCandidateId] = useState<string>('');
  const [isSubmittingJd, setIsSubmittingJd] = useState(false);
  const [jdText, setJdText] = useState('');
  
  // Sliders state
  const [trajWeight, setTrajWeight] = useState(40);
  const [behWeight, setBehWeight] = useState(30);
  const [depthWeight, setDepthWeight] = useState(30);



  // Load project candidates
  useEffect(() => {
    if (!isOpen || !project) return;

    const fetchCandidates = async () => {
      try {
        let dbCandidates: any[] = [];
        try {
          const { data, error } = await api.db('candidates')
            .select('*')
            .eq('project_id', project.id);
          if (!error && data) {
            dbCandidates = data;
          }
        } catch (e) {
          console.warn('Backend query failed, falling back to API');
        }

        if (dbCandidates.length === 0) {
          // Fallback to real candidate list from local API
          const res = await fetch('/api/candidates');
          const apiData = await res.json();
          if (Array.isArray(apiData)) {
            dbCandidates = apiData.map((c: any) => {
              const flags = [];
              if (c.has_expert_low_duration) flags.push({ type: 'EXPERT_LOW_DURATION', text: 'Claims expert proficiency with low duration' });
              if (c.has_yoe_mismatch) flags.push({ type: 'YOE_MISMATCH', text: 'Stated experience duration mismatch with career history' });
              if (c.has_overlap) flags.push({ type: 'OVERLAP', text: 'Overlapping employment dates in career history' });
              if (c.has_assessment_mismatch) flags.push({ type: 'ASSESSMENT_MISMATCH', text: 'Claimed proficiency mismatch with verified test scores' });
              if (c.has_suspicious_uniformity) flags.push({ type: 'SUSPICIOUS_UNIFORMITY', text: 'Uniform expert proficiency claimed across all skills' });

              return {
                id: c.candidate_id,
                project_id: project.id,
                name: c.anonymized_name,
                email: `${c.candidate_id.toLowerCase()}@sample.local`,
                resume_file_url: '#',
                trajectory_score: Math.round(c.experience_fit * 100),
                behaviour_score: Math.round(c.behavioral * 100),
                insider_score: Math.round(c.education * 100),
                credibility_score: Math.round(c.logistics_fit * 100),
                final_score: Math.round(c.score * 100),
                trajectory_label: c.years_of_experience > 7 ? 'SENIOR' : 'MID',
                red_flags: flags,
                insider_signals: c.consistency_penalty > 0 ? ['Consistency Gate Penalty Triggered'] : [],
                interrogation_qs: c.consistency_penalty > 0 ? ['Explain the discrepancies flagged in your career history validation.'] : [],
                narrative: c.reasoning
              };
            });
          }
        }

        setCandidates(dbCandidates);
        if (dbCandidates.length > 0) {
          setActiveCandidateId(dbCandidates[0].id);
        }
      } catch (err) {
        console.warn('Error fetching candidates:', err);
      }
    };

    fetchCandidates();
  }, [isOpen, project]);

  // Recalculate scores and re-sort when weights change
  const processedCandidates = React.useMemo(() => {
    if (!candidates || candidates.length === 0) return [];
    
    const total = trajWeight + behWeight + depthWeight;
    const wTraj = trajWeight / (total || 1);
    const wBeh = behWeight / (total || 1);
    const wDepth = depthWeight / (total || 1);

    const updated = candidates.map(c => {
      const tScore = c.trajectory_score ?? 70;
      const bScore = c.behaviour_score ?? 70;
      const dScore = c.insider_score ?? 70;
      
      const calculatedScore = Math.round(
        tScore * wTraj +
        bScore * wBeh +
        dScore * wDepth
      );
      
      return {
        ...c,
        calculatedScore
      };
    });

    return updated.sort((a, b) => b.calculatedScore - a.calculatedScore);
  }, [candidates, trajWeight, behWeight, depthWeight]);

  const activeCandidate = processedCandidates.find(c => c.id === activeCandidateId) || processedCandidates[0];

  if (!isOpen || !project) return null;

  // Handler to submit JD and start mock analysis
  const handleJdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdText.trim()) return;

    setIsSubmittingJd(true);

    try {
      // 1. Update project status and JD text
      const { error: projError } = await api.db('projects')
        .update({
          jd_raw_text: jdText.trim(),
          status: 'auditing',
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id);

      if (projError) throw projError;
      
      // Trigger a refresh of the parent grid
      onRefresh();

      // 2. Simulate analysis by creating mock candidates after 4 seconds
      setTimeout(async () => {
        const mockNames = ['Alex Mercer', 'Jordan Vance', 'Priya Rao', 'Yuki Tanaka'];
        const mockRoles = [
          'Senior ML Engineer', 
          'Lead React Developer', 
          'Principal Product Manager',
          'Data Infrastructure Architect'
        ];

        // Insert mock candidates
        for (let i = 0; i < mockNames.length; i++) {
          await api.db('candidates').insert({
            project_id: project.id,
            org_id: project.org_id,
            name: mockNames[i],
            email: `${mockNames[i].toLowerCase().replace(' ', '')}@recruiter-x.ai`,
            resume_file_url: 'https://recruiter-x.ai/resumes/mock.pdf',
            trajectory_score: Math.floor(Math.random() * 50) + 50,
            behaviour_score: Math.floor(Math.random() * 50) + 50,
            insider_score: Math.floor(Math.random() * 50) + 50,
            credibility_score: Math.floor(Math.random() * 40) + 60,
            final_score: Math.floor(Math.random() * 40) + 60,
            trajectory_label: ['ACCELERATING', 'STEADY', 'PLATEAUED'][Math.floor(Math.random() * 3)],
            red_flags: i === 1 ? [
              { type: 'Title Inflation', severity: 'high', text: 'Claims lead responsibility but achievements represent routine components.' }
            ] : [],
            insider_signals: [
              { signal: 'NCCL custom collectives', absence_type: 'suspicious' }
            ],
            interrogation_qs: [
              'You worked on multi-node GPU training. What specific optimization did you apply to NCCL collective communication?'
            ],
            narrative: 'Candidate exhibits a strong trajectory of title progression. Technical depth in systems architecture is verified.',
            analysis_status: 'complete',
            analysis_completed_at: new Date().toISOString()
          });
        }

        // Calculate pool report metrics
        const report = {
          total_applicants: mockNames.length,
          actually_qualified: 3,
          qualification_rate_percentage: 75.0,
          average_inflation_rate: 15.0,
          honest_candidate_rate: 80.0,
          most_over_claimed_skill: 'Kubernetes',
          most_under_claimed_skill: 'NCCL',
          score_distribution: {"0_to_25": 0, "26_to_50": 0, "51_to_75": 1, "76_to_100": 3},
          trajectory_distribution: {"Accelerating": 2, "Steady": 1, "Plateaued": 1, "Declining": 0},
          pool_narrative: "Overall pool quality shows strong technical alignment for Staff machine learning systems requirements."
        };

        // Update project to complete
        await api.db('projects')
          .update({
            status: 'complete',
            jd_structured: { 
              must_have_skills: ['React', 'Machine Learning', 'Python'],
              nice_to_have_skills: ['Docker'],
              pool_report: report 
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', project.id);

        onRefresh();
      }, 4000);

      onClose();
    } catch (err) {
      console.warn('Failed to update project JD:', err);
    } finally {
      setIsSubmittingJd(false);
    }
  };

  const getTrajectoryBadgeStyles = (trajectory: string) => {
    switch (trajectory?.toUpperCase()) {
      case 'ACCELERATING':
        return 'bg-blue-50 text-[#0000FF] border-[#0000FF]/25';
      case 'STEADY':
        return 'bg-neutral-50 text-neutral-600 border-neutral-200';
      case 'PLATEAUED':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'DECLINING':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-neutral-50 text-neutral-600 border-neutral-200';
    }
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 70) return 'text-[#0000FF]';
    if (score >= 45) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getScoreBgClass = (score: number) => {
    if (score >= 70) return 'bg-[#0000FF]';
    if (score >= 45) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans animate-fade-in">
      <div className="w-full max-w-6xl h-[85vh] bg-white rounded-[32px] border border-neutral-100 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-neutral-100 bg-neutral-50/50">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-lg text-neutral-900 leading-none">
                {project.title}
              </h2>
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block bg-neutral-200 px-2 py-0.5 rounded">
                {project.status}
              </span>
            </div>
            <p className="text-neutral-500 text-xs mt-1">
              Role: <span className="font-medium text-neutral-800">{project.role}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {project.status === 'complete' && (
              <a
                href="/api/export"
                download
                className="bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 text-xs font-semibold rounded-full px-4 py-2 transition-all flex items-center gap-1.5 active:scale-[0.98] shadow-sm select-none cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 rotate-180" />
                <span>Download CSV</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 transition-colors p-2 hover:bg-neutral-100 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content Router by Status */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {/* DRAFT STATE - UPLOAD JD */}
          {project.status === 'draft' && (
            <div className="max-w-2xl mx-auto space-y-6 py-6">
              <div className="space-y-1.5 text-center">
                <div className="w-12 h-12 bg-blue-50 text-[#0000FF] rounded-full flex items-center justify-center mx-auto mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-neutral-900 text-base">
                  Upload Job Description to Begin Audit
                </h3>
                <p className="text-neutral-500 text-xs max-w-md mx-auto leading-relaxed">
                  Provide the Job Description text. Recruiter-X will audit the required competencies, generate a benchmark ghost candidate profile, and evaluate the applicant queue.
                </p>
              </div>

              <form onSubmit={handleJdSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Job Description Raw Text
                  </label>
                  <textarea
                    required
                    rows={8}
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    placeholder="Paste the job description criteria, requirements, and responsibilities here..."
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl py-3.5 px-4 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-[#0000FF] focus:bg-white transition-all text-xs resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold rounded-full px-5 py-2.5 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingJd}
                    className="bg-[#0000FF] hover:bg-[#0000CC] disabled:bg-neutral-200 text-white text-xs font-semibold rounded-full px-6 py-2.5 transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/10"
                  >
                    {isSubmittingJd ? 'Initializing...' : 'Initialize Analysis'}
                    <Play className="w-3 h-3 fill-current" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ANALYZING STATE - PROGRESS */}
          {(project.status === 'active' || project.status === 'auditing') && (
            <div className="max-w-md mx-auto py-12 flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative flex items-center justify-center">
                {/* Dotted Spinner */}
                <svg className="w-16 h-16 text-[#0000FF] animate-[spin_12s_linear_infinite]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="3.5" strokeDasharray="8 8" />
                  <circle cx="50" cy="50" r="28" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" />
                  <circle cx="50" cy="50" r="18" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                </svg>
                <div className="absolute w-4 h-4 rounded-full bg-[#0000FF] animate-ping" />
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-neutral-900 text-base">
                  Analyzing Candidate Pool...
                </h3>
                <p className="text-neutral-500 text-xs max-w-sm leading-relaxed">
                  The Recruiter-X evaluation engine is conducting a deep-dive audit of all uploaded resume transcripts. Reranking match metrics will compile automatically.
                </p>
              </div>

              <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden relative">
                <div className="absolute inset-y-0 left-0 bg-[#0000FF] w-[60%] animate-[pulse_2s_infinite]" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#0000FF] animate-pulse">Running Cohort Aggregations...</span>
            </div>
          )}

          {/* FAILED STATE */}
          {project.status === 'failed' && (
            <div className="max-w-md mx-auto py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-neutral-900 text-base">
                  Analysis Pipeline Interrupted
                </h3>
                <p className="text-neutral-500 text-xs leading-relaxed">
                  {project.jd_structured?.error || 'A critical error occurred while executing the background parsing tasks.'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-full px-5 py-2.5 transition-all mt-4"
              >
                Close View
              </button>
            </div>
          )}

          {/* COMPLETE OR ARCHIVED STATE - DECISION CONSOLE */}
          {(project.status === 'complete' || project.status === 'archived') && (
            <div className="w-full h-full flex flex-col space-y-6">
              
              {/* Tabs for Console sections */}
              <div className="flex border-b border-neutral-100 gap-6 text-xs font-semibold text-neutral-400">
                <button
                  onClick={() => setActiveTab('candidates')}
                  className={`pb-3.5 border-b-2 px-1 transition-all ${
                    activeTab === 'candidates' ? 'border-[#0000FF] text-[#0000FF]' : 'border-transparent hover:text-neutral-800'
                  }`}
                >
                  Candidate Shortlist ({processedCandidates.length})
                </button>
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`pb-3.5 border-b-2 px-1 transition-all ${
                    activeTab === 'overview' ? 'border-[#0000FF] text-[#0000FF]' : 'border-transparent hover:text-neutral-800'
                  }`}
                >
                  Project Overview & Stats
                </button>
              </div>

              {activeTab === 'candidates' && (
                processedCandidates.length > 0 ? (
                  <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 items-stretch">
                    
                    {/* Left side: Weights sliders and ranked list (col-span-4) */}
                    <div className="lg:col-span-4 border border-neutral-100 rounded-2xl bg-neutral-50/50 p-6 flex flex-col justify-between shadow-sm">
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
                          <Sliders className="w-4 h-4 text-[#0000FF]" />
                          <h3 className="font-semibold text-[10px] uppercase tracking-wider text-neutral-800">
                            Decision Weights
                          </h3>
                        </div>

                        <div className="space-y-4">
                          {/* Trajectory */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-bold text-neutral-600">
                              <span>Career Progression</span>
                              <span className="text-[#0000FF]">{trajWeight}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={trajWeight}
                              onChange={(e) => setTrajWeight(Number(e.target.value))}
                              className="w-full accent-[#0000FF] cursor-pointer"
                            />
                          </div>

                          {/* Behaviour */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-bold text-neutral-600">
                              <span>Ownership Pronouns</span>
                              <span className="text-[#0000FF]">{behWeight}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={behWeight}
                              onChange={(e) => setBehWeight(Number(e.target.value))}
                              className="w-full accent-[#0000FF] cursor-pointer"
                            />
                          </div>

                          {/* Technical Depth */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-bold text-neutral-600">
                              <span>Technical Depth</span>
                              <span className="text-[#0000FF]">{depthWeight}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={depthWeight}
                              onChange={(e) => setDepthWeight(Number(e.target.value))}
                              className="w-full accent-[#0000FF] cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Ranked list */}
                      <div className="mt-8 pt-6 border-t border-neutral-200 flex-1 flex flex-col">
                        <h4 className="font-bold text-[10px] uppercase tracking-wider text-neutral-400 mb-3">
                          Ranked Shortlist
                        </h4>
                        <div className="space-y-2 overflow-y-auto max-h-[220px]">
                          {processedCandidates.map((c, index) => (
                            <div
                              key={c.id}
                              onClick={() => setActiveCandidateId(c.id)}
                              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                activeCandidateId === c.id
                                  ? 'border-[#0000FF] bg-blue-50/50 font-semibold'
                                  : 'border-neutral-100 bg-white hover:border-neutral-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="text-xs font-bold text-neutral-400">#{index + 1}</span>
                                <span className="text-xs text-neutral-800 truncate max-w-[120px]">{c.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold ${getScoreColorClass(c.calculatedScore)}`}>
                                  {c.calculatedScore}/100
                                </span>
                                <ChevronRight className={`w-3.5 h-3.5 ${activeCandidateId === c.id ? 'text-[#0000FF]' : 'text-neutral-400'}`} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right side: Detailed Candidate view (col-span-8) */}
                    <div className="lg:col-span-8 border border-neutral-100 rounded-2xl bg-white p-6 shadow-sm flex flex-col justify-between overflow-y-auto max-h-[500px]">
                      {activeCandidate ? (
                        <div className="space-y-6">
                          
                          {/* Header section */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-neutral-100 pb-4 gap-4">
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-semibold text-lg text-neutral-900 leading-none">
                                  {activeCandidate.name}
                                </h3>
                                <span className={`border text-[9px] font-bold px-2 py-0.5 rounded tracking-wide ${getTrajectoryBadgeStyles(activeCandidate.trajectory_label)}`}>
                                  {activeCandidate.trajectory_label || 'STEADY'}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-500">{activeCandidate.email}</p>
                            </div>

                            <div className="text-left sm:text-right flex items-baseline sm:flex-col justify-between sm:justify-center">
                              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Match Score</span>
                              <span className="text-2xl font-medium tracking-tight flex items-baseline leading-none">
                                <span className={getScoreColorClass(activeCandidate.calculatedScore)}>
                                  {activeCandidate.calculatedScore}
                                </span>
                                <span className="text-neutral-300 text-sm">/100</span>
                              </span>
                            </div>
                          </div>

                          {/* Red flags */}
                          {activeCandidate.red_flags && activeCandidate.red_flags.length > 0 && (
                            <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 space-y-2">
                              <div className="flex items-center gap-2 text-rose-700 text-xs font-bold uppercase">
                                <AlertTriangle className="w-4 h-4" />
                                <span>Red Flags Detected ({activeCandidate.red_flags.length})</span>
                              </div>
                              <div className="space-y-1.5 pl-6">
                                {activeCandidate.red_flags.map((flag: any, idx: number) => (
                                  <div key={idx} className="text-xs text-neutral-700 leading-relaxed">
                                    <span className="font-semibold text-rose-700 mr-1">[{flag.type}]:</span>
                                    {flag.text}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Base scores breakdown */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Career progression</span>
                              <div className="flex items-center gap-3">
                                <div className="h-1.5 bg-neutral-100 rounded-full flex-1 overflow-hidden">
                                  <div 
                                    className={`h-full ${getScoreBgClass(activeCandidate.trajectory_score ?? 70)}`} 
                                    style={{ width: `${activeCandidate.trajectory_score ?? 70}%` }}
                                  />
                                </div>
                                <span className="text-xs font-bold text-neutral-700 min-w-[20px]">{activeCandidate.trajectory_score ?? 70}</span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Behaviour signals</span>
                              <div className="flex items-center gap-3">
                                <div className="h-1.5 bg-neutral-100 rounded-full flex-1 overflow-hidden">
                                  <div 
                                    className={`h-full ${getScoreBgClass(activeCandidate.behaviour_score ?? 70)}`} 
                                    style={{ width: `${activeCandidate.behaviour_score ?? 70}%` }}
                                  />
                                </div>
                                <span className="text-xs font-bold text-neutral-700 min-w-[20px]">{activeCandidate.behaviour_score ?? 70}</span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Technical depth</span>
                              <div className="flex items-center gap-3">
                                <div className="h-1.5 bg-neutral-100 rounded-full flex-1 overflow-hidden">
                                  <div 
                                    className={`h-full ${getScoreBgClass(activeCandidate.insider_score ?? 70)}`} 
                                    style={{ width: `${activeCandidate.insider_score ?? 70}%` }}
                                  />
                                </div>
                                <span className="text-xs font-bold text-neutral-700 min-w-[20px]">{activeCandidate.insider_score ?? 70}</span>
                              </div>
                            </div>
                          </div>

                          {/* Narrative summary */}
                          {activeCandidate.narrative && (
                            <div className="space-y-1.5 border-t border-neutral-100 pt-4">
                              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">AI Narrative Audit</span>
                              <p className="text-xs text-neutral-600 leading-relaxed bg-neutral-50/50 border border-neutral-100 p-3 rounded-2xl">
                                {activeCandidate.narrative}
                              </p>
                            </div>
                          )}

                          {/* Insider signals */}
                          {activeCandidate.insider_signals && activeCandidate.insider_signals.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-neutral-100">
                              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Insider Jargon & Signals</span>
                              <div className="bg-emerald-50/20 border border-emerald-100/50 p-3 rounded-2xl text-xs space-y-1">
                                <span className="font-semibold text-emerald-800 block">Verified Jargon Claims</span>
                                <ul className="list-disc list-inside space-y-0.5 text-neutral-600 text-[11px]">
                                  {activeCandidate.insider_signals.map((sig: any, i: number) => (
                                    <li key={i}>{typeof sig === 'string' ? sig : sig.signal}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}

                          {/* Interrogation Questions */}
                          {activeCandidate.interrogation_qs && activeCandidate.interrogation_qs.length > 0 && (
                            <div className="space-y-3 border-t border-neutral-100 pt-4">
                              <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-[#0000FF]">
                                <HelpCircle className="w-4 h-4" />
                                <span>Interrogation Probes</span>
                              </div>
                              <div className="space-y-2">
                                {activeCandidate.interrogation_qs.map((q: string, idx: number) => (
                                  <div key={idx} className="bg-blue-50/50 border border-[#0000FF]/15 p-3.5 rounded-2xl text-xs flex gap-2.5 items-start">
                                    <span className="font-bold text-[#0000FF] bg-[#0000FF]/10 text-[9px] px-1.5 py-0.5 rounded mt-0.5">
                                      Q{idx + 1}
                                    </span>
                                    <span className="text-neutral-800 leading-relaxed">{q}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      ) : (
                        <div className="text-center text-neutral-400 py-12">No candidate selected.</div>
                      )}
                    </div>

                  </div>
                ) : (
                  <div className="text-center text-neutral-400 py-12">No candidates analyzed yet for this project.</div>
                )
              )}

              {activeTab === 'overview' && (
                <div className="max-w-2xl space-y-6 py-4">
                  {project.jd_structured?.pool_report ? (() => {
                    const report = project.jd_structured.pool_report;
                    return (
                      <div className="space-y-6">
                        <div className="p-5 border border-neutral-100 rounded-2xl bg-neutral-50/50 space-y-2">
                          <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Cohort Narrative Summary</h4>
                          <p className="text-xs text-neutral-600 leading-relaxed font-medium">{report.pool_narrative}</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-4 border border-neutral-100 rounded-2xl text-center">
                            <span className="text-2xl font-semibold text-neutral-900">{report.total_applicants}</span>
                            <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block mt-1">Total Applicants</span>
                          </div>
                          <div className="p-4 border border-neutral-100 rounded-2xl text-center">
                            <span className="text-2xl font-semibold text-[#0000FF]">{report.qualification_rate_percentage}%</span>
                            <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block mt-1">Qualify Rate</span>
                          </div>
                          <div className="p-4 border border-neutral-100 rounded-2xl text-center">
                            <span className="text-2xl font-semibold text-amber-600">{report.average_inflation_rate}%</span>
                            <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block mt-1">Avg Inflation</span>
                          </div>
                          <div className="p-4 border border-neutral-100 rounded-2xl text-center">
                            <span className="text-2xl font-semibold text-emerald-600">{report.honest_candidate_rate}%</span>
                            <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block mt-1">Honest Rate</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-100">
                          {/* Key skills audited */}
                          <div className="space-y-2 text-xs">
                            <h5 className="font-semibold text-neutral-800 uppercase text-[10px] tracking-wider">Outliers and Highlights</h5>
                            <div className="space-y-1.5">
                              <div className="flex justify-between border-b border-neutral-100 pb-1.5 text-neutral-600">
                                <span>Most Over-claimed Jargon:</span>
                                <span className="font-bold text-rose-600">{report.most_over_claimed_skill}</span>
                              </div>
                              <div className="flex justify-between border-b border-neutral-100 pb-1.5 text-neutral-600">
                                <span>Most Under-claimed Jargon:</span>
                                <span className="font-bold text-emerald-600">{report.most_under_claimed_skill}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="text-center text-neutral-400 py-12">No statistics report compiled yet.</div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
