import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/**
 * POST /api/webhook - 接收支付回調
 * 用於處理第三方支付服務的回調通知
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { order_id, status, transaction_id, payment_method } = req.body;

    if (!order_id || !status) {
      return res.status(400).json({ 
        error: 'Missing required fields: order_id, status' 
      });
    }

    // 更新訂單狀態
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status,
        transaction_id,
        payment_method,
        updated_at: new Date().toISOString()
      })
      .eq('id', order_id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ success: true, order: data });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
}
