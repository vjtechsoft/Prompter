import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { checkRateLimit, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
  'image/pjpeg',
  'image/x-png',
]);

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Validates binary magic bytes to guarantee file is genuinely an allowed image
 * and not an executable or malicious script disguised with an image extension.
 */
function validateImageMagicBytes(buffer: Buffer): { valid: boolean; detectedExt?: string } {
  if (buffer.length < 12) return { valid: false };

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detectedExt: '.jpg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, detectedExt: '.png' };
  }

  // WEBP: 'RIFF' .... 'WEBP'
  const riffHeader = buffer.subarray(0, 4).toString('ascii');
  const webpHeader = buffer.subarray(8, 12).toString('ascii');
  if (riffHeader === 'RIFF' && webpHeader === 'WEBP') {
    return { valid: true, detectedExt: '.webp' };
  }

  return { valid: false };
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting Protection
    const rateCheck = checkRateLimit(req, 'upload', RATE_LIMIT_PRESETS.upload);
    if (!rateCheck.allowed && rateCheck.response) {
      return rateCheck.response;
    }

    // 2. Authentication Enforcement
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required to upload files' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 3. File Size Validation
    if (file.size <= 0) {
      return NextResponse.json({ error: 'Uploaded file is empty.' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File exceeds maximum allowed size of 5MB.' }, { status: 400 });
    }

    const fileExt = path.extname(file.name || '').toLowerCase();
    const mimeType = (file.type || '').toLowerCase();

    // 4. Strict MIME and Extension Validation
    if (!ALLOWED_MIME_TYPES.has(mimeType) || !ALLOWED_EXTENSIONS.has(fileExt)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only genuine JPG, PNG, and WEBP images are supported.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 5. Deep Inspection: Magic Bytes Verification
    const magicCheck = validateImageMagicBytes(buffer);
    if (!magicCheck.valid || !magicCheck.detectedExt) {
      return NextResponse.json(
        { error: 'File validation failed: Content does not match valid image binary signatures.' },
        { status: 400 }
      );
    }

    // Standardize extension based on verified binary signature
    const safeExt = magicCheck.detectedExt;

    // 6. Safe Random Filename Generation (Zero path traversal risk)
    const randomSuffix = crypto.randomBytes(8).toString('hex');
    const safeFilename = `${Date.now()}-${randomSuffix}${safeExt}`;

    // 7. Store in Database
    try {
      const base64Data = buffer.toString('base64');
      await prisma.uploadedFile.create({
        data: {
          filename: safeFilename,
          mimeType: safeExt === '.png' ? 'image/png' : safeExt === '.webp' ? 'image/webp' : 'image/jpeg',
          data: base64Data,
          size: file.size,
        },
      });
    } catch (dbErr) {
      console.warn('Could not save uploaded file to database:', dbErr);
    }

    // 8. Save to Public Uploads Directory (if writable)
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, safeFilename);
      await fs.writeFile(filePath, buffer);
    } catch {
      // Ignored: read-only serverless filesystem fallback
    }

    const publicUrl = `/uploads/${safeFilename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      name: path.basename(file.name || safeFilename),
      size: file.size,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
