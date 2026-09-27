import { NextRequest, NextResponse } from 'next/server';
import { AuthError, requireAdmin } from '@/lib/auth';
import {
  blockUser,
  clearDeviceBlock,
  getDeviceBlock,
  listBlockedUserIds,
  listDeviceBlocks,
  unblockUser,
} from '@/lib/deviceBlock';
import { UNBLOCKABLE_USER_ID } from '@/lib/deviceBlockShared';

/**
 * Admin → Users blocks (requireAdmin).
 * GET  → every device/account block + ids of blocked accounts.
 * POST { action: 'block' | 'unblock', userId } → account block toggle (never user id 1).
 * POST { action: 'clear', blockId }            → release a block row; an account row unblocks the account.
 */

export async function GET() {
  try {
    await requireAdmin();
    const [blocks, blockedUserIds] = await Promise.all([listDeviceBlocks(), listBlockedUserIds()]);
    return NextResponse.json({ blocks, blockedUserIds });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error listing blocks:', error);
    return NextResponse.json({ error: 'Failed to list blocks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => ({}));

    if (body.action === 'block' || body.action === 'unblock') {
      const userId = Number(body.userId);
      if (!Number.isInteger(userId) || userId < 1) {
        return NextResponse.json({ error: 'User is required' }, { status: 400 });
      }
      if (body.action === 'block') {
        if (userId === UNBLOCKABLE_USER_ID) {
          return NextResponse.json({ error: 'This account cannot be blocked' }, { status: 400 });
        }
        await blockUser(userId);
      } else {
        await unblockUser(userId);
      }
      return NextResponse.json({ success: true });
    }

    if (body.action === 'clear') {
      const block = await getDeviceBlock(Number(body.blockId));
      if (!block) {
        return NextResponse.json({ error: 'Block not found' }, { status: 404 });
      }
      // An account row alone would be recreated at next login while users.blocked_at stays set.
      if (block.userId) await unblockUser(block.userId);
      else await clearDeviceBlock(block.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error updating block:', error);
    return NextResponse.json({ error: 'Failed to update block' }, { status: 500 });
  }
}
