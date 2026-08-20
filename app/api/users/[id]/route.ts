import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  hashPin,
  isValidPin,
  requireAdmin,
  AuthError,
} from '@/lib/auth';
import { isDuplicateEmailError, normalizeEmail, normalizeName } from '@/lib/profile';
import { deleteUserAndData } from '@/lib/users';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id: rawId } = await context.params;
    const id = Number(rawId);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 400 });
    }

    const existing = await query(
      'SELECT id, pin_hash FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const name = normalizeName(body.name);
    const email = normalizeEmail(body.email);
    const pin = typeof body.pin === 'string' && body.pin.length > 0 ? body.pin : null;

    if (!name) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }

    if (email === undefined) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (pin != null) {
      if (!isValidPin(pin)) {
        return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 });
      }
      await query(
        'UPDATE users SET name = ?, email = ?, pin_hash = ? WHERE id = ?',
        [name, email, hashPin(pin), id]
      );
    } else {
      await query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, id]);
    }

    const hasPin = pin != null || existing.rows[0].pin_hash != null;

    return NextResponse.json({
      success: true,
      user: { id, name, email, has_pin: hasPin },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (isDuplicateEmailError(error)) {
      return NextResponse.json({ error: 'That email is already in use' }, { status: 409 });
    }
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const current = await requireAdmin();
    const { id: rawId } = await context.params;
    const id = Number(rawId);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 400 });
    }

    if (id === current.id) {
      return NextResponse.json({ error: 'You cannot delete the signed-in profile' }, { status: 400 });
    }

    const existing = await query('SELECT id FROM users WHERE id = ? LIMIT 1', [id]);
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await deleteUserAndData(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
