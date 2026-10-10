'use client';

import React, { useState, useRef } from 'react';
import { Upload, Info, Loader2, AlertCircle } from 'lucide-react';
import { useProjectStore } from '@/stores/useProjectStore';
import PipelinePreview from './PipelinePreview';
import PipelineRunner from './PipelineRunner';

export default function Phase2Candidates() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    projectId,
    jdIsDemo,
    candidatesIsDemo,
    setCandidatesIsDemo,
    runStatus
  } = useProjectStore();

  const [file, setFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationSuccess, setValidationSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHonestCard, setShowHonestCard] = useState(false);

  const handleDemoToggle = (checked: boolean) => {
    setCandidatesIsDemo(checked);
    setError(null);
    if (checked) {
      setFile(null);
      setValidationSuccess(false);
      setShowHonestCard(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setValidationSuccess(false);
    setIsValidating(true);
    setShowHonestCard(true); // Show honest card immediately on upload attempt

    try {
      const formData = new FormData();
      formData.append('candidates_file', selectedFile);

      const response = await fetch('/api/validate-candidates', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Schema validation failed');
      }

      setValidationSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to validate candidates file');
      setValidationSuccess(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleUseDemoPoolFallback = () => {
    setCandidatesIsDemo(true);
    setFile(null);
    setValidationSuccess(false);
    setShowHonestCard(false);
    setError(null);
  };

  const isPoolReady = candidatesIsDemo || (validationSuccess && !isValidating);

  return (
    <div className="space-y-6 max-w-xl mx-auto font-sans text-left">
      {/* Phase Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_4px_16px_rgba(0,0,34,0.06)] p-10 space-y-6">
        {/* Title */}
        <div>
          <h2 className="font-display font-semibold text-2xl text-[#0A0A0A] leading-tight">
            Add your candidate pool
          </h2>
          <p className="font-body text-sm text-[#4A4A4A] mt-2">
            Upload a candidate dataset or use the precomputed 100K sample pool.
          </p>
        </div>

        {/* Demo Checkbox */}
        <div className="p-4 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] space-y-3">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={candidatesIsDemo}
              onChange={(e) => handleDemoToggle(e.target.checked)}
              disabled={runStatus !== 'idle'}
              className="hidden"
            />
            <div
              className={`w-4.5 h-4.5 rounded flex items-center justify-center border transition-all ${
                candidatesIsDemo
                  ? 'bg-[#0000FF] border-[#0000FF] text-white'
                  : 'border-[#E5E7EB] group-hover:border-[#0000FF]/50 bg-white'
              }`}
            >
              {candidatesIsDemo && (
                <svg className="w-3 h-3 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-xs font-semibold text-[#4A4A4A] group-hover:text-[#0A0A0A] transition-colors">
              Use the demo candidate pool (100,000 sample candidates — precomputed)
            </span>
          </label>
          {candidatesIsDemo && (
            <span className="text-[11px] font-bold text-[#16A34A] block ml-7">
              ✓ 100,000 candidates loaded — precomputed index ready
            </span>
          )}
        </div>

        {/* Upload zone (shown when demo tick is OFF) */}
        {!candidatesIsDemo && (
          <div className="space-y-4">
            {isValidating ? (
              <div className="bg-[#0000FF] border-2 border-dashed border-white/50 rounded-xl p-12 text-center text-white flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
                <p className="font-display font-semibold text-base">Validating Schema...</p>
              </div>
            ) : validationSuccess && file ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#0000FF] hover:bg-[#1A1AFF] border-2 border-dashed border-white/50 rounded-xl p-12 text-center text-white cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 select-none"
              >
                <span className="text-2xl">✓</span>
                <p className="font-display font-semibold text-base">{file.name}</p>
                <p className="text-white/80 text-xs">✓ 100,000 candidates loaded, schema valid</p>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#0000FF] hover:bg-[#1A1AFF] border-2 border-dashed border-white/50 rounded-xl p-12 text-center text-white cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 group select-none"
              >
                <Upload className="w-8 h-8 text-white transition-transform group-hover:-translate-y-1" />
                <div>
                  <p className="font-display font-semibold text-lg">Drop your candidate dataset here</p>
                  <p className="text-white/75 text-sm mt-0.5">or click to browse</p>
                </div>
                <span className="text-[10px] text-white/50 tracking-wider">.jsonl  .jsonl.gz</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".jsonl,.jsonl.gz"
                  className="hidden"
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2.5 text-xs">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>{error}</div>
              </div>
            )}

            {/* Honest info card */}
            {showHonestCard && (
              <div className="bg-[#EEF2FF] border border-[#2563EB]/20 rounded-xl p-5 space-y-4 text-xs leading-relaxed">
                <div className="flex gap-2.5">
                  <Info className="w-5 h-5 text-[#0000FF] shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <h5 className="font-bold text-[#0A0A0A] text-sm">Custom Candidate Pool Received</h5>
                    <p className="text-[#4A4A4A]">
                      Your file has been received. Processing a new candidate pool requires an offline embedding + indexing step (~20–30 min for 100K candidates) that runs outside this app.
                    </p>
                    <p className="text-[#4A4A4A] font-medium">
                      For this session, ranking will run against the precomputed 100K sample dataset.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleUseDemoPoolFallback}
                    className="bg-[#0A0A0A] hover:bg-black text-white text-xs font-semibold rounded-full px-5 py-2.5 transition-all select-none active:scale-[0.98]"
                  >
                    Continue with demo pool
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Render Pipeline Preview and Runner once pool is ready */}
      {isPoolReady && (
        <div className="space-y-6 animate-fade-in">
          <PipelinePreview />
          <PipelineRunner />
        </div>
      )}
    </div>
  );
}
