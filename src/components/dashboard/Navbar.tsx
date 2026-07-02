'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Building, LogOut, Plus } from 'lucide-react';

interface NavbarProps {
  activeOrgName: string;
  onOpenCreateModal: () => void;
}

export default function Navbar({ activeOrgName, onOpenCreateModal }: NavbarProps) {
  const router = useRouter();

  const handleLogout = () => {
    router.push('/');
  };

  return (
    <nav className="w-full bg-white border-b border-neutral-100 py-4 px-6 md:px-12 flex justify-between items-center z-30 relative font-sans">
      {/* Left: Brand Logo & Org */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 select-none">
          <svg className="w-7 h-7 text-[#0000FF]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="6" strokeDasharray="10 10" />
            <circle cx="50" cy="50" r="10" fill="currentColor" />
          </svg>
          <span className="font-semibold text-lg tracking-tight text-[#0A0A0A]">
            Recruiter-X
          </span>
        </div>
        
        {/* Org Indicator */}
        <div className="h-4 w-px bg-neutral-200 hidden sm:block" />
        <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-100 rounded-full px-3 py-1 text-xs text-neutral-600 font-medium">
          <Building className="w-3.5 h-3.5 text-neutral-400" />
          <span>{activeOrgName}</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* + New Project Button */}
        <button
          onClick={onOpenCreateModal}
          className="bg-[#0000FF] hover:bg-[#0000CC] text-white text-xs font-semibold rounded-full px-5 py-2.5 transition-all flex items-center gap-1.5 active:scale-[0.98] shadow-md shadow-blue-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          className="text-neutral-400 hover:text-neutral-900 transition-colors p-2"
          title="Sign Out"
        >
          <LogOut className="w-4.5 h-4.5" />
        </button>
      </div>
    </nav>
  );
}
