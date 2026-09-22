import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function validateClientApiKey(req: NextRequest): Promise<{ valid: boolean; error?: string }> {
  try {
    const config = await prisma.appSettings.findUnique({
      where: { id: 'default' },
      select: { requireApiKey: true, clientApiKey: true },
    });

    // If API key enforcement is disabled in settings, allow traffic
    if (!config || !config.requireApiKey) {
      return { valid: true };
    }

    const key =
      req.headers.get('x-api-key') ||
      req.headers.get('X-API-Key') ||
      req.nextUrl.searchParams.get('api_key');

    if (!key) {
      return {
        valid: false,
        error: 'Unauthorized: Missing Client API Key. Please provide the "x-api-key" header or "api_key" query parameter.',
      };
    }

    if (key !== config.clientApiKey) {
      return {
        valid: false,
        error: 'Unauthorized: Invalid Client API Key provided.',
      };
    }

    return { valid: true };
  } catch (error) {
    console.error('Client API key validation error:', error);
    return { valid: false, error: 'Internal security verification failure' };
  }
}
