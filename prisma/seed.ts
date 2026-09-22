import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Clear existing data in reverse relation order
  await prisma.activityLog.deleteMany({});
  await prisma.loginLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.prompt.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.advertisement.deleteMany({});
  await prisma.notificationSetting.deleteMany({});
  await prisma.appSettings.deleteMany({});
  await prisma.appUrls.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('Admin@123456', 10);

  // 2. Create strictly ONE Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Alex Vance',
      email: 'admin@promptmanager.com',
      password: passwordHash,
      role: 'SUPER_ADMIN',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      status: 'ACTIVE',
      lastLoginAt: new Date(),
      lastLoginIp: '192.168.1.100',
    },
  });

  // 3. Create 2 Sample Admins (Maximum 4 allowed)
  const admin1 = await prisma.user.create({
    data: {
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@promptmanager.com',
      password: passwordHash,
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      status: 'ACTIVE',
      lastLoginAt: new Date(Date.now() - 3600000 * 5),
      lastLoginIp: '192.168.1.105',
    },
  });

  const admin2 = await prisma.user.create({
    data: {
      name: 'Marcus Reid',
      email: 'marcus.reid@promptmanager.com',
      password: passwordHash,
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      status: 'ACTIVE',
      lastLoginAt: new Date(Date.now() - 3600000 * 24),
      lastLoginIp: '192.168.1.112',
    },
  });

  console.log('✅ Users created (1 Super Admin, 2 Admins)');

  // 4. Create Categories
  const categoriesData = [
    {
      title: 'Coding & Architecture',
      slug: 'coding-and-architecture',
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
      status: true,
      position: 1,
      createdById: superAdmin.id,
    },
    {
      title: 'Midjourney & AI Art',
      slug: 'midjourney-and-ai-art',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      status: true,
      position: 2,
      createdById: superAdmin.id,
    },
    {
      title: 'Copywriting & Marketing',
      slug: 'copywriting-and-marketing',
      image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&auto=format&fit=crop&q=80',
      status: true,
      position: 3,
      createdById: admin1.id,
    },
    {
      title: 'Productivity & Workflows',
      slug: 'productivity-and-workflows',
      image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=600&auto=format&fit=crop&q=80',
      status: true,
      position: 4,
      createdById: admin1.id,
    },
    {
      title: 'Academic & Research',
      slug: 'academic-and-research',
      image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80',
      status: true,
      position: 5,
      createdById: admin2.id,
    },
    {
      title: 'Creative Fiction',
      slug: 'creative-fiction',
      image: 'https://images.unsplash.com/photo-1474932430478-367dbb6832c1?w=600&auto=format&fit=crop&q=80',
      status: false,
      position: 6,
      createdById: admin2.id,
    },
  ];

  const categories = [];
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat });
    categories.push(created);
  }

  console.log(`✅ ${categories.length} Categories created`);

  // 5. Create Prompts
  const promptsData = [
    {
      title: 'Full-Stack Next.js 14 Clean Architecture Blueprint',
      slug: 'full-stack-nextjs-14-clean-architecture-blueprint',
      prompt: `Act as a Principal Software Architect. Design a modular Next.js 14 App Router enterprise application for [DOMAIN_NAME].
Include:
1. Directory structure separating Domain, Application, Infrastructure, and Presentation layers.
2. Type-safe Prisma schema with repository pattern and caching.
3. Server Actions with Zod schema validation and granular error boundary strategy.
4. Edge middleware with JWT role-based access control.
5. Provide a production checklist with security headers (CSP, HSTS) and Dockerfile.`,
      featuredImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
      categoryId: categories[0].id,
      tags: JSON.stringify(['nextjs', 'typescript', 'architecture', 'react', 'prisma']),
      likes: 1240,
      views: 18450,
      shares: 380,
      isPremium: true,
      status: true,
      createdById: superAdmin.id,
    },
    {
      title: 'Ultra-Realistic Cinematic Portrait Photography Prompter',
      slug: 'ultra-realistic-cinematic-portrait-photography-prompter',
      prompt: `A close-up 85mm portrait photo of [SUBJECT], natural skin texture with subtle imperfections, rim lighting, golden hour illumination, shot on Hasselblad H6D-100c, 100mm f/2.2 lens, volumetric haze, bokeh background, award-winning National Geographic photo, hyper-detailed, photorealistic, 8k resolution --ar 16:9 --style raw --v 6.0`,
      featuredImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
      categoryId: categories[1].id,
      tags: JSON.stringify(['midjourney', 'photography', 'portrait', 'cinematic', 'art']),
      likes: 980,
      views: 14200,
      shares: 410,
      isPremium: false,
      status: true,
      createdById: admin1.id,
    },
    {
      title: 'High-Converting B2B SaaS Landing Page Copywriter',
      slug: 'high-converting-b2b-saas-landing-page-copywriter',
      prompt: `Act as a world-class Direct Response Copywriter trained in Ogilvy and Schwartz frameworks.
Write complete above-the-fold and landing page copy for [PRODUCT_NAME], a SaaS tool solving [PRIMARY_PAIN_POINT] for [TARGET_AUDIENCE].
Structure:
- Hook / Hero Headline (under 12 words, outcome-driven)
- Subheadline expanding on how it works without friction
- Primary & Secondary CTA micro-copy
- 3 Value Pillars with "Problem -> Solution -> Tangible Metric"
- Social Proof testimonial framing guidelines
- Interactive FAQ addressing the top 4 objections.`,
      featuredImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
      categoryId: categories[2].id,
      tags: JSON.stringify(['copywriting', 'marketing', 'saas', 'conversion', 'sales']),
      likes: 750,
      views: 9300,
      shares: 210,
      isPremium: true,
      status: true,
      createdById: admin2.id,
    },
    {
      title: 'Obsidian & Notion Second Brain Knowledge Architect',
      slug: 'obsidian-and-notion-second-brain-knowledge-architect',
      prompt: `You are an expert in Tiago Forte's Building a Second Brain (P.A.R.A. Method) and Niklas Luhmann's Zettelkasten.
Design a cohesive personal knowledge management workflow for a [PROFESSION] managing [ACTIVE_PROJECT_COUNT] projects.
Specify:
1. Folder and Tag taxonomy (Projects, Areas, Resources, Archives).
2. Daily note template with habit tracker, top 3 priorities, and fleeting notes capture.
3. Weekly review ritual checklist to process inbox zero across bookmarks, voice memos, and literature notes.
4. Syntopical synthesis prompt to turn raw notes into publishable evergreen essays.`,
      featuredImage: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&auto=format&fit=crop&q=80',
      categoryId: categories[3].id,
      tags: JSON.stringify(['productivity', 'notion', 'obsidian', 'knowledge', 'workflow']),
      likes: 420,
      views: 6100,
      shares: 115,
      isPremium: false,
      status: true,
      createdById: admin1.id,
    },
    {
      title: 'Systematic Literature Review & Meta-Analysis Synthesizer',
      slug: 'systematic-literature-review-and-meta-analysis-synthesizer',
      prompt: `Act as a senior academic researcher and methodologist. Given the following research question: [RESEARCH_QUESTION] in the field of [FIELD_NAME]:
1. Formulate PRISMA guidelines compliant search strings for PubMed, Scopus, and IEEE Xplore using Boolean logic.
2. Define explicit inclusion and exclusion criteria (PICO framework).
3. Outline a risk of bias assessment matrix (e.g. Cochrane RoB 2 or ROBINS-I).
4. Provide a structured table format to extract: Sample Size, Methodology, Primary Effect Size, Confidence Intervals, and Limitations.`,
      featuredImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80',
      categoryId: categories[4].id,
      tags: JSON.stringify(['academic', 'research', 'paper', 'literature-review', 'science']),
      likes: 310,
      views: 4500,
      shares: 95,
      isPremium: true,
      status: true,
      createdById: superAdmin.id,
    },
    {
      title: 'Isometric 3D Game Asset Generator (Unreal Engine 5)',
      slug: 'isometric-3d-game-asset-generator-unreal-engine-5',
      prompt: `Isometric 3D stylized game asset of [OBJECT_OR_BUILDING], clay render style, vibrant pastel color palette, soft global illumination, octane render, clean white background, low-poly minimalism with high-poly smooth bevels, trending on ArtStation --v 6.0 --q 2 --s 250`,
      featuredImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      categoryId: categories[1].id,
      tags: JSON.stringify(['game-dev', '3d', 'midjourney', 'unreal-engine', 'isometric']),
      likes: 890,
      views: 11200,
      shares: 340,
      isPremium: false,
      status: true,
      createdById: admin1.id,
    },
    {
      title: 'Database Schema Optimization & Query Profiling Master',
      slug: 'database-schema-optimization-and-query-profiling-master',
      prompt: `Act as a Principal PostgreSQL DBA. Analyze the provided slow query and schema: [PASTE_QUERY_AND_SCHEMA]
Provide:
1. EXPLAIN ANALYZE execution plan breakdown with sequential scan bottlenecks identified.
2. Composite index recommendations (with B-Tree vs GIN rationale).
3. Query rewrite using CTEs or window functions for optimal execution.
4. Connection pooling and vacuuming configuration recommendations.`,
      featuredImage: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=80',
      categoryId: categories[0].id,
      tags: JSON.stringify(['sql', 'database', 'postgres', 'optimization', 'performance']),
      likes: 640,
      views: 8700,
      shares: 190,
      isPremium: true,
      status: true,
      createdById: admin2.id,
    },
    {
      title: 'Sci-Fi Worldbuilding & Faction Culture Builder',
      slug: 'sci-fi-worldbuilding-and-faction-culture-builder',
      prompt: `You are an acclaimed science fiction worldbuilder. Create a rich civilization profile for a post-planetary species inhabiting [ENVIRONMENT_TYPE].
Include:
- Societal hierarchy and governing philosophy
- Unique linguistic idioms and cultural taboos
- Keystone technology and its ecological cost
- Architectural aesthetics and religious mythology
- A brewing tension with a rival neighbor faction.`,
      featuredImage: 'https://images.unsplash.com/photo-1474932430478-367dbb6832c1?w=800&auto=format&fit=crop&q=80',
      categoryId: categories[5].id,
      tags: JSON.stringify(['fiction', 'worldbuilding', 'storytelling', 'scifi', 'writing']),
      likes: 210,
      views: 3200,
      shares: 45,
      isPremium: false,
      status: false,
      createdById: admin1.id,
    },
  ];

  for (const p of promptsData) {
    await prisma.prompt.create({ data: p });
  }

  console.log(`✅ ${promptsData.length} Prompts created`);

  // 6. Advertisements (Default AdMob active, Meta and Unity disabled)
  await prisma.advertisement.create({
    data: {
      id: 'default',
      activeProvider: 'ADMOB',
      admobEnabled: true,
      admobAppId: 'ca-app-pub-3940256099942544~3347511713',
      admobBannerId: 'ca-app-pub-3940256099942544/6300978111',
      admobInterstitialId: 'ca-app-pub-3940256099942544/1033173712',
      admobRewardedId: 'ca-app-pub-3940256099942544/5224354917',
      admobNativeId: 'ca-app-pub-3940256099942544/2247696110',
      admobAppOpenId: 'ca-app-pub-3940256099942544/3419835294',
      metaEnabled: false,
      metaBannerId: 'IMG_16_9_APP_INSTALL#YOUR_PLACEMENT_ID',
      metaInterstitialId: 'YOUR_INTERSTITIAL_PLACEMENT_ID',
      metaRewardedId: 'YOUR_REWARDED_PLACEMENT_ID',
      metaNativeId: 'YOUR_NATIVE_PLACEMENT_ID',
      unityEnabled: false,
      unityGameId: '1234567',
      unityBannerPlacement: 'Banner_Android',
      unityInterstitialPlacement: 'Interstitial_Android',
      unityRewardedPlacement: 'Rewarded_Android',
    },
  });

  // 7. Notification Setting
  await prisma.notificationSetting.create({
    data: {
      id: 'default',
      oneSignalAppId: 'b2f7f966-d8cc-11e4-bed1-df8f05be55ba',
      oneSignalRestKey: 'NGEwNmQxZTUtNDU3Yi00NDYxLWE1NmUtOGYwNmQxZTUtNDU3',
      isEnabled: true,
    },
  });

  // 8. Notifications History
  await prisma.notification.create({
    data: {
      title: '🚀 50+ New Midjourney Prompts Added!',
      message: 'Explore our latest collection of photorealistic portrait and cinematic lighting prompts.',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      deepLink: 'prompter://category/midjourney-and-ai-art',
      sendToAll: true,
      sentAt: new Date(),
      status: 'SENT',
      createdById: superAdmin.id,
    },
  });

  // 9. App Settings
  await prisma.appSettings.create({
    data: {
      id: 'default',
      appName: 'Prompter Studio',
      developerName: 'Prompter Devs',
      packageName: 'com.prompter.studio',
      versionName: '2.4.0',
      versionCode: '240',
      supportEmail: 'support@prompter.io',
      website: 'https://prompter.io',
      contactNumber: '+1 (800) 555-0199',
      copyright: '© 2026 Prompter Studio. All rights reserved.',
      defaultLanguage: 'en',
      theme: 'system',
      timezone: 'UTC',
      currency: 'USD ($)',
      maintenanceMode: false,
      appLogo: '/logo.png',
      splashLogo: '/logo.png',
      appIcon: '/icon.png',
      favicon: '/favicon.ico',
    },
  });

  // 10. App URLs
  await prisma.appUrls.create({
    data: {
      id: 'default',
      privacyPolicy: 'https://prompter.io/privacy-policy',
      termsOfService: 'https://prompter.io/terms-of-service',
      refundPolicy: 'https://prompter.io/refund-policy',
      dataDeletionPolicy: 'https://prompter.io/data-deletion',
      contactUs: 'https://prompter.io/contact',
      aboutUs: 'https://prompter.io/about',
      website: 'https://prompter.io',
      playStore: 'https://play.google.com/store/apps/details?id=com.prompter.studio',
      facebook: 'https://facebook.com/prompter',
      instagram: 'https://instagram.com/prompter',
      youtube: 'https://youtube.com/@prompter',
      twitter: 'https://x.com/prompter',
      telegram: 'https://t.me/prompter',
    },
  });

  // 11. Initial Activity & Login Logs
  await prisma.activityLog.createMany({
    data: [
      {
        userId: superAdmin.id,
        action: 'SYSTEM_INITIALIZATION',
        entity: 'SYSTEM',
        details: 'Initial database seed and Super Admin account provisioning',
        ipAddress: '127.0.0.1',
        userAgent: 'Internal System Script',
      },
      {
        userId: superAdmin.id,
        action: 'CREATE_PROMPT',
        entity: 'PROMPT',
        details: 'Created prompt: Full-Stack Next.js 14 Clean Architecture Blueprint',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      {
        userId: admin1.id,
        action: 'CREATE_PROMPT',
        entity: 'PROMPT',
        details: 'Created prompt: Ultra-Realistic Cinematic Portrait Photography Prompter',
        ipAddress: '192.168.1.105',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    ],
  });

  await prisma.loginLog.createMany({
    data: [
      {
        userId: superAdmin.id,
        status: 'SUCCESS',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0',
      },
      {
        userId: admin1.id,
        status: 'SUCCESS',
        ipAddress: '192.168.1.105',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
    ],
  });

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
