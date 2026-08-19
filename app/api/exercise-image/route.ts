import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const type = searchParams.get('type') === 'end' ? 'end' : 'start';

    if (!name) {
      return new NextResponse('Missing name', { status: 400 });
    }

    const column = type === 'end' ? 'image_end' : 'image_start';
    const result = await query(
      `SELECT ${column} AS image FROM exercises WHERE name = ? LIMIT 1`,
      [name]
    );

    const imageData = result.rows[0]?.image;
    if (!imageData) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const buffer = Buffer.isBuffer(imageData)
      ? imageData
      : Buffer.from(imageData instanceof Uint8Array ? imageData : Object.values(imageData as object));

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Error serving exercise image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
