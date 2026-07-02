'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#0A0A14] text-[#8888AA] py-16 border-t border-white/5 select-none">
      <div className="max-w-6xl mx-auto px-6 space-y-12">
        
        {/* Row 1: Columns */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          
          {/* Col 1: Wordmark & Tagline */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#0000FF]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="12" strokeDasharray="15 15" />
                <circle cx="50" cy="50" r="12" fill="currentColor" />
              </svg>
              <span className="font-display font-bold text-sm tracking-widest text-white uppercase">
                RECRUITER-X
              </span>
            </Link>
            <p className="font-body text-xs leading-relaxed max-w-[240px]">
              Next-generation candidate intelligence powered by offline trajectory analytics. Bypassing keywords, discovering practitioners.
            </p>
          </div>

          {/* Col 2: Product */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-[10px] text-white uppercase tracking-widest">
              Product
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/changelog" className="hover:text-white transition-colors">Changelog</Link></li>
              <li><Link href="/roadmap" className="hover:text-white transition-colors">Roadmap</Link></li>
            </ul>
          </div>

          {/* Col 3: Company */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-[10px] text-white uppercase tracking-widest">
              Company
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/press" className="hover:text-white transition-colors">Press Kit</Link></li>
            </ul>
          </div>

          {/* Col 4: Resources */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-[10px] text-white uppercase tracking-widest">
              Resources
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
              <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="/status" className="hover:text-white transition-colors">API Status</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
            </ul>
          </div>

        </div>

        {/* Row 2: Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] tracking-wider uppercase font-mono">
          <span>
            &copy; {new Date().getFullYear()} Recruiter-X. All rights reserved.
          </span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/gdpr" className="hover:text-white transition-colors">GDPR</Link>
            <Link href="/security" className="hover:text-white transition-colors">Security</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
