import { create } from 'zustand';

export interface ParsedJD {
  quality_score: number;
  must_have_skills: { name: string; weight: number }[];
  nice_to_have_skills: { name: string; weight: number }[];
  experience_range: string;
  work_mode: string;
  locations: string[];
  salary: string;
  seniority: string;
  notice_period: string;
  audit_narrative: string;
}

interface ProjectState {
  projectId: string | null;
  projectName: string;
  phase: 0 | 1 | 2;
  jdIsDemo: boolean;
  jdParsed: ParsedJD | null;
  candidatesIsDemo: boolean;
  runId: string | null;
  runStatus: 'idle' | 'queued' | 'parsing_jd' | 'embedding' | 'ranking' | 'processing_results' | 'complete' | 'failed';
  runError: string | null;
  elapsedSeconds: number;

  setProjectId: (id: string | null) => void;
  setProjectName: (name: string) => void;
  setPhase: (phase: 0 | 1 | 2) => void;
  setJdIsDemo: (isDemo: boolean) => void;
  setJdParsed: (parsed: ParsedJD | null) => void;
  setCandidatesIsDemo: (isDemo: boolean) => void;
  setRunId: (id: string | null) => void;
  setRunStatus: (status: 'idle' | 'queued' | 'parsing_jd' | 'embedding' | 'ranking' | 'processing_results' | 'complete' | 'failed') => void;
  setRunError: (error: string | null) => void;
  setElapsedSeconds: (seconds: number) => void;
  resetStore: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projectId: null,
  projectName: '',
  phase: 0,
  jdIsDemo: false,
  jdParsed: null,
  candidatesIsDemo: false,
  runId: null,
  runStatus: 'idle',
  runError: null,
  elapsedSeconds: 0,

  setProjectId: (id) => set({ projectId: id }),
  setProjectName: (name) => set({ projectName: name }),
  setPhase: (phase) => set({ phase }),
  setJdIsDemo: (isDemo) => set({ jdIsDemo: isDemo }),
  setJdParsed: (parsed) => set({ jdParsed: parsed }),
  setCandidatesIsDemo: (isDemo) => set({ candidatesIsDemo: isDemo }),
  setRunId: (id) => set({ runId: id }),
  setRunStatus: (status) => set({ runStatus: status }),
  setRunError: (error) => set({ runError: error }),
  setElapsedSeconds: (seconds) => set({ elapsedSeconds: seconds }),
  resetStore: () =>
    set({
      projectId: null,
      projectName: '',
      phase: 0,
      jdIsDemo: false,
      jdParsed: null,
      candidatesIsDemo: false,
      runId: null,
      runStatus: 'idle',
      runError: null,
      elapsedSeconds: 0,
    }),
}));
