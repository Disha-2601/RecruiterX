import { create } from 'zustand';

interface ProjectState {
  currentStep: number;
  projectTitle: string;
  projectId: string | null;
  jdFile: File | null;
  jdText: string;
  jdIsDemo: boolean;
  parsedJd: any | null;
  jdParseLoading: boolean;
  jdParseError: string | null;
  candidateFile: File | null;
  candidatesIsDemo: boolean;
  candidateValidation: any | null;
  candidateValidationLoading: boolean;
  candidateValidationError: string | null;
  pipelineLogs: string[];
  pipelineRunning: boolean;
  pipelineCompleted: boolean;
  pipelineError: string | null;

  setStep: (step: number) => void;
  setProjectTitle: (title: string) => void;
  setProjectId: (id: string | null) => void;
  setJdFile: (file: File | null) => void;
  setJdText: (text: string) => void;
  setJdIsDemo: (isDemo: boolean) => void;
  setParsedJd: (data: any | null) => void;
  setJdParseLoading: (loading: boolean) => void;
  setJdParseError: (error: string | null) => void;
  setCandidateFile: (file: File | null) => void;
  setCandidatesIsDemo: (isDemo: boolean) => void;
  setCandidateValidation: (data: any | null) => void;
  setCandidateValidationLoading: (loading: boolean) => void;
  setCandidateValidationError: (error: string | null) => void;
  setPipelineLogs: (logs: string[]) => void;
  addPipelineLog: (log: string) => void;
  setPipelineRunning: (running: boolean) => void;
  setPipelineCompleted: (completed: boolean) => void;
  setPipelineError: (error: string | null) => void;
  resetStore: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentStep: 1,
  projectTitle: 'New Evaluation Workspace',
  projectId: null,
  jdFile: null,
  jdText: '',
  jdIsDemo: false,
  parsedJd: null,
  jdParseLoading: false,
  jdParseError: null,
  candidateFile: null,
  candidatesIsDemo: false,
  candidateValidation: null,
  candidateValidationLoading: false,
  candidateValidationError: null,
  pipelineLogs: [],
  pipelineRunning: false,
  pipelineCompleted: false,
  pipelineError: null,

  setStep: (step) => set({ currentStep: step }),
  setProjectTitle: (title) => set({ projectTitle: title }),
  setProjectId: (id) => set({ projectId: id }),
  setJdFile: (file) => set({ jdFile: file }),
  setJdText: (text) => set({ jdText: text }),
  setJdIsDemo: (isDemo) => set({ jdIsDemo: isDemo }),
  setParsedJd: (data) => set({ parsedJd: data }),
  setJdParseLoading: (loading) => set({ jdParseLoading: loading }),
  setJdParseError: (error) => set({ jdParseError: error }),
  setCandidateFile: (file) => set({ candidateFile: file }),
  setCandidatesIsDemo: (isDemo) => set({ candidatesIsDemo: isDemo }),
  setCandidateValidation: (data) => set({ candidateValidation: data }),
  setCandidateValidationLoading: (loading) => set({ candidateValidationLoading: loading }),
  setCandidateValidationError: (error) => set({ candidateValidationError: error }),
  setPipelineLogs: (logs) => set({ pipelineLogs: logs }),
  addPipelineLog: (log) => set((state) => ({ pipelineLogs: [...state.pipelineLogs, log] })),
  setPipelineRunning: (running) => set({ pipelineRunning: running }),
  setPipelineCompleted: (completed) => set({ pipelineCompleted: completed }),
  setPipelineError: (error) => set({ pipelineError: error }),
  resetStore: () =>
    set({
      currentStep: 1,
      projectTitle: 'New Evaluation Workspace',
      projectId: null,
      jdFile: null,
      jdText: '',
      jdIsDemo: false,
      parsedJd: null,
      jdParseLoading: false,
      jdParseError: null,
      candidateFile: null,
      candidatesIsDemo: false,
      candidateValidation: null,
      candidateValidationLoading: false,
      candidateValidationError: null,
      pipelineLogs: [],
      pipelineRunning: false,
      pipelineCompleted: false,
      pipelineError: null,
    }),
}));
