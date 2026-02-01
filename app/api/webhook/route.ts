import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

/**
 * POST /api/webhook - 接收支付回調
 * 用於處理第三方支付服務的回調通知
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, status, transaction_id, payment_method } = body;

    if (!order_id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: order_id, status' },
        { status: 400 }
      );
    }

    // 更新訂單狀態
    const { data, error } = await supabase
      .from('orders')
      .update({
        status,
        transaction_id,
        payment_method,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, order: data });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
