'use client';

import React, { useState } from 'react';
import { ChevronDown, ArrowRight } from 'lucide-react';

const QUESTIONS = [
  {
    question: 'How is Recruiter-X different from an ATS?',
    answer: 'An ATS manages your hiring pipeline — it tracks where candidates are in the process. Recruiter-X is the intelligence layer that sits between applications and your decisions. It analyzes depth, detects inflation, benchmarks against ideal, and generates interview questions. We integrate with your ATS, not replace it.',
  },
  {
    question: 'Does Recruiter-X screen resumes?',
    answer: 'No. Recruiter-X does not "screen out" candidates based on arbitrary keyword filters. It conducts a parallel, multi-layer evaluation of every single applicant in your pile. It outputs a ranked list with human-readable reasoning, giving every candidate a fair and comprehensive assessment.',
  },
  {
    question: 'Is Recruiter-X GDPR compliant?',
    answer: 'Yes. Under GDPR Article 22, individuals have the right not to be subject to solely automated decisions. Recruiter-X outputs are explicitly recommendations — the system never makes hiring decisions. Every score includes human-readable reasoning. Data Subject Access Requests (DSAR) are supported.',
  },
  {
    question: 'How does OTRA actually work? What does it cost?',
    answer: 'OTRA stands for Offline Trajectory Relevance Analysis. It is fully vectorized and runs locally on your CPU in under 5 minutes without making any external API calls, meaning zero data leakage and zero API charges. It is completely free to run on your local infrastructure.',
  },
  {
    question: 'How long does analysis take?',
    answer: 'JD Audit runs under 15 seconds. Ghost Candidate generation takes under 20 seconds. Full candidate analysis and ranking for a pool of 100 candidates completes in under 30 seconds using the precomputed semantic index.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section className="bg-[#0A0A14] py-24 md:py-32 relative border-b border-white/5">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* Header */}
        <div className="text-center mb-16 space-y-3">
          <span className="font-data text-xs font-bold uppercase tracking-widest text-[#0000FF] block">
            FAQ
          </span>
          <h2 className="font-display font-black text-3xl md:text-4xl text-white tracking-tight uppercase">
            Frequently Asked Questions
          </h2>
        </div>

        {/* Accordion list */}
        <div className="space-y-4 max-w-3xl mx-auto">
          {QUESTIONS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div 
                key={i}
                className={`border rounded-xl overflow-hidden transition-all duration-300 ${
                  isOpen ? 'bg-[#111128] border-white/20' : 'bg-[#111128]/45 border-white/5 hover:border-white/10'
                }`}
              >
                <button
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left group"
                >
                  <span className="font-display font-bold text-sm text-white uppercase tracking-wider">
                    {item.question}
                  </span>
                  <span className={`shrink-0 w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-transform duration-300 ${
                    isOpen ? 'rotate-180 text-[#0000FF] border-[#0000FF]/30' : 'text-white/40 group-hover:text-white'
                  }`}>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </span>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="font-body text-xs text-[#8888AA] leading-relaxed px-6 pb-6 pt-2 border-t border-white/5">
                    {item.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contact support link */}
        <div className="text-center pt-10">
          <a 
            href="mailto:support@recruiter-x.ai"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0000FF] hover:underline"
          >
            <span>Contact Support</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </section>
  );
}
