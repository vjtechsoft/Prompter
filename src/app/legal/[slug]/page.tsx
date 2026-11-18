import React from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { ShieldCheck, ArrowLeft, Printer, Clock } from 'lucide-react';
import { sanitizeHtml } from '@/lib/sanitize';

interface LegalPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

const policyMap: Record<
  string,
  { title: string; htmlKey: 'privacyPolicyHtml' | 'termsOfServiceHtml' | 'refundPolicyHtml' | 'dataDeletionPolicyHtml'; defaultTitle: string }
> = {
  'privacy-policy': { title: 'Privacy Policy', htmlKey: 'privacyPolicyHtml', defaultTitle: 'Prompter Privacy Policy' },
  privacy: { title: 'Privacy Policy', htmlKey: 'privacyPolicyHtml', defaultTitle: 'Prompter Privacy Policy' },
  'terms-of-service': { title: 'Terms of Service', htmlKey: 'termsOfServiceHtml', defaultTitle: 'Prompter Terms of Service' },
  terms: { title: 'Terms of Service', htmlKey: 'termsOfServiceHtml', defaultTitle: 'Prompter Terms of Service' },
  'refund-policy': { title: 'Refund Policy', htmlKey: 'refundPolicyHtml', defaultTitle: 'Prompter Refund Policy' },
  refund: { title: 'Refund Policy', htmlKey: 'refundPolicyHtml', defaultTitle: 'Prompter Refund Policy' },
  'data-deletion': { title: 'Data Deletion Policy', htmlKey: 'dataDeletionPolicyHtml', defaultTitle: 'Prompter User Data Deletion Instructions' },
  'data-deletion-policy': { title: 'Data Deletion Policy', htmlKey: 'dataDeletionPolicyHtml', defaultTitle: 'Prompter User Data Deletion Instructions' },
};

export async function generateMetadata({ params }: LegalPageProps): Promise<Metadata> {
  const { slug } = await params;
  const config = policyMap[slug.toLowerCase()];
  if (!config) {
    return { title: 'Page Not Found — Prompter Legal' };
  }
  return {
    title: `${config.title} — Prompter AI`,
    description: `Official ${config.title} for Prompter AI application and platform.`,
  };
}

export default async function LegalPolicyPage({ params }: LegalPageProps) {
  const { slug } = await params;
  const config = policyMap[slug.toLowerCase()];

  if (!config) {
    notFound();
  }

  const urls = await prisma.appUrls.findUnique({
    where: { id: 'default' },
  });

  const rawHtml = urls?.[config.htmlKey] || '';
  const updatedAt = urls?.updatedAt ? new Date(urls.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'November 2026';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 p-2 flex items-center justify-center shadow">
              <Image src="/logo.png" alt="Prompter" width={32} height={32} className="object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-tight">Prompter AI</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Legal Center
                </span>
              </div>
              <p className="text-xs text-slate-400">Codemorio Infotech Pvt. Ltd.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" /> Updated: {updatedAt}
            </span>
          </div>
        </div>

        {/* Policy Document Card */}
        <article className="rounded-3xl bg-slate-900/90 border border-slate-800 p-8 sm:p-12 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 pb-6 border-b border-slate-800/80">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Official Policy Document
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {config.title}
            </h1>
            <p className="text-xs text-slate-400 mt-2">
              Please read this document carefully to understand your rights, responsibilities, and how your data is handled.
            </p>
          </div>

          {/* Rendered HTML Content */}
          {rawHtml.trim() ? (
            <div
              className="prose prose-invert prose-indigo max-w-none text-slate-300 leading-relaxed text-sm sm:text-base space-y-4
                [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-slate-800
                [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-indigo-300 [&_h3]:mt-6 [&_h3]:mb-2
                [&_p]:text-slate-300 [&_p]:leading-relaxed [&_p]:mb-4
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_ul]:mb-4
                [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1.5 [&_ol]:mb-4
                [&_li]:text-slate-300
                [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-500 [&_blockquote]:bg-slate-950/60 [&_blockquote]:p-4 [&_blockquote]:rounded-r-xl [&_blockquote]:italic
                [&_a]:text-indigo-400 [&_a]:underline hover:[&_a]:text-indigo-300
                [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-800 [&_th]:p-2 [&_th]:bg-slate-800 [&_td]:border [&_td]:border-slate-800 [&_td]:p-2
              "
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(rawHtml) }}
            />
          ) : (
            <div className="py-12 text-center text-slate-400">
              <p className="text-base font-semibold text-slate-300 mb-1">Policy Content Being Updated</p>
              <p className="text-xs">
                The administrator has not yet published custom HTML content for this policy document.
              </p>
            </div>
          )}
        </article>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 pt-6 border-t border-slate-800">
          <p>© 2026 Prompter AI. All Rights Reserved. Created by Codemorio Infotech Pvt. Ltd.</p>
          <div className="flex items-center gap-4 mt-3 sm:mt-0">
            <Link href="/legal/privacy-policy" className="hover:text-indigo-400 transition-colors">Privacy</Link>
            <span>•</span>
            <Link href="/legal/terms-of-service" className="hover:text-indigo-400 transition-colors">Terms</Link>
            <span>•</span>
            <Link href="/legal/refund-policy" className="hover:text-indigo-400 transition-colors">Refund</Link>
            <span>•</span>
            <Link href="/legal/data-deletion" className="hover:text-indigo-400 transition-colors">Data Deletion</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
