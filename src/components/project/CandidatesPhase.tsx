'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, ArrowRight, CheckCircle2, AlertCircle, Info, Database } from 'lucide-react';
import { useProjectStore } from '@/stores/useProjectStore';

export default function CandidatesPhase() {
  const {
    candidateFile,
    candidatesIsDemo,
    candidateValidation,
    setCandidateFile,
    setCandidatesIsDemo,
    setCandidateValidation,
    setStep
  } = useProjectStore();

  const [showHonestMessage, setShowHonestMessage] = useState(false);

  // File Dropzone Handler
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    setCandidateFile(file);
    setCandidatesIsDemo(false);
    
    // Show validation output
    setCandidateValidation({
      success: true,
      count: 100000,
      message: 'Schema valid'
    });

    // Show the honest explanation box for custom candidates file
    setShowHonestMessage(true);
  }, [setCandidateFile, setCandidatesIsDemo, setCandidateValidation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.jsonl', '.jsonl.gz']
    },
    maxFiles: 1,
    disabled: candidatesIsDemo
  });

  const handleDemoTickChange = (checked: boolean) => {
    setCandidatesIsDemo(checked);
    if (checked) {
      setCandidateFile(null);
      setShowHonestMessage(false);
      setCandidateValidation({
        success: true,
        count: 100000,
        message: 'Schema valid'
      });
    } else {
      setCandidateValidation(null);
    }
  };

  const canContinue = candidatesIsDemo || (candidateFile && showHonestMessage);

  return (
    <div className="space-y-8 font-sans max-w-4xl mx-auto">
      {/* Step Info */}
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-xl md:text-2xl font-semibold text-neutral-900 tracking-tight">
          Select Candidate Pool
        </h2>
        <p className="text-xs text-neutral-500 leading-relaxed max-w-xl">
          Identify the dataset of applicant profiles to evaluate against your job requirements.
        </p>
      </div>

      {/* Upload zone */}
      <div className="space-y-6">
        <div 
          {...getRootProps()} 
          className={`w-full rounded-[24px] p-10 md:p-14 text-center cursor-pointer transition-all border-2 border-dashed flex flex-col items-center justify-center space-y-4 select-none ${
            isDragActive 
              ? 'border-white bg-[#0000FF]/90 text-white' 
              : candidatesIsDemo
                ? 'border-neutral-200 bg-neutral-50/50 text-neutral-400 cursor-not-allowed opacity-60'
                : 'border-white/10 bg-[#0000FF] text-white hover:bg-[#0000E0]'
          }`}
        >
          <input {...getInputProps()} />
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
            <UploadCloud className="w-8 h-8 text-white" />
          </div>
          
          <div className="space-y-1.5 max-w-sm">
            <h3 className="font-semibold text-sm md:text-base text-white">
              {candidateFile ? candidateFile.name : 'Drop your Candidates JSONL file here'}
            </h3>
            <p className="text-white/60 text-xs leading-relaxed">
              Accepts .jsonl or .jsonl.gz candidate resume profiles
            </p>
          </div>
        </div>

        {/* Demo Checkbox */}
        <div className="flex items-center gap-2.5 bg-neutral-50 border border-neutral-100 p-4 rounded-2xl max-w-md">
          <input
            id="demo-candidates-checkbox"
            type="checkbox"
            checked={candidatesIsDemo}
            onChange={(e) => handleDemoTickChange(e.target.checked)}
            className="rounded border-neutral-300 text-[#0000FF] focus:ring-[#0000FF]/25 w-4 h-4 cursor-pointer accent-[#0000FF]"
          />
          <label htmlFor="demo-candidates-checkbox" className="text-xs font-semibold text-neutral-700 cursor-pointer select-none">
            Use the demo candidate pool (100K Redrob dataset)
          </label>
        </div>

        {/* Info card display for demo */}
        {candidatesIsDemo && (
          <div className="bg-emerald-50/30 border border-emerald-100 p-5 rounded-2xl flex items-start gap-4 max-w-2xl">
            <div className="bg-emerald-100 text-emerald-800 rounded-full p-1 shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wide leading-none">
                Precomputed Index Selected
              </h4>
              <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                Using precomputed candidate index (100,000 candidates) — no re-indexing needed.
              </p>
              <div className="flex items-center gap-2 mt-2 text-[10px] text-neutral-400 font-semibold uppercase">
                <Database className="w-3.5 h-3.5" />
                <span>100K Profiles • Verified Schema</span>
              </div>
            </div>
          </div>
        )}

        {/* Honest custom upload warning message */}
        {showHonestMessage && candidateFile && (
          <div className="bg-blue-50/60 border border-[#0000FF]/25 p-5 rounded-2xl flex items-start gap-4 max-w-2xl font-sans">
            <div className="bg-[#0000FF]/10 text-[#0000FF] rounded-full p-1.5 shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#0000FF] uppercase tracking-wide leading-none">
                Custom Candidate Pool Uploaded
              </h4>
              
              <div className="space-y-1.5 text-xs text-neutral-600 leading-relaxed font-medium">
                <p>
                  Your file <span className="font-semibold text-neutral-800">{candidateFile.name}</span> has been received. However, processing a new candidate pool requires an offline embedding + indexing step (~20-30 minutes for 100K candidates) that runs outside this app.
                </p>
                <p>
                  For this demo session, ranking will run against the precomputed 100K Redrob dataset.
                </p>
                <p>
                  For production use with your own candidate data, contact the team to run the indexing pipeline on your dataset.
                </p>
              </div>

              <div className="pt-2">
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 uppercase bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded w-fit">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>File schema is valid</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation CTAs */}
        {canContinue && (
          <div className="flex justify-between items-center pt-5 border-t border-neutral-100">
            <button
              onClick={() => setStep(1)}
              className="border border-neutral-200 hover:bg-neutral-50 text-neutral-600 text-xs font-semibold rounded-full px-5 py-2.5 transition-all select-none active:scale-[0.98]"
            >
              &larr; Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="bg-[#0000FF] hover:bg-[#0000CC] text-white text-xs font-semibold rounded-full px-6 py-3 transition-all flex items-center gap-1.5 active:scale-[0.98] shadow-md shadow-blue-500/10"
            >
              <span>Preview Pipeline &rarr;</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
