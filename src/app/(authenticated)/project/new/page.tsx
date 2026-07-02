'use client';

import React from 'react';
import StepIndicator from '@/components/project/StepIndicator';
import Phase0Name from '@/components/project/Phase0Name';

export default function NewProjectPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans pb-16">
      <div className="max-w-2xl mx-auto px-4 pt-12 space-y-8 text-center">
        {/* Step Indicator */}
        <StepIndicator currentPhase={0} />

        {/* Phase Card */}
        <Phase0Name />
      </div>
    </div>
  );
}
