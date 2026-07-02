'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white border-b border-neutral-100 py-4 px-6 md:px-12 flex justify-between items-center select-none">
      {/* Left: Nav links */}
      <div className="flex items-center gap-6">
        <Link 
          href="/" 
          className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
            pathname === '/' 
              ? 'bg-blue-50 text-[#0000FF]' 
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          Home
        </Link>
        <Link 
          href="/dashboard" 
          className="text-xs font-semibold px-3 py-1.5 rounded-full text-neutral-500 hover:text-neutral-900 transition-all"
        >
          Dashboard
        </Link>
        <Link 
          href="/project/new" 
          className="text-xs font-semibold px-3 py-1.5 rounded-full text-neutral-500 hover:text-neutral-900 transition-all"
        >
          Project
        </Link>
      </div>

      {/* Right: Brand Logo */}
      <Link 
        href="/dashboard" 
        className="flex items-center gap-2 select-none active:scale-[0.98] transition-transform"
      >
        <svg className="w-7 h-7 text-[#0000FF]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="6" strokeDasharray="10 10" />
          <circle cx="50" cy="50" r="10" fill="currentColor" />
        </svg>
        <span className="font-semibold text-lg tracking-tight text-[#0A0A0A]">
          Recruiter-X
        </span>
      </Link>
    </nav>
  );
}
