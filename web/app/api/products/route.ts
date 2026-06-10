import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const products = category
    ? db
        .prepare(
          'SELECT id, name, description, price, category, image_url FROM products WHERE category = ? ORDER BY id'
        )
        .all(category)
    : db
        .prepare(
          'SELECT id, name, description, price, category, image_url FROM products ORDER BY id'
        )
        .all();

  return NextResponse.json(products);
}
