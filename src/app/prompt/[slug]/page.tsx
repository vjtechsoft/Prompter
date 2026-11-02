import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import DeepLinkClient from './deep-link-client';

export const dynamic = 'force-dynamic';

interface Props {
  params: { slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

async function getPromptData(slug: string) {
  const prompt = await prisma.prompt.findFirst({
    where: {
      isDeleted: false,
      status: true,
      category: { status: true },
      OR: [{ slug: slug }, { id: slug }],
    },
    include: {
      category: {
        select: { id: true, title: true, slug: true, image: true },
      },
      subcategory: {
        select: { id: true, title: true, slug: true },
      },
    },
  });

  if (!prompt) return null;

  const [settings, urls] = await Promise.all([
    prisma.appSettings.findUnique({ where: { id: 'default' } }),
    prisma.appUrls.findUnique({ where: { id: 'default' } }),
  ]);

  return { prompt, settings, urls };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getPromptData(params.slug);
  if (!data) {
    return {
      title: 'Prompt Not Found',
      description: 'The requested AI prompt could not be found or is unavailable.',
    };
  }

  const { prompt, settings, urls } = data;
  const appName = settings?.appName || 'Prompter';
  const packageName = settings?.packageName || 'com.prompter.studio';
  const title = `${prompt.title} - ${appName}`;
  const description =
    prompt.prompt.length > 160 ? prompt.prompt.substring(0, 157) + '...' : prompt.prompt;
  const image = prompt.featuredImage || '/logo.png';
  const playStoreUrl =
    urls?.playStore || `https://play.google.com/store/apps/details?id=${packageName}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: prompt.title,
        },
      ],
      type: 'article',
      siteName: appName,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    other: {
      'al:android:url': `prompter://prompt/${prompt.slug}`,
      'al:android:package': packageName,
      'al:android:app_name': appName,
      'play-store-url': playStoreUrl,
    },
  };
}

export default async function PromptDeepLinkPage({ params, searchParams }: Props) {
  const data = await getPromptData(params.slug);
  if (!data) {
    notFound();
  }

  const { prompt, settings, urls } = data;
  const appName = settings?.appName || 'Prompter';
  const packageName = settings?.packageName || 'com.prompter.studio';
  const playStoreUrl =
    urls?.playStore || `https://play.google.com/store/apps/details?id=${packageName}`;
  const appLogo = settings?.appLogo || '/logo.png';

  let parsedTags: string[] = [];
  try {
    parsedTags = typeof prompt.tags === 'string' ? JSON.parse(prompt.tags) : prompt.tags;
  } catch {
    parsedTags = [];
  }

  return (
    <DeepLinkClient
      prompt={{
        id: prompt.id,
        title: prompt.title,
        slug: prompt.slug,
        prompt: prompt.prompt,
        featuredImage: prompt.featuredImage,
        category: prompt.category,
        subcategory: prompt.subcategory,
        tags: parsedTags,
        likes: prompt.likes,
        views: prompt.views,
        shares: prompt.shares,
        copies: prompt.copies,
        isPremium: prompt.isPremium,
      }}
      appInfo={{
        appName,
        packageName,
        playStoreUrl,
        appLogo,
      }}
      initialNoRedirect={searchParams?.noredirect === '1' || searchParams?.preview === '1'}
    />
  );
}
