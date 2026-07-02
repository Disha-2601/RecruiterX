'use client';

import React, { useEffect } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import JDPhase from './JDPhase';
import CandidatesPhase from './CandidatesPhase';
import PipelinePreview from './PipelinePreview';
import { ClipboardList, Users, Play } from 'lucide-react';
import { api } from '@/utils/api-client';

export default function ProjectWizard({ projectId }: { projectId: string }) {
  const {
    currentStep,
    projectTitle,
    setProjectId,
    setProjectTitle,
    resetStore
  } = useProjectStore();



  // Load project title on mount
  useEffect(() => {
    resetStore();
    setProjectId(projectId);

    const loadProject = async () => {
      try {
        const { data, error } = await api.db('projects')
          .select('title')
          .eq('id', projectId)
          .single();

        if (data && data.title) {
          setProjectTitle(data.title);
        }
      } catch (err) {
        console.warn('Failed to load project title, using defaults.');
      }
    };

    if (projectId !== 'demo-project-id') {
      loadProject();
    } else {
      setProjectTitle('Senior AI/ML Engineer Search');
    }
  }, [projectId, setProjectId, setProjectTitle, resetStore]);

  // Handle title edit in the wizard
  const handleTitleChange = async (newTitle: string) => {
    setProjectTitle(newTitle);
    if (projectId !== 'demo-project-id') {
      try {
        await api.db('projects')
          .update({ title: newTitle })
          .eq('id', projectId);
      } catch (e) {
        console.warn('Failed to update title in DB:', e);
      }
    }
  };

  return (
    <div className="w-full space-y-10 font-sans max-w-5xl mx-auto px-4 md:px-0">
      
      {/* Header Workspace Title Edit */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-neutral-100">
        <div className="space-y-1 w-full max-w-xl">
          <span className="text-[10px] font-bold text-[#0000FF] uppercase tracking-wider block">
            Workspace Configuration
          </span>
          <input
            type="text"
            value={projectTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full bg-transparent text-xl md:text-2xl font-semibold text-neutral-900 border-b border-transparent hover:border-neutral-200 focus:border-[#0000FF] focus:outline-none transition-all py-1"
            placeholder="Untitled Workspace"
          />
        </div>

        {/* Workspace details badge */}
        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest bg-neutral-50 border border-neutral-150 px-3 py-1 rounded-full">
          ID: {projectId.slice(0, 8)}
        </span>
      </div>

      {/* Steps Progress Indicator */}
      <div className="w-full bg-neutral-50/50 border border-neutral-150 rounded-2xl p-4 md:p-6 grid grid-cols-3 gap-4 relative overflow-hidden select-none max-w-3xl mx-auto">
        {/* Step 1 */}
        <div className={`flex items-center gap-2.5 transition-opacity ${currentStep >= 1 ? 'opacity-100' : 'opacity-40'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
            currentStep === 1 ? 'bg-[#0000FF] text-white shadow-md shadow-blue-500/20' : currentStep > 1 ? 'bg-[#0000FF] text-white' : 'bg-neutral-200 text-neutral-500'
          }`}>
            <ClipboardList className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block">Phase 1</span>
            <span className="text-xs font-semibold text-neutral-850">Requirements</span>
          </div>
        </div>

        {/* Step 2 */}
        <div className={`flex items-center gap-2.5 transition-opacity ${currentStep >= 2 ? 'opacity-100' : 'opacity-40'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
            currentStep === 2 ? 'bg-[#0000FF] text-white shadow-md shadow-blue-500/20' : currentStep > 2 ? 'bg-[#0000FF] text-white' : 'bg-neutral-200 text-neutral-500'
          }`}>
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block">Phase 2</span>
            <span className="text-xs font-semibold text-neutral-850">Candidates</span>
          </div>
        </div>

        {/* Step 3 */}
        <div className={`flex items-center gap-2.5 transition-opacity ${currentStep >= 3 ? 'opacity-100' : 'opacity-40'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
            currentStep === 3 ? 'bg-[#0000FF] text-white shadow-md shadow-blue-500/20' : 'bg-neutral-200 text-neutral-500'
          }`}>
            <Play className="w-4 h-4 fill-current" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block">Phase 3</span>
            <span className="text-xs font-semibold text-neutral-850">Run Matching</span>
          </div>
        </div>
      </div>

      {/* Render Steps */}
      <div className="bg-white rounded-[32px] border border-neutral-100 p-8 shadow-sm">
        {currentStep === 1 && <JDPhase />}
        {currentStep === 2 && <CandidatesPhase />}
        {currentStep === 3 && <PipelinePreview />}
      </div>
    </div>
  );
}
