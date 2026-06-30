'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { 
  ArrowLeft, Sparkles, TrendingUp, AlertTriangle, 
  HelpCircle, UserCheck, Award, ThumbsUp, CheckCircle, Info,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell
} from 'recharts';

export default function PoolIntelligenceReportPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const supabase = useMemo(() => createClient(), []);

  const [project, setProject] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch project containing pool_report in jd_structured
  const fetchReport = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const cookiesArr = document.cookie.split(';');
      const orgCookie = cookiesArr.find(c => c.trim().startsWith('org_id='));
      const resolvedOrgId = orgCookie ? orgCookie.split('=')[1].trim() : null;

      if (!resolvedOrgId) {
        toast.error('No active organization selected.');
        router.push('/org-selection');
        return;
      }

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
    } catch (err: any) {
      toast.error('Error fetching report details.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, router, supabase]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center items-center font-sans">
        <div className="relative w-12 h-12 flex justify-center items-center">
          <svg className="w-10 h-10 text-[#0000FF] animate-spin" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="6" strokeDasharray="10 10" />
            <circle cx="50" cy="50" r="10" fill="currentColor" />
          </svg>
        </div>
        <p className="mt-4 text-xs font-mono tracking-widest text-text-secondary uppercase">Compiling Intelligence...</p>
      </div>
    );
  }

  const jdStructured = project?.jd_structured || {};
  const poolReport = jdStructured.pool_report;

  if (!poolReport) {
    return (
      <div className="min-h-screen bg-bg-base relative flex flex-col items-center justify-center font-sans text-text-primary px-6">
        <div className="bg-white border border-neutral-200 rounded-[20px] p-8 max-w-md text-center shadow-card">
          <AlertTriangle className="w-12 h-12 text-[#D97706] mx-auto mb-4" />
          <h3 className="font-display font-bold text-lg mb-2">Report Not Found</h3>
          <p className="text-sm text-text-secondary mb-6 leading-relaxed">
            The pool intelligence report has not been generated yet. Please finish analyzing candidates to compile the health band.
          </p>
          <button 
            onClick={() => router.push(`/project/${projectId}`)}
            className="px-6 py-2.5 bg-[#0000FF] hover:bg-[#0000CC] text-white text-xs font-semibold rounded-full transition-all active:scale-[0.98]"
          >
            Back to Workspace
          </button>
        </div>
      </div>
    );
  }

  // Format Recharts data
  const dist = poolReport.score_distribution || {};
  const chartData = [
    { name: '0 - 25', count: dist['0_to_25'] || dist['0-25'] || 0 },
    { name: '26 - 50', count: dist['26_to_50'] || dist['26-50'] || 0 },
    { name: '51 - 75', count: dist['51_to_75'] || dist['51-75'] || 0 },
    { name: '76 - 100', count: dist['76_to_100'] || dist['76-100'] || 0 }
  ];

  const colors = ['#8FB3FF', '#2563EB', '#0000FF', '#000033'];

  return (
    <div className="min-h-screen bg-bg-base relative overflow-x-hidden font-sans text-text-primary">
      {/* Background ambient drifting glow */}
      <div 
        className="absolute top-1/3 left-1/2 w-[700px] h-[700px] bg-gradient-blob rounded-full filter blur-[120px] pointer-events-none opacity-20 transform translate-x-[-50%] translate-y-[-50%] animate-blob-drift" 
        style={{ '--blob-duration': '22s' } as React.CSSProperties}
      />

      {/* Navigation Header */}
      <header className="border-b border-neutral-100 bg-white sticky top-0 z-20 px-6 md:px-12 py-5 flex items-center gap-6">
        <button 
          onClick={() => router.push(`/project/${projectId}`)}
          className="p-2 border border-neutral-200 rounded-full hover:bg-neutral-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-text-secondary" />
        </button>
        <div>
          <h1 className="font-display font-bold text-xl md:text-2xl text-text-primary tracking-tight">
            Pool Intelligence Report
          </h1>
          <p className="text-xs text-text-secondary font-mono mt-0.5">
            Meta Analysis for {project?.title || 'hiring run'}
          </p>
        </div>
      </header>

      <main className="max-w-content mx-auto px-6 md:px-12 py-12 relative z-10 space-y-8">
        
        {/* LLM Generated Pool Narrative Card */}
        <div className="bg-white border border-neutral-200 rounded-[20px] p-6 shadow-card flex items-start gap-4">
          <div className="p-3 bg-[#EEF2FF] rounded-full text-[#0000FF]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-text-primary mb-1">
              Executive Summary
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed font-sans">
              {poolReport.pool_narrative || "The analysis shows a diverse set of candidates with varying ranges of core skills alignment."}
            </p>
          </div>
        </div>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Hero Qualification Rate Stat Card (span 4/12) */}
          <div className="md:col-span-4 bg-white border border-neutral-200 rounded-[20px] p-8 shadow-card flex flex-col justify-between relative overflow-hidden">
            {/* Soft radial glow behind card */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-blob rounded-full filter blur-xl opacity-30 pointer-events-none" />

            <div>
              <span className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider block mb-2">
                Hiring Signal
              </span>
              <h3 className="font-display font-bold text-lg text-text-primary mb-6">
                Qualification Rate
              </h3>
            </div>

            <div className="my-4">
              <span className="font-display font-bold text-6xl md:text-7xl bg-gradient-score bg-clip-text text-transparent block">
                {poolReport.qualification_rate_percentage}%
              </span>
              <p className="text-xs text-text-secondary font-mono mt-2 uppercase tracking-wide">
                {poolReport.actually_qualified} of {poolReport.total_applicants} candidates qualified (&gt;65 score)
              </p>
            </div>

            <div className="border-t border-neutral-100 pt-4 mt-4 text-xs text-text-tertiary font-mono">
              Benchmark profile represents 100% ideal target match.
            </div>
          </div>

          {/* Score distribution Chart Card (span 8/12) */}
          <div className="md:col-span-8 bg-white border border-neutral-200 rounded-[20px] p-6 shadow-card flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider block mb-2">
                Candidate Spread
              </span>
              <h3 className="font-display font-bold text-lg text-text-primary mb-6">
                Score Distributions
              </h3>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                  <XAxis dataKey="name" stroke="#8C8C8C" fontSize={11} className="font-mono" />
                  <YAxis stroke="#8C8C8C" fontSize={11} className="font-mono" allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px' }}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={50}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="text-[10px] font-mono text-text-tertiary text-right mt-4">
              Bar chart represents candidates count per score bracket.
            </div>
          </div>

          {/* Honesty & Inflation Metrics Cluster (span 6/12) */}
          <div className="md:col-span-6 grid grid-cols-2 gap-6">
            
            {/* Honesty Rate */}
            <div className="bg-white border border-neutral-200 rounded-[20px] p-6 shadow-card flex flex-col justify-between">
              <div>
                <UserCheck className="w-5 h-5 text-[#16A34A] mb-4" />
                <h4 className="text-xs font-mono text-text-tertiary uppercase tracking-wider mb-1">
                  Honesty Rate
                </h4>
                <p className="text-2xl font-display font-bold text-text-primary">
                  {poolReport.honest_candidate_rate}%
                </p>
              </div>
              <p className="text-[10px] text-text-secondary leading-relaxed mt-4 font-sans">
                Percent of applicants with credibility index score &gt;= 70.
              </p>
            </div>

            {/* Avg Inflation */}
            <div className="bg-white border border-neutral-200 rounded-[20px] p-6 shadow-card flex flex-col justify-between">
              <div>
                <TrendingUp className="w-5 h-5 text-[#0000FF] mb-4" />
                <h4 className="text-xs font-mono text-text-tertiary uppercase tracking-wider mb-1">
                  Avg Inflation
                </h4>
                <p className="text-2xl font-display font-bold text-text-primary">
                  {poolReport.average_inflation_rate}%
                </p>
              </div>
              <p className="text-[10px] text-text-secondary leading-relaxed mt-4 font-sans">
                Average percentage deduction for candidate claims exaggeration.
              </p>
            </div>
          </div>

          {/* Over/Under claimed skills (span 6/12) */}
          <div className="md:col-span-6 bg-white border border-neutral-200 rounded-[20px] p-6 shadow-card flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider block mb-2">
                Practitioner Insights
              </span>
              <h3 className="font-display font-bold text-base text-text-primary mb-6">
                Market Alignment Skills
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider block mb-1">
                  Most Over-Claimed Skill (Exaggerated claims)
                </span>
                <p className="text-sm font-semibold text-[#DC2626] font-sans">
                  {poolReport.most_over_claimed_skill || 'None detected'}
                </p>
              </div>

              <div className="border-t border-neutral-100 pt-4">
                <span className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider block mb-1">
                  Most Conspicuously Under-Claimed Skill
                </span>
                <p className="text-sm font-semibold text-[#D97706] font-sans">
                  {poolReport.most_under_claimed_skill || 'None detected'}
                </p>
              </div>
            </div>

            <div className="text-[10px] font-mono text-text-tertiary mt-6">
              Inferred from flag counts and practitioner checklist gaps.
            </div>
          </div>

          {/* Hidden Gems List (span 12/12) */}
          <div className="md:col-span-12 bg-white border border-neutral-200 rounded-[20px] p-6 shadow-card space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-5 h-5 text-[#0000FF]" />
                <h3 className="font-display font-bold text-lg text-text-primary">
                  Hidden Gems In This Pool
                </h3>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Candidates with high insider practitioner scores, despite slightly lower keyword matches or overall scores.
              </p>
            </div>

            {poolReport.hidden_gems && poolReport.hidden_gems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {poolReport.hidden_gems.map((gem: any, idx: number) => (
                  <div key={idx} className="border border-[#8FB3FF]/30 bg-[#EEF2FF]/20 rounded-[12px] p-4 flex flex-col justify-between">
                    <div className="mb-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-sm text-text-primary">{gem.name}</h4>
                        <div className="flex gap-2 text-[10px] font-mono font-bold">
                          <span className="text-[#0000FF] bg-[#EEF2FF] px-2 py-0.5 rounded-full">INSIDER: {gem.insider_score}</span>
                          <span className="text-text-secondary bg-neutral-100 px-2 py-0.5 rounded-full">FINAL: {gem.final_score}</span>
                        </div>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed font-sans">{gem.reason}</p>
                    </div>
                    
                    <button
                      onClick={() => router.push(`/project/${projectId}`)}
                      className="text-xs font-semibold text-[#0000FF] hover:underline flex items-center gap-1 mt-2 self-start"
                    >
                      <span>Find in Workspace</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-neutral-50 border border-neutral-200 rounded-[12px] p-6 text-center text-xs text-text-tertiary">
                <Info className="w-4 h-4 mx-auto mb-2 text-text-tertiary" />
                <span>No hidden gems resolved in this analysis batch.</span>
              </div>
            )}
          </div>

          {/* Job description warnings (span 12/12) */}
          <div className="md:col-span-12 bg-white border border-neutral-200 rounded-[20px] p-6 shadow-card space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-5 h-5 text-[#D97706]" />
                <h3 className="font-display font-bold text-lg text-text-primary">
                  Job Description Quality Warnings
                </h3>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Flags in the job description that correlate directly with the quality of candidates attracted.
              </p>
            </div>

            {poolReport.jd_warnings && poolReport.jd_warnings.length > 0 ? (
              <div className="space-y-4">
                {poolReport.jd_warnings.map((warn: any, idx: number) => (
                  <div key={idx} className="bg-[#FFFBEB] border border-[#D97706]/15 rounded-[12px] p-4 text-xs">
                    <p className="font-bold text-[#D97706] mb-1 font-sans">{warn.warning}</p>
                    <p className="text-text-secondary leading-relaxed font-sans">{warn.correlation}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#F0FDF4] border border-[#16A34A]/15 text-[#16A34A] rounded-[12px] p-4 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>No high-impact JD warnings or candidate mismatches detected!</span>
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
