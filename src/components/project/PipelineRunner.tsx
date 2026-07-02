'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Play, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';
import { useProjectStore } from '@/stores/useProjectStore';

export default function PipelineRunner() {
  const router = useRouter();
  const {
    projectId,
    jdIsDemo,
    runId,
    runStatus,
    runError,
    elapsedSeconds,
    setRunId,
    setRunStatus,
    setRunError,
    setElapsedSeconds,
  } = useProjectStore();

  const [isLaunching, setIsLaunching] = useState(false);

  // Poll status when active
  useEffect(() => {
    if (!runId || (runStatus !== 'queued' && runStatus !== 'embedding' && runStatus !== 'ranking' && runStatus !== 'processing_results')) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/runs/${runId}/status`);
        if (!res.ok) return;

        const data = await res.json();
        
        // Update store values
        setRunStatus(data.status);
        setRunError(data.error_message);
        setElapsedSeconds(data.elapsed_seconds);
      } catch (err) {
        console.warn('Failed to poll run status:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [runId, runStatus, setRunStatus, setRunError, setElapsedSeconds]);

  // Elapsed timer (visual second ticker on frontend)
  useEffect(() => {
    if (runStatus === 'idle' || runStatus === 'complete' || runStatus === 'failed') {
      return;
    }

    const timer = setInterval(() => {
      setElapsedSeconds(elapsedSeconds + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [runStatus, elapsedSeconds, setElapsedSeconds]);

  const handleRun = async () => {
    if (!projectId || isLaunching) return;

    setIsLaunching(true);
    setRunError(null);
    setElapsedSeconds(0);

    try {
      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          skip_embed: jdIsDemo
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to start run');
      }

      const data = await res.json();
      setRunId(data.run_id);
      setRunStatus('queued');
    } catch (err: any) {
      setRunError(err.message || 'Error occurred starting the run');
      setRunStatus('failed');
    } finally {
      setIsLaunching(false);
    }
  };

  const handleTryAgain = () => {
    setRunStatus('idle');
    setRunId(null);
    setRunError(null);
    setElapsedSeconds(0);
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Render Idle state (Ready to Run)
  if (runStatus === 'idle') {
    return (
      <div className="w-full pt-2">
        <button
          onClick={handleRun}
          disabled={isLaunching}
          className="w-full bg-gradient-to-r from-[#000033] via-[#0000FF] to-[#2563EB] hover:brightness-110 disabled:bg-[#F5F5F5] disabled:text-[#8C8C8C] text-white py-4 rounded-xl text-base font-semibold transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.99] shadow-[0_0_60px_rgba(0,0,255,0.15)] select-none disabled:shadow-none disabled:cursor-not-allowed"
        >
          {isLaunching ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Launching...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span className="font-display">Run Pipeline</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // Render Execution Active state
  const isActive = ['queued', 'embedding', 'ranking', 'processing_results'].includes(runStatus);
  if (isActive) {
    const showEmbedding = !jdIsDemo;

    return (
      <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_4px_16px_rgba(0,0,34,0.06)] p-6 space-y-5 font-sans text-left animate-fade-in select-none">
        {/* Header row */}
        <div className="flex justify-between items-center pb-3 border-b border-[#F0F0F0]">
          <div className="flex items-center gap-2 text-[#0A0A0A]">
            <Loader2 className="w-4 h-4 animate-spin text-[#0000FF]" />
            <h4 className="font-display font-semibold text-sm">
              Pipeline Running
            </h4>
          </div>
          <span className="font-mono text-xs text-[#8C8C8C]">
            {formatTime(elapsedSeconds)}
          </span>
        </div>

        {/* Stage List */}
        <div className="space-y-4">
          {/* Stage 1: Embedding (only for custom JDs) */}
          {showEmbedding && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={
                  runStatus === 'queued' ? 'text-[#8C8C8C]' :
                  runStatus === 'embedding' ? 'text-[#0000FF] font-bold' :
                  'text-[#16A34A]'
                }>
                  ●
                </span>
                <span className={runStatus === 'embedding' ? 'text-[#0A0A0A] font-semibold' : 'text-[#4A4A4A]'}>
                  Encoding Job Description
                </span>
              </div>
              <span className="text-[#8C8C8C] font-mono">
                {runStatus === 'queued' ? 'pending' :
                 runStatus === 'embedding' ? 'running...' :
                 'complete'}
              </span>
            </div>
          )}

          {/* Stage 2: Ranking (always run) */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={
                ['queued', 'embedding'].includes(runStatus) ? 'text-[#8C8C8C]' :
                runStatus === 'ranking' ? 'text-[#0000FF] font-bold' :
                'text-[#16A34A]'
              }>
                ●
              </span>
              <span className={runStatus === 'ranking' ? 'text-[#0A0A0A] font-semibold' : 'text-[#4A4A4A]'}>
                Ranking 100,000 Candidates
              </span>
            </div>
            <span className="text-[#8C8C8C] font-mono">
              {['queued', 'embedding'].includes(runStatus) ? 'pending' :
               runStatus === 'ranking' ? 'running...' :
               'complete'}
            </span>
          </div>

          {/* Stage 3: DB Injection */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={
                ['queued', 'embedding', 'ranking'].includes(runStatus) ? 'text-[#8C8C8C]' :
                runStatus === 'processing_results' ? 'text-[#0000FF] font-bold' :
                'text-[#16A34A]'
              }>
                ●
              </span>
              <span className={runStatus === 'processing_results' ? 'text-[#0A0A0A] font-semibold' : 'text-[#4A4A4A]'}>
                Persisting Shortlist Records
              </span>
            </div>
            <span className="text-[#8C8C8C] font-mono">
              {['queued', 'embedding', 'ranking'].includes(runStatus) ? 'pending' :
               runStatus === 'processing_results' ? 'saving...' :
               'complete'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Render Completed state
  if (runStatus === 'complete') {
    return (
      <div className="bg-[#F0FDF4] border border-[#16A34A]/20 rounded-2xl p-6 text-center font-sans space-y-4 animate-fade-in">
        <div className="flex flex-col items-center space-y-2">
          <CheckCircle className="w-10 h-10 text-[#16A34A]" />
          <h3 className="font-display font-semibold text-lg text-[#0A0A0A]">
            Ranking Complete
          </h3>
          <p className="text-xs text-[#4A4A4A]">
            100 candidates scored, ranked, and persisted.
          </p>
          <span className="text-xs text-[#8C8C8C] font-mono">
            Total time: {elapsedSeconds} seconds
          </span>
        </div>

        <div className="pt-2 flex justify-center">
          <button
            onClick={() => router.push(`/dashboard`)}
            className="bg-[#0A0A0A] hover:bg-black text-white text-xs font-semibold rounded-full px-6 py-2.5 transition-all select-none active:scale-[0.98]"
          >
            View Results →
          </button>
        </div>
      </div>
    );
  }

  // Render Failed state
  if (runStatus === 'failed') {
    return (
      <div className="bg-[#FEF2F2] border border-[#DC2626]/20 rounded-2xl p-6 text-center font-sans space-y-4 animate-fade-in">
        <div className="flex flex-col items-center space-y-2">
          <AlertCircle className="w-10 h-10 text-[#DC2626]" />
          <h3 className="font-display font-semibold text-lg text-[#0A0A0A]">
            Pipeline Failed
          </h3>
          <p className="text-xs text-red-700 max-w-md break-words">
            {runError || 'An unexpected error occurred during execution.'}
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <button
            onClick={handleTryAgain}
            className="border-1.5 border-[#DC2626] hover:bg-[#FEF2F2] text-[#DC2626] text-xs font-semibold rounded-full px-5 py-2.5 transition-all select-none flex items-center gap-1.5 active:scale-[0.98]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
}
