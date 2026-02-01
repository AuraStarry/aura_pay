import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

/**
 * GET /api/products - 取得所有產品
 * Query: ?all=true (include inactive products)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('all') === 'true';

    let query = supabase.from('products').select('*');

    if (!showAll) {
      query = query.eq('active', true);
    }

    const { data, error } = await query;

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

/**
 * POST /api/products - 建立新產品
 * Body: { name, sku, price, currency, active, description, metadata }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, sku, price, currency = 'USD', active = true, description, metadata } = body;

    if (!name || !sku || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, sku, price' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('products')
      .insert({ name, sku, price, currency, active, description, metadata })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ product: data }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/products/:id - 更新產品
 * Body: { name?, sku?, price?, currency?, active?, description?, metadata? }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing product id' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ product: data });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/:id - 刪除產品
 * Body: { id }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing product id' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
