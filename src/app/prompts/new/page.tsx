'use client';

import React from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { PromptForm } from '@/components/prompts/prompt-form';

export default function NewPromptPage() {
  return (
    <AdminLayout>
      <PromptForm isEdit={false} />
    </AdminLayout>
  );
}
