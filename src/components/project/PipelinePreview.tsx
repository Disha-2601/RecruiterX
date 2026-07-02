'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Play, CheckCircle2, Lock, Terminal, Activity, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { useProjectStore } from '@/stores/useProjectStore';

export default function PipelinePreview() {
  const router = useRouter();
  const {
    projectTitle,
    jdIsDemo,
    candidatesIsDemo,
    jdFile,
    jdText,
    candidateFile,
    setStep
  } = useProjectStore();

  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Determine path active flags
  const isCachedOnly = jdIsDemo && candidatesIsDemo;
  const isReEmbedOnly = !jdIsDemo;

  // Logs stream timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && !isCompleted) {
      timer = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, isCompleted]);

  const runPipeline = async () => {
    setIsRunning(true);
    setError(null);
    setLogs(['[SYSTEM] Preparing payload...', '[SYSTEM] Initializing pipeline worker...']);

    try {
      const formData = new FormData();
      formData.append('title', projectTitle);
      
      // Determine skip_embed
      const skipEmbed = isCachedOnly;
      formData.append('skip_embed', skipEmbed ? 'true' : 'false');
      formData.append('reindex', 'false'); // never call build_index.py

      // Provide JD file or a dummy file to satisfy API
      if (jdFile) {
        formData.append('jd', jdFile);
      } else {
        // Construct a dummy file with text if writing JD or using demo
        const textContent = jdText || 'Senior AI/ML Engineer demo description';
        const dummyFile = new File([textContent], 'jd.txt', { type: 'text/plain' });
        formData.append('jd', dummyFile);
      }

      // Pass candidates file if present
      if (candidateFile) {
        formData.append('candidates', candidateFile);
      }

      // Add API logs simulation while starting request
      const progressTimer = setTimeout(() => {
        setLogs((prev) => [...prev, '[SYSTEM] Connecting to backend server...', '[SYSTEM] Loading precomputed candidate vectors...']);
      }, 1500);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearTimeout(progressTimer);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Pipeline run failed');
      }

      const data = await res.json();
      
      if (data.logs && Array.isArray(data.logs)) {
        setLogs(data.logs);
      } else {
        setLogs((prev) => [...prev, '[SYSTEM] Pipeline completed successfully.']);
      }

      setIsCompleted(true);
    } catch (err: any) {
      setError(err.message || 'Error occurred while running evaluation pipeline');
      setLogs((prev) => [...prev, `[ERROR] ${err.message}`]);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (isRunning) {
    return (
      <div className="space-y-8 font-sans max-w-4xl mx-auto">
        {/* Runner Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-neutral-100">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-semibold text-neutral-900 tracking-tight flex items-center gap-2">
              {isCompleted ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              ) : (
                <Activity className="w-6 h-6 text-[#0000FF] animate-pulse shrink-0" />
              )}
              <span>
                {isCompleted ? 'Evaluation Complete' : 'Executing Matcher Pipeline'}
              </span>
            </h2>
            <p className="text-xs text-neutral-500 leading-none">
              Running semantic scoring, logistics fit matching, and consistency audits
            </p>
          </div>

          <div className="bg-neutral-50 border border-neutral-150 px-4 py-2 rounded-2xl flex items-baseline gap-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Time:</span>
            <span className="text-sm font-bold text-neutral-700">{formatTime(timeElapsed)}</span>
          </div>
        </div>

        {/* Logs Terminal */}
        <div className="bg-[#0A0A14] text-neutral-300 font-mono rounded-[24px] border border-white/5 p-6 space-y-3 shadow-xl max-w-3xl mx-auto relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
            <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5" /> Pipeline Console Logs</span>
            {!isCompleted && !error && <span className="text-[#0000FF] animate-pulse">Running</span>}
          </div>
          
          <div className="space-y-2 h-[260px] overflow-y-auto text-xs leading-relaxed scrollbar-thin scrollbar-thumb-white/10 pr-2">
            {logs.map((log, i) => {
              const isError = log.includes('[ERROR]');
              const isSystem = log.includes('[SYSTEM]');
              const isWarn = log.includes('[WARN]');
              let color = 'text-neutral-300';
              if (isError) color = 'text-rose-400 font-bold';
              else if (isSystem) color = 'text-[#0000FF] font-semibold';
              else if (isWarn) color = 'text-amber-400';

              return (
                <div key={i} className={color}>
                  {log}
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Actions */}
        <div className="flex justify-end pt-4 max-w-3xl mx-auto">
          {error && (
            <div className="mr-auto p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isCompleted && (
            <button
              onClick={() => {
                router.push('/dashboard');
                // Refresh window after a brief timeout to trigger load of new json
                setTimeout(() => {
                  window.location.reload();
                }, 500);
              }}
              className="bg-[#0000FF] hover:bg-[#0000CC] text-white text-xs font-semibold rounded-full px-6 py-3.5 transition-all flex items-center gap-1.5 active:scale-[0.98] shadow-md shadow-blue-500/10"
            >
              <span>View Results Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-xl md:text-2xl font-semibold text-neutral-900 tracking-tight">
          Configure Matcher Pipeline
        </h2>
        <p className="text-xs text-neutral-500 leading-relaxed max-w-xl">
          Review pipeline modes and estimate execution times based on your selections.
        </p>
      </div>

      {/* Path Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Cached Index */}
        <div 
          className={`rounded-[24px] border p-6 flex flex-col justify-between min-h-[220px] transition-all relative overflow-hidden bg-white select-none ${
            isCachedOnly
              ? 'border-[#0000FF] shadow-lg shadow-blue-500/5 ring-1 ring-[#0000FF]/30'
              : 'border-neutral-200 opacity-60'
          }`}
        >
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-[#0000FF] uppercase tracking-wider block bg-blue-50 px-2 py-0.5 rounded-full">
                ~30 sec
              </span>
              {isCachedOnly && <CheckCircle2 className="w-5 h-5 text-[#0000FF]" />}
            </div>
            <h3 className="font-semibold text-sm text-neutral-900 leading-tight">
              Cached Index (Ranking only)
            </h3>
            <p className="text-neutral-500 text-[11px] leading-relaxed">
              Fast path execution. Bypasses JD parse & re-embedding, loads directly from pre-computed cache vectors.
            </p>
          </div>
          {isCachedOnly && (
            <div className="mt-4 text-[10px] font-bold uppercase tracking-wider text-[#0000FF]">
              Active Configuration
            </div>
          )}
        </div>

        {/* Card 2: Re-embed JD */}
        <div 
          className={`rounded-[24px] border p-6 flex flex-col justify-between min-h-[220px] transition-all relative overflow-hidden bg-white select-none ${
            isReEmbedOnly
              ? 'border-[#0000FF] shadow-lg shadow-blue-500/5 ring-1 ring-[#0000FF]/30'
              : 'border-neutral-200 opacity-60'
          }`}
        >
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-[#0000FF] uppercase tracking-wider block bg-blue-50 px-2 py-0.5 rounded-full">
                ~45 sec
              </span>
              {isReEmbedOnly && <CheckCircle2 className="w-5 h-5 text-[#0000FF]" />}
            </div>
            <h3 className="font-semibold text-sm text-neutral-900 leading-tight">
              Re-embed JD Only
            </h3>
            <p className="text-neutral-500 text-[11px] leading-relaxed">
              Runs MiniLM model weights on CPU to encode the custom JD, then ranks against cached candidate pool.
            </p>
          </div>
          {isReEmbedOnly && (
            <div className="mt-4 text-[10px] font-bold uppercase tracking-wider text-[#0000FF]">
              Active Configuration
            </div>
          )}
        </div>

        {/* Card 3: Locked Re-indexing */}
        <div className="rounded-[24px] border border-neutral-200 bg-neutral-50/50 p-6 flex flex-col justify-between min-h-[220px] opacity-40 select-none">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block bg-neutral-100 px-2 py-0.5 rounded-full">
                Offline Only
              </span>
              <Lock className="w-4 h-4 text-neutral-400" />
            </div>
            <h3 className="font-semibold text-sm text-neutral-500 leading-tight">
              Full Index Rebuilding
            </h3>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              New candidate pools require offline embedding (~20-30 min for 100K candidates). Run outside the app.
            </p>
          </div>
          <div className="mt-4 text-[9px] font-bold uppercase tracking-wider text-neutral-400">
            Locked
          </div>
        </div>
      </div>

      {/* Navigation CTAs */}
      <div className="flex justify-between items-center pt-5 border-t border-neutral-100">
        <button
          onClick={() => setStep(2)}
          className="border border-neutral-200 hover:bg-neutral-50 text-neutral-600 text-xs font-semibold rounded-full px-5 py-2.5 transition-all select-none active:scale-[0.98]"
        >
          &larr; Back
        </button>
        <button
          onClick={runPipeline}
          className="bg-[#0000FF] hover:bg-[#0000CC] text-white text-xs font-semibold rounded-full px-6 py-3.5 transition-all flex items-center gap-1.5 active:scale-[0.98] shadow-md shadow-blue-500/10"
        >
          <span>Run Evaluation Pipeline</span>
          <Play className="w-3.5 h-3.5 fill-current" />
        </button>
      </div>
    </div>
  );
}
