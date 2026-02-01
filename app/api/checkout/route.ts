import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

/**
 * POST /api/checkout - 建立支付訂單
 * Body: { product_id, quantity, customer_email, metadata }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_id, quantity = 1, customer_email, metadata } = body;

    if (!product_id || !customer_email) {
      return NextResponse.json(
        { error: 'Missing required fields: product_id, customer_email' },
        { status: 400 }
      );
    }

    // 查詢產品資訊
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // 建立訂單
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        product_id,
        quantity,
        customer_email,
        amount: product.price * quantity,
        status: 'pending',
        metadata,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: product.currency || 'USD',
      status: 'pending',
    });
  } catch (error: any) {
    console.error('Error creating checkout:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout' },
      { status: 500 }
    );
  }
}
