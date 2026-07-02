'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentPhase: 0 | 1 | 2;
}

export default function StepIndicator({ currentPhase }: StepIndicatorProps) {
  const steps = [
    { phase: 0, label: 'Project Name' },
    { phase: 1, label: 'Job Description' },
    { phase: 2, label: 'Candidates & Run' },
  ];

  return (
    <div className="flex items-center justify-center space-x-2 md:space-x-4 max-w-2xl mx-auto py-6 select-none font-sans">
      {steps.map((step, idx) => {
        const isActive = currentPhase === step.phase;
        const isCompleted = currentPhase > step.phase;
        const isPending = currentPhase < step.phase;

        return (
          <React.Fragment key={step.phase}>
            {/* Step Item */}
            <div className="flex items-center gap-2">
              {/* Circle */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-[#0000FF] text-white shadow-md shadow-blue-500/20'
                    : isCompleted
                    ? 'bg-[#16A34A] text-white'
                    : 'bg-[#F5F5F5] text-[#8C8C8C] border border-[#E5E7EB]'
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </div>

              {/* Label */}
              <span
                className={`text-xs md:text-sm font-medium transition-colors duration-300 ${
                  isActive
                    ? 'text-[#0A0A0A] font-bold'
                    : 'text-[#8C8C8C]'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {idx < steps.length - 1 && (
              <div
                className={`h-0.5 w-8 md:w-16 transition-colors duration-500 ${
                  currentPhase > step.phase ? 'bg-[#0000FF]' : 'bg-[#E5E7EB]'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
