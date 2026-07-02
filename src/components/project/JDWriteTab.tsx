'use client';

import React from 'react';

interface JDWriteTabProps {
  jdText: string;
  setJdText: (text: string) => void;
  isAnalyzing: boolean;
  handleSubmit: (e: React.FormEvent) => void;
}

export default function JDWriteTab({
  jdText,
  setJdText,
  isAnalyzing,
  handleSubmit
}: JDWriteTabProps) {
  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-sans text-right">
      <textarea
        value={jdText}
        onChange={(e) => setJdText(e.target.value)}
        placeholder="Paste or write the full job description here..."
        disabled={isAnalyzing}
        className="w-full bg-white border-2 border-[#0000FF] rounded-xl p-4 text-[#0000FF] placeholder-[#0000FF]/30 focus:outline-none transition-all text-sm min-h-[240px] resize-y"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={jdText.trim().length < 50 || isAnalyzing}
          className="border-1.5 border-[#0000FF] hover:bg-[#EEF2FF] text-[#0000FF] disabled:border-[#E5E7EB] disabled:text-[#8C8C8C] disabled:bg-transparent text-xs font-semibold rounded-full px-6 py-2.5 transition-all select-none"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze JD →'}
        </button>
      </div>
    </form>
  );
}
