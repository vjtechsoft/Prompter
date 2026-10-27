import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params;
    if (!filename) {
      return NextResponse.json({ error: 'Filename missing' }, { status: 400 });
    }

    // Sanitize filename against directory traversal attacks
    const safeFilename = path.basename(filename);

    // 1. Check PostgreSQL database first (serverless-compatible for Vercel)
    try {
      const dbFile = await prisma.uploadedFile.findUnique({
        where: { filename: safeFilename },
      });

      if (dbFile && dbFile.data) {
        const fileBuffer = Buffer.from(dbFile.data, 'base64');
        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': dbFile.mimeType || 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }
    } catch (dbErr) {
      // Fallback to disk if DB query fails or during offline dev
    }

    // 2. Fallback to local filesystem (for legacy/local development files)
    const filePath = path.join(process.cwd(), 'public', 'uploads', safeFilename);

    try {
      const fileBuffer = await fs.readFile(filePath);
      const ext = path.extname(safeFilename).toLowerCase();

      let contentType = 'application/octet-stream';
      if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.webp') contentType = 'image/webp';
      else if (ext === '.svg') contentType = 'image/svg+xml';
      else if (ext === '.gif') contentType = 'image/gif';

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
      throw err;
    }
  } catch (error) {
    console.error('Error serving upload:', error);
    return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 });
  }
}
