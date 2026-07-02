'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useProjectStore } from '@/stores/useProjectStore';
import ParsedRequirementsCard from './ParsedRequirementsCard';

export default function JDPhase() {
  const {
    jdFile,
    jdText,
    jdIsDemo,
    parsedJd,
    jdParseLoading,
    jdParseError,
    setJdFile,
    setJdText,
    setJdIsDemo,
    setParsedJd,
    setJdParseLoading,
    setJdParseError,
    setStep
  } = useProjectStore();

  const [activeTab, setActiveTab] = useState<'upload' | 'write'>('upload');

  // Load cached JD if demo tick is already checked on load
  const loadCachedJd = useCallback(async () => {
    setJdParseLoading(true);
    setJdParseError(null);
    try {
      const res = await fetch('/api/cached-jd');
      if (!res.ok) {
        throw new Error('Failed to load cached demo JD');
      }
      const data = await res.json();
      setParsedJd(data);
    } catch (err: any) {
      setJdParseError(err.message || 'Error fetching cached JD requirements');
    } finally {
      setJdParseLoading(false);
    }
  }, [setJdParseLoading, setJdParseError, setParsedJd]);

  // Handle demo tick checkbox change
  const handleDemoTickChange = async (checked: boolean) => {
    setJdIsDemo(checked);
    if (checked) {
      await loadCachedJd();
    } else {
      setParsedJd(null);
      setJdFile(null);
      setJdText('');
    }
  };

  // Run initial load of demo JD if checked on mount
  useEffect(() => {
    if (jdIsDemo && !parsedJd) {
      loadCachedJd();
    }
  }, [jdIsDemo, parsedJd, loadCachedJd]);

  // File Dropzone Handler
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    setJdFile(file);
    setJdIsDemo(false);
    setJdParseLoading(true);
    setJdParseError(null);

    const formData = new FormData();
    formData.append('jd_file', file);

    try {
      const res = await fetch('/api/parse-jd', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Parsing failed');
      }

      const data = await res.json();
      setParsedJd(data);
    } catch (err: any) {
      setJdParseError(err.message || 'Failed to parse job description file');
      setParsedJd(null);
    } finally {
      setJdParseLoading(false);
    }
  }, [setJdFile, setJdIsDemo, setJdParseLoading, setJdParseError, setParsedJd]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    disabled: jdParseLoading || jdIsDemo
  });

  // Textarea submit handler
  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdText.trim()) return;

    setJdIsDemo(false);
    setJdParseLoading(true);
    setJdParseError(null);

    try {
      const res = await fetch('/api/parse-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd_text: jdText }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Parsing failed');
      }

      const data = await res.json();
      setParsedJd(data);
    } catch (err: any) {
      setJdParseError(err.message || 'Failed to parse text job description');
      setParsedJd(null);
    } finally {
      setJdParseLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-4xl mx-auto">
      {/* Step Info */}
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-xl md:text-2xl font-semibold text-neutral-900 tracking-tight">
          Define Evaluation Criteria
        </h2>
        <p className="text-xs text-neutral-500 leading-relaxed max-w-xl">
          Upload or write your Job Description. Our AI extracts weights, required years of experience, locations, and skills dynamically.
        </p>
      </div>

      {/* Tabs Selector */}
      <div className="flex bg-neutral-50 border border-neutral-200/60 p-1 rounded-full items-center max-w-[280px]">
        <button
          onClick={() => setActiveTab('upload')}
          disabled={jdIsDemo}
          className={`flex-1 text-xs font-semibold rounded-full py-2 transition-all active:scale-[0.98] ${
            activeTab === 'upload'
              ? 'bg-[#0000FF] text-white shadow-sm'
              : 'text-neutral-500 hover:text-neutral-800 disabled:opacity-50'
          }`}
        >
          Upload JD
        </button>
        <button
          onClick={() => setActiveTab('write')}
          disabled={jdIsDemo}
          className={`flex-1 text-xs font-semibold rounded-full py-2 transition-all active:scale-[0.98] ${
            activeTab === 'write'
              ? 'bg-[#0000FF] text-white shadow-sm'
              : 'text-neutral-500 hover:text-neutral-800 disabled:opacity-50'
          }`}
        >
          Write JD
        </button>
      </div>

      {/* Tabs Content */}
      <div className="space-y-6">
        {activeTab === 'upload' && (
          <div 
            {...getRootProps()} 
            className={`w-full rounded-[24px] p-10 md:p-14 text-center cursor-pointer transition-all border-2 border-dashed flex flex-col items-center justify-center space-y-4 select-none ${
              isDragActive 
                ? 'border-white bg-[#0000FF]/90 text-white' 
                : jdIsDemo
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
                {jdFile ? jdFile.name : 'Drop your JD here or click to browse'}
              </h3>
              <p className="text-white/60 text-xs leading-relaxed">
                Accepts Markdown (.md), Microsoft Word (.docx), PDF (.pdf), or Text (.txt) formats
              </p>
            </div>
          </div>
        )}

        {activeTab === 'write' && (
          <form onSubmit={handleTextSubmit} className="space-y-4">
            <div className="w-full rounded-[24px] border border-[#0000FF]/30 p-1 bg-white focus-within:ring-2 focus-within:ring-[#0000FF]/20 focus-within:border-[#0000FF] transition-all">
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                disabled={jdParseLoading || jdIsDemo}
                placeholder="Paste or write the job description requirements here..."
                className="w-full min-h-[220px] rounded-[20px] p-5 text-neutral-800 placeholder-neutral-400 text-xs focus:outline-none resize-y"
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={jdParseLoading || !jdText.trim() || jdIsDemo}
                className="bg-[#0000FF] hover:bg-[#0000CC] disabled:bg-neutral-100 text-white disabled:text-neutral-400 text-xs font-semibold rounded-full px-6 py-2.5 transition-all flex items-center gap-1.5 active:scale-[0.98] shadow-sm select-none"
              >
                {jdParseLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <span>Extract Requirements</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Demo Checkbox */}
        <div className="flex items-center gap-2.5 bg-neutral-50 border border-neutral-100 p-4 rounded-2xl max-w-md">
          <input
            id="demo-jd-checkbox"
            type="checkbox"
            checked={jdIsDemo}
            onChange={(e) => handleDemoTickChange(e.target.checked)}
            className="rounded border-neutral-300 text-[#0000FF] focus:ring-[#0000FF]/25 w-4 h-4 cursor-pointer accent-[#0000FF]"
          />
          <label htmlFor="demo-jd-checkbox" className="text-xs font-semibold text-neutral-700 cursor-pointer select-none">
            Use the demo JD (Redrob Senior AI/ML Engineer)
          </label>
        </div>

        {/* Error message */}
        {jdParseError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-800 flex items-start gap-2.5 max-w-2xl">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">{jdParseError}</div>
          </div>
        )}

        {/* Loading Indicator */}
        {jdParseLoading && (
          <div className="w-full py-8 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[#0000FF] animate-spin" />
            <span className="text-xs text-neutral-500 font-medium">Extracting job description signals...</span>
          </div>
        )}

        {/* Parsed Card Display (renders in all states if parsedJd exists) */}
        {parsedJd && !jdParseLoading && (
          <div className="space-y-6">
            <ParsedRequirementsCard data={parsedJd} />
            
            {/* Continue CTA */}
            <div className="flex justify-end pt-2 border-t border-neutral-100">
              <button
                onClick={() => setStep(2)}
                className="bg-[#0000FF] hover:bg-[#0000CC] text-white text-xs font-semibold rounded-full px-6 py-3 transition-all flex items-center gap-1.5 active:scale-[0.98] shadow-md shadow-blue-500/10"
              >
                <span>Continue &rarr;</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
