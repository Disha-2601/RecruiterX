'use client';

import React from 'react';
import { Upload, Loader2 } from 'lucide-react';

interface JDUploadTabProps {
  isAnalyzing: boolean;
  file: File | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function JDUploadTab({
  isAnalyzing,
  file,
  fileInputRef,
  handleFileChange
}: JDUploadTabProps) {
  if (isAnalyzing && file) {
    return (
      <div className="bg-[#0000FF] border-2 border-dashed border-white/50 rounded-xl p-12 text-center text-white flex flex-col items-center justify-center space-y-4 font-sans select-none animate-pulse">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
        <div>
          <p className="font-display font-semibold text-base">{file.name}</p>
          <p className="text-white/70 text-xs mt-1">Analyzing JD...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      className="bg-[#0000FF] hover:bg-[#1A1AFF] border-2 border-dashed border-white/50 rounded-xl p-12 text-center text-white cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 group select-none font-sans"
    >
      <Upload className="w-8 h-8 text-white transition-transform group-hover:-translate-y-1" />
      <div>
        <p className="font-display font-semibold text-lg">Drop your JD here</p>
        <p className="text-white/75 text-sm mt-0.5">or click to browse</p>
      </div>
      <span className="text-[10px] text-white/50 tracking-wider">.md  .docx  .pdf  .txt</span>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".md,.docx,.pdf,.txt"
        className="hidden"
      />
    </div>
  );
}
