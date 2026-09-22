import prisma from './prisma';
import { NextRequest } from 'next/server';

export async function logActivity({
  userId,
  action,
  entity,
  details,
  req,
}: {
  userId?: string;
  action: string;
  entity: string;
  details?: string;
  req?: NextRequest;
}) {
  try {
    const ipAddress = req
      ? req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1'
      : '127.0.0.1';
    const userAgent = req ? req.headers.get('user-agent') || '' : '';

    await prisma.activityLog.create({
      data: {
        userId: userId || null,
        action,
        entity,
        details: details || null,
        ipAddress: typeof ipAddress === 'string' ? ipAddress.split(',')[0].trim() : '127.0.0.1',
        userAgent: userAgent ? userAgent.substring(0, 255) : null,
      },
    });
  } catch (error) {
    console.error('Failed to write activity log:', error);
  }
}

export async function logLoginAttempt({
  userId,
  status,
  req,
}: {
  userId: string;
  status: 'SUCCESS' | 'FAILED';
  req?: NextRequest;
}) {
  try {
    const ipAddress = req
      ? req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1'
      : '127.0.0.1';
    const userAgent = req ? req.headers.get('user-agent') || '' : '';

    await prisma.loginLog.create({
      data: {
        userId,
        status,
        ipAddress: typeof ipAddress === 'string' ? ipAddress.split(',')[0].trim() : '127.0.0.1',
        userAgent: userAgent ? userAgent.substring(0, 255) : null,
      },
    });
  } catch (error) {
    console.error('Failed to write login log:', error);
  }
}
