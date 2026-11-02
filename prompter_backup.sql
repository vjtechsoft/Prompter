-- =========================================================================
-- Prompter MySQL Database Dump for Hostinger (phpMyAdmin / MySQL 8.x)
-- Generated on: 2026-11-02T15:48:38.794Z
-- =========================================================================

SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS = 0;
SET @OLD_SQL_MODE = @@SQL_MODE, SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET NAMES utf8mb4;

-- -------------------------------------------------------------------------
-- Drop existing tables if they exist
-- -------------------------------------------------------------------------
DROP TABLE IF EXISTS `UploadedFile`;
DROP TABLE IF EXISTS `TrendingSetting`;
DROP TABLE IF EXISTS `PromptActivity`;
DROP TABLE IF EXISTS `PromptLike`;
DROP TABLE IF EXISTS `AppUser`;
DROP TABLE IF EXISTS `LoginLog`;
DROP TABLE IF EXISTS `ActivityLog`;
DROP TABLE IF EXISTS `AppUrls`;
DROP TABLE IF EXISTS `AppSettings`;
DROP TABLE IF EXISTS `FcmDeviceToken`;
DROP TABLE IF EXISTS `Notification`;
DROP TABLE IF EXISTS `NotificationSetting`;
DROP TABLE IF EXISTS `Advertisement`;
DROP TABLE IF EXISTS `Prompt`;
DROP TABLE IF EXISTS `Subcategory`;
DROP TABLE IF EXISTS `Category`;
DROP TABLE IF EXISTS `User`;

-- -------------------------------------------------------------------------
-- Table Structures and Foreign Key Constraints
-- -------------------------------------------------------------------------
-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'ADMIN',
    `avatar` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `rememberToken` TEXT NULL,
    `resetToken` TEXT NULL,
    `resetTokenExpiry` DATETIME(3) NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `lastLoginIp` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `image` TEXT NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `position` INTEGER NOT NULL DEFAULT 0,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Category_title_key`(`title`),
    UNIQUE INDEX `Category_slug_key`(`slug`),
    INDEX `Category_isFeatured_idx`(`isFeatured`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Subcategory` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `image` TEXT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `position` INTEGER NOT NULL DEFAULT 0,
    `categoryId` VARCHAR(191) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Subcategory_slug_key`(`slug`),
    INDEX `Subcategory_categoryId_idx`(`categoryId`),
    INDEX `Subcategory_createdById_idx`(`createdById`),
    UNIQUE INDEX `Subcategory_categoryId_title_key`(`categoryId`, `title`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Prompt` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `prompt` TEXT NOT NULL,
    `featuredImage` TEXT NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `subcategoryId` VARCHAR(191) NULL,
    `tags` TEXT NOT NULL DEFAULT '[]',
    `likes` INTEGER NOT NULL DEFAULT 0,
    `views` INTEGER NOT NULL DEFAULT 0,
    `shares` INTEGER NOT NULL DEFAULT 0,
    `copies` INTEGER NOT NULL DEFAULT 0,
    `isPremium` BOOLEAN NOT NULL DEFAULT false,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Prompt_title_key`(`title`),
    UNIQUE INDEX `Prompt_slug_key`(`slug`),
    INDEX `Prompt_subcategoryId_idx`(`subcategoryId`),
    INDEX `Prompt_isFeatured_idx`(`isFeatured`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Advertisement` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `activeProvider` VARCHAR(191) NOT NULL DEFAULT 'ADMOB',
    `interstitialInterval` INTEGER NOT NULL DEFAULT 3,
    `nativeInterval` INTEGER NOT NULL DEFAULT 5,
    `admobEnabled` BOOLEAN NOT NULL DEFAULT true,
    `admobAppId` VARCHAR(191) NOT NULL DEFAULT '',
    `admobBannerId` VARCHAR(191) NOT NULL DEFAULT '',
    `admobInterstitialId` VARCHAR(191) NOT NULL DEFAULT '',
    `admobRewardedId` VARCHAR(191) NOT NULL DEFAULT '',
    `admobNativeId` VARCHAR(191) NOT NULL DEFAULT '',
    `admobAppOpenId` VARCHAR(191) NOT NULL DEFAULT '',
    `metaEnabled` BOOLEAN NOT NULL DEFAULT false,
    `metaBannerId` VARCHAR(191) NOT NULL DEFAULT '',
    `metaInterstitialId` VARCHAR(191) NOT NULL DEFAULT '',
    `metaRewardedId` VARCHAR(191) NOT NULL DEFAULT '',
    `metaNativeId` VARCHAR(191) NOT NULL DEFAULT '',
    `unityEnabled` BOOLEAN NOT NULL DEFAULT false,
    `unityGameId` VARCHAR(191) NOT NULL DEFAULT '',
    `unityBannerPlacement` VARCHAR(191) NOT NULL DEFAULT '',
    `unityInterstitialPlacement` VARCHAR(191) NOT NULL DEFAULT '',
    `unityRewardedPlacement` VARCHAR(191) NOT NULL DEFAULT '',
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NotificationSetting` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `provider` VARCHAR(191) NOT NULL DEFAULT 'FCM',
    `fcmProjectId` VARCHAR(191) NOT NULL DEFAULT '',
    `fcmClientEmail` VARCHAR(191) NOT NULL DEFAULT '',
    `fcmPrivateKey` TEXT NOT NULL DEFAULT '',
    `fcmServerKey` TEXT NOT NULL DEFAULT '',
    `fcmTopic` VARCHAR(191) NOT NULL DEFAULT 'all_users',
    `oneSignalAppId` VARCHAR(191) NOT NULL DEFAULT '',
    `oneSignalRestKey` VARCHAR(191) NOT NULL DEFAULT '',
    `isEnabled` BOOLEAN NOT NULL DEFAULT false,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `image` TEXT NULL,
    `deepLink` TEXT NULL,
    `targetTopic` VARCHAR(191) NULL DEFAULT 'all_users',
    `sendToAll` BOOLEAN NOT NULL DEFAULT true,
    `scheduledAt` DATETIME(3) NULL,
    `sentAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'SENT',
    `successCount` INTEGER NOT NULL DEFAULT 0,
    `failureCount` INTEGER NOT NULL DEFAULT 0,
    `errorMessage` TEXT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Notification_status_scheduledAt_idx`(`status`, `scheduledAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FcmDeviceToken` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `deviceId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `platform` VARCHAR(191) NULL,
    `appVersion` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FcmDeviceToken_token_key`(`token`),
    INDEX `FcmDeviceToken_token_idx`(`token`),
    INDEX `FcmDeviceToken_deviceId_idx`(`deviceId`),
    INDEX `FcmDeviceToken_userId_idx`(`userId`),
    INDEX `FcmDeviceToken_platform_idx`(`platform`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AppSettings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `appName` VARCHAR(191) NOT NULL DEFAULT 'Prompter Admin',
    `developerName` VARCHAR(191) NOT NULL DEFAULT 'Prompter Devs',
    `packageName` VARCHAR(191) NOT NULL DEFAULT 'com.codemario.prompter',
    `versionName` VARCHAR(191) NOT NULL DEFAULT '1.0.0',
    `versionCode` VARCHAR(191) NOT NULL DEFAULT '100',
    `supportEmail` VARCHAR(191) NOT NULL DEFAULT 'support@prompter.io',
    `website` VARCHAR(191) NOT NULL DEFAULT 'https://prompter.io',
    `contactNumber` VARCHAR(191) NOT NULL DEFAULT '+1 (555) 019-2834',
    `copyright` VARCHAR(191) NOT NULL DEFAULT '© 2026 Prompter. All rights reserved.',
    `defaultLanguage` VARCHAR(191) NOT NULL DEFAULT 'en',
    `theme` VARCHAR(191) NOT NULL DEFAULT 'system',
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'UTC',
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD ($)',
    `maintenanceMode` BOOLEAN NOT NULL DEFAULT false,
    `clientApiKey` VARCHAR(191) NOT NULL DEFAULT 'prompter_live_sec_7f8a9b1c2d3e4f5a',
    `requireApiKey` BOOLEAN NOT NULL DEFAULT true,
    `appLogo` TEXT NOT NULL DEFAULT '/logo.png',
    `splashLogo` TEXT NOT NULL DEFAULT '/logo.png',
    `appIcon` TEXT NOT NULL DEFAULT '/icon.png',
    `favicon` TEXT NOT NULL DEFAULT '/favicon.ico',
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AppUrls` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `privacyPolicy` TEXT NOT NULL DEFAULT 'https://prompter.io/privacy',
    `termsOfService` TEXT NOT NULL DEFAULT 'https://prompter.io/terms',
    `refundPolicy` TEXT NOT NULL DEFAULT 'https://prompter.io/refund',
    `dataDeletionPolicy` TEXT NOT NULL DEFAULT 'https://prompter.io/data-deletion',
    `contactUs` TEXT NOT NULL DEFAULT 'https://prompter.io/contact',
    `aboutUs` TEXT NOT NULL DEFAULT 'https://prompter.io/about',
    `website` TEXT NOT NULL DEFAULT 'https://prompter.io',
    `playStore` TEXT NOT NULL DEFAULT 'https://play.google.com/store/apps/details?id=com.codemario.prompter',
    `facebook` TEXT NOT NULL DEFAULT 'https://facebook.com/prompter',
    `instagram` TEXT NOT NULL DEFAULT 'https://instagram.com/prompter',
    `youtube` TEXT NOT NULL DEFAULT 'https://youtube.com/@prompter',
    `twitter` TEXT NOT NULL DEFAULT 'https://x.com/prompter',
    `telegram` TEXT NOT NULL DEFAULT 'https://t.me/prompter',
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActivityLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(191) NOT NULL,
    `details` TEXT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoginLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'SUCCESS',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AppUser` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT 'User',
    `email` VARCHAR(191) NOT NULL,
    `avatar` TEXT NULL,
    `authProvider` VARCHAR(191) NOT NULL DEFAULT 'GOOGLE',
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `isVip` BOOLEAN NOT NULL DEFAULT false,
    `appVersion` VARCHAR(191) NULL,
    `likesCount` INTEGER NOT NULL DEFAULT 0,
    `lastActiveAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AppUser_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PromptLike` (
    `id` VARCHAR(191) NOT NULL,
    `promptId` VARCHAR(191) NOT NULL,
    `clientIdentifier` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PromptLike_promptId_idx`(`promptId`),
    INDEX `PromptLike_clientIdentifier_idx`(`clientIdentifier`),
    INDEX `PromptLike_userId_idx`(`userId`),
    UNIQUE INDEX `PromptLike_promptId_clientIdentifier_key`(`promptId`, `clientIdentifier`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PromptActivity` (
    `id` VARCHAR(191) NOT NULL,
    `promptId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `clientIdentifier` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PromptActivity_promptId_type_createdAt_idx`(`promptId`, `type`, `createdAt`),
    INDEX `PromptActivity_type_createdAt_idx`(`type`, `createdAt`),
    INDEX `PromptActivity_createdAt_idx`(`createdAt`),
    INDEX `PromptActivity_promptId_createdAt_idx`(`promptId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TrendingSetting` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `weightViews` DOUBLE NOT NULL DEFAULT 1.0,
    `weightLikes` DOUBLE NOT NULL DEFAULT 3.0,
    `weightCopies` DOUBLE NOT NULL DEFAULT 5.0,
    `weightShares` DOUBLE NOT NULL DEFAULT 4.0,
    `maxPromptsPerCategory` INTEGER NOT NULL DEFAULT 10,
    `enableToday` BOOLEAN NOT NULL DEFAULT true,
    `enableWeekly` BOOLEAN NOT NULL DEFAULT true,
    `enableMonthly` BOOLEAN NOT NULL DEFAULT true,
    `enableAllTime` BOOLEAN NOT NULL DEFAULT true,
    `minScoreThreshold` DOUBLE NOT NULL DEFAULT 0.0,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UploadedFile` (
    `id` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `data` LONGTEXT NOT NULL,
    `size` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `UploadedFile_filename_key`(`filename`),
    INDEX `UploadedFile_filename_idx`(`filename`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Category` ADD CONSTRAINT `Category_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subcategory` ADD CONSTRAINT `Subcategory_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subcategory` ADD CONSTRAINT `Subcategory_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_subcategoryId_fkey` FOREIGN KEY (`subcategoryId`) REFERENCES `Subcategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivityLog` ADD CONSTRAINT `ActivityLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoginLog` ADD CONSTRAINT `LoginLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PromptLike` ADD CONSTRAINT `PromptLike_promptId_fkey` FOREIGN KEY (`promptId`) REFERENCES `Prompt`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PromptActivity` ADD CONSTRAINT `PromptActivity_promptId_fkey` FOREIGN KEY (`promptId`) REFERENCES `Prompt`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;



-- -------------------------------------------------------------------------
-- Records / Data Inserts
-- -------------------------------------------------------------------------

-- Data for table `User` (3 records)
INSERT INTO `User` (`id`, `name`, `email`, `password`, `role`, `avatar`, `status`, `rememberToken`, `resetToken`, `resetTokenExpiry`, `lastLoginAt`, `lastLoginIp`, `createdAt`, `updatedAt`) VALUES ('cmueaqe2400006q8wjgiyp1nu', 'Alex Vance', 'admin@promptmanager.com', '$2a$10$K/cs99RKSfVY3nddm1kiFOuUiJU7uKk5RFJEV8EGrcQFzLnuTl7Lq', 'SUPER_ADMIN', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'ACTIVE', NULL, NULL, NULL, '2026-11-02 09:36:49.178', '::1', '2026-09-23 16:07:14.092', '2026-11-02 09:36:49.180');
INSERT INTO `User` (`id`, `name`, `email`, `password`, `role`, `avatar`, `status`, `rememberToken`, `resetToken`, `resetTokenExpiry`, `lastLoginAt`, `lastLoginIp`, `createdAt`, `updatedAt`) VALUES ('cmueaqe2600016q8w6ux5rmhl', 'Sarah Jenkins', 'sarah.jenkins@promptmanager.com', '$2a$10$K/cs99RKSfVY3nddm1kiFOuUiJU7uKk5RFJEV8EGrcQFzLnuTl7Lq', 'ADMIN', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', 'ACTIVE', NULL, NULL, NULL, '2026-09-23 11:07:14.093', '192.168.1.105', '2026-09-23 16:07:14.095', '2026-09-23 16:07:14.095');
INSERT INTO `User` (`id`, `name`, `email`, `password`, `role`, `avatar`, `status`, `rememberToken`, `resetToken`, `resetTokenExpiry`, `lastLoginAt`, `lastLoginIp`, `createdAt`, `updatedAt`) VALUES ('cmueaqe2700026q8wqx76fs5v', 'Marcus Reid', 'marcus.reid@promptmanager.com', '$2a$10$K/cs99RKSfVY3nddm1kiFOuUiJU7uKk5RFJEV8EGrcQFzLnuTl7Lq', 'ADMIN', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'ACTIVE', NULL, NULL, NULL, '2026-09-22 16:07:14.094', '192.168.1.112', '2026-09-23 16:07:14.095', '2026-09-23 16:07:14.095');

-- Data for table `Category` (6 records)
INSERT INTO `Category` (`id`, `title`, `slug`, `image`, `status`, `isFeatured`, `position`, `createdById`, `createdAt`, `updatedAt`) VALUES ('cmueaqe2800046q8wke78b9qc', 'Coding & Architecture', 'coding-and-architecture', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80', 1, 0, 1, 'cmueaqe2400006q8wjgiyp1nu', '2026-09-23 16:07:14.096', '2026-09-23 16:07:14.096');
INSERT INTO `Category` (`id`, `title`, `slug`, `image`, `status`, `isFeatured`, `position`, `createdById`, `createdAt`, `updatedAt`) VALUES ('cmueaqe2900066q8wo7fgjeml', 'Midjourney & AI Art', 'midjourney-and-ai-art', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80', 1, 0, 2, 'cmueaqe2400006q8wjgiyp1nu', '2026-09-23 16:07:14.098', '2026-09-23 16:07:14.098');
INSERT INTO `Category` (`id`, `title`, `slug`, `image`, `status`, `isFeatured`, `position`, `createdById`, `createdAt`, `updatedAt`) VALUES ('cmueaqe2a00086q8woy6qn6a9', 'Copywriting & Marketing', 'copywriting-and-marketing', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&auto=format&fit=crop&q=80', 1, 0, 3, 'cmueaqe2600016q8w6ux5rmhl', '2026-09-23 16:07:14.099', '2026-09-23 16:07:14.099');
INSERT INTO `Category` (`id`, `title`, `slug`, `image`, `status`, `isFeatured`, `position`, `createdById`, `createdAt`, `updatedAt`) VALUES ('cmueaqe2b000a6q8wgfdle1bx', 'Productivity & Workflows', 'productivity-and-workflows', 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=600&auto=format&fit=crop&q=80', 1, 0, 4, 'cmueaqe2600016q8w6ux5rmhl', '2026-09-23 16:07:14.100', '2026-09-23 16:07:14.100');
INSERT INTO `Category` (`id`, `title`, `slug`, `image`, `status`, `isFeatured`, `position`, `createdById`, `createdAt`, `updatedAt`) VALUES ('cmueaqe2c000c6q8wnh0xrjkw', 'Academic & Research', 'academic-and-research', 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80', 1, 0, 5, 'cmueaqe2700026q8wqx76fs5v', '2026-09-23 16:07:14.101', '2026-09-23 16:07:14.101');
INSERT INTO `Category` (`id`, `title`, `slug`, `image`, `status`, `isFeatured`, `position`, `createdById`, `createdAt`, `updatedAt`) VALUES ('cmueaqe2d000e6q8wr9gn8wlp', 'Creative Fiction', 'creative-fiction', 'https://images.unsplash.com/photo-1474932430478-367dbb6832c1?w=600&auto=format&fit=crop&q=80', 0, 0, 6, 'cmueaqe2700026q8wqx76fs5v', '2026-09-23 16:07:14.101', '2026-09-23 16:07:14.101');

-- Data for table `Prompt` (8 records)
INSERT INTO `Prompt` (`id`, `title`, `slug`, `prompt`, `featuredImage`, `categoryId`, `subcategoryId`, `tags`, `likes`, `views`, `shares`, `copies`, `isPremium`, `isFeatured`, `status`, `isDeleted`, `createdById`, `createdAt`, `updatedAt`) VALUES ('cmueaqe2e000g6q8wcut20uup', 'Full-Stack Next.js 14 Clean Architecture Blueprint', 'full-stack-nextjs-14-clean-architecture-blueprint', 'Act as a Principal Software Architect. Design a modular Next.js 14 App Router enterprise application for [DOMAIN_NAME].\nInclude:\n1. Directory structure separating Domain, Application, Infrastructure, and Presentation layers.\n2. Type-safe Prisma schema with repository pattern and caching.\n3. Server Actions with Zod schema validation and granular error boundary strategy.\n4. Edge middleware with JWT role-based access control.\n5. Provide a production checklist with security headers (CSP, HSTS) and Dockerfile.', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80', 'cmueaqe2800046q8wke78b9qc', NULL, '["nextjs","typescript","architecture","react","prisma"]', 1240, 18450, 380, 1, 1, 0, 1, 0, 'cmueaqe2400006q8wjgiyp1nu', '2026-09-23 16:07:14.102', '2026-10-27 16:28:59.535');
INSERT INTO `Prompt` (`id`, `title`, `slug`, `prompt`, `featuredImage`, `categoryId`, `subcategoryId`, `tags`, `likes`, `views`, `shares`, `copies`, `isPremium`, `isFeatured`, `status`, `isDeleted`, `createdById`, `createdAt`, `updatedAt`) VALUES ('cmueaqe2f000i6q8wfvjvt3x2', 'Ultra-Realistic Cinematic Portrait Photography Prompter', 'ultra-realistic-cinematic-portrait-photography-prompter', 'A close-up 85mm portrait photo of [SUBJECT], natural skin texture with subtle imperfections, rim lighting, golden hour illumination, shot on Hasselblad H6D-100c, 100mm f/2.2 lens, volumetric haze, bokeh background, award-winning National Geographic photo, hyper-detailed, photorealistic, 8k resolution --ar 16:9 --style raw --v 6.0', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80', 'cmueaqe2900066q8wo7fgjeml', NULL, '["midjourney","photography","portrait","cinematic","art"]', 980, 14200, 411, 2, 0, 0, 1, 0, 'cmueaqe2600016q8w6ux5rmhl', '2026-09-23 16:07:14.104', '2026-10-27 16:31:51.041');
INSERT INTO `Prompt` (`id`, `title`, `slug`, `prompt`, `featuredImage`, `categoryId`, `subcategoryId`, `tags`, `likes`, `views`, `shares`, `copies`, `isPremium`, `isFeatured`, `status`, `isDeleted`, `createdById`, `createdAt`, `updatedAt`) VALUES ('cmueaqe2g000k6q8wbt70cpdv', 'High-Converting B2B SaaS Landing Page Copywriter', 'high-converting-b2b-saas-landing-page-copywriter', 'Act as a world-class Direct Response Copywriter trained in Ogilvy and Schwartz frameworks.\nWrite complete above-the-fold and landing page copy for [PRODUCT_NAME], a SaaS tool solving [PRIMARY_PAIN_POINT] for [TARGET_AUDIENCE].\nStructure:\n- Hook / Hero Headline (under 12 words, outcome-driven)\n- Subheadline expanding on how it works without friction\n- Primary & Secondary CTA micro-copy\n- 3 Value Pillars with "Problem -> Solution -> Tangible Metric"\n- Social Proof testimonial framing guidelines\n- Interactive FAQ addressing the top 4 objections.', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80', 'cmueaqe2a00086q8woy6qn6a9', NULL, '["copywriting","marketing","saas","conversion","sales"]', 750, 9300, 210, 0, 1, 0, 1, 0, 'cmueaqe2700026q8wqx76fs5v', '2026-09-23 16:07:14.105', '2026-09-23 16:07:14.105');
INSERT INTO `Prompt` (`id`, `title`, `slug`, `prompt`, `featuredImage`, `categoryId`, `subcategoryId`, `tags`, `likes`, `views`, `shares`, `copies`, `isPremium`, `isFeatured`, `status`, `isDeleted`, `createdById`, `createdAt`, `updatedAt`) VALUES ('cmueaqe2h000m6q8w55hsiw08', 'Obsidian & Notion Second Brain Knowledge Architect', 'obsidian-and-notion-second-brain-knowledge-architect', 'You are an expert in Tiago Forte\'s Building a Second Brain (P.A.R.A. Method) and Niklas Luhmann\'s Zettelkasten.\nDesign a cohesive personal knowledge management workflow for a [PROFESSION] managing [ACTIVE_PROJECT_COUNT] projects.\nSpecify:\n1. Folder and Tag taxonomy (Projects, Areas, Resources, Archives).\n2. Daily note template with habit tracker, top 3 priorities, and fleeting notes capture.\n3. Weekly review ritual checklist to process inbox zero across bookmarks, voice memos, and literature notes.\n4. Syntopical synthesis prompt to turn raw notes into publishable evergreen essays.', 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&auto=format&fit=crop&q=80', 'cmueaqe2b000a6q8wgfdle1bx', NULL, '["productivity","notion","obsidian","knowledge","workflow"]', 420, 6100, 115, 0, 0, 0, 1, 0, 'cmueaqe2600016q8w6ux5rmhl', '2026-09-23 16:07:14.106', '2026-09-23 16:07:14.106');
INSERT INTO `Prompt` (`id`, `title`, `slug`, `prompt`, `featuredImage`, `categoryId`, `subcategoryId`, `tags`, `likes`, `views`, `shares`, `copies`, `isPremium`, `isFeatured`, `status`, `isDeleted`, `createdById`, `createdAt`, `updatedAt`) VALUES ('cmueaqe2i000o6q8wp8tumiym', 'Systematic Literature Review & Meta-Analysis Synthesizer', 'systematic-literature-review-and-meta-analysis-synthesizer', 'Act as a senior academic researcher and methodologist. Given the following research question: [RESEARCH_QUESTION] in the field of [FIELD_NAME]:\n1. Formulate PRISMA guidelines compliant search strings for PubMed, Scopus, and IEEE Xplore using Boolean logic.\n2. Define explicit inclusion and exclusion criteria (PICO framework).\n3. Outline a risk of bias assessment matrix (e.g. Cochrane RoB 2 or ROBINS-I).\n4. Provide a structured table format to extract: Sample Size, Methodology, Primary Effect Size, Confidence Intervals, and Limitations.', 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80', 'cmueaqe2c000c6q8wnh0xrjkw', NULL, '["academic","research","paper","literature-review","science"]', 310, 4500, 95, 0, 1, 0, 1, 0, 'cmueaqe2400006q8wjgiyp1nu', '2026-09-23 16:07:14.107', '2026-09-23 16:07:14.107');
INSERT INTO `Prompt` (`id`, `title`, `slug`, `prompt`, `featuredImage`, `categoryId`, `subcategoryId`, `tags`, `likes`, `views`, `shares`, `copies`, `isPremium`, `isFeatured`, `status`, `isDeleted`, `createdById`, `createdAt`, `updatedAt`) VALUES ('cmueaqe2j000q6q8w12retpwo', 'Isometric 3D Game Asset Generator (Unreal Engine 5)', 'isometric-3d-game-asset-generator-unreal-engine-5', 'Isometric 3D stylized game asset of [OBJECT_OR_BUILDING], clay render style, vibrant pastel color palette, soft global illumination, octane render, clean white background, low-poly minimalism with high-poly smooth bevels, trending on ArtStation --v 6.0 --q 2 --s 250', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', 'cmueaqe2900066q8wo7fgjeml', NULL, '["game-dev","3d","midjourney","unreal-engine","isometric"]', 890, 11200, 340, 0, 0, 0, 1, 0, 'cmueaqe2600016q8w6ux5rmhl', '2026-09-23 16:07:14.107', '2026-09-23 16:07:14.107');
INSERT INTO `Prompt` (`id`, `title`, `slug`, `prompt`, `featuredImage`, `categoryId`, `subcategoryId`, `tags`, `likes`, `views`, `shares`, `copies`, `isPremium`, `isFeatured`, `status`, `isDeleted`, `createdById`, `createdAt`, `updatedAt`) VALUES ('cmueaqe2l000s6q8wtbv86ghm', 'Database Schema Optimization & Query Profiling Master', 'database-schema-optimization-and-query-profiling-master', 'Act as a Principal PostgreSQL DBA. Analyze the provided slow query and schema: [PASTE_QUERY_AND_SCHEMA]\nProvide:\n1. EXPLAIN ANALYZE execution plan breakdown with sequential scan bottlenecks identified.\n2. Composite index recommendations (with B-Tree vs GIN rationale).\n3. Query rewrite using CTEs or window functions for optimal execution.\n4. Connection pooling and vacuuming configuration recommendations.', 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=80', 'cmueaqe2800046q8wke78b9qc', NULL, '["sql","database","postgres","optimization","performance"]', 640, 8700, 190, 0, 1, 0, 1, 0, 'cmueaqe2700026q8wqx76fs5v', '2026-09-23 16:07:14.109', '2026-09-23 16:07:14.109');
INSERT INTO `Prompt` (`id`, `title`, `slug`, `prompt`, `featuredImage`, `categoryId`, `subcategoryId`, `tags`, `likes`, `views`, `shares`, `copies`, `isPremium`, `isFeatured`, `status`, `isDeleted`, `createdById`, `createdAt`, `updatedAt`) VALUES ('cmueaqe2l000u6q8w015aw6n1', 'Sci-Fi Worldbuilding & Faction Culture Builder', 'sci-fi-worldbuilding-and-faction-culture-builder', 'You are an acclaimed science fiction worldbuilder. Create a rich civilization profile for a post-planetary species inhabiting [ENVIRONMENT_TYPE].\nInclude:\n- Societal hierarchy and governing philosophy\n- Unique linguistic idioms and cultural taboos\n- Keystone technology and its ecological cost\n- Architectural aesthetics and religious mythology\n- A brewing tension with a rival neighbor faction.', 'https://images.unsplash.com/photo-1474932430478-367dbb6832c1?w=800&auto=format&fit=crop&q=80', 'cmueaqe2d000e6q8wr9gn8wlp', NULL, '["fiction","worldbuilding","storytelling","scifi","writing"]', 210, 3200, 45, 0, 0, 0, 0, 0, 'cmueaqe2600016q8w6ux5rmhl', '2026-09-23 16:07:14.110', '2026-09-23 16:07:14.110');

-- Data for table `Advertisement` (1 records)
INSERT INTO `Advertisement` (`id`, `activeProvider`, `interstitialInterval`, `nativeInterval`, `admobEnabled`, `admobAppId`, `admobBannerId`, `admobInterstitialId`, `admobRewardedId`, `admobNativeId`, `admobAppOpenId`, `metaEnabled`, `metaBannerId`, `metaInterstitialId`, `metaRewardedId`, `metaNativeId`, `unityEnabled`, `unityGameId`, `unityBannerPlacement`, `unityInterstitialPlacement`, `unityRewardedPlacement`, `updatedAt`) VALUES ('default', 'ADMOB', 3, 5, 1, 'ca-app-pub-3940256099942544~3347511713', 'ca-app-pub-3940256099942544/6300978111', 'ca-app-pub-3940256099942544/1033173712', 'ca-app-pub-3940256099942544/5224354917', 'ca-app-pub-3940256099942544/2247696110', 'ca-app-pub-3940256099942544/3419835294', 0, 'IMG_16_9_APP_INSTALL#YOUR_PLACEMENT_ID', 'YOUR_INTERSTITIAL_PLACEMENT_ID', 'YOUR_REWARDED_PLACEMENT_ID', 'YOUR_NATIVE_PLACEMENT_ID', 0, '1234567', 'Banner_Android', 'Interstitial_Android', 'Rewarded_Android', '2026-09-23 16:07:14.111');

-- Data for table `NotificationSetting` (1 records)
INSERT INTO `NotificationSetting` (`id`, `provider`, `fcmProjectId`, `fcmClientEmail`, `fcmPrivateKey`, `fcmServerKey`, `fcmTopic`, `oneSignalAppId`, `oneSignalRestKey`, `isEnabled`, `updatedAt`) VALUES ('default', 'FCM', '', '', '', '', 'all_users', 'b2f7f966-d8cc-11e4-bed1-df8f05be55ba', 'NGEwNmQxZTUtNDU3Yi00NDYxLWE1NmUtOGYwNmQxZTUtNDU3', 1, '2026-09-23 16:07:14.112');

-- Data for table `Notification` (1 records)
INSERT INTO `Notification` (`id`, `title`, `message`, `image`, `deepLink`, `targetTopic`, `sendToAll`, `scheduledAt`, `sentAt`, `status`, `successCount`, `failureCount`, `errorMessage`, `createdById`, `createdAt`, `updatedAt`) VALUES ('cmueaqe2p000w6q8weuv5edgg', '🚀 50+ New Midjourney Prompts Added!', 'Explore our latest collection of photorealistic portrait and cinematic lighting prompts.', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80', 'prompter://category/midjourney-and-ai-art', 'all_users', 1, NULL, '2026-09-23 16:07:14.112', 'SENT', 0, 0, NULL, 'cmueaqe2400006q8wjgiyp1nu', '2026-09-23 16:07:14.113', '2026-09-23 16:07:14.113');

-- Data for table `AppSettings` (1 records)
INSERT INTO `AppSettings` (`id`, `appName`, `developerName`, `packageName`, `versionName`, `versionCode`, `supportEmail`, `website`, `contactNumber`, `copyright`, `defaultLanguage`, `theme`, `timezone`, `currency`, `maintenanceMode`, `clientApiKey`, `requireApiKey`, `appLogo`, `splashLogo`, `appIcon`, `favicon`, `updatedAt`) VALUES ('default', 'Prompter Studio', 'Prompter Devs', 'com.codemario.prompter', '2.4.0', '240', 'support@prompter.io', 'https://prompter.io', '+1 (800) 555-0199', '© 2026 Prompter Studio. All rights reserved.', 'en', 'system', 'UTC', 'USD ($)', 0, 'prompter_live_sec_7f8a9b1c2d3e4f5a', 1, '/logo.png', '/logo.png', '/icon.png', '/favicon.ico', '2026-11-02 09:51:01.483');

-- Data for table `AppUrls` (1 records)
INSERT INTO `AppUrls` (`id`, `privacyPolicy`, `termsOfService`, `refundPolicy`, `dataDeletionPolicy`, `contactUs`, `aboutUs`, `website`, `playStore`, `facebook`, `instagram`, `youtube`, `twitter`, `telegram`, `updatedAt`) VALUES ('default', 'https://prompter.io/privacy-policy', 'https://prompter.io/terms-of-service', 'https://prompter.io/refund-policy', 'https://prompter.io/data-deletion', 'https://prompter.io/contact', 'https://prompter.io/about', 'https://prompter.io', 'https://play.google.com/store/apps/details?id=com.codemario.prompter', 'https://facebook.com/prompter', 'https://instagram.com/prompter', 'https://youtube.com/@prompter', 'https://x.com/prompter', 'https://t.me/prompter', '2026-11-02 09:51:01.490');

-- Data for table `TrendingSetting` (1 records)
INSERT INTO `TrendingSetting` (`id`, `weightViews`, `weightLikes`, `weightCopies`, `weightShares`, `maxPromptsPerCategory`, `enableToday`, `enableWeekly`, `enableMonthly`, `enableAllTime`, `minScoreThreshold`, `updatedAt`) VALUES ('default', 1, 3, 5, 4, 10, 1, 1, 1, 1, 0, '2026-10-27 16:28:59.435');

SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;
SET SQL_MODE = @OLD_SQL_MODE;
