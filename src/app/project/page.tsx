'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

export default function ProjectPageRedirect() {
  const router = useRouter();
  const supabase = createClient();
  const [statusMessage, setStatusMessage] = useState('Initializing project workspace...');

  useEffect(() => {
    const createProjectAndRedirect = async () => {
      try {
        // 1. Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.replace('/login');
          return;
        }

        // 2. Resolve active organization ID from cookies
        const cookiesArr = document.cookie.split(';');
        const orgCookie = cookiesArr.find(c => c.trim().startsWith('org_id='));
        let orgId = orgCookie ? orgCookie.split('=')[1].trim() : null;

        if (!orgId) {
          // Fallback: check if the user has any organization
          const { data: memberships } = await supabase
            .from('org_members')
            .select('org_id')
            .eq('user_id', user.id)
            .limit(1);

          if (memberships && memberships.length > 0) {
            orgId = memberships[0].org_id;
            document.cookie = `org_id=${orgId}; path=/; max-age=31536000; SameSite=Lax`;
          } else {
            router.replace('/org-selection');
            return;
          }
        }

        setStatusMessage('Provisioning new workspace...');

        // 3. Insert new draft project
        const { data: newProject, error: insertError } = await supabase
          .from('projects')
          .insert({
            org_id: orgId,
            title: 'Untitled Project',
            role: 'Untitled Role',
            status: 'draft',
            created_by: user.id
          })
          .select()
          .single();

        if (insertError || !newProject) {
          throw insertError || new Error('Failed to create project record');
        }

        setStatusMessage('Redirecting to workspace...');
        router.replace(`/project/${newProject.id}`);
      } catch (err: any) {
        console.error('Failed to auto-create project:', err);
        toast.error('Could not create a new project. Redirecting to dashboard.');
        router.replace('/dashboard');
      }
    };

    createProjectAndRedirect();
  }, [router, supabase]);

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center font-sans text-[#0A0A0A] p-6 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-gradient-blob rounded-full filter blur-[100px] pointer-events-none opacity-30 transform -translate-x-1/2 -translate-y-1/2" />

      <div className="relative flex flex-col items-center max-w-sm text-center space-y-6 z-10">
        {/* Spinner */}
        <div className="relative w-12 h-12 flex justify-center items-center">
          <svg className="w-10 h-10 text-[#0000FF] animate-spin" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="6" strokeDasharray="10 10" />
            <circle cx="50" cy="50" r="10" fill="currentColor" />
          </svg>
        </div>

        <div className="space-y-2">
          <h3 className="font-display font-bold text-lg tracking-tight">
            Setting up workspace
          </h3>
          <p className="text-xs text-text-secondary font-mono tracking-wider uppercase">
            {statusMessage}
          </p>
        </div>
      </div>
    </div>
  );
}
