import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  createDeviceBlock,
  getDeviceBlock,
  recordAccessRequest,
  setDeviceBlockCookie,
} from '@/lib/deviceBlock';
import { clearDeviceBlockCookieOptions, DEVICE_BLOCK_COOKIE, verifyDeviceBlockToken } from '@/lib/deviceBlockToken';
import { isValidEmailFormat } from '@/lib/profile';
import { sendNow } from '@/lib/emails/send';
import { buildAccessRequestEmail, feedbackMailTo } from '@/lib/emails/feedback';
import { trackServerEvent } from '@/lib/trackServerEvent';

/**
 * Public (middleware-exempt) endpoint behind /join's "Under 18 / Pass" and the /blocked page.
 * GET    → this browser's block status; a cleared block also deletes the cookie.
 * POST   { action: 'pass' }                     → block this browser.
 * POST   { action: 'request', email, note }     → one-time access request, mailed to Kevin.
 */

const NOTE_MAX = 1000;

async function currentBlockId(): Promise<number | null> {
  const store = await cookies();
  return verifyDeviceBlockToken(store.get(DEVICE_BLOCK_COOKIE)?.value);
}

export async function GET() {
  const id = await currentBlockId();
  const block = id ? await getDeviceBlock(id) : null;
  if (!block || block.cleared) {
    const response = NextResponse.json({ blocked: false });
    if (id) response.cookies.set(clearDeviceBlockCookieOptions());
    return response;
  }
  return NextResponse.json({
    blocked: true,
    kind: block.userId ? 'account' : 'device',
    requested: block.requested,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));

  if (body.action === 'pass') {
    // Reuse a still-active block so repeat taps don't pile up rows.
    const existing = await currentBlockId();
    const active = existing ? await getDeviceBlock(existing) : null;
    const blockId = active && !active.cleared ? active.id : await createDeviceBlock();
    void trackServerEvent({ eventType: 'join_pass', pageCategory: 'join', pageUrl: '/join' });
    return setDeviceBlockCookie(NextResponse.json({ blocked: true }), blockId);
  }

  if (body.action === 'request') {
    const email = String(body.email || '').trim();
    const note = String(body.note || '').trim().slice(0, NOTE_MAX);
    if (!isValidEmailFormat(email)) {
      return NextResponse.json({ error: 'Enter a valid email' }, { status: 400 });
    }
    if (!note) {
      return NextResponse.json({ error: 'Add a short note' }, { status: 400 });
    }
    const id = await currentBlockId();
    if (!id || !(await recordAccessRequest(id, email, note))) {
      return NextResponse.json({ error: 'Request already sent' }, { status: 409 });
    }
    await sendNow(feedbackMailTo(), buildAccessRequestEmail({ blockId: id, email, note }), {
      template: 'access_request',
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
