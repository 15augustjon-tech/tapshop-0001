import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { bookDelivery, getDeliveryQuote, calculateTapShopFee } from '@/lib/lalamove'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { order_id } = body

    if (!order_id) {
      return NextResponse.json(
        { error: 'Missing order_id' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, sellers(shop_name, phone, pickup_address)')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if order is in correct status
    if (order.order_status !== 'confirmed') {
      return NextResponse.json(
        { error: 'Order must be confirmed before shipping' },
        { status: 400 }
      )
    }

    const seller = order.sellers as { shop_name: string; phone: string; pickup_address: string }

    if (!seller?.pickup_address) {
      return NextResponse.json(
        { error: 'Seller has no pickup address configured' },
        { status: 400 }
      )
    }

    // First get a fresh quote
    const quote = await getDeliveryQuote({
      pickupAddress: seller.pickup_address,
      deliveryAddress: order.buyer_address,
    })

    if (!quote) {
      // Lalamove not configured - just update order status (mock mode)
      await supabase
        .from('orders')
        .update({
          order_status: 'shipped',
          lalamove_order_id: `mock_${Date.now()}`,
        })
        .eq('id', order_id)

      return NextResponse.json({
        success: true,
        is_mock: true,
        message: 'Order marked as shipped (Lalamove not configured)',
      })
    }

    // Book the delivery with Lalamove
    const booking = await bookDelivery({
      quotationId: quote.quotationId,
      senderName: seller.shop_name,
      senderPhone: seller.phone || '',
      recipientName: order.buyer_name,
      recipientPhone: order.buyer_phone,
      pickupAddress: seller.pickup_address,
      deliveryAddress: order.buyer_address,
      cashOnDelivery: order.delivery_fee, // Collect delivery fee from buyer
      remarks: `TapShop Order #${order.order_number}`,
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Failed to book delivery with Lalamove' },
        { status: 500 }
      )
    }

    // Calculate actual delivery cost (what we pay Lalamove)
    const deliveryCost = quote.fee

    // Update order with Lalamove info
    await supabase
      .from('orders')
      .update({
        order_status: 'shipped',
        lalamove_order_id: booking.orderId,
        lalamove_share_link: booking.shareLink,
        delivery_cost: deliveryCost,
      })
      .eq('id', order_id)

    // Create delivery record
    await supabase
      .from('deliveries')
      .insert({
        order_id: order_id,
        lalamove_order_id: booking.orderId,
        status: booking.status,
        pickup_address: seller.pickup_address,
        delivery_address: order.buyer_address,
        quoted_fee: order.delivery_fee,
        actual_cost: deliveryCost,
        share_link: booking.shareLink,
      })

    return NextResponse.json({
      success: true,
      lalamove_order_id: booking.orderId,
      share_link: booking.shareLink,
      delivery_cost: deliveryCost,
      delivery_fee: order.delivery_fee,
      profit: order.delivery_fee - deliveryCost,
    })
  } catch (error) {
    console.error('Delivery booking error:', error)
    return NextResponse.json(
      { error: 'Failed to book delivery' },
      { status: 500 }
    )
  }
}
