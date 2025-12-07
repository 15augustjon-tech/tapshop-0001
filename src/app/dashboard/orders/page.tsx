'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Order } from '@/lib/types'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [hasPickupAddress, setHasPickupAddress] = useState(true)
  const [shipError, setShipError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const loadOrders = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Check if seller has pickup address
    const { data: seller } = await supabase
      .from('sellers')
      .select('pickup_address')
      .eq('id', user.id)
      .single()

    setHasPickupAddress(!!seller?.pickup_address)

    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })

    if (data) {
      setOrders(data)
    }
    setLoading(false)
  }, [supabase, router])

  useEffect(() => {
    loadOrders()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          loadOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, loadOrders])

  const confirmPayment = async (orderId: string) => {
    setActionLoading(orderId)
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: 'confirmed', order_status: 'confirmed' })
      .eq('id', orderId)

    if (!error) {
      loadOrders()
    }
    setActionLoading(null)
  }

  const shipOrder = async (orderId: string) => {
    if (!hasPickupAddress) {
      setShipError('Please set your pickup address in Settings before shipping.')
      return
    }

    setActionLoading(orderId)
    setShipError(null)

    try {
      const response = await fetch('/api/delivery/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      })

      const data = await response.json()

      if (!response.ok) {
        setShipError(data.error || 'Failed to book delivery. Please try again.')
        setActionLoading(null)
        return
      }

      loadOrders()
    } catch (err) {
      setShipError('Failed to book delivery. Please try again.')
      console.error('Ship order error:', err)
    }

    setActionLoading(null)
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-800' },
      shipped: { bg: 'bg-purple-100', text: 'text-purple-800' },
      delivered: { bg: 'bg-green-100', text: 'text-green-800' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
    }
    const badge = badges[status] || badges.pending
    return `${badge.bg} ${badge.text}`
  }

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-gray-500">Loading orders...</p>
      </main>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>

      {!hasPickupAddress && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <p className="text-orange-800 font-medium">⚠️ Pickup address not set</p>
          <p className="text-sm text-orange-700 mt-1">
            You need to set your pickup address in Settings before you can ship orders with Lalamove.
          </p>
          <a href="/dashboard/settings" className="text-sm text-orange-600 underline mt-2 inline-block">
            Go to Settings →
          </a>
        </div>
      )}

      {shipError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{shipError}</p>
          <button onClick={() => setShipError(null)} className="text-sm text-red-600 underline mt-1">
            Dismiss
          </button>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-500">No orders yet</p>
          <p className="text-sm text-gray-400 mt-2">
            Orders will appear here when customers place them
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              {/* Header */}
              <div className="flex flex-wrap justify-between items-start gap-2 mb-4">
                <div>
                  <p className="font-mono text-sm text-gray-500">
                    {order.order_number}
                  </p>
                  <p className="font-medium text-gray-900">{order.buyer_name}</p>
                  <p className="text-sm text-gray-600">{order.buyer_phone}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                    order.order_status
                  )}`}
                >
                  {order.order_status.toUpperCase()}
                </span>
              </div>

              {/* Products */}
              <div className="border-t border-b py-3 mb-3">
                {order.product_details.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span>฿{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="text-sm space-y-1 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal (PromptPay)</span>
                  <span>฿{order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery (COD)</span>
                  <span>฿{order.delivery_fee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>฿{order.total_amount.toLocaleString()}</span>
                </div>
              </div>

              {/* Address */}
              <div className="bg-gray-50 rounded p-3 mb-4">
                <p className="text-xs text-gray-500 mb-1">Delivery Address:</p>
                <p className="text-sm text-gray-700">{order.buyer_address}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {order.order_status === 'pending' && (
                  <button
                    onClick={() => confirmPayment(order.id)}
                    disabled={actionLoading === order.id}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {actionLoading === order.id ? 'Confirming...' : 'Confirm Payment'}
                  </button>
                )}

                {order.order_status === 'confirmed' && (
                  <button
                    onClick={() => shipOrder(order.id)}
                    disabled={actionLoading === order.id || !hasPickupAddress}
                    title={!hasPickupAddress ? 'Set pickup address in Settings first' : undefined}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium disabled:opacity-50 ${
                      hasPickupAddress
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    {actionLoading === order.id ? 'Booking...' : hasPickupAddress ? 'Ship It!' : 'Setup Required'}
                  </button>
                )}

                {order.order_status === 'shipped' && (
                  <div className="flex-1 text-center">
                    <p className="py-2 text-purple-600 font-medium">Driver on the way</p>
                    {order.lalamove_share_link && (
                      <a
                        href={order.lalamove_share_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Track Delivery
                      </a>
                    )}
                  </div>
                )}

                {order.order_status === 'delivered' && (
                  <div className="flex-1 text-center py-2 text-green-600 font-medium">
                    ✓ Delivered
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <p className="text-xs text-gray-400 mt-4">
                {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
