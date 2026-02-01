import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

/**
 * GET /api/products - 取得所有產品
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true);

    if (error) throw error;

    return NextResponse.json({ products: data });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
