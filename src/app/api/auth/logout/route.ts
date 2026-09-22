import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, TOKEN_COOKIE_NAME } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (user) {
      await logActivity({
        userId: user.id,
        action: 'LOGOUT',
        entity: 'AUTH',
        details: `User ${user.email} logged out`,
        req,
      });
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    response.cookies.delete(TOKEN_COOKIE_NAME);
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
