'use client';

import React, { useState } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Home', href: '#' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
];

export default function Navbar() {
  const [isHovered, setIsHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Floating Dynamic Island Navbar with Glassmorphism */}
      <div 
        className="fixed top-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out select-none pointer-events-auto"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div 
          className={`relative h-12 bg-white/35 backdrop-blur-xl border border-white/25 shadow-[0_10px_32px_rgba(0,0,255,0.06)] rounded-full flex items-center justify-between transition-all duration-500 ease-out overflow-hidden px-5 ${
            isHovered 
              ? 'w-[92vw] md:w-[760px] lg:w-[960px] max-w-content' 
              : 'w-[160px] md:w-[170px]'
          }`}
        >
          {/* Left Side: Navigation links (Only visible on hover, desktop) */}
          <div 
            className={`hidden md:flex items-center gap-6 lg:gap-8 transition-all duration-300 ${
              isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'
            }`}
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="font-display text-xs font-bold text-black/70 hover:text-black transition-colors duration-150 whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Center: Logo (Always centered) */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 transition-all duration-300 shrink-0">
            <a href="#" className="flex items-center gap-0.5">
              <span className="font-display font-black text-sm tracking-tight text-black">
                RECRUITER
              </span>
              <span className="font-display font-black text-sm tracking-tight gradient-text">
                -X
              </span>
            </a>
          </div>

          {/* Right Side: Action Buttons (Only visible on hover, desktop) */}
          <div 
            className={`hidden md:flex items-center gap-4 transition-all duration-300 ${
              isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
            }`}
          >
            <a href="/dashboard" className="text-xs font-bold text-black/70 hover:text-black transition-colors whitespace-nowrap">
              Log in
            </a>
            <a href="/project" className="btn-primary !h-8 !px-4 !text-xs font-bold whitespace-nowrap">
              Get Started
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Mobile Hamburger - visible on mobile */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMobileOpen(!mobileOpen);
            }}
            className="md:hidden ml-auto p-1 rounded-full hover:bg-black/5 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="w-4 h-4 text-black" />
            ) : (
              <Menu className="w-4 h-4 text-black" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div 
            className="absolute inset-0 bg-black/35 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-4 top-20 left-4 bg-white/95 backdrop-blur-lg border border-gray-150 shadow-modal rounded-3xl p-6 flex flex-col gap-6 animate-[modal-enter-soft_250ms_cubic-bezier(0.34,1.56,0.64,1)_both]">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="font-display text-base font-semibold text-black hover:text-[var(--color-blue)] transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="border-t border-gray-100 pt-5 mt-1 flex flex-col gap-3">
              <a href="/dashboard" className="btn-ghost text-sm justify-center text-black" onClick={() => setMobileOpen(false)}>
                Log in
              </a>
              <a href="/project" className="btn-primary text-sm w-full" onClick={() => setMobileOpen(false)}>
                Get Started
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
