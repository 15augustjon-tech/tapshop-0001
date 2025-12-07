import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNewOrderNotification } from '@/lib/line'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      seller_id,
      buyer_name,
      buyer_phone,
      buyer_address,
      cart,
      subtotal,
      delivery_fee,
      total_amount,
    } = body

    // Validate required fields
    if (!seller_id || !buyer_name || !buyer_phone || !buyer_address || !cart?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Verify seller exists
    const { data: sellerCheck, error: sellerError } = await supabase
      .from('sellers')
      .select('id')
      .eq('id', seller_id)
      .single()

    if (sellerError || !sellerCheck) {
      return NextResponse.json(
        { error: 'Invalid seller' },
        { status: 400 }
      )
    }

    // Generate order number
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    const orderNumber = `TS-${dateStr}-${random}`

    // Create order
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        seller_id,
        buyer_name,
        buyer_phone,
        buyer_address,
        product_details: cart,
        subtotal,
        delivery_fee: delivery_fee || 0,
        delivery_cost: null, // Will be set when we book Lalamove
        total_amount,
        payment_method: 'promptpay',
        payment_status: 'pending',
        order_status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Order creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    // Send LINE notification to seller (async, don't wait)
    const { data: seller } = await supabase
      .from('sellers')
      .select('line_user_id')
      .eq('id', seller_id)
      .single()

    if (seller?.line_user_id) {
      sendNewOrderNotification(seller.line_user_id, {
        orderNumber,
        buyerName: buyer_name,
        buyerPhone: buyer_phone,
        buyerAddress: buyer_address,
        items: cart,
        subtotal,
        deliveryFee: delivery_fee || 0,
        total: total_amount,
      }).catch(err => console.error('LINE notification error:', err))
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      order_number: order.order_number,
    })
  } catch (err) {
    console.error('Order API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
