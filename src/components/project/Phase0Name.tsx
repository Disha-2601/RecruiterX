'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api-client';
import { useProjectStore } from '@/stores/useProjectStore';

export default function Phase0Name() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setProjectId, setProjectName, setPhase } = useProjectStore();

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 3) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Resolve active organization ID from cookies
      const cookiesArr = document.cookie.split(';');
      const orgCookie = cookiesArr.find(c => c.trim().startsWith('org_id='));
      const orgId = orgCookie ? orgCookie.split('=')[1].trim() : 'mock-local-org';

      const user = { id: 'mock-user-id' };

      const { data, error: insertError } = await api.db('projects')
        .insert({
          org_id: orgId,
          title: name.trim(),
          role: name.trim(),
          status: 'draft',
          created_by: user.id
        })
        .single();

      if (insertError || !data) {
        throw insertError || new Error('Failed to create project');
      }

      setProjectId(data.id);
      setProjectName(data.title);
      setPhase(1);

      router.push(`/project/${data.id}?phase=1`);
    } catch (err: any) {
      setError(err.message || 'Failed to create project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_4px_16px_rgba(0,0,34,0.06)] p-10 max-w-xl mx-auto font-sans text-left">
      <div className="space-y-6">
        <div>
          <h2 className="font-display font-semibold text-2xl text-[#0A0A0A] leading-tight">
            What role are you hiring for?
          </h2>
          <p className="font-body text-sm text-[#4A4A4A] mt-2">
            Give this project a name so you can find it later.
          </p>
        </div>

        <form onSubmit={handleContinue} className="space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Senior ML Engineer — Bangalore"
              className="w-full bg-white border border-[#E5E7EB] rounded-lg py-3.5 px-4 text-[#0A0A0A] placeholder-[#8C8C8C] focus:outline-none focus:border-[#0000FF] focus:ring-1 focus:ring-[#0000FF]/20 transition-all text-sm"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={name.trim().length < 3 || isSubmitting}
              className="bg-[#0A0A0A] disabled:bg-[#F5F5F5] text-white disabled:text-[#8C8C8C] text-sm font-medium rounded-full px-7 py-3 transition-all select-none active:scale-[0.98] disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Continue →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
