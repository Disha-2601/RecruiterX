'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { useProjectStore } from '@/stores/useProjectStore';
import { api } from '@/utils/api-client';
import ParsedRequirementsCard from './ParsedRequirementsCard';
import JDUploadTab from './JDUploadTab';
import JDWriteTab from './JDWriteTab';

export default function Phase1JD() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    projectId,
    jdIsDemo,
    jdParsed,
    setJdIsDemo,
    setJdParsed,
    setPhase
  } = useProjectStore();

  const [activeTab, setActiveTab] = useState<'upload' | 'write'>('upload');
  const [jdText, setJdText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle Demo checkbox
  const handleDemoToggle = async (checked: boolean) => {
    setJdIsDemo(checked);
    setError(null);

    if (checked) {
      setIsAnalyzing(true);
      try {
        const response = await fetch('/api/cached-jd');
        if (!response.ok) {
          throw new Error('Failed to fetch cached demo requirements');
        }
        const data = await response.json();
        setJdParsed(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load demo requirements');
        setJdIsDemo(false);
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      setJdParsed(null);
    }
  };

  // Handle file select
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('jd_file', selectedFile);

      const response = await fetch('/api/parse-jd', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to parse job description file');
      }

      const data = await response.json();
      setJdParsed(data);
    } catch (err: any) {
      setError(err.message || 'Error occurred while uploading and parsing file.');
      setFile(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle write JD submit
  const handleWriteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (jdText.trim().length < 50) return;

    setError(null);
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/parse-jd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jd_text: jdText.trim() }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to parse job description text');
      }

      const data = await response.json();
      setJdParsed(data);
    } catch (err: any) {
      setError(err.message || 'Error occurred while analyzing written text.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle resetting JD
  const handleResetJD = () => {
    setJdParsed(null);
    setJdIsDemo(false);
    setFile(null);
    setJdText('');
    setError(null);
  };

  // Handle continue
  const handleContinue = async () => {
    if (!jdParsed || !projectId) return;

    try {
      const rawText = jdIsDemo 
        ? 'Demo Job Description' 
        : activeTab === 'write' 
        ? jdText 
        : file?.name || 'Uploaded File';

      const mustHaveNames = jdParsed.must_have_skills.map(s => s.name);
      const niceToHaveNames = jdParsed.nice_to_have_skills.map(s => s.name);

      await api.db('projects')
        .update({
          jd_raw_text: rawText,
          jd_structured: {
            must_have_skills: mustHaveNames,
            nice_to_have_skills: niceToHaveNames,
            pool_report: null
          },
          status: 'draft'
        })
        .eq('id', projectId);

      setPhase(2);
      router.push(`/project/${projectId}?phase=2`);
    } catch (err) {
      console.error('Failed to update project JD in DB:', err);
    }
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_4px_16px_rgba(0,0,34,0.06)] p-10 max-w-xl mx-auto font-sans text-left space-y-6">
      {/* Title */}
      <div>
        <h2 className="font-display font-semibold text-2xl text-[#0A0A0A] leading-tight">
          Add your Job Description
        </h2>
        <p className="font-body text-sm text-[#4A4A4A] mt-2">
          We&apos;ll extract skills, experience range, location, and salary — and show you exactly what we found before moving on.
        </p>
      </div>

      {/* Main Area */}
      {!jdParsed && (
        <div className="space-y-6">
          {/* Tab Selector */}
          {!jdIsDemo && (
            <div className="flex bg-[#F5F5F5] p-1 rounded-full w-fit">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('upload');
                  setError(null);
                }}
                className={`text-xs font-semibold px-5 py-2 rounded-full transition-all ${
                  activeTab === 'upload'
                    ? 'bg-[#0A0A0A] text-white'
                    : 'text-[#4A4A4A] hover:text-[#0A0A0A]'
                }`}
              >
                Upload JD
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('write');
                  setError(null);
                }}
                className={`text-xs font-semibold px-5 py-2 rounded-full transition-all ${
                  activeTab === 'write'
                    ? 'bg-[#0A0A0A] text-white'
                    : 'text-[#4A4A4A] hover:text-[#0A0A0A]'
                }`}
              >
                Write JD
              </button>
            </div>
          )}

          {/* Upload Tab Container */}
          {activeTab === 'upload' && !jdIsDemo && (
            <JDUploadTab
              isAnalyzing={isAnalyzing}
              file={file}
              fileInputRef={fileInputRef}
              handleFileChange={handleFileChange}
            />
          )}

          {/* Write Tab Container */}
          {activeTab === 'write' && !jdIsDemo && (
            <JDWriteTab
              jdText={jdText}
              setJdText={setJdText}
              isAnalyzing={isAnalyzing}
              handleSubmit={handleWriteSubmit}
            />
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>{error}</div>
            </div>
          )}
        </div>
      )}

      {/* Demo Checkbox */}
      <div className="pt-2 border-t border-[#F0F0F0]">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={jdIsDemo}
            onChange={(e) => handleDemoToggle(e.target.checked)}
            disabled={isAnalyzing}
            className="hidden"
          />
          <div
            className={`w-4.5 h-4.5 rounded flex items-center justify-center border transition-all ${
              jdIsDemo
                ? 'bg-[#0000FF] border-[#0000FF] text-white'
                : 'border-[#E5E7EB] group-hover:border-[#0000FF]/50 bg-white'
            }`}
          >
            {jdIsDemo && (
              <svg className="w-3 h-3 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-xs font-medium text-[#4A4A4A] group-hover:text-[#0A0A0A] transition-colors">
            Use the demo JD (Sample Senior AI/ML Engineer role)
          </span>
        </label>
        {jdIsDemo && (
          <span className="text-[11px] font-bold text-[#16A34A] block mt-1.5 ml-7">
            ✓ Using precomputed JD requirements
          </span>
        )}
      </div>

      {/* Parsed Requirements Display */}
      {jdParsed && (
        <div className="space-y-6 pt-4 border-t border-[#F0F0F0]">
          <ParsedRequirementsCard data={jdParsed} onReset={handleResetJD} />
          
          <div className="flex justify-end">
            <button
              onClick={handleContinue}
              className="bg-[#0A0A0A] hover:bg-black text-white text-sm font-semibold rounded-full px-7 py-3 transition-all select-none active:scale-[0.98]"
            >
              Continue →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
