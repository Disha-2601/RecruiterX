'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Play, Terminal, CheckCircle, AlertTriangle, ArrowRight, Loader2, RefreshCw } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();

  const [projectTitle, setProjectTitle] = useState('Senior AI/ML Engineer Search');
  const [jobRole, setJobRole] = useState('Senior AI/ML Engineer (Pune/Noida)');
  
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [candidatesFile, setCandidatesFile] = useState<File | null>(null);
  const [reindex, setReindex] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Auto-scroll logs terminal
  useEffect(() => {
    const el = document.getElementById('terminal-log-container');
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [logs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdFile) {
      setError('Please upload the Job Description file.');
      return;
    }

    if (reindex && !candidatesFile) {
      setError('Please upload the Candidate Pool file to rebuild the index.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(false);
    setLogs(['[SYSTEM] Initializing ranking pipeline...', '[SYSTEM] Preparing file buffers...']);

    try {
      const formData = new FormData();
      formData.append('title', projectTitle);
      formData.append('jd', jdFile);
      if (candidatesFile) {
        formData.append('candidates', candidatesFile);
      }
      formData.append('reindex', reindex ? 'true' : 'false');

      // We make the API call to upload and run
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.logs) {
        setLogs(data.logs);
      }

      if (!response.ok || data.success === false) {
        throw new Error(data.error || 'Pipeline execution failed.');
      }

      setSuccess(true);
      setLogs(prev => [...prev, '[SYSTEM] Pipeline completed successfully. Redirecting to Shortlist...']);
      
      // Auto-redirect to dashboard after 2 seconds on success
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during execution.');
      setLogs(prev => [...prev, `[ERROR] Process halted: ${err.message}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white font-sans">
      {/* Onboarding Navbar */}
      <nav className="border-b border-neutral-800 bg-neutral-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-sans font-black text-base tracking-tight text-white">RECRUITER</span>
            <span className="font-sans font-black text-base tracking-tight text-blue-500">-X</span>
            <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500/20">LIVE RANKER</span>
          </div>
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors font-mono"
          >
            <span>Skip to Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Onboard Candidate Ranking Pipeline</h1>
          <p className="text-sm text-neutral-400">Upload your target Job Description and Candidate Pool `.jsonl` data. Our vectorized engine will extract details, build semantic indexes, and run the composite scoring calculations live.</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex gap-3 text-red-400 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <div>
              <p className="font-bold">Execution Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex gap-3 text-green-400 text-xs">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <div>
              <p className="font-bold">Success!</p>
              <p>Shortlist calculated. Redirecting to Shortlist Dashboard...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-neutral-950 p-6 rounded-xl border border-neutral-800">
          
          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block font-mono">Project Name</label>
              <input
                type="text"
                required
                disabled={isProcessing}
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block font-mono">Target Role</label>
              <input
                type="text"
                required
                disabled={isProcessing}
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Document Upload Grids */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            
            {/* JD Upload */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block font-mono">1. Job Description (.docx / .txt)</label>
              <div className={`border-2 border-dashed rounded-lg p-5 text-center transition-all relative ${jdFile ? 'border-blue-500/40 bg-blue-500/5' : 'border-neutral-800 bg-neutral-900/30 hover:border-neutral-700'}`}>
                <input
                  type="file"
                  required
                  accept=".docx,.txt"
                  disabled={isProcessing}
                  onChange={(e) => setJdFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <Upload className={`w-6 h-6 mx-auto mb-2 ${jdFile ? 'text-blue-500' : 'text-neutral-500'}`} />
                <p className="text-xs font-bold truncate max-w-xs">{jdFile ? jdFile.name : 'Upload docx / txt JD'}</p>
                <p className="text-[10px] text-neutral-500 mt-1">Select from docs/given doc/job_description.docx</p>
              </div>
            </div>

            {/* Candidates Upload */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block font-mono">2. Candidate Pool (.jsonl)</label>
                <span className="text-[10px] text-neutral-500 italic">Optional</span>
              </div>
              <div className={`border-2 border-dashed rounded-lg p-5 text-center transition-all relative ${candidatesFile ? 'border-blue-500/40 bg-blue-500/5' : 'border-neutral-800 bg-neutral-900/30 hover:border-neutral-700'}`}>
                <input
                  type="file"
                  accept=".jsonl,.json"
                  disabled={isProcessing}
                  onChange={(e) => setCandidatesFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <Upload className={`w-6 h-6 mx-auto mb-2 ${candidatesFile ? 'text-blue-500' : 'text-neutral-500'}`} />
                <p className="text-xs font-bold truncate max-w-xs">{candidatesFile ? candidatesFile.name : 'Upload candidates.jsonl'}</p>
                <p className="text-[10px] text-neutral-500 mt-1">Leave empty to use precomputed 100K pool</p>
              </div>
            </div>

          </div>

          {/* Re-indexing check */}
          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                disabled={isProcessing}
                checked={reindex}
                onChange={(e) => setReindex(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-neutral-800 bg-neutral-900 disabled:opacity-50"
              />
              <div className="text-xs">
                <span className="font-bold text-neutral-200 block">Rebuild Candidate Semantic Index</span>
                <span className="text-neutral-500">Enable this if you uploaded a new candidates file. Note: Indexing the full 100K candidate pool takes ~5 mins.</span>
              </div>
            </label>
          </div>

          {/* Action button */}
          <div className="pt-4 border-t border-neutral-800 flex justify-end">
            <button
              type="submit"
              disabled={isProcessing || !jdFile || (reindex && !candidatesFile)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-sans text-sm font-bold px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-blue-600/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Run Inference Pipeline</span>
                </>
              )}
            </button>
          </div>

        </form>

        {/* Live Terminal Log Viewer */}
        {(isProcessing || logs.length > 2) && (
          <div className="mt-8 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">
              <Terminal className="w-4 h-4" />
              <span>Pipeline Execution Logs</span>
            </div>
            <div 
              id="terminal-log-container"
              className="bg-black border border-neutral-800 rounded-lg p-4 font-mono text-xs text-neutral-300 h-64 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-neutral-800"
            >
              {logs.map((log, index) => (
                <div key={index} className="leading-relaxed break-all">
                  {log.startsWith('[ERROR]') ? (
                    <span className="text-red-500">{log}</span>
                  ) : log.startsWith('[WARN]') ? (
                    <span className="text-yellow-500">{log}</span>
                  ) : log.startsWith('[SYSTEM]') ? (
                    <span className="text-blue-400">{log}</span>
                  ) : (
                    <span>{log}</span>
                  )}
                </div>
              ))}
              {isProcessing && (
                <div className="flex items-center gap-1.5 text-neutral-500 animate-pulse mt-2">
                  <span className="h-1.5 w-1.5 bg-neutral-500 rounded-full animate-bounce" />
                  <span className="h-1.5 w-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] ml-1">Executing subprocess...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
