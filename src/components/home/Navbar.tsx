'use client';

import React from 'react';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#0A0A14]/75 backdrop-blur-md border-b border-white/5 transition-all select-none">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Left: Brand Logo */}
        <Link 
          href="/" 
          className="flex items-center gap-2 select-none active:scale-[0.98] transition-transform"
        >
          <svg className="w-6 h-6 text-[#0000FF]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="12" strokeDasharray="15 15" />
            <circle cx="50" cy="50" r="12" fill="currentColor" />
          </svg>
          <span className="font-display font-bold text-sm tracking-widest text-white uppercase">
            RECRUITER-X
          </span>
        </Link>

        {/* Right: Sign In pill button */}
        <Link
          href="/dashboard"
          className="border border-white/20 hover:border-white/80 text-white text-xs font-semibold rounded-full px-5 py-2.5 transition-all select-none active:scale-[0.97]"
        >
          Dashboard
        </Link>
      </div>
    </nav>
  );
}
