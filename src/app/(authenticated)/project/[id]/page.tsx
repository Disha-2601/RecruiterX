'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import StepIndicator from '@/components/project/StepIndicator';
import Phase1JD from '@/components/project/Phase1JD';
import Phase2Candidates from '@/components/project/Phase2Candidates';
import { useProjectStore } from '@/stores/useProjectStore';
import { api } from '@/utils/api-client';
import { Loader2 } from 'lucide-react';

export default function ProjectWorkspacePage({ params }: { params: { id: string } }) {
  const projectId = params.id;
  const searchParams = useSearchParams();
  const searchPhase = searchParams.get('phase');

  const {
    phase,
    setProjectId,
    setProjectName,
    setPhase,
    setJdParsed,
    setJdIsDemo,
    resetStore
  } = useProjectStore();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    resetStore();
    setProjectId(projectId);

    const loadProject = async () => {
      try {
        const { data, error } = await api.db('projects')
          .select('id, title, jd_raw_text, jd_structured')
          .eq('id', projectId)
          .single();

        if (error) throw error;

        if (data) {
          setProjectName(data.title);
          
          if (data.jd_structured) {
            // Restore parsed JD details if they exist in DB
            const struct = data.jd_structured;
            const formattedSkills = (skills: any) => {
              if (Array.isArray(skills)) {
                return skills.map(s => typeof s === 'string' ? { name: s, weight: 1.0 } : s);
              }
              return [];
            };

            setJdParsed({
              quality_score: struct.pool_report?.quality_score || 95,
              must_have_skills: formattedSkills(struct.must_have_skills),
              nice_to_have_skills: formattedSkills(struct.nice_to_have_skills),
              experience_range: struct.pool_report?.experience_range || '5 – 9 years',
              work_mode: struct.pool_report?.work_mode || 'Hybrid',
              locations: struct.pool_report?.locations || ['Pune', 'Noida'],
              salary: struct.pool_report?.salary || 'Not stated',
              seniority: struct.pool_report?.seniority || 'Senior',
              notice_period: struct.pool_report?.notice_period || '30 days preferred',
              audit_narrative: struct.pool_report?.pool_narrative || 'Successfully retrieved cached requirements.'
            });

            if (data.jd_raw_text === 'Demo Job Description') {
              setJdIsDemo(true);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load project from database, using fallback:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId && projectId !== 'demo-project-id') {
      loadProject();
    } else {
      setProjectName('Senior AI/ML Engineer Search');
      setIsLoading(false);
    }
  }, [projectId, resetStore, setProjectId, setProjectName, setJdParsed, setJdIsDemo]);

  // Sync phase with query param
  useEffect(() => {
    if (searchPhase === '2') {
      setPhase(2);
    } else {
      setPhase(1);
    }
  }, [searchPhase, setPhase]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center items-center font-sans text-[#0A0A0A]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0000FF]" />
        <span className="text-xs uppercase tracking-widest text-[#8C8C8C] mt-4">Loading Workspace...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans pb-24 select-none">
      <div className="max-w-2xl mx-auto px-4 pt-12 space-y-8 text-center">
        {/* Step Indicator */}
        <StepIndicator currentPhase={phase} />

        {/* Phase Components */}
        {phase === 1 && <Phase1JD />}
        {phase === 2 && <Phase2Candidates />}
      </div>
    </div>
  );
}
