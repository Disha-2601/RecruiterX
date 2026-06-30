'use client';

import React, { useState, useEffect } from 'react';
import { Sliders, AlertTriangle, CheckCircle, Info, ChevronRight, HelpCircle } from 'lucide-react';
import rankedCandidatesData from '../data/ranked_candidates.json';

interface CandidateRecord {
  candidate_id: string;
  rank: number;
  score: number;
  reasoning: string;
  anonymized_name: string;
  years_of_experience: number;
  current_title: string;
  current_company: string;
  location: string;
  notice_period_days: number;
  preferred_work_mode: string;
  skill_match: number;
  experience_fit: number;
  behavioral: number;
  education: number;
  logistics_fit: number;
  consistency_penalty: number;
  has_expert_low_duration: boolean;
  has_yoe_mismatch: boolean;
  has_overlap: boolean;
  has_assessment_mismatch: boolean;
  has_suspicious_uniformity: boolean;
}

export default function DashboardDemo() {
  const [skillWeight, setSkillWeight] = useState(40);
  const [expWeight, setExpWeight] = useState(25);
  const [behavWeight, setBehWeight] = useState(20);
  const [eduWeight, setEduWeight] = useState(8);
  const [logWeight, setLogWeight] = useState(7);
  
  const [activeCandidateId, setActiveCandidateId] = useState<string>('');
  const [candidates, setCandidates] = useState<any[]>([]);

  // Initialize active candidate
  useEffect(() => {
    if (rankedCandidatesData && rankedCandidatesData.length > 0) {
      setActiveCandidateId(rankedCandidatesData[0].candidate_id);
    }
  }, []);

  // Recalculate scores and re-sort when weights change
  useEffect(() => {
    const total = skillWeight + expWeight + behavWeight + eduWeight + logWeight;
    const wSkill = skillWeight / (total || 1);
    const wExp = expWeight / (total || 1);
    const wBehav = behavWeight / (total || 1);
    const wEdu = eduWeight / (total || 1);
    const wLog = logWeight / (total || 1);

    const updated = (rankedCandidatesData as CandidateRecord[]).map(c => {
      const rawScore = (
        c.skill_match * wSkill +
        c.experience_fit * wExp +
        c.behavioral * wBehav +
        c.education * wEdu +
        c.logistics_fit * wLog
      );
      // Final composite score applying the consistency penalty
      const calculatedScore = Math.round(rawScore * (1.0 - c.consistency_penalty) * 100);
      
      // Map Red Flags
      const redFlags = [];
      if (c.has_expert_low_duration) {
        redFlags.push({ type: 'Expert Low Duration', severity: 'high' as const, text: 'Claims expert proficiency in core skills with low duration.' });
      }
      if (c.has_yoe_mismatch) {
        redFlags.push({ type: 'YoE Mismatch', severity: 'high' as const, text: 'Stated years of experience does not align with career history duration.' });
      }
      if (c.has_overlap) {
        redFlags.push({ type: 'Employment Overlap', severity: 'medium' as const, text: 'Overlapping career timeline detected (potential double employment).' });
      }
      if (c.has_assessment_mismatch) {
        redFlags.push({ type: 'Test Mismatch', severity: 'medium' as const, text: 'Verified assessment scores contradict self-reported expertise.' });
      }
      if (c.has_suspicious_uniformity) {
        redFlags.push({ type: 'Suspicious Uniformity', severity: 'low' as const, text: 'Uniform expert/advanced proficiency across all listed skills.' });
      }

      // Trajectory classification based on experience fit
      const trajectory = c.experience_fit > 0.85 ? 'ACCELERATING' : c.experience_fit > 0.65 ? 'STEADY' : c.experience_fit > 0.45 ? 'PLATEAUED' : 'DECLINING';

      // Verified signals
      const present = [
        `Verified Experience: ${c.years_of_experience} Years`,
        `Preferred Mode: ${c.preferred_work_mode.toUpperCase()}`,
        `Location Fit: ${c.location} (${c.preferred_work_mode === 'onsite' ? 'Onsite' : c.preferred_work_mode === 'hybrid' ? 'Hybrid' : 'Flexible'})`,
        `Notice Period: ${c.notice_period_days} Days`
      ];
      const absent = [];
      if (c.consistency_penalty > 0) {
        absent.push(`Consistency Penalty: -${Math.round(c.consistency_penalty * 100)}% Applied`);
      } else {
        absent.push("No consistency anomalies detected");
      }

      // Custom generated screening questions
      const questions = [
        `Your profile indicates a ${c.notice_period_days}-day notice period. Can you confirm if you are eligible for an immediate buyout or joining within 30 days?`,
        `Given the hybrid requirement (2 days/week in Pune/Noida), how does relocating to or commuting within ${c.location} fit into your timeline?`,
        `Regarding your experience in ${c.current_title} at ${c.current_company}: can you explain the technical architecture of your retrieval model and the choice of vector DB?`
      ];

      return {
        ...c,
        id: c.candidate_id,
        name: c.anonymized_name || c.candidate_id,
        statedRole: `${c.current_title} at ${c.current_company}`,
        trajectory,
        calculatedScore,
        baseTrajectoryScore: Math.round(c.experience_fit * 100),
        baseBehaviourScore: Math.round(c.behavioral * 100),
        baseDepthScore: Math.round(c.skill_match * 100),
        baseEducationScore: Math.round(c.education * 100),
        baseLogisticsScore: Math.round(c.logistics_fit * 100),
        redFlags,
        insiderSignals: {
          present,
          absent,
          score: Math.round((1 - c.consistency_penalty) * 100)
        },
        narrative: c.reasoning,
        questions
      };
    });

    // Sort by calculatedScore desc, then candidate_id asc
    updated.sort((a, b) => {
      if (b.calculatedScore !== a.calculatedScore) {
        return b.calculatedScore - a.calculatedScore;
      }
      return a.id.localeCompare(b.id);
    });

    setCandidates(updated);
  }, [skillWeight, expWeight, behavWeight, eduWeight, logWeight]);

  const activeCandidate = candidates.find(c => c.id === activeCandidateId) || candidates[0];

  const getTrajectoryBadgeStyles = (trajectory: string) => {
    switch (trajectory) {
      case 'ACCELERATING':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'STEADY':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'PLATEAUED':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'DECLINING':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgClass = (score: number) => {
    if (score >= 70) return 'bg-blue-600';
    if (score >= 50) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 text-[#0A0A0A] font-mono text-sm max-w-6xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-lg border border-neutral-100">
      
      {/* Sidebar / Controls Panel (col-span-4) */}
      <div className="lg:col-span-4 rounded-lg border border-neutral-200 bg-neutral-50 p-6 flex flex-col justify-between shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-4 border-b border-neutral-200 pb-3">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-[#0A0A0A]">
              DECISION_WEIGHTS
            </h3>
          </div>
          
          <p className="text-xs text-neutral-600 leading-relaxed mb-6 font-mono">
            Adjust components weighting. The ranker dynamically calculates matching scores and re-ranks the candidates shortlist in real-time.
          </p>

          <div className="space-y-4">
            {/* Skill Match Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-neutral-700">
                <span>SKILL_MATCH</span>
                <span className="text-blue-600 font-sans">{skillWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={skillWeight}
                onChange={(e) => setSkillWeight(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            {/* Experience Fit Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-neutral-700">
                <span>EXPERIENCE_FIT</span>
                <span className="text-blue-600 font-sans">{expWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={expWeight}
                onChange={(e) => setExpWeight(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            {/* Behaviour Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-neutral-700">
                <span>BEHAVIOUR_SIGNALS</span>
                <span className="text-blue-600 font-sans">{behavWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={behavWeight}
                onChange={(e) => setBehWeight(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            {/* Education Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-neutral-700">
                <span>EDUCATION_TIER</span>
                <span className="text-blue-600 font-sans">{eduWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={eduWeight}
                onChange={(e) => setEduWeight(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            {/* Logistics Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-neutral-700">
                <span>LOGISTICS_FIT</span>
                <span className="text-blue-600 font-sans">{logWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={logWeight}
                onChange={(e) => setLogWeight(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Real-time Rank List */}
        <div className="mt-8 pt-6 border-t border-neutral-200">
          <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-500 mb-3">
            RANKED_SHORTLIST (Top 100)
          </h4>
          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {candidates.map((c: any, index: number) => (
              <div
                key={c.id}
                onClick={() => setActiveCandidateId(c.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                  activeCandidateId === c.id
                    ? 'border-blue-600 bg-blue-50 font-bold'
                    : 'border-neutral-200 bg-white hover:border-blue-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-sans text-neutral-400">#{index + 1}</span>
                  <span className="text-xs truncate max-w-[140px]">{c.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`font-sans text-xs font-bold ${getScoreColorClass(c.calculatedScore)}`}>
                    {c.calculatedScore}/100
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 ${activeCandidateId === c.id ? 'text-blue-600' : 'text-neutral-400'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Workspace (col-span-8) */}
      <div className="lg:col-span-8 space-y-6">
        {activeCandidate ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm space-y-6">
            
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-neutral-200 pb-4 gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-sans font-bold text-lg text-neutral-900">
                    {activeCandidate.name}
                  </h3>
                  <span className={`border text-[10px] font-bold px-2 py-0.5 rounded tracking-wide ${getTrajectoryBadgeStyles(activeCandidate.trajectory)}`}>
                    {activeCandidate.trajectory}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 font-mono">
                  {activeCandidate.statedRole}
                </p>
              </div>

              <div className="text-left sm:text-right flex items-baseline sm:flex-col justify-between sm:justify-center">
                <span className="text-xs text-neutral-400 font-mono block">COMPOSITE_SCORE</span>
                <span className="font-sans text-3xl font-medium tracking-tight flex items-baseline">
                  <span className={getScoreColorClass(activeCandidate.calculatedScore)}>
                    {activeCandidate.calculatedScore}
                  </span>
                  <span className="text-neutral-300 text-base">/100</span>
                </span>
              </div>
            </div>

            {/* Red Flags if any */}
            {activeCandidate.redFlags.length > 0 && (
              <div className="bg-red-50 border border-red-200/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-red-700 text-xs font-bold uppercase">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>CONSISTENCY_GATE_WARNINGS ({activeCandidate.redFlags.length})</span>
                </div>
                <div className="space-y-1.5 pl-6">
                  {activeCandidate.redFlags.map((flag: any, idx: number) => (
                    <div key={idx} className="text-xs text-neutral-800">
                      <span className="font-bold text-red-600 mr-1">[{flag.type}]:</span>
                      {flag.text}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Score Breakdown metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-neutral-100 p-4 rounded-lg bg-neutral-50/50">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">SKILL_MATCH</span>
                <div className="flex items-center gap-3">
                  <div className="h-2 bg-neutral-200 rounded-full flex-1 overflow-hidden">
                    <div 
                      className={`h-full ${getScoreBgClass(activeCandidate.baseDepthScore)}`} 
                      style={{ width: `${activeCandidate.baseDepthScore}%` }}
                    />
                  </div>
                  <span className="text-xs font-sans font-bold text-neutral-700 min-w-[24px]">
                    {activeCandidate.baseDepthScore}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">EXPERIENCE_FIT</span>
                <div className="flex items-center gap-3">
                  <div className="h-2 bg-neutral-200 rounded-full flex-1 overflow-hidden">
                    <div 
                      className={`h-full ${getScoreBgClass(activeCandidate.baseTrajectoryScore)}`} 
                      style={{ width: `${activeCandidate.baseTrajectoryScore}%` }}
                    />
                  </div>
                  <span className="text-xs font-sans font-bold text-neutral-700 min-w-[24px]">
                    {activeCandidate.baseTrajectoryScore}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">BEHAVIOUR_SIGNALS</span>
                <div className="flex items-center gap-3">
                  <div className="h-2 bg-neutral-200 rounded-full flex-1 overflow-hidden">
                    <div 
                      className={`h-full ${getScoreBgClass(activeCandidate.baseBehaviourScore)}`} 
                      style={{ width: `${activeCandidate.baseBehaviourScore}%` }}
                    />
                  </div>
                  <span className="text-xs font-sans font-bold text-neutral-700 min-w-[24px]">
                    {activeCandidate.baseBehaviourScore}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">LOGISTICS_FIT</span>
                <div className="flex items-center gap-3">
                  <div className="h-2 bg-neutral-200 rounded-full flex-1 overflow-hidden">
                    <div 
                      className={`h-full ${getScoreBgClass(activeCandidate.baseLogisticsScore)}`} 
                      style={{ width: `${activeCandidate.baseLogisticsScore}%` }}
                    />
                  </div>
                  <span className="text-xs font-sans font-bold text-neutral-700 min-w-[24px]">
                    {activeCandidate.baseLogisticsScore}
                  </span>
                </div>
              </div>
            </div>

            {/* Brief Narrative */}
            <div className="space-y-1.5 border-t border-neutral-100 pt-4">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">FACTUAL_EXPLANATION</span>
              <p className="text-xs text-neutral-800 leading-relaxed font-mono bg-neutral-50 border border-neutral-200 p-3 rounded-lg">
                {activeCandidate.narrative}
              </p>
            </div>

            {/* Insider signals */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                INGESTED_PROFILE_FACTS
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Present */}
                <div className="border border-green-200/50 bg-green-50/30 p-3 rounded-lg space-y-1.5">
                  <div className="font-bold text-green-800 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                    <span>SIGNAL_VALIDATIONS</span>
                  </div>
                  <ul className="space-y-1 list-disc list-inside text-neutral-600 text-[11px] leading-tight">
                    {activeCandidate.insiderSignals.present.map((sig: string, i: number) => (
                      <li key={i}>{sig}</li>
                    ))}
                  </ul>
                </div>

                {/* Absent */}
                <div className="border border-yellow-200/50 bg-yellow-50/30 p-3 rounded-lg space-y-1.5">
                  <div className="font-bold text-yellow-800 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-yellow-600" />
                    <span>CONSISTENCY_CHECK</span>
                  </div>
                  <ul className="space-y-1 list-disc list-inside text-neutral-600 text-[11px] leading-tight">
                    {activeCandidate.insiderSignals.absent.map((sig: string, i: number) => (
                      <li key={i}>{sig}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Custom generated Interrogation Questions */}
            <div className="space-y-3 border-t border-neutral-200 pt-4">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-blue-700">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>INTERROGATION_QUESTIONS</span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed font-mono">
                Targeted technical screening probes generated specifically for this candidate to verify claims and resolve potential concerns during review:
              </p>
              <div className="space-y-2">
                {activeCandidate.questions.map((q: string, idx: number) => (
                  <div key={idx} className="bg-blue-50/50 border border-blue-200/50 p-3 rounded-lg text-xs flex items-start gap-2.5 font-mono">
                    <span className="font-sans font-bold text-blue-700 bg-blue-100/50 text-[11px] px-1.5 py-0.5 rounded leading-none mt-0.5 border border-blue-200">
                      Q{idx + 1}
                    </span>
                    <span className="text-neutral-800 leading-relaxed">
                      {q}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-neutral-200 rounded-lg text-neutral-500">
            No active candidate selected. Please run the ranker first.
          </div>
        )}
      </div>

    </div>
  );
}
