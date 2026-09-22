'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AdminLayout } from '@/components/layout/admin-layout';
import { PromptForm } from '@/components/prompts/prompt-form';
import { PromptItem } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditPromptPage() {
  const params = useParams();
  const id = params?.id as string;

  const [prompt, setPrompt] = useState<PromptItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPrompt() {
      try {
        const res = await fetch(`/api/prompts/${id}`);
        const data = await res.json();
        if (data.prompt) {
          setPrompt(data.prompt);
        }
      } catch (err) {
        console.error('Failed to load prompt', err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadPrompt();
  }, [id]);

  return (
    <AdminLayout>
      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-12 w-1/3 rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Skeleton className="lg:col-span-2 h-96 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </div>
      ) : prompt ? (
        <PromptForm initialData={prompt} isEdit={true} />
      ) : (
        <div className="text-center py-12 text-slate-400">Prompt not found</div>
      )}
    </AdminLayout>
  );
}
