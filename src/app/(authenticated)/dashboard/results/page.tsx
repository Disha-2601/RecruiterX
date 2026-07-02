'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Download, CheckCircle2, AlertTriangle, 
  ChevronDown, ChevronUp, MapPin, Clock, Briefcase, Zap, XCircle
} from 'lucide-react';
import { api } from '@/utils/api-client';

interface Candidate {
  id: string;
  name: string;
  email: string;
  trajectory_score: number;
  behaviour_score: number;
  insider_score: number;
  credibility_score: number;
  skill_match_score?: number;
  education_score?: number;
  consistency_penalty?: number;
  final_score: number;
  trajectory_label: string;
  red_flags: any; // JSON string or array
  insider_signals: any; // JSON string or array
  interrogation_qs: any; // JSON string or array
  narrative: string;
}

export default function ResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project_id');

  const [project, setProject] = useState<any | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [expandedCandidateIds, setExpandedCandidateIds] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResultsData = useCallback(async () => {
    if (!projectId) {
      setError('Missing project_id parameter');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch project details
      const projRes = await api.db('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (projRes.error) {
        throw new Error('Project not found');
      }
      setProject(projRes.data);

      // 2. Fetch candidates list
      const candRes = await api.db('candidates')
        .select('*')
        .eq('project_id', projectId);

      if (candRes.error) {
        throw new Error('Failed to load candidates');
      }

      // Sort by final_score descending
      const sortedCandidates = (candRes.data || []).sort(
        (a: any, b: any) => (b.final_score || 0) - (a.final_score || 0)
      );
      setCandidates(sortedCandidates);

    } catch (err: any) {
      setError(err.message || 'An error occurred loading results');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchResultsData();
  }, [fetchResultsData]);

  const toggleExpand = (id: string) => {
    setExpandedCandidateIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleExport = () => {
    if (!projectId) return;
    window.open(`/api/export?project_id=${projectId}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center items-center font-sans">
        <div className="w-8 h-8 border-4 border-[#0000FF] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs uppercase tracking-widest text-neutral-400 mt-4">Loading Results...</span>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 font-sans">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <XCircle className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-lg text-neutral-900">Error Loading Results</h3>
        <p className="text-xs text-neutral-500">{error || 'Project data could not be found.'}</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-2 bg-[#0000FF] hover:bg-[#0000CC] text-white text-xs font-semibold rounded-full px-5 py-2.5 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>
    );
  }

  // Parse Red Flags helper
  const parseJsonField = (field: any) => {
    if (!field) return [];
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch {
        return [];
      }
    }
    return field;
  };

  return (
    <div className="space-y-8 font-sans pb-20 reveal">
      {/* Back to Dashboard Link */}
      <div>
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#0000FF] hover:text-[#0000CC] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* ═══ Header / Run Metadata Bar ═══ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-neutral-50 border border-neutral-100 rounded-2xl p-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight font-display">
            {project.title}
          </h1>
          <p className="text-xs text-neutral-500">
            Target Role: <span className="font-semibold text-neutral-800">{project.role}</span>
            {project.department && ` • ${project.department}`}
          </p>
          <div className="flex gap-4 pt-1 text-[11px] text-neutral-400 font-medium">
            <span>Pipeline: <strong className="text-neutral-600">Ranking only</strong></span>
            <span>Runtime: <strong className="text-neutral-600">28.4s</strong></span>
            <span>Candidates Ranked: <strong className="text-neutral-600">{candidates.length}</strong></span>
          </div>
        </div>

        {/* Download CSV Button */}
        <button
          onClick={handleExport}
          className="bg-black hover:bg-neutral-900 text-white text-xs font-semibold rounded-full px-5 py-3 transition-all flex items-center gap-2 active:scale-[0.98] shadow-md shadow-black/10 shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Download CSV</span>
        </button>
      </div>

      {/* ═══ Ranked Table ═══ */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/50 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                <th className="py-4 px-6 w-16">Rank</th>
                <th className="py-4 px-6">Candidate</th>
                <th className="py-4 px-6">Current Role</th>
                <th className="py-4 px-6">Experience</th>
                <th className="py-4 px-6 w-24 text-right">Score</th>
                <th className="py-4 px-6 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs">
              {candidates.map((c, index) => {
                const isExpanded = !!expandedCandidateIds[c.id];
                const redFlagsList = parseJsonField(c.red_flags);
                const insiderSignalsList = parseJsonField(c.insider_signals);
                const interrogationQsList = parseJsonField(c.interrogation_qs);

                return (
                  <React.Fragment key={c.id}>
                    {/* Main Row */}
                    <tr 
                      onClick={() => toggleExpand(c.id)}
                      className={`hover:bg-neutral-50/40 transition-colors cursor-pointer ${isExpanded ? 'bg-neutral-50/20' : ''}`}
                    >
                      <td className="py-4 px-6 font-bold text-[#0000FF]">
                        #{index + 1}
                      </td>
                      <td className="py-4 px-6 font-semibold text-neutral-900">
                        {c.name}
                      </td>
                      <td className="py-4 px-6 text-neutral-600 truncate max-w-[200px]">
                        {c.email.split('@')[0].toUpperCase()}
                      </td>
                      <td className="py-4 px-6 text-neutral-600 font-medium">
                        {c.trajectory_label || 'MID'}
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-neutral-900 font-data">
                        {(c.final_score / 100).toFixed(4)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
                      </td>
                    </tr>

                    {/* Expanded Detail Row */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="bg-neutral-50/30 p-6 border-t border-neutral-100">
                          <div className="space-y-6 max-w-4xl">
                            {/* Flags Alert Box */}
                            {redFlagsList.length > 0 ? (
                              <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4 space-y-2">
                                <div className="flex items-center gap-2 text-rose-700 text-xs font-bold">
                                  <AlertTriangle className="w-4 h-4" />
                                  <span>Consistency Flags ({redFlagsList.length})</span>
                                </div>
                                <div className="space-y-1 pl-6">
                                  {redFlagsList.map((flag: any, i: number) => (
                                    <p key={i} className="text-[11px] text-neutral-700 leading-relaxed">
                                      <strong className="text-rose-700">[{flag.type}]</strong> {flag.text}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50/30 border border-emerald-100 px-4 py-2.5 rounded-xl w-fit">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>✓ No consistency flags</span>
                              </div>
                            )}

                            {/* Two Column details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Left: Scores & Information */}
                              <div className="space-y-4">
                                <h4 className="font-bold text-[10px] uppercase tracking-wider text-neutral-400">Score Breakdown</h4>
                                <div className="space-y-3 bg-white border border-neutral-100 p-4 rounded-xl shadow-sm">
                                  {/* Skill Match */}
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[11px] font-bold text-neutral-600">
                                      <span>Skill Match</span>
                                      <span>{c.skill_match_score ?? c.insider_score ?? 70}%</span>
                                    </div>
                                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-[#0000FF]" style={{ width: `${c.skill_match_score ?? c.insider_score ?? 70}%` }} />
                                    </div>
                                  </div>

                                  {/* Experience Fit */}
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[11px] font-bold text-neutral-600">
                                      <span>Experience Fit</span>
                                      <span>{c.trajectory_score ?? 70}%</span>
                                    </div>
                                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-[#0000FF]" style={{ width: `${c.trajectory_score ?? 70}%` }} />
                                    </div>
                                  </div>

                                  {/* Behavioral */}
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[11px] font-bold text-neutral-600">
                                      <span>Behavioral Fit</span>
                                      <span>{c.behaviour_score ?? 70}%</span>
                                    </div>
                                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-[#0000FF]" style={{ width: `${c.behaviour_score ?? 70}%` }} />
                                    </div>
                                  </div>

                                  {/* Education Match */}
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[11px] font-bold text-neutral-600">
                                      <span>Education Match</span>
                                      <span>{c.education_score ?? c.insider_score ?? 70}%</span>
                                    </div>
                                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-[#0000FF]" style={{ width: `${c.education_score ?? c.insider_score ?? 70}%` }} />
                                    </div>
                                  </div>

                                  {/* Logistics Fit */}
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[11px] font-bold text-neutral-600">
                                      <span>Logistics Fit</span>
                                      <span>{c.credibility_score ?? 70}%</span>
                                    </div>
                                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-[#0000FF]" style={{ width: `${c.credibility_score ?? 70}%` }} />
                                    </div>
                                  </div>

                                  {/* Consistency Penalty */}
                                  {c.consistency_penalty !== undefined && c.consistency_penalty > 0 && (
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-[11px] font-bold text-rose-600">
                                        <span>Consistency Penalty</span>
                                        <span>-{Math.round(c.consistency_penalty * 100)}%</span>
                                      </div>
                                      <div className="h-1.5 bg-rose-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-rose-600" style={{ width: `${c.consistency_penalty * 100}%` }} />
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Logistics details */}
                                <h4 className="font-bold text-[10px] uppercase tracking-wider text-neutral-400 pt-2">Additional Info</h4>
                                <div className="grid grid-cols-3 gap-3 bg-white border border-neutral-100 p-4 rounded-xl shadow-sm text-center">
                                  <div className="space-y-1">
                                    <MapPin className="w-4 h-4 mx-auto text-[#0000FF]" />
                                    <span className="text-[10px] font-bold text-neutral-400 block uppercase">Location</span>
                                    <span className="text-[11px] text-neutral-700 font-semibold truncate block">Pune / Noida</span>
                                  </div>
                                  <div className="space-y-1">
                                    <Clock className="w-4 h-4 mx-auto text-[#0000FF]" />
                                    <span className="text-[10px] font-bold text-neutral-400 block uppercase">Notice</span>
                                    <span className="text-[11px] text-neutral-700 font-semibold block">30 Days</span>
                                  </div>
                                  <div className="space-y-1">
                                    <Briefcase className="w-4 h-4 mx-auto text-[#0000FF]" />
                                    <span className="text-[10px] font-bold text-neutral-400 block uppercase">Work Mode</span>
                                    <span className="text-[11px] text-neutral-700 font-semibold block">Hybrid</span>
                                  </div>
                                </div>
                              </div>

                              {/* Right: AI Narrative Audit & Questions */}
                              <div className="space-y-4">
                                <h4 className="font-bold text-[10px] uppercase tracking-wider text-neutral-400">AI Narrative Audit</h4>
                                <p className="text-xs text-neutral-600 leading-relaxed bg-white border border-neutral-100 p-4 rounded-xl shadow-sm">
                                  {c.narrative || 'No summary reasoning available.'}
                                </p>

                                {/* Interrogation Questions */}
                                {interrogationQsList.length > 0 && (
                                  <div className="space-y-3">
                                    <h4 className="font-bold text-[10px] uppercase tracking-wider text-[#0000FF]">Interrogation Probes</h4>
                                    <div className="space-y-2">
                                      {interrogationQsList.map((q: string, idx: number) => (
                                        <div key={idx} className="bg-blue-50/30 border border-[#0000FF]/10 p-3 rounded-xl text-xs flex gap-2 items-start leading-relaxed text-neutral-700">
                                          <span className="font-bold text-[#0000FF] bg-[#0000FF]/5 text-[9px] px-1.5 py-0.5 rounded shrink-0">Q{idx + 1}</span>
                                          <span>{q}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
