'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { X, Key, AlertTriangle } from 'lucide-react';

interface CreateProjectModalProps {
  orgId: string;
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: any) => void;
}

interface ApiKeyOption {
  id: string;
  provider: string;
  model: string;
  label: string | null;
  is_default: boolean;
}

export default function CreateProjectModal({
  orgId,
  isOpen,
  onClose,
  onProjectCreated
}: CreateProjectModalProps) {
  const [title, setTitle] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [seniority, setSeniority] = useState('Senior');
  const [apiKeys, setApiKeys] = useState<ApiKeyOption[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!isOpen) return;

    const fetchApiKeys = async () => {
      try {
        const { data, error: keyError } = await supabase
          .from('api_keys')
          .select('id, provider, model, label, is_default')
          .eq('org_id', orgId)
          .eq('is_active', true);

        if (keyError) throw keyError;
        setApiKeys(data || []);
        if (data && data.length > 0) {
          setSelectedKeyId(data.find(k => k.is_default)?.id || data[0].id);
        }
      } catch (err: any) {
        console.warn('Failed to fetch API keys:', err.message);
      }
    };

    fetchApiKeys();
  }, [isOpen, orgId, supabase]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !role.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: insertError } = await supabase
        .from('projects')
        .insert({
          org_id: orgId,
          title: title.trim(),
          role: role.trim(),
          department: department.trim() || null,
          seniority: seniority || null,
          status: 'draft',
          created_by: user.id
        })
        .select()
        .single();

      if (insertError) throw insertError;

      onProjectCreated(data);
      onClose();
      // Reset form
      setTitle('');
      setRole('');
      setDepartment('');
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-sans animate-fade-in">
      <div className="w-full max-w-[480px] bg-white rounded-[24px] border border-neutral-100 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h3 className="font-semibold text-lg text-neutral-900">
            Create New Project
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors p-1.5 hover:bg-neutral-50 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-700 flex gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Project Title */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Project Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q2 Staff Backend ML Pipeline"
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2.5 px-4 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-[#0000FF] focus:bg-white transition-all text-xs"
            />
          </div>

          {/* Target Role */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Target Role/Title *
            </label>
            <input
              type="text"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Staff Machine Learning Engineer"
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2.5 px-4 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-[#0000FF] focus:bg-white transition-all text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Department */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Engineering"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2.5 px-4 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-[#0000FF] focus:bg-white transition-all text-xs"
              />
            </div>

            {/* Seniority */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Seniority Level
              </label>
              <select
                value={seniority}
                onChange={(e) => setSeniority(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2.5 px-3 text-neutral-800 focus:outline-none focus:border-[#0000FF] focus:bg-white transition-all text-xs"
              >
                <option value="Junior">Junior</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
                <option value="Staff/Principal">Staff/Principal</option>
                <option value="Lead/Manager">Lead/Manager</option>
              </select>
            </div>
          </div>

          {/* LLM API Key Selection */}
          <div className="space-y-1.5 pt-2">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              AI Processing Engine (BYOK)
            </label>
            {apiKeys.length > 0 ? (
              <div className="relative">
                <select
                  value={selectedKeyId}
                  onChange={(e) => setSelectedKeyId(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2.5 pl-9 pr-4 text-neutral-800 focus:outline-none focus:border-[#0000FF] focus:bg-white transition-all text-xs appearance-none"
                >
                  {apiKeys.map((key) => (
                    <option key={key.id} value={key.id}>
                      {key.label || `${key.provider.toUpperCase()} (${key.model})`}
                    </option>
                  ))}
                </select>
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-400 pointer-events-none">
                  <Key className="w-3.5 h-3.5" />
                </span>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 flex gap-2.5 text-xs leading-relaxed">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                <div>
                  No active LLM keys set up. You can create the project now, but candidate analysis requires configured provider keys.
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold rounded-full px-5 py-2.5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#0000FF] hover:bg-[#0000CC] disabled:bg-neutral-200 text-white text-xs font-semibold rounded-full px-6 py-2.5 transition-all shadow-md shadow-blue-500/10"
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
