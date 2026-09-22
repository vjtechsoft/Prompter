import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const users = [
  {
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    authProvider: 'GOOGLE',
    status: 'ACTIVE',
    isVip: true,
    appVersion: '1.2.0',
    likesCount: 42,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 12), // 12 mins ago
  },
  {
    name: 'David Chen',
    email: 'david.chen88@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    authProvider: 'GOOGLE',
    status: 'ACTIVE',
    isVip: false,
    appVersion: '1.2.0',
    likesCount: 15,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago
  },
  {
    name: 'Elena Rostova',
    email: 'elena.rostova@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    authProvider: 'GOOGLE',
    status: 'ACTIVE',
    isVip: true,
    appVersion: '1.2.1',
    likesCount: 88,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hrs ago
  },
  {
    name: "Liam O'Connor",
    email: 'liam.oconnor@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    authProvider: 'GOOGLE',
    status: 'ACTIVE',
    isVip: false,
    appVersion: '1.1.9',
    likesCount: 9,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hrs ago
  },
  {
    name: 'Aarav Patel',
    email: 'aarav.patel.tech@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    authProvider: 'GOOGLE',
    status: 'ACTIVE',
    isVip: true,
    appVersion: '1.2.1',
    likesCount: 124,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 18), // 18 mins ago
  },
  {
    name: 'Chloe Dubois',
    email: 'chloe.dubois@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    authProvider: 'GOOGLE',
    status: 'ACTIVE',
    isVip: false,
    appVersion: '1.2.0',
    likesCount: 27,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 14), // 14 hrs ago
  },
  {
    name: 'Marcus Thorne',
    email: 'marcus.thorne99@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    authProvider: 'GOOGLE',
    status: 'BLOCKED',
    isVip: false,
    appVersion: '1.0.4',
    likesCount: 2,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
  },
  {
    name: 'Hana Tanaka',
    email: 'hana.tanaka.ai@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    authProvider: 'GOOGLE',
    status: 'ACTIVE',
    isVip: true,
    appVersion: '1.2.1',
    likesCount: 65,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
  },
  {
    name: 'Lucas Silva',
    email: 'lucas.silva.dev@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    authProvider: 'GOOGLE',
    status: 'ACTIVE',
    isVip: false,
    appVersion: '1.2.0',
    likesCount: 31,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hrs ago
  },
  {
    name: 'Amara Okafor',
    email: 'amara.okafor@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80',
    authProvider: 'GOOGLE',
    status: 'ACTIVE',
    isVip: true,
    appVersion: '1.2.1',
    likesCount: 73,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 10), // 10 mins ago
  },
  {
    name: 'Felix Weber',
    email: 'felix.weber.berlin@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    authProvider: 'GOOGLE',
    status: 'ACTIVE',
    isVip: false,
    appVersion: '1.1.8',
    likesCount: 19,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 20), // 20 hrs ago
  },
  {
    name: 'Zoe Martinez',
    email: 'zoe.martinez.creative@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    authProvider: 'GOOGLE',
    status: 'ACTIVE',
    isVip: true,
    appVersion: '1.2.1',
    likesCount: 95,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
  },
  {
    name: 'Viktor Novak',
    email: 'viktor.novak.bot@gmail.com',
    avatar: null,
    authProvider: 'GOOGLE',
    status: 'BLOCKED',
    isVip: false,
    appVersion: '1.0.0',
    likesCount: 0,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14), // 14 days ago
  },
  {
    name: 'Maya Lin',
    email: 'maya.lin.prompt@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=150&auto=format&fit=crop&q=80',
    authProvider: 'GOOGLE',
    status: 'ACTIVE',
    isVip: false,
    appVersion: '1.2.0',
    likesCount: 38,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hrs ago
  },
];

async function seed() {
  console.log('Seeding client app users...');
  let created = 0;
  for (const u of users) {
    await prisma.appUser.upsert({
      where: { email: u.email },
      update: u,
      create: u,
    });
    created++;
  }
  console.log(`Successfully seeded ${created} client app users.`);
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
