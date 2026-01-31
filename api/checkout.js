import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/**
 * POST /api/checkout - 建立支付訂單
 * Body: { product_id, quantity, customer_email, ... }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { product_id, quantity = 1, customer_email, metadata } = req.body;

    if (!product_id || !customer_email) {
      return res.status(400).json({ 
        error: 'Missing required fields: product_id, customer_email' 
      });
    }

    // 查詢產品資訊
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return res.status(404).json({ error: 'Product not found' });
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
        metadata
      })
      .select()
      .single();

    if (orderError) throw orderError;

    res.status(200).json({ 
      order_id: order.id,
      amount: order.amount,
      currency: product.currency || 'USD',
      status: 'pending'
    });
  } catch (error) {
    console.error('Error creating checkout:', error);
    res.status(500).json({ error: 'Failed to create checkout' });
  }
}
