import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDeliveryQuote, getMockQuote, calculateTapShopFee } from '@/lib/lalamove'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { seller_id, buyer_address } = body

    if (!seller_id || !buyer_address) {
      return NextResponse.json(
        { error: 'Missing seller_id or buyer_address' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Get seller's pickup address
    const { data: seller } = await supabase
      .from('sellers')
      .select('pickup_address')
      .eq('id', seller_id)
      .single()

    if (!seller?.pickup_address) {
      return NextResponse.json(
        { error: 'Seller has no pickup address configured' },
        { status: 400 }
      )
    }

    // Try to get real quote from Lalamove
    const lalamoveQuote = await getDeliveryQuote({
      pickupAddress: seller.pickup_address,
      deliveryAddress: buyer_address,
    })

    let deliveryFee: number
    let quotationId: string

    if (lalamoveQuote) {
      // Real Lalamove quote - add TapShop markup (15%, rounded to nearest 5)
      deliveryFee = calculateTapShopFee(lalamoveQuote.fee)
      quotationId = lalamoveQuote.quotationId
    } else {
      // Use mock quote if Lalamove not configured
      const mockQuote = getMockQuote()
      deliveryFee = mockQuote.fee
      quotationId = mockQuote.quotationId
    }

    return NextResponse.json({
      delivery_fee: deliveryFee,
      quotation_id: quotationId,
      is_mock: !lalamoveQuote,
    })
  } catch (error) {
    console.error('Delivery quote error:', error)
    return NextResponse.json(
      { error: 'Failed to get delivery quote' },
      { status: 500 }
    )
  }
}
