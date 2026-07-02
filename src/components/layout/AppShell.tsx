'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/utils/api-client';
import { Building, LogOut, Plus } from 'lucide-react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [activeOrg, setActiveOrg] = useState<{ id: string; name: string }>({
    id: 'mock-local-org',
    name: 'Local Dev Organization',
  });


  const fetchOrg = useCallback(async () => {
    try {
      // Resolve active organization ID from cookie
      const cookiesArr = document.cookie.split(';');
      const orgCookie = cookiesArr.find(c => c.trim().startsWith('org_id='));
      let resolvedOrgId = orgCookie ? orgCookie.split('=')[1].trim() : null;

      if (!resolvedOrgId) {
        resolvedOrgId = 'mock-local-org';
      }

      const { data: membership } = await api.db('org_members')
        .select('org_id, organizations(name)')
        .eq('user_id', 'mock-local-user')
        .limit(1)
        .single();

      if (membership && membership.organizations) {
        const orgName = (membership.organizations as any).name;
        setActiveOrg({ id: membership.org_id, name: orgName });
        return;
      }

      setActiveOrg({ id: resolvedOrgId, name: 'Local Dev Organization' });
    } catch (e) {
      console.warn('Backend org fetch failed, using fallback.');
    }
  }, []);

  useEffect(() => {
    fetchOrg();
  }, [fetchOrg]);

  const handleLogout = () => {
    router.push('/');
  };



  // Determine if path is wizard or dashboard
  const isDashboard = pathname === '/' || pathname === '/dashboard';
  const isProject = pathname.startsWith('/project');

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Top Navbar */}
      <nav className="w-full bg-white border-b border-neutral-100 py-4 px-6 md:px-12 flex justify-between items-center z-30 relative select-none">
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
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
              isDashboard 
                ? 'bg-blue-50 text-[#0000FF]' 
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Dashboard
          </Link>
          <Link 
            href="/project/new" 
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
              pathname === '/project/new' || pathname.startsWith('/project/')
                ? 'bg-blue-50 text-[#0000FF]' 
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Project
          </Link>
        </div>

        {/* Right: Brand Logo & Org Indicator / Sign Out */}
        <div className="flex items-center gap-4">
          {/* Org Indicator */}
          <div className="items-center gap-1.5 bg-neutral-50 border border-neutral-100 rounded-full px-3 py-1 text-xs text-neutral-600 font-medium hidden sm:flex">
            <Building className="w-3.5 h-3.5 text-neutral-400" />
            <span>{activeOrg.name}</span>
          </div>

          <div className="hidden sm:block h-4 w-px bg-neutral-200" />

          {/* Brand Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 select-none active:scale-[0.98] transition-transform">
            <svg className="w-7 h-7 text-[#0000FF]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="6" strokeDasharray="10 10" />
              <circle cx="50" cy="50" r="10" fill="currentColor" />
            </svg>
            <span className="font-semibold text-lg tracking-tight text-[#0A0A0A]">
              Recruiter-X
            </span>
          </Link>

          <div className="h-4 w-px bg-neutral-200" />

          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            className="text-neutral-400 hover:text-neutral-950 transition-colors p-2"
            title="Sign Out"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </nav>

      {/* Main Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-12 py-8">
        {children}
      </main>


    </div>
  );
}
