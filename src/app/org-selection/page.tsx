'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../utils/api-client';
import { Building, Plus, Loader2, AlertCircle } from 'lucide-react';

interface OrgMember {
  org_id: string;
  organisations: {
    id: string;
    name: string;
  };
}

export default function OrgSelectionPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<OrgMember[]>([]);
  const [newOrgName, setNewOrgName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkUserAndFetchOrgs = async () => {
      setError(null);
      const user = { id: 'mock-user-id', email: 'developer@sample.local' };

      try {
        const { data, error: fetchError } = await api.db('org_members')
          .select('org_id, organisations(id, name)')
          .eq('user_id', user.id);

        if (fetchError) throw fetchError;
        setOrgs((data as any) || []);
      } catch (err: any) {
        console.warn('Organizations fetch failed, using fallback.');
        setOrgs([
          {
            org_id: 'mock-local-org',
            organisations: {
              id: 'mock-local-org',
              name: 'Local Dev Organization'
            }
          }
        ]);
      } finally {
        setIsFetching(false);
      }
    };

    checkUserAndFetchOrgs();
  }, [router]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const user = { id: 'mock-user-id' };

      // Create organisation
      const { data: orgData, error: orgError } = await api.db('organisations')
        .insert({ name: newOrgName })
        .single();

      if (orgError) throw orgError;

      // Create org membership
      const { error: memberError } = await api.db('org_members')
        .insert({
          org_id: orgData.id,
          user_id: user.id,
          role: 'owner'
        });

      if (memberError) throw memberError;

      document.cookie = `org_id=${orgData.id}; path=/; max-age=31536000; SameSite=Lax`;
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create organization.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectOrg = (orgId: string) => {
    document.cookie = `org_id=${orgId}; path=/; max-age=31536000; SameSite=Lax`;
    router.push('/dashboard');
  };

  const handleLogout = () => {
    router.push('/');
  };

  return (
    <div 
      className="min-h-screen flex flex-col justify-center items-center px-4 font-sans relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/login.jpeg')" }}
    >
      {/* Dark overlay to ensure contrast */}
      <div className="absolute inset-0 bg-[#070716]/45 backdrop-blur-[1px] pointer-events-none" />

      {/* Main Glassmorphic Card */}
      <div className="w-full max-w-[420px] rounded-[32px] bg-[#0d0c22]/45 backdrop-blur-xl text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/10 z-10 p-8 flex flex-col items-center">
        
        {/* Animated Target/Concentric Dotted Icon */}
        <div className="mb-6 flex justify-center">
          <svg className="w-12 h-12 text-white/90 animate-[spin_40s_linear_infinite]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 6" />
            <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
            <circle cx="50" cy="50" r="8" fill="currentColor" />
            <circle cx="50" cy="50" r="18" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
          </svg>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="font-sans font-medium text-3xl tracking-tight text-white mb-2.5">
            Select Workspace
          </h2>
          <p className="text-white/60 text-xs px-2 leading-relaxed">
            Select an active organization or initialize a new workspace to continue
          </p>
        </div>

        {error && (
          <div className="w-full mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="text-xs leading-relaxed">{error}</div>
          </div>
        )}

        {isFetching ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-white/70" />
            <span className="text-xs text-white/30 uppercase tracking-widest font-sans">Querying organizations...</span>
          </div>
        ) : (
          <div className="w-full space-y-8">
            {/* Existing Orgs list */}
            {orgs.length > 0 && (
              <div className="space-y-3">
                <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block">
                  Select Active Tenant
                </label>
                <div className="space-y-2.5">
                  {orgs.map((o) => (
                    <button
                      key={o.org_id}
                      onClick={() => handleSelectOrg(o.org_id)}
                      className="w-full flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-[#0d0c22]/30 hover:bg-white/5 transition-all group font-semibold text-xs active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <Building className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                        <span className="text-white/80 group-hover:text-white">{o.organisations?.name || 'Unnamed Org'}</span>
                      </div>
                      <span className="text-[10px] text-white/20 uppercase group-hover:text-white/60 transition-colors">Access &rarr;</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Create new Org Form */}
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <label className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block">
                Initialize New Organization
              </label>
              <div className="space-y-3">
                <input
                  type="text"
                  required
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Enter organization name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all text-xs"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-white hover:bg-white/90 disabled:bg-white/50 text-black rounded-full py-3.5 font-semibold transition-all text-xs flex items-center justify-center gap-2 select-none active:scale-[0.98] shadow-lg shadow-black/10 mt-6"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Initializing Workspace...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Create Workspace</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer Link / Logout */}
        <div className="mt-8 text-center text-xs text-white/40">
          <button 
            onClick={handleLogout}
            className="text-white hover:underline font-semibold transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
